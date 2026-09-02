import { NextResponse } from "next/server";
import { isUserLogin } from "@/lib/auth/user";
import { dbQuery } from "@/lib/database/pg";

// GET — List user's project discussions
export async function GET() {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;

        const projectChatsRes = await dbQuery(
            `SELECT DISTINCT ON (pc.id)
                pc.id AS package_chat_id,
                pc.id AS id,
                pc.title AS project_title,
                pc.description,
                'project' AS project_type,
                COALESCE(pc.status, 'waiting') AS project_status,
                pc.created_at,
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
             JOIN project_chats_participants pcp ON pc.id = pcp.chat_id
             WHERE pcp.user_id = $1
             ORDER BY pc.id, pc.created_at DESC`,
            [userId]
        );

        return NextResponse.json({ success: true, data: projectChatsRes.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST — Create a new standalone project without package linkage
export async function POST(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const body = await req.json();
        const { title, description } = body;

        if (!title || !title.trim()) {
            return NextResponse.json({ success: false, message: "Project title is required" }, { status: 400 });
        }

        const cleanTitle = title.trim();
        const cleanDesc = (description || "").trim();

        // 1. Create project_chats record
        const projectRes = await dbQuery(
            `INSERT INTO project_chats (title, description, status)
             VALUES ($1, $2, 'waiting')
             RETURNING id, title, description, status, created_at`,
            [cleanTitle, cleanDesc || null]
        );
        const newProject = projectRes.rows[0];

        // 2. Add user as participant
        await dbQuery(
            `INSERT INTO project_chats_participants (chat_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (chat_id, user_id, staff_id) DO NOTHING`,
            [newProject.id, userId]
        );

        // 3. Find a staff ID for initial welcome greeting
        const staffRes = await dbQuery("SELECT id FROM staffs ORDER BY id ASC LIMIT 1");
        const staffId = staffRes.rows.length > 0 ? staffRes.rows[0].id : null;

        const welcomeText = `Welcome to your project discussion for "${cleanTitle}"! Our technical team and project leads have been notified and will assist you here. Please share any specifications, links, or file attachments to get started.`;
        if (staffId) {
            await dbQuery(
                `INSERT INTO project_chats_messages (chat_id, staff_id, content)
                 VALUES ($1, $2, $3)`,
                [newProject.id, staffId, welcomeText]
            );
        }

        // 4. If user supplied an initial project description / brief, post it as the user's initial message
        if (cleanDesc) {
            await dbQuery(
                `INSERT INTO project_chats_messages (chat_id, user_id, content)
                 VALUES ($1, $2, $3)`,
                [newProject.id, userId, `Project Scope & Description:\n${cleanDesc}`]
            );
        }

        // 5. Send user notification
        await dbQuery(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES ($1, $2, $3, 'project', $4)`,
            [
                userId,
                `Project Created: ${cleanTitle}`,
                `Your new project discussion for "${cleanTitle}" is now active in your dashboard.`,
                `/user/projects/${newProject.id}`
            ]
        ).catch(() => {});

        return NextResponse.json({
            success: true,
            message: "Project created successfully!",
            data: newProject
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE — User delete a project
export async function DELETE(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get('id') || searchParams.get('chat_id');

        if (!projectId) {
            return NextResponse.json({ success: false, message: "Project ID is required" }, { status: 400 });
        }

        // Verify that user is a participant of this project
        const check = await dbQuery(
            `SELECT chat_id FROM project_chats_participants WHERE chat_id = $1 AND user_id = $2`,
            [projectId, userId]
        );
        if (check.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Project not found or access denied" }, { status: 404 });
        }

        // Delete the project (cascades to participants, messages, images, files)
        await dbQuery(`DELETE FROM project_chats WHERE id = $1`, [projectId]);

        return NextResponse.json({
            success: true,
            message: "Project deleted successfully"
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
