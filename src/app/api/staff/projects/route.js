import { NextResponse } from "next/server";
import { isStaffLogin } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const query = `
            SELECT * FROM (
                SELECT DISTINCT ON (pc.id)
                    pc.id AS package_chat_id,
                    pc.id AS id,
                    pc.title AS project_title,
                    pc.description,
                    'project' AS project_type,
                    COALESCE(pc.status, 'waiting') AS project_status,
                    pc.created_at,
                    u.name AS user_name,
                    u.email AS user_email,
                    u.id AS user_id,
                    (
                        SELECT content 
                        FROM project_chats_messages pcm 
                        WHERE pcm.chat_id = pc.id 
                        ORDER BY pcm.created_at DESC LIMIT 1
                    ) AS last_message,
                    (
                        SELECT created_at 
                        FROM project_chats_messages pcm 
                        WHERE pcm.chat_id = pc.id 
                        ORDER BY pcm.created_at DESC LIMIT 1
                    ) AS last_message_at
                FROM project_chats pc
                LEFT JOIN project_chats_participants pcp ON pc.id = pcp.chat_id AND pcp.user_id IS NOT NULL
                LEFT JOIN users u ON u.id = pcp.user_id
                ORDER BY pc.id DESC, pc.created_at DESC
            ) sub
            ORDER BY COALESCE(last_message_at, created_at) DESC, id DESC
        `;

        const res = await dbQuery(query);
        return NextResponse.json({ success: true, data: res.rows });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const staffId = auth.data.id;
        const body = await req.json();
        const { title, description, user_id } = body;

        if (!title || !title.trim()) {
            return NextResponse.json({ success: false, message: "Project title is required" }, { status: 400 });
        }

        const cleanTitle = title.trim();
        const cleanDesc = (description || "").trim();

        const projectRes = await dbQuery(
            `INSERT INTO project_chats (title, description, created_by, status)
             VALUES ($1, $2, $3, 'waiting')
             RETURNING id, title, description, status, created_at`,
            [cleanTitle, cleanDesc || null, staffId]
        );
        const newProject = projectRes.rows[0];

        await dbQuery(
            `INSERT INTO project_chats_participants (chat_id, staff_id)
             VALUES ($1, $2)
             ON CONFLICT (chat_id, user_id, staff_id) DO NOTHING`,
            [newProject.id, staffId]
        );

        if (user_id) {
            await dbQuery(
                `INSERT INTO project_chats_participants (chat_id, user_id)
                 VALUES ($1, $2)
                 ON CONFLICT (chat_id, user_id, staff_id) DO NOTHING`,
                [newProject.id, user_id]
            );

            await dbQuery(
                `INSERT INTO notifications (user_id, title, message, type, link)
                 VALUES ($1, $2, $3, 'project', $4)`,
                [
                    user_id,
                    `New Project Assigned: ${cleanTitle}`,
                    `A new project discussion "${cleanTitle}" has been opened for you by staff.`,
                    `/user/projects/${newProject.id}`
                ]
            ).catch(() => {});
        }

        await dbQuery(
            `INSERT INTO project_chats_messages (chat_id, staff_id, content)
             VALUES ($1, $2, $3)`,
            [
                newProject.id, 
                staffId, 
                `Project created by staff: "${cleanTitle}". ${cleanDesc ? `\nDetails: ${cleanDesc}` : ''}`
            ]
        );

        return NextResponse.json({
            success: true,
            message: "Project created successfully",
            data: newProject
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
