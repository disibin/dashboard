import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/database/pg";
import { isUserLogin } from "@/lib/auth/user";

export async function GET() {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;

        const query = `
            SELECT 
                t.id, 
                t.title, 
                t.created_at, 
                t.updated_at,
                tp.last_read_at,
                (
                    SELECT message FROM ticket_messages tm 
                    WHERE tm.ticket_id = t.id 
                    ORDER BY tm.created_at DESC LIMIT 1
                ) AS last_message,
                (
                    SELECT created_at FROM ticket_messages tm 
                    WHERE tm.ticket_id = t.id 
                    ORDER BY tm.created_at DESC LIMIT 1
                ) AS last_message_at,
                (
                    (SELECT COUNT(*) FROM ticket_attachments ta WHERE ta.ticket_id = t.id) +
                    (SELECT COUNT(*) FROM ticket_images ti WHERE ti.ticket_id = t.id)
                ) AS attachment_count
            FROM tickets t
            JOIN ticket_participants tp ON t.id = tp.ticket_id
            WHERE tp.user_id = $1
            ORDER BY t.updated_at DESC
        `;

        const res = await dbQuery(query, [userId]);
        return NextResponse.json({ success: true, data: res.rows });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const body = await req.json();
        const { title, subject, message, images } = body;

        const ticketTitle = (title || subject || "").trim();
        if (!ticketTitle) {
            return NextResponse.json({ success: false, message: "Ticket subject is required" }, { status: 400 });
        }
        if (!message || !message.trim()) {
            return NextResponse.json({ success: false, message: "Initial message is required" }, { status: 400 });
        }

        const ticketRes = await dbQuery(
            `INSERT INTO tickets (title) VALUES ($1) RETURNING id, title, created_at, updated_at`,
            [ticketTitle]
        );
        const ticket = ticketRes.rows[0];

        await dbQuery(
            `INSERT INTO ticket_participants (ticket_id, user_id, last_read_at) VALUES ($1, $2, now())`,
            [ticket.id, userId]
        );

        const msgRes = await dbQuery(
            `INSERT INTO ticket_messages (ticket_id, user_id, message) VALUES ($1, $2, $3) RETURNING id, ticket_id, user_id, message, created_at`,
            [ticket.id, userId, message.trim()]
        );
        const initialMsg = msgRes.rows[0];

        const createdImages = [];
        if (Array.isArray(images) && images.length > 0) {
            for (const img of images) {
                if (img.file_url) {
                    const imgRes = await dbQuery(
                        `INSERT INTO ticket_images (ticket_id, user_id, file_url, file_id) VALUES ($1, $2, $3, $4) RETURNING id, ticket_id, user_id, file_url, file_id, created_at`,
                        [ticket.id, userId, img.file_url, img.file_id || null]
                    );
                    createdImages.push(imgRes.rows[0]);

                    await dbQuery(
                        `INSERT INTO ticket_attachments (ticket_id, user_id, file_url, file_id) VALUES ($1, $2, $3, $4)`,
                        [ticket.id, userId, img.file_url, img.file_id || null]
                    ).catch(() => {});
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: "Ticket created successfully",
            data: {
                ticket,
                message: initialMsg,
                images: createdImages,
                attachments: createdImages
            }
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const { searchParams } = new URL(req.url);
        const ticketId = searchParams.get('id');

        if (!ticketId) {
            return NextResponse.json({ success: false, message: "Ticket ID is required" }, { status: 400 });
        }

        const check = await dbQuery(
            `SELECT id FROM ticket_participants WHERE ticket_id = $1 AND user_id = $2`,
            [ticketId, userId]
        );
        if (check.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Ticket not found or access denied" }, { status: 404 });
        }

        await dbQuery(`DELETE FROM tickets WHERE id = $1`, [ticketId]);

        return NextResponse.json({
            success: true,
            message: "Ticket deleted successfully"
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
