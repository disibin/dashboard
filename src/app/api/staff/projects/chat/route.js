import { NextResponse } from "next/server";
import { isStaffLogin, isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

let imagesTableChecked = false;

async function ensurePackageChatsImagesTable() {
    if (imagesTableChecked) return;
    try {
        await dbQuery(`
            CREATE TABLE IF NOT EXISTS package_chats_images (
                id SERIAL PRIMARY KEY,
                chat_id INT REFERENCES package_chats(id) ON DELETE CASCADE,
                user_id INT REFERENCES users(id) ON DELETE SET NULL,
                staff_id INT REFERENCES staffs(id) ON DELETE SET NULL,
                file_url TEXT NOT NULL,
                file_id TEXT,
                created_at TIMESTAMP DEFAULT now()
            );
            ALTER TABLE package_chats ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'waiting';
        `).catch(() => {});
        imagesTableChecked = true;
    } catch (err) {}
}

// GET — Fetch chat messages, images & detailed project metadata for staff
export async function GET(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        await ensurePackageChatsImagesTable();

        const { searchParams } = new URL(req.url);
        const chatId = searchParams.get('chat_id');

        if (!chatId) {
            return NextResponse.json({ success: false, message: "chat_id is required" }, { status: 400 });
        }

        // Fetch project metadata & client details
        const chatRes = await dbQuery(
            `SELECT 
                pc.id, 
                pc.title, 
                COALESCE(pc.status, 'waiting') AS status,
                pc.created_at, 
                pc.package_id,
                pkg.name AS package_name,
                pkg.description AS package_description,
                pkg.price AS package_price,
                pur.id AS purchase_id,
                pur.price AS purchase_price,
                pur.discount AS purchase_discount,
                COALESCE(pur.status, 'active') AS purchase_status,
                pay.id AS payment_id,
                COALESCE(pay.paid, 0) AS paid,
                COALESCE(pay.due, GREATEST(0, COALESCE(pur.price - pur.discount, pkg.price - pkg.discount, 0))) AS due,
                CASE 
                    WHEN pay.id IS NULL THEN 'none'
                    ELSE pay.status 
                END AS payment_status,
                t.name AS tenant_name,
                u.id AS user_id,
                u.name AS user_name,
                u.email AS user_email
             FROM package_chats pc
             LEFT JOIN package_chats_participants pcp ON pc.id = pcp.chat_id
             LEFT JOIN users u ON pcp.user_id = u.id
             LEFT JOIN packages pkg ON pc.package_id = pkg.id
             LEFT JOIN tenants t ON t.id = pkg.tenant_id
             LEFT JOIN purchases pur ON pur.package_id = pc.package_id AND pur.user_id = pcp.user_id
             LEFT JOIN payments pay ON pur.id = pay.purchase_id
             WHERE pc.id = $1`,
            [chatId]
        );

        if (chatRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Project chat not found" }, { status: 404 });
        }

        const chat = chatRes.rows[0];

        // Fetch features list for the package
        let features = [];
        if (chat.package_id) {
            const featRes = await dbQuery(
                `SELECT pf.id, pf.value, f.name AS feature_name
                 FROM package_features pf
                 JOIN features f ON pf.feature_id = f.id
                 WHERE pf.package_id = $1`,
                [chat.package_id]
            ).catch(() => ({ rows: [] }));
            features = featRes.rows;
        }

        // Fetch messages from package_chats_messages
        const msgRes = await dbQuery(
            `SELECT 
                pcm.id, 
                pcm.chat_id, 
                pcm.user_id, 
                pcm.staff_id, 
                pcm.content AS message, 
                pcm.created_at,
                CASE 
                    WHEN pcm.user_id IS NOT NULL THEN COALESCE(u.name, 'Customer')
                    WHEN pcm.staff_id IS NOT NULL THEN COALESCE(stf.name, 'Disibin Support')
                    ELSE 'Disibin Staff Support' 
                END AS sender_name,
                CASE
                    WHEN pcm.user_id IS NOT NULL THEN 'user'
                    ELSE 'staff'
                END AS sender_type
             FROM package_chats_messages pcm
             LEFT JOIN users u ON pcm.user_id = u.id
             LEFT JOIN staffs stf ON pcm.staff_id = stf.id
             WHERE pcm.chat_id = $1
             ORDER BY pcm.created_at ASC`,
            [chatId]
        );

        // Fetch shared images from package_chats_images
        const imgRes = await dbQuery(
            `SELECT pci.id, pci.chat_id, pci.user_id, pci.staff_id, pci.file_url, pci.file_id, pci.created_at,
                    u.name AS user_name, stf.name AS staff_name
             FROM package_chats_images pci
             LEFT JOIN users u ON pci.user_id = u.id
             LEFT JOIN staffs stf ON pci.staff_id = stf.id
             WHERE pci.chat_id = $1
             ORDER BY pci.created_at ASC`,
            [chatId]
        ).catch(() => ({ rows: [] }));

        return NextResponse.json({
            success: true,
            data: {
                chat: { ...chat, features },
                messages: msgRes.rows,
                images: imgRes.rows
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST — Send a new message / images in package project chat by staff
export async function POST(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        await ensurePackageChatsImagesTable();

        const staffId = auth.data.id;
        const body = await req.json();
        const { chat_id, message, images } = body;

        const msgText = (message || "").trim();
        const hasImages = Array.isArray(images) && images.length > 0;

        if (!chat_id || (!msgText && !hasImages)) {
            return NextResponse.json({ success: false, message: "chat_id and message/images are required" }, { status: 400 });
        }

        // Verify project chat exists
        const chatCheck = await dbQuery(`SELECT id FROM package_chats WHERE id = $1`, [chat_id]);
        if (chatCheck.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Project chat not found" }, { status: 404 });
        }

        let newMsg = null;
        if (msgText || !hasImages) {
            const msgRes = await dbQuery(
                `INSERT INTO package_chats_messages (chat_id, staff_id, content)
                 VALUES ($1, $2, $3)
                 RETURNING id, chat_id, staff_id, content AS message, created_at`,
                [chat_id, staffId, msgText || "Sent image attachment"]
            );
            newMsg = msgRes.rows[0];
        }

        const newImages = [];
        if (hasImages) {
            for (const img of images) {
                if (img.file_url) {
                    const imgRes = await dbQuery(
                        `INSERT INTO package_chats_images (chat_id, staff_id, file_url, file_id)
                         VALUES ($1, $2, $3, $4)
                         RETURNING id, chat_id, staff_id, file_url, file_id, created_at`,
                        [chat_id, staffId, img.file_url, img.file_id || null]
                    );
                    newImages.push(imgRes.rows[0]);
                }
            }
        }

        // Send in-app notification to the client user participant
        const userPart = await dbQuery(
            `SELECT user_id FROM package_chats_participants WHERE chat_id = $1 AND user_id IS NOT NULL`,
            [chat_id]
        );
        if (userPart.rows.length > 0) {
            const clientUser = userPart.rows[0];
            await dbQuery(
                `INSERT INTO notifications (user_id, title, message, type, link)
                 VALUES ($1, $2, $3, 'project', $4)`,
                [
                    clientUser.user_id,
                    `New Update on Project Chat #${chat_id}`,
                    `Staff ${auth.data.name || 'Support'} replied: "${msgText.substring(0, 80)}${msgText.length > 80 ? '...' : ''}"`,
                    `/user/projects/${chat_id}`
                ]
            ).catch(() => {});
        }

        return NextResponse.json({
            success: true,
            message: "Sent successfully",
            data: {
                message: newMsg ? {
                    ...newMsg,
                    sender_type: 'staff',
                    sender_name: auth.data.name || 'Disibin Support'
                } : null,
                images: newImages
            }
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// PATCH — Staff updates package project chat title or status
export async function PATCH(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        await ensurePackageChatsImagesTable();

        const body = await req.json();
        const { chat_id, title, status } = body;

        if (!chat_id) {
            return NextResponse.json({ success: false, message: "chat_id is required" }, { status: 400 });
        }

        const updates = [];
        const params = [];
        let paramIdx = 1;

        if (title && title.trim()) {
            updates.push(`title = $${paramIdx++}`);
            params.push(title.trim());
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
        const query = `UPDATE package_chats SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING id, title, status`;
        const updateRes = await dbQuery(query, params);

        if (updateRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Project chat not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Project chat updated successfully",
            data: updateRes.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE — Delete package project chat (Manager Role only)
export async function DELETE(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const { searchParams } = new URL(req.url);
        const chatId = searchParams.get('chat_id');

        if (!chatId) {
            return NextResponse.json({ success: false, message: "chat_id is required" }, { status: 400 });
        }

        const delRes = await dbQuery(`DELETE FROM package_chats WHERE id = $1 RETURNING id`, [chatId]);
        if (delRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Project chat not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Project chat deleted successfully"
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
