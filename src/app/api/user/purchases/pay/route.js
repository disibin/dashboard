import { NextResponse } from "next/server";
import { isUserLogin } from "@/lib/auth/user";
import { dbQuery } from "@/lib/database/pg";

export async function POST(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const body = await req.json();
        const {
            purchase_id,
            order_id,
            payment_method,
            transaction_id,
            sender_number,
            note,
            proof_url
        } = body;

        if (!purchase_id && !order_id) {
            return NextResponse.json({ success: false, message: "purchase_id or order_id is required" }, { status: 400 });
        }

        if (!transaction_id || !transaction_id.trim()) {
            return NextResponse.json({ success: false, message: "Transaction ID / Reference is required" }, { status: 400 });
        }

        const targetId = parseInt(purchase_id || order_id, 10);
        if (isNaN(targetId)) {
            return NextResponse.json({ success: false, message: "Valid purchase_id is required" }, { status: 400 });
        }

        const purchaseRes = await dbQuery(
            `SELECT id, user_id, price, discount FROM purchases WHERE id = $1 AND user_id = $2`,
            [targetId, userId]
        );

        if (purchaseRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Purchase record not found" }, { status: 404 });
        }

        const targetPurchaseId = purchaseRes.rows[0].id;

        const paymentCheck = await dbQuery(
            `SELECT id, price, paid, due, status FROM payments WHERE purchase_id = $1`,
            [targetPurchaseId]
        );

        let updatedPayment;
        if (paymentCheck.rows.length > 0) {
            const payId = paymentCheck.rows[0].id;
            const updateRes = await dbQuery(
                `UPDATE payments 
                 SET payment_method = $1, transaction_id = $2, sender_number = $3, note = $4, proof_url = $5, status = 'pending', updated_at = now()
                 WHERE id = $6
                 RETURNING *`,
                [
                    payment_method || 'manual',
                    transaction_id.trim(),
                    sender_number ? sender_number.trim() : null,
                    note ? note.trim() : null,
                    proof_url ? proof_url.trim() : null,
                    payId
                ]
            );
            updatedPayment = updateRes.rows[0];
        } else {
            const netPrice = Math.max(0, Number(purchaseRes.rows[0].price || 0) - Number(purchaseRes.rows[0].discount || 0));
            const insertRes = await dbQuery(
                `INSERT INTO payments (
                    purchase_id, user_id, price, paid, due, 
                    payment_method, transaction_id, sender_number, note, proof_url, status
                 )
                 VALUES ($1, $2, $3, 0, $3, $4, $5, $6, $7, $8, 'pending')
                 RETURNING *`,
                [
                    targetPurchaseId,
                    userId,
                    netPrice,
                    payment_method || 'manual',
                    transaction_id.trim(),
                    sender_number ? sender_number.trim() : null,
                    note ? note.trim() : null,
                    proof_url ? proof_url.trim() : null
                ]
            );
            updatedPayment = insertRes.rows[0];
        }

        await dbQuery(`UPDATE purchases SET status = 'pending', updated_at = now() WHERE id = $1`, [targetPurchaseId]);

        await dbQuery(
            `INSERT INTO activity_logs (action, entity_type, entity_id, description)
             VALUES ('PAYMENT_PROOF_SUBMITTED', 'payments', $1, $2)`,
            [updatedPayment.id, `User ID ${userId} submitted payment proof with Trx ID: ${transaction_id.trim()}`]
        ).catch(() => {});

        return NextResponse.json({
            success: true,
            message: "Payment details submitted successfully! Staff will verify and approve shortly.",
            data: updatedPayment
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
