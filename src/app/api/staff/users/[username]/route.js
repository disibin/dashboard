import { NextResponse } from "next/server";
import { isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET(req, { params }) {
    try {
        const auth = await isManager();
        if (!auth.success) {
            return NextResponse.json({ success: false, message: "Forbidden: Only managers can view user profile details" }, { status: 403 });
        }

        const resolvedParams = await params;
        let paramValue = resolvedParams.username || '';
        try {
            paramValue = decodeURIComponent(paramValue);
            if (paramValue.includes('%')) {
                paramValue = decodeURIComponent(paramValue);
            }
        } catch {}
        paramValue = paramValue.trim();

        if (!paramValue) {
            return NextResponse.json({ success: false, message: "User Email or ID is required" }, { status: 400 });
        }

        let userRes;
        const numericId = parseInt(paramValue, 10);
        if (!isNaN(numericId) && numericId.toString() === paramValue) {
            userRes = await dbQuery(`
                SELECT id, name, email, phone, city, country, address_line1, address_line2, state, postal_code, is_active, is_verified, last_login, created_at, updated_at
                FROM users
                WHERE id = $1
            `, [numericId]);
        } else {
            userRes = await dbQuery(`
                SELECT id, name, email, phone, city, country, address_line1, address_line2, state, postal_code, is_active, is_verified, last_login, created_at, updated_at
                FROM users
                WHERE LOWER(email) = LOWER($1)
            `, [paramValue]);
        }

        if (userRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "User profile not found" }, { status: 404 });
        }

        const user = userRes.rows[0];

        const projectsRes = await dbQuery(`
            SELECT DISTINCT pc.id, pc.title, pc.description, pc.status, pc.created_at
            FROM project_chats pc
            JOIN project_chats_participants pcp ON pc.id = pcp.chat_id
            WHERE pcp.user_id = $1
            ORDER BY pc.created_at DESC
        `, [user.id]).catch(() => ({ rows: [] }));

        const purchasesRes = await dbQuery(`
            SELECT p.id, p.order_id, p.price, p.discount, p.status, p.created_at, pkg.name as package_name, pkg.slug as package_slug
            FROM purchases p
            LEFT JOIN packages pkg ON p.package_id = pkg.id
            WHERE p.user_id = $1
            ORDER BY p.created_at DESC
        `, [user.id]).catch(() => ({ rows: [] }));

        const paymentsRes = await dbQuery(`
            SELECT pay.id, pay.purchase_id, pay.order_id, pay.price, pay.paid, pay.due, pay.payment_method, pay.transaction_id, pay.sender_number, pay.note, pay.proof_url, pay.status, pay.created_at
            FROM payments pay
            WHERE pay.user_id = $1
            ORDER BY pay.created_at DESC
        `, [user.id]).catch(() => ({ rows: [] }));

        const cartRes = await dbQuery(`
            SELECT c.id as cart_id, c.package_id, c.created_at, pkg.name as package_name, pkg.price, pkg.discount, pkg.image
            FROM user_cart c
            LEFT JOIN packages pkg ON c.package_id = pkg.id
            WHERE c.user_id = $1
            ORDER BY c.created_at DESC
        `, [user.id]).catch(() => ({ rows: [] }));

        const ticketsRes = await dbQuery(`
            SELECT DISTINCT t.id, t.title, t.created_at, t.updated_at
            FROM tickets t
            JOIN ticket_participants tp ON t.id = tp.ticket_id
            WHERE tp.user_id = $1
            ORDER BY t.created_at DESC
        `, [user.id]).catch(() => ({ rows: [] }));

        const reviewsRes = await dbQuery(`
            SELECT r.id, r.tenant_name, r.rating, r.comment, r.reply, r.is_approved, r.created_at
            FROM reviews r
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC
        `, [user.id]).catch(() => ({ rows: [] }));

        const loginLogsRes = await dbQuery(`
            SELECT id, action, entity_type, description, status, created_at
            FROM user_login_logs
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 20
        `, [user.id]).catch(() => ({ rows: [] }));

        return NextResponse.json({
            success: true,
            data: {
                user,
                projects: projectsRes.rows,
                purchases: purchasesRes.rows,
                payments: paymentsRes.rows,
                cart: cartRes.rows,
                tickets: ticketsRes.rows,
                reviews: reviewsRes.rows,
                loginLogs: loginLogsRes.rows
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
