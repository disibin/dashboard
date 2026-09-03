import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/database/pg";
import { isStaffLogin } from "@/lib/auth/staff";

let ticketImagesTableChecked = false;

async function ensureTicketImagesTable() {
    if (ticketImagesTableChecked) return;
    try {
        await dbQuery(`
            CREATE TABLE IF NOT EXISTS ticket_images (
                id SERIAL PRIMARY KEY,
                ticket_id INT REFERENCES tickets(id) ON DELETE CASCADE,
                user_id INT REFERENCES users(id) ON DELETE SET NULL,
                staff_id INT REFERENCES staffs(id) ON DELETE SET NULL,
                file_url TEXT NOT NULL,
                file_id TEXT,
                created_at TIMESTAMP DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS idx_ticket_images_ticket_id ON ticket_images(ticket_id);
        `).catch(() => {});
        ticketImagesTableChecked = true;
    } catch (err) {}
}

export async function GET(req, { params }) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        await ensureTicketImagesTable();

        const resolvedParams = await params;
        const ticketId = resolvedParams.id;

        const ticketRes = await dbQuery(
            `SELECT id, title, created_at, updated_at FROM tickets WHERE id = $1`,
            [ticketId]
        );
        if (ticketRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
        }
        const ticket = ticketRes.rows[0];

        const userRes = await dbQuery(
            `SELECT u.id, u.name, u.email
             FROM ticket_participants tp
             JOIN users u ON tp.user_id = u.id
             WHERE tp.ticket_id = $1 AND tp.user_id IS NOT NULL`,
            [ticketId]
        );
        const userInfo = userRes.rows.length > 0 ? userRes.rows[0] : null;

        const messagesRes = await dbQuery(
            `SELECT 
                tm.id, 
                tm.ticket_id, 
                tm.user_id, 
                tm.staff_id, 
                tm.message, 
                tm.created_at,
                u.name AS user_name,
                t.name AS staff_name,
                t.role AS staff_role
             FROM ticket_messages tm
             LEFT JOIN users u ON tm.user_id = u.id
             LEFT JOIN staffs t ON tm.staff_id = t.id
             WHERE tm.ticket_id = $1
             ORDER BY tm.created_at ASC`,
            [ticketId]
        );

        const imagesRes = await dbQuery(
            `SELECT ti.id, ti.ticket_id, ti.user_id, ti.staff_id, ti.file_url, ti.file_id, ti.created_at
             FROM ticket_images ti
             WHERE ti.ticket_id = $1
             ORDER BY ti.created_at ASC`,
            [ticketId]
        ).catch(() => ({ rows: [] }));

        const attachmentsRes = await dbQuery(
            `SELECT id, ticket_id, user_id, staff_id, file_url, file_id, created_at
             FROM ticket_attachments
             WHERE ticket_id = $1
             ORDER BY created_at ASC`,
            [ticketId]
        ).catch(() => ({ rows: [] }));

        const combinedImages = imagesRes.rows.length > 0 ? imagesRes.rows : attachmentsRes.rows;

        return NextResponse.json({
            success: true,
            data: {
                ticket,
                user: userInfo,
                messages: messagesRes.rows,
                images: combinedImages,
                attachments: attachmentsRes.rows
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        await ensureTicketImagesTable();

        const staffId = auth.data.id;
        const resolvedParams = await params;
        const ticketId = resolvedParams.id;
        const body = await req.json();
        const { message, images } = body;

        const msgText = (message || "").trim();
        const hasImages = Array.isArray(images) && images.length > 0;

        if (!msgText && !hasImages) {
            return NextResponse.json({ success: false, message: "Cannot send empty reply" }, { status: 400 });
        }

        const msgRes = await dbQuery(
            `INSERT INTO ticket_messages (ticket_id, staff_id, message) 
             VALUES ($1, $2, $3) 
             RETURNING id, ticket_id, staff_id, message, created_at`,
            [ticketId, staffId, msgText || "Sent image attachment"]
        );
        const newMessage = { ...msgRes.rows[0], staff_name: auth.data.name || "Support Staff", staff_role: auth.data.role || "staff" };

        const newImages = [];
        if (hasImages) {
            for (const img of images) {
                if (img.file_url) {
                    const imgRes = await dbQuery(
                        `INSERT INTO ticket_images (ticket_id, staff_id, file_url, file_id) 
                         VALUES ($1, $2, $3, $4) 
                         RETURNING id, ticket_id, staff_id, file_url, file_id, created_at`,
                        [ticketId, staffId, img.file_url, img.file_id || null]
                    );
                    newImages.push(imgRes.rows[0]);

                    await dbQuery(
                        `INSERT INTO ticket_attachments (ticket_id, staff_id, file_url, file_id) 
                         VALUES ($1, $2, $3, $4)`,
                        [ticketId, staffId, img.file_url, img.file_id || null]
                    ).catch(() => {});
                }
            }
        }

        await dbQuery(`UPDATE tickets SET updated_at = now() WHERE id = $1`, [ticketId]);

        const userPart = await dbQuery(
            `SELECT user_id FROM ticket_participants WHERE ticket_id = $1 AND user_id IS NOT NULL`,
            [ticketId]
        );
        if (userPart.rows.length > 0) {
            const ticketUser = userPart.rows[0];
            await dbQuery(
                `INSERT INTO notifications (user_id, title, message, type, link)
                 VALUES ($1, $2, $3, 'ticket', $4)`,
                [
                    ticketUser.user_id,
                    `New Reply on Ticket #${ticketId}`,
                    `Staff ${auth.data.name || 'Support'} replied: "${msgText.substring(0, 80)}${msgText.length > 80 ? '...' : ''}"`,
                    `/user/tickets/${ticketId}`
                ]
            ).catch(() => {});
        }

        return NextResponse.json({
            success: true,
            message: "Reply sent successfully",
            data: {
                newMessage,
                images: newImages,
                newAttachments: newImages
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const resolvedParams = await params;
        const ticketId = resolvedParams.id;
        const body = await req.json();
        const { title } = body;

        if (!title || !title.trim()) {
            return NextResponse.json({ success: false, message: "Ticket title is required" }, { status: 400 });
        }

        const newTitle = title.trim();
        const updateRes = await dbQuery(
            `UPDATE tickets SET title = $1, updated_at = now() WHERE id = $2 RETURNING id, title, updated_at`,
            [newTitle, ticketId]
        );

        if (updateRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Ticket title updated successfully",
            data: updateRes.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

