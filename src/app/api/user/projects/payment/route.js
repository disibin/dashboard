import { NextResponse } from "next/server";
import { isUserLogin } from "@/lib/auth/user";
import { dbQuery } from "@/lib/database/pg";

export async function POST(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const body = await req.json();
        const { purchase_id } = body;

        if (!purchase_id) {
            return NextResponse.json({ success: false, message: "purchase_id is required" }, { status: 400 });
        }

        const purchaseRes = await dbQuery(
            `SELECT id, user_id, price, discount, status FROM purchases WHERE id = $1 AND user_id = $2`,
            [purchase_id, userId]
        );

        if (purchaseRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Purchase record not found" }, { status: 404 });
        }

        const purchase = purchaseRes.rows[0];

        const existingPayment = await dbQuery(
            `SELECT id, price, paid, due, status FROM payments WHERE purchase_id = $1`,
            [purchase_id]
        );

        if (existingPayment.rows.length > 0) {
            return NextResponse.json({
                success: true,
                message: "Payment record already exists",
                data: existingPayment.rows[0]
            });
        }

        const netPrice = Math.max(0, Number(purchase.price || 0) - Number(purchase.discount || 0));

        const paymentRes = await dbQuery(
            `INSERT INTO payments (purchase_id, price, paid, due, status)
             VALUES ($1, $2, 0, $3, 'unpaid')
             RETURNING id, purchase_id, price, paid, due, status, created_at`,
            [purchase_id, netPrice, netPrice]
        );

        return NextResponse.json({
            success: true,
            message: "Package payment created successfully. Status: unpaid",
            data: paymentRes.rows[0]
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const body = await req.json();
        const { purchase_id, payment_id } = body;

        if (!purchase_id && !payment_id) {
            return NextResponse.json({ success: false, message: "purchase_id or payment_id is required" }, { status: 400 });
        }

        const purchaseRes = await dbQuery(
            `SELECT p.id, pay.id AS payment_id, pay.price
             FROM purchases p
             LEFT JOIN payments pay ON p.id = pay.purchase_id
             WHERE (p.id = $1 OR pay.id = $2) AND p.user_id = $3`,
            [purchase_id || null, payment_id || null, userId]
        );

        if (purchaseRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Purchase/Payment record not found" }, { status: 404 });
        }

        const record = purchaseRes.rows[0];

        const updatePaymentRes = await dbQuery(
            `UPDATE payments
             SET paid = price, due = 0, status = 'paid', updated_at = now()
             WHERE purchase_id = $1
             RETURNING id, purchase_id, price, paid, due, status, updated_at`,
            [record.id]
        );

        await dbQuery(
            `UPDATE purchases SET status = 'complete', updated_at = now() WHERE id = $1`,
            [record.id]
        ).catch(() => {});

        return NextResponse.json({
            success: true,
            message: "Payment processed successfully! Status: Paid",
            data: updatePaymentRes.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
