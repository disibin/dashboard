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

        // 1. Fetch package details
        const pkgRes = await dbQuery("SELECT id, name, price, discount FROM packages WHERE id = $1", [package_id]);
        if (pkgRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Package not found" }, { status: 404 });
        }
        const pkg = pkgRes.rows[0];

        // 2. Check if chat already exists for this user and package
        const existingChatRes = await dbQuery(
            `SELECT pc.id, pc.title
             FROM package_chats pc
             JOIN package_chats_participants pcp ON pc.id = pcp.chat_id
             WHERE pcp.user_id = $1 AND pc.package_id = $2
             ORDER BY pc.created_at DESC
             LIMIT 1`,
            [userId, package_id]
        );

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

        // 3. Create purchase record
        const netPrice = Math.max(0, Number(pkg.price || 0) - Number(pkg.discount || 0));
        const purchaseRes = await dbQuery(
            `INSERT INTO purchases (user_id, package_id, price, discount, status)
             VALUES ($1, $2, $3, $4, 'incomplete')
             RETURNING id, created_at`,
            [userId, package_id, pkg.price || 0, pkg.discount || 0]
        );
        const purchase = purchaseRes.rows[0];


        // 4. Create package_chats record
        const chatTitle = `${pkg.name} Project`;
        const chatRes = await dbQuery(
            `INSERT INTO package_chats (package_id, title)
             VALUES ($1, $2)
             RETURNING id, title, created_at`,
            [package_id, chatTitle]
        );
        const packageChat = chatRes.rows[0];

        // 5. Add user as participant in package_chats_participants
        await dbQuery(
            `INSERT INTO package_chats_participants (chat_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT (chat_id, user_id, staff_id) DO NOTHING`,
            [packageChat.id, userId]
        );

        // 6. Get a staff ID for initial welcome message
        const staffRes = await dbQuery("SELECT id FROM staffs ORDER BY id ASC LIMIT 1");
        const staffId = staffRes.rows.length > 0 ? staffRes.rows[0].id : null;

        // 7. Insert initial welcome message into package_chats_messages
        const welcomeText = `Welcome to your project discussion for "${pkg.name}"! Our technical team and staff project manager will review your scope and assist you right away. Feel free to leave any initial requirements below.`;
        
        if (staffId) {
            await dbQuery(
                `INSERT INTO package_chats_messages (chat_id, staff_id, content)
                 VALUES ($1, $2, $3)`,
                [packageChat.id, staffId, welcomeText]
            );
        } else {
            await dbQuery(
                `INSERT INTO package_chats_messages (chat_id, user_id, content)
                 VALUES ($1, $2, $3)`,
                [packageChat.id, userId, `Project started for ${pkg.name}. Welcome!` ]
            );
        }

        // Send user notification
        await dbQuery(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES ($1, $2, $3, 'project', $4)`,
            [
                userId,
                `Project Started: ${pkg.name}`,
                `Your project discussion for ${pkg.name} is now open in your projects dashboard.`,
                `/user/projects`
            ]
        ).catch(() => {});

        return NextResponse.json({
            success: true,
            message: `Project started for ${pkg.name}!`,
            data: {
                purchase_id: purchase.id,
                package_chat_id: packageChat.id,
                title: packageChat.title
            }
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
