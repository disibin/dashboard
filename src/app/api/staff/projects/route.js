import { NextResponse } from "next/server";
import { isStaffLogin } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

// GET — List all package project chats for support and manager staff
export async function GET() {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const query = `
            SELECT DISTINCT ON (pc.id)
                pc.id AS package_chat_id,
                pc.id AS id,
                COALESCE(pc.title, pkg.name, 'Package Project') AS project_title,
                'package' AS project_type,
                COALESCE(pc.status, 'waiting') AS project_status,
                pkg.name AS package_name,
                pkg.description,
                COALESCE(pur.price - pur.discount, pkg.price - pkg.discount, 0) AS net_price,
                pc.created_at,
                t.name AS tenant_name,
                u.name AS user_name,
                u.email AS user_email,
                u.id AS user_id,
                COALESCE(pay.status, 'unpaid') AS payment_status,
                (
                    SELECT content 
                    FROM package_chats_messages pcm 
                    WHERE pcm.chat_id = pc.id 
                    ORDER BY pcm.created_at DESC LIMIT 1
                ) AS last_message,
                (
                    SELECT created_at 
                    FROM package_chats_messages pcm 
                    WHERE pcm.chat_id = pc.id 
                    ORDER BY pcm.created_at DESC LIMIT 1
                ) AS last_message_at
            FROM package_chats pc
            JOIN package_chats_participants pcp ON pc.id = pcp.chat_id
            LEFT JOIN users u ON u.id = pcp.user_id
            LEFT JOIN packages pkg ON pc.package_id = pkg.id
            LEFT JOIN tenants t ON t.id = pkg.tenant_id
            LEFT JOIN purchases pur ON pur.package_id = pc.package_id AND pur.user_id = pcp.user_id
            LEFT JOIN payments pay ON pur.id = pay.purchase_id
            ORDER BY pc.id, pc.created_at DESC
        `;

        const res = await dbQuery(query);
        return NextResponse.json({ success: true, data: res.rows });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
