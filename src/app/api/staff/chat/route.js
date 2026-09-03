import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/database/pg";
import { isStaffLogin } from "@/lib/auth/staff";


export async function GET() {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const currentStaffId = auth.data.id;

        const query = `
            SELECT 
                c.id,
                c.title,
                c.is_group,
                c.created_by,
                c.created_at,
                tp.last_read_at,
                (
                    SELECT content FROM chat_messages cm 
                    WHERE cm.chat_id = c.id 
                    ORDER BY cm.created_at DESC LIMIT 1
                ) AS last_message,
                (
                    SELECT created_at FROM chat_messages cm 
                    WHERE cm.chat_id = c.id 
                    ORDER BY cm.created_at DESC LIMIT 1
                ) AS last_message_time,
                (
                    SELECT cm.sender_id FROM chat_messages cm 
                    WHERE cm.chat_id = c.id 
                    ORDER BY cm.created_at DESC LIMIT 1
                ) AS last_sender_id,
                (
                    SELECT t.name FROM chat_messages cm 
                    LEFT JOIN staffs t ON cm.sender_id = t.id 
                    WHERE cm.chat_id = c.id 
                    ORDER BY cm.created_at DESC LIMIT 1
                ) AS last_sender_name,
                (
                    SELECT t.name FROM chat_participants tp2 
                    JOIN staffs t ON tp2.staff_id = t.id 
                    WHERE tp2.chat_id = c.id AND tp2.staff_id != $1 LIMIT 1
                ) AS other_participant_name,
                (
                    SELECT t.role FROM chat_participants tp2 
                    JOIN staffs t ON tp2.staff_id = t.id 
                    WHERE tp2.chat_id = c.id AND tp2.staff_id != $1 LIMIT 1
                ) AS other_participant_role
            FROM chats c
            JOIN chat_participants tp ON c.id = tp.chat_id
            WHERE tp.staff_id = $1
            ORDER BY COALESCE(
                (SELECT created_at FROM chat_messages cm WHERE cm.chat_id = c.id ORDER BY cm.created_at DESC LIMIT 1),
                c.created_at
            ) DESC
        `;

        const res = await dbQuery(query, [currentStaffId]);
        return NextResponse.json({ success: true, data: res.rows });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}


export async function POST(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const currentStaffId = auth.data.id;
        const body = await req.json();
        const { isGroup, title, participantStaffIds } = body;

        const staffIds = Array.isArray(participantStaffIds) ? participantStaffIds.map(id => parseInt(id)).filter(Boolean) : [];

        if (staffIds.length === 0) {
            return NextResponse.json({ success: false, message: "Please select at least one staff member" }, { status: 400 });
        }


        if (!isGroup && staffIds.length === 1) {
            const targetId = staffIds[0];
            const existingRes = await dbQuery(
                `SELECT c.id, c.title, c.is_group
                 FROM chats c
                 JOIN chat_participants tp1 ON c.id = tp1.chat_id AND tp1.staff_id = $1
                 JOIN chat_participants tp2 ON c.id = tp2.chat_id AND tp2.staff_id = $2
                 WHERE c.is_group = false LIMIT 1`,
                [currentStaffId, targetId]
            );

            if (existingRes.rows.length > 0) {
                return NextResponse.json({
                    success: true,
                    message: "Chat conversation existing",
                    data: existingRes.rows[0]
                });
            }
        }


        const chatTitle = isGroup ? (title || "Group Chat").trim() : null;
        const chatRes = await dbQuery(
            `INSERT INTO chats (title, is_group, created_by) 
             VALUES ($1, $2, $3) 
             RETURNING id, title, is_group, created_by, created_at`,
            [chatTitle, Boolean(isGroup), currentStaffId]
        );
        const chat = chatRes.rows[0];


        await dbQuery(
            `INSERT INTO chat_participants (chat_id, staff_id, last_read_at) VALUES ($1, $2, now())`,
            [chat.id, currentStaffId]
        );


        for (const tid of staffIds) {
            if (tid !== currentStaffId) {
                await dbQuery(
                    `INSERT INTO chat_participants (chat_id, staff_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [chat.id, tid]
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: isGroup ? "Group chat created" : "Conversation started",
            data: chat
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
