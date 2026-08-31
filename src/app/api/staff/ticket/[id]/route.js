import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/database/pg";
import { isStaffLogin } from "@/lib/auth/staff";

// GET — Fetch thread for a specific staff ticket
export async function GET(req, { params }) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const resolvedParams = await params;
        const ticketId = resolvedParams.id;

        // Fetch ticket details
        const ticketRes = await dbQuery(
            `SELECT id, title, created_at, updated_at FROM tickets WHERE id = $1`,
            [ticketId]
        );
        if (ticketRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
        }
        const ticket = ticketRes.rows[0];

        // Fetch client user details
        const userRes = await dbQuery(
            `SELECT u.id, u.name, u.email
             FROM ticket_participants tp
             JOIN users u ON tp.user_id = u.id
             WHERE tp.ticket_id = $1 AND tp.user_id IS NOT NULL`,
            [ticketId]
        );
        const userInfo = userRes.rows.length > 0 ? userRes.rows[0] : null;

        // Fetch messages with sender names
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

        // Fetch attachments
        const attachmentsRes = await dbQuery(
            `SELECT id, ticket_id, user_id, staff_id, file_url, file_id, created_at
             FROM ticket_attachments
             WHERE ticket_id = $1
             ORDER BY created_at ASC`,
            [ticketId]
        );

        return NextResponse.json({
            success: true,
            data: {
                ticket,
                user: userInfo,
                messages: messagesRes.rows,
                attachments: attachmentsRes.rows
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST — Staff member sends reply / attachments to ticket
export async function POST(req, { params }) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

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

        // Always create a message row
        const msgRes = await dbQuery(
            `INSERT INTO ticket_messages (ticket_id, staff_id, message) 
             VALUES ($1, $2, $3) 
             RETURNING id, ticket_id, staff_id, message, created_at`,
            [ticketId, staffId, msgText]
        );
        const newMessage = { ...msgRes.rows[0], staff_name: auth.data.name || "Support Staff", staff_role: auth.data.role || "staff" };

        const newAttachments = [];
        if (hasImages) {
            for (const img of images) {
                if (img.file_url) {
                    const attRes = await dbQuery(
                        `INSERT INTO ticket_attachments (ticket_id, staff_id, file_url, file_id) 
                         VALUES ($1, $2, $3, $4) 
                         RETURNING id, ticket_id, staff_id, file_url, file_id, created_at`,
                        [ticketId, staffId, img.file_url, img.file_id || null]
                    );
                    newAttachments.push(attRes.rows[0]);
                }
            }
        }

        // Update ticket modified time
        await dbQuery(`UPDATE tickets SET updated_at = now() WHERE id = $1`, [ticketId]);

        // Send in-app notification to ticket user participant
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
                newAttachments
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
