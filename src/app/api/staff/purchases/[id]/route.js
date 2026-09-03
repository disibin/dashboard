import { NextResponse } from "next/server";
import { isStaffLogin } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET(req, { params }) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const resolvedParams = await params;
        const purchaseId = resolvedParams.id;

        if (!purchaseId) {
            return NextResponse.json({ success: false, message: "Purchase ID is required" }, { status: 400 });
        }

        let cleanedId = purchaseId.trim();
        let numericId = parseInt(cleanedId.replace(/^(PUR|PAY|ORD|INV)-/i, ''), 10);
        if (isNaN(numericId)) numericId = null;

        const purchaseRes = await dbQuery(`
            SELECT 
                p.id,
                p.id AS purchase_id,
                p.order_id,
                p.price,
                p.discount,
                p.status AS purchase_status,
                p.created_at,
                p.updated_at,
                u.id AS user_id,
                u.name AS user_name,
                u.email AS user_email,
                u.phone AS user_phone,
                u.city AS user_city,
                u.country AS user_country,
                u.is_verified AS user_verified,
                pkg.id AS package_id,
                pkg.name AS package_name,
                pkg.slug AS package_slug,
                pkg.description AS package_description,
                pkg.price AS package_original_price,
                pkg.image AS package_image
            FROM purchases p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN packages pkg ON p.package_id = pkg.id
            WHERE p.order_id = $1 OR (p.id = $2 AND $2 IS NOT NULL)
        `, [cleanedId, numericId]);

        if (purchaseRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Purchase record not found" }, { status: 404 });
        }

        const purchase = purchaseRes.rows[0];

        const paymentsRes = await dbQuery(`
            SELECT id, purchase_id, order_id, price, paid, due, payment_method, transaction_id, sender_number, note, proof_url, status, created_at
            FROM payments
            WHERE purchase_id = $1 OR order_id = $2
            ORDER BY created_at DESC
        `, [purchase.purchase_id, purchase.order_id]).catch(() => ({ rows: [] }));

        const featuresRes = await dbQuery(`
            SELECT f.id, f.name, f.slug, pf.value
            FROM package_features pf
            JOIN features f ON pf.feature_id = f.id
            WHERE pf.package_id = $1
        `, [purchase.package_id]).catch(() => ({ rows: [] }));

        const projectTitle = `Project - ${purchase.package_name || 'Deliverable'} (#${purchase.purchase_id})`;
        const projectRes = await dbQuery(`
            SELECT pc.id, pc.title, pc.status, pc.created_at
            FROM project_chats pc
            JOIN project_chats_participants pcp ON pc.id = pcp.chat_id
            WHERE pcp.user_id = $1 AND pc.title = $2
            LIMIT 1
        `, [purchase.user_id, projectTitle]).catch(() => ({ rows: [] }));

        return NextResponse.json({
            success: true,
            data: {
                purchase,
                payments: paymentsRes.rows,
                features: featuresRes.rows,
                project: projectRes.rows[0] || null
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
