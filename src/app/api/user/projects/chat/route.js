import { NextResponse } from "next/server";
import { isUserLogin } from "@/lib/auth/user";
import { dbQuery } from "@/lib/database/pg";

// GET — Fetch chat messages, images & detailed project metadata
export async function GET(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const { searchParams } = new URL(req.url);
        const chatId = searchParams.get('chat_id');

        if (!chatId) {
            return NextResponse.json({ success: false, message: "chat_id is required" }, { status: 400 });
        }

        // Verify user participation & fetch project metadata
        const chatRes = await dbQuery(
            `SELECT 
                pc.id, 
                pc.title, 
                pc.description,
                COALESCE(pc.status, 'waiting') AS status,
                pc.created_at, 
                'project' AS project_type
             FROM project_chats pc
             JOIN project_chats_participants pcp ON pc.id = pcp.chat_id
             WHERE pc.id = $1 AND pcp.user_id = $2`,
            [chatId, userId]
        );

        if (chatRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Project chat not found or access denied" }, { status: 404 });
        }

        const chat = chatRes.rows[0];

        // Fetch messages from project_chats_messages
        const msgRes = await dbQuery(
            `SELECT 
                pcm.id, 
                pcm.chat_id, 
                pcm.user_id, 
                pcm.staff_id, 
                pcm.content AS message, 
                pcm.created_at,
                CASE 
                    WHEN pcm.user_id IS NOT NULL THEN COALESCE(u.name, 'You')
                    WHEN pcm.staff_id IS NOT NULL THEN COALESCE(stf.name, 'Disibin Support')
                    ELSE 'Disibin Staff Support' 
                END AS sender_name,
                CASE
                    WHEN pcm.user_id IS NOT NULL THEN 'user'
                    ELSE 'staff'
                END AS sender_type
             FROM project_chats_messages pcm
             LEFT JOIN users u ON pcm.user_id = u.id
             LEFT JOIN staffs stf ON pcm.staff_id = stf.id
             WHERE pcm.chat_id = $1
             ORDER BY pcm.created_at ASC`,
            [chatId]
        );

        // Fetch shared images from project_chats_images
        const imgRes = await dbQuery(
            `SELECT pci.id, pci.chat_id, pci.user_id, pci.staff_id, pci.file_url, pci.file_id, pci.created_at,
                    u.name AS user_name, stf.name AS staff_name
             FROM project_chats_images pci
             LEFT JOIN users u ON pci.user_id = u.id
             LEFT JOIN staffs stf ON pci.staff_id = stf.id
             WHERE pci.chat_id = $1
             ORDER BY pci.created_at ASC`,
            [chatId]
        ).catch(() => ({ rows: [] }));

        return NextResponse.json({
            success: true,
            data: {
                chat,
                messages: msgRes.rows,
                images: imgRes.rows
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST — Send a new message / images in project chat
export async function POST(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const body = await req.json();
        const { chat_id, message, images } = body;

        const msgText = (message || "").trim();
        const hasImages = Array.isArray(images) && images.length > 0;

        if (!chat_id || (!msgText && !hasImages)) {
            return NextResponse.json({ success: false, message: "chat_id and message/images are required" }, { status: 400 });
        }

        // Verify user participation in chat
        const participantRes = await dbQuery(
            `SELECT chat_id FROM project_chats_participants WHERE chat_id = $1 AND user_id = $2`,
            [chat_id, userId]
        );

        if (participantRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Project chat not found or access denied" }, { status: 400 });
        }

        let newMsg = null;
        if (msgText || !hasImages) {
            const msgRes = await dbQuery(
                `INSERT INTO project_chats_messages (chat_id, user_id, content)
                 VALUES ($1, $2, $3)
                 RETURNING id, chat_id, user_id, content AS message, created_at`,
                [chat_id, userId, msgText || "Sent image attachment"]
            );
            newMsg = msgRes.rows[0];
        }

        const newImages = [];
        if (hasImages) {
            for (const img of images) {
                if (img.file_url) {
                    const imgRes = await dbQuery(
                        `INSERT INTO project_chats_images (chat_id, user_id, file_url, file_id)
                         VALUES ($1, $2, $3, $4)
                         RETURNING id, chat_id, user_id, file_url, file_id, created_at`,
                        [chat_id, userId, img.file_url, img.file_id || null]
                    );
                    newImages.push(imgRes.rows[0]);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: "Sent successfully",
            data: {
                message: newMsg ? {
                    ...newMsg,
                    sender_type: 'user',
                    sender_name: auth.data.name || 'You'
                } : null,
                images: newImages
            }
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// PATCH — Rename project chat title or update status / description
export async function PATCH(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const body = await req.json();
        const { chat_id, title, status, description } = body;

        if (!chat_id) {
            return NextResponse.json({ success: false, message: "chat_id is required" }, { status: 400 });
        }

        // Verify user participation in chat
        const participantRes = await dbQuery(
            `SELECT chat_id FROM project_chats_participants WHERE chat_id = $1 AND user_id = $2`,
            [chat_id, userId]
        );

        if (participantRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Project chat not found or access denied" }, { status: 403 });
        }

        const updates = [];
        const params = [];
        let paramIdx = 1;

        if (title && title.trim()) {
            updates.push(`title = $${paramIdx++}`);
            params.push(title.trim());
        }

        if (description !== undefined) {
            updates.push(`description = $${paramIdx++}`);
            params.push(description ? description.trim() : null);
        }

        if (status) {
            const validStatuses = ['waiting', 'progress', 'working', 'completed', 'spam'];
            if (!validStatuses.includes(status)) {
                return NextResponse.json({ success: false, message: "Invalid status value" }, { status: 400 });
            }
            updates.push(`status = $${paramIdx++}`);
            params.push(status);
        }

        if (updates.length === 0) {
            return NextResponse.json({ success: false, message: "Nothing to update" }, { status: 400 });
        }

        params.push(chat_id);
        const query = `UPDATE project_chats SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING id, title, description, status`;
        const updateRes = await dbQuery(query, params);

        return NextResponse.json({
            success: true,
            message: "Project chat updated successfully",
            data: updateRes.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE — Delete project chat
export async function DELETE(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const { searchParams } = new URL(req.url);
        const chatId = searchParams.get('chat_id');

        if (!chatId) {
            return NextResponse.json({ success: false, message: "chat_id is required" }, { status: 400 });
        }

        // Verify user participation in chat
        const participantRes = await dbQuery(
            `SELECT chat_id FROM project_chats_participants WHERE chat_id = $1 AND user_id = $2`,
            [chatId, userId]
        );

        if (participantRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Project chat not found or access denied" }, { status: 403 });
        }

        // Delete project chat (Cascades to messages, participants, images)
        await dbQuery(`DELETE FROM project_chats WHERE id = $1`, [chatId]);

        return NextResponse.json({
            success: true,
            message: "Project chat deleted successfully"
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
