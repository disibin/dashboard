import { NextResponse } from "next/server";
import { isUserLogin } from "@/lib/auth/user";
import { dbQuery } from "@/lib/database/pg";

export async function POST(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const body = await req.json();
        const { package_id } = body;

        if (!package_id) {
            return NextResponse.json({ success: false, message: "package_id is required" }, { status: 400 });
        }

        const pkgRes = await dbQuery("SELECT id, name, price, discount, description FROM packages WHERE id = $1", [package_id]);
        if (pkgRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Package not found" }, { status: 404 });
        }
        const pkg = pkgRes.rows[0];

        const chatTitle = `${pkg.name} Project`;

        const existingChatRes = await dbQuery(
            `SELECT pc.id, pc.title
             FROM project_chats pc
             JOIN project_chats_participants pcp ON pc.id = pcp.chat_id
             WHERE pcp.user_id = $1 AND pc.title = $2
             ORDER BY pc.created_at DESC
             LIMIT 1`,
            [userId, chatTitle]
        ).catch(() => ({ rows: [] }));

        if (existingChatRes.rows.length > 0) {
            const existingChat = existingChatRes.rows[0];
            return NextResponse.json({
                success: true,
                message: "Package project already started. Opening project chat...",
                data: {
                    package_chat_id: existingChat.id,
                    title: existingChat.title
                }
            });
        }

        const purchaseRes = await dbQuery(
            `INSERT INTO purchases (user_id, package_id, price, discount, status)
             VALUES ($1, $2, $3, $4, 'incomplete')
             RETURNING id, created_at`,
            [userId, package_id, pkg.price || 0, pkg.discount || 0]
        );
        const purchase = purchaseRes.rows[0];

        const chatRes = await dbQuery(
            `INSERT INTO project_chats (title, description, status)
             VALUES ($1, $2, 'waiting')
             RETURNING id, title, created_at`,
            [chatTitle, `Package project initiated for ${pkg.name}. Scope deliverables based on selected package.`]
        );
        const projectChat = chatRes.rows[0];

        await dbQuery(
            `INSERT INTO project_chats_participants (chat_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (chat_id, user_id, staff_id) DO NOTHING`,
            [projectChat.id, userId]
        );

        const staffRes = await dbQuery("SELECT id FROM staffs ORDER BY id ASC LIMIT 1");
        const staffId = staffRes.rows.length > 0 ? staffRes.rows[0].id : null;

        const welcomeText = `Welcome to your project discussion for "${pkg.name}"! Our technical team and staff project manager will review your scope and assist you right away. Feel free to leave any initial requirements below.`;

        if (staffId) {
            await dbQuery(
                `INSERT INTO project_chats_messages (chat_id, staff_id, content)
                 VALUES ($1, $2, $3)`,
                [projectChat.id, staffId, welcomeText]
            );
        } else {
            await dbQuery(
                `INSERT INTO project_chats_messages (chat_id, user_id, content)
                 VALUES ($1, $2, $3)`,
                [projectChat.id, userId, `Project started for ${pkg.name}. Welcome!` ]
            );
        }

        await dbQuery(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES ($1, $2, $3, 'project', $4)`,
            [
                userId,
                `Project Started: ${pkg.name}`,
                `Your project discussion for ${pkg.name} is now open in your projects dashboard.`,
                `/user/projects/${projectChat.id}`
            ]
        ).catch(() => {});

        return NextResponse.json({
            success: true,
            message: `Project started for ${pkg.name}!`,
            data: {
                purchase_id: purchase.id,
                package_chat_id: projectChat.id,
                title: projectChat.title
            }
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
