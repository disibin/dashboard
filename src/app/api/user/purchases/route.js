import { NextResponse } from "next/server";
import { isUserLogin } from "@/lib/auth/user";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;

        const res = await dbQuery(`
            SELECT 
                pur.id AS purchase_id, 
                pur.order_id,
                pur.package_id, 
                pur.price, 
                pur.discount, 
                pur.status AS purchase_status, 
                pur.created_at,
                pkg.name AS package_title, 
                pkg.description AS package_description,
                pkg.image AS package_image,
                pay.id AS payment_id, 
                COALESCE(pay.price, pur.price - pur.discount) AS payment_price, 
                COALESCE(pay.paid, 0) AS paid, 
                COALESCE(pay.due, pur.price - pur.discount) AS due, 
                COALESCE(pay.status, 'unpaid') AS payment_status,
                pay.payment_method,
                pay.transaction_id,
                pay.sender_number,
                pay.note,
                pay.proof_url,
                pay.verified_at
            FROM purchases pur
            LEFT JOIN packages pkg ON pur.package_id = pkg.id
            LEFT JOIN payments pay ON (
                (pur.order_id IS NOT NULL AND pay.order_id = pur.order_id)
                OR 
                (pur.order_id IS NULL AND pay.purchase_id = pur.id)
            )
            WHERE pur.user_id = $1
            ORDER BY pur.created_at DESC
        `, [userId]);

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const { searchParams } = new URL(req.url);
        const purchaseId = searchParams.get('purchase_id');
        const orderId = searchParams.get('order_id');

        if (!purchaseId && !orderId) {
            return NextResponse.json({ success: false, message: "purchase_id or order_id is required" }, { status: 400 });
        }

        let purRes;
        if (purchaseId) {
            purRes = await dbQuery(
                `SELECT pur.id, pur.status, pur.order_id, pay.status AS payment_status
                 FROM purchases pur
                 LEFT JOIN payments pay ON (
                     (pur.order_id IS NOT NULL AND pay.order_id = pur.order_id)
                     OR (pur.order_id IS NULL AND pay.purchase_id = pur.id)
                 )
                 WHERE pur.id = $1 AND pur.user_id = $2`,
                [purchaseId, userId]
            );
        } else {
            purRes = await dbQuery(
                `SELECT pur.id, pur.status, pur.order_id, pay.status AS payment_status
                 FROM purchases pur
                 LEFT JOIN payments pay ON pay.order_id = pur.order_id
                 WHERE pur.order_id = $1 AND pur.user_id = $2`,
                [orderId, userId]
            );
        }

        if (purRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Purchase record not found" }, { status: 404 });
        }

        const hasCompleted = purRes.rows.some(
            r => (r.status || '').toLowerCase() === 'complete' || (r.payment_status || '').toLowerCase() === 'paid'
        );

        if (hasCompleted) {
            return NextResponse.json({
                success: false,
                message: "Completed purchases and confirmed payments cannot be deleted."
            }, { status: 400 });
        }

        if (orderId) {
            await dbQuery(`DELETE FROM payments WHERE order_id = $1 AND status != 'paid'`, [orderId]);
            await dbQuery(`DELETE FROM purchases WHERE order_id = $1 AND status != 'complete'`, [orderId]);
        } else {
            const row = purRes.rows[0];
            if (row.order_id) {
                await dbQuery(`DELETE FROM purchases WHERE id = $1 AND status != 'complete'`, [purchaseId]);

                const remaining = await dbQuery(`SELECT id FROM purchases WHERE order_id = $1`, [row.order_id]);
                if (remaining.rows.length === 0) {
                    await dbQuery(`DELETE FROM payments WHERE order_id = $1 AND status != 'paid'`, [row.order_id]);
                }
            } else {
                await dbQuery(`DELETE FROM payments WHERE purchase_id = $1 AND status != 'paid'`, [purchaseId]);
                await dbQuery(`DELETE FROM purchases WHERE id = $1 AND status != 'complete'`, [purchaseId]);
            }
        }

        return NextResponse.json({
            success: true,
            message: "Purchase record removed successfully"
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
