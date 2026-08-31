import { NextResponse } from "next/server";
import { isUserLogin } from "@/lib/auth/user";
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
        `).catch(() => {});
        imagesTableChecked = true;
    } catch (err) {}
}

// GET — Fetch chat messages, images & detailed project metadata
export async function GET(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        await ensurePackageChatsImagesTable();

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
                pc.created_at, 
                pc.package_id,
                pkg.name AS package_name,
                pkg.description AS package_description,
                pkg.price AS package_price,
                pur.id AS purchase_id,
                pur.price AS purchase_price,
                pur.discount AS purchase_discount,
                COALESCE(pur.status, 'active') AS purchase_status,
                COALESCE(pay.paid, 0) AS paid,
                COALESCE(pay.due, GREATEST(0, COALESCE(pur.price - pur.discount, pkg.price - pkg.discount, 0))) AS due,
                COALESCE(pay.status, 'unpaid') AS payment_status,
                t.name AS tenant_name
             FROM package_chats pc
             JOIN package_chats_participants pcp ON pc.id = pcp.chat_id
             LEFT JOIN packages pkg ON pc.package_id = pkg.id
             LEFT JOIN tenants t ON t.id = pkg.tenant_id
             LEFT JOIN purchases pur ON pur.package_id = pc.package_id AND pur.user_id = pcp.user_id
             LEFT JOIN payments pay ON pur.id = pay.purchase_id
             WHERE pc.id = $1 AND pcp.user_id = $2`,
            [chatId, userId]
        );

        if (chatRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Project chat not found or access denied" }, { status: 404 });
        }

        const chat = chatRes.rows[0];

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
                    WHEN pcm.user_id IS NOT NULL THEN COALESCE(u.name, 'You')
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
            `SELECT pci.id, pci.chat_id, pci.user_id, pci.staff_id, pci.file_url, pci.file_id, pci.created_at
             FROM package_chats_images pci
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

// POST — Send a new message / images in package project chat
export async function POST(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        await ensurePackageChatsImagesTable();

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
            `SELECT chat_id FROM package_chats_participants WHERE chat_id = $1 AND user_id = $2`,
            [chat_id, userId]
        );

        if (participantRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Project chat not found or access denied" }, { status: 400 });
        }

        let newMsg = null;
        if (msgText || !hasImages) {
            const msgRes = await dbQuery(
                `INSERT INTO package_chats_messages (chat_id, user_id, content)
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
                        `INSERT INTO package_chats_images (chat_id, user_id, file_url, file_id)
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

// PATCH — Rename package project chat title
export async function PATCH(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const body = await req.json();
        const { chat_id, title } = body;

        if (!chat_id || !title || !title.trim()) {
            return NextResponse.json({ success: false, message: "chat_id and title are required" }, { status: 400 });
        }

        // Verify user participation in chat
        const participantRes = await dbQuery(
            `SELECT chat_id FROM package_chats_participants WHERE chat_id = $1 AND user_id = $2`,
            [chat_id, userId]
        );

        if (participantRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Project chat not found or access denied" }, { status: 403 });
        }

        const newTitle = title.trim();
        await dbQuery(
            `UPDATE package_chats SET title = $1 WHERE id = $2`,
            [newTitle, chat_id]
        );

        return NextResponse.json({
            success: true,
            message: "Project chat title updated successfully",
            data: { title: newTitle }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
