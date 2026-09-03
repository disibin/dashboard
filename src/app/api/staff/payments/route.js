import { NextResponse } from "next/server";
import { isStaffLogin, isManager, isRoleAllowed } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const query = `
            SELECT 
                pay.id AS payment_id,
                pay.order_id,
                pay.purchase_id,
                pay.price AS total_price,
                pay.paid AS paid_amount,
                pay.due AS due_amount,
                pay.status AS payment_status,
                pay.payment_method,
                pay.transaction_id,
                pay.sender_number,
                pay.note,
                pay.proof_url,
                pay.verified_by,
                stf.name AS verified_by_name,
                pay.verified_at,
                pay.created_at,
                pay.updated_at,
                COALESCE(u.id, pay.user_id) AS user_id,
                COALESCE(u.name, 'Customer') AS user_name,
                COALESCE(u.email, 'No email') AS user_email,
                u.phone AS user_phone,
                (
                    SELECT json_agg(json_build_object(
                        'package_id', pkg.id,
                        'package_name', pkg.name,
                        'price', pur.price,
                        'discount', pur.discount,
                        'status', pur.status
                    ))
                    FROM purchases pur
                    LEFT JOIN packages pkg ON pur.package_id = pkg.id
                    WHERE (pay.order_id IS NOT NULL AND pur.order_id = pay.order_id)
                       OR (pay.order_id IS NULL AND pur.id = pay.purchase_id)
                ) AS items
            FROM payments pay
            LEFT JOIN users u ON pay.user_id = u.id
            LEFT JOIN staffs stf ON pay.verified_by = stf.id
            ORDER BY pay.created_at DESC
        `;

        const res = await dbQuery(query);
        return NextResponse.json({ success: true, data: res.rows });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const auth = await isRoleAllowed(['support', 'manager']);
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const staffId = auth.data.id;
        const staffName = auth.data.name || 'Staff';
        const body = await req.json();
        const { payment_id, action, paid, status, note } = body;

        if (!payment_id) {
            return NextResponse.json({ success: false, message: "payment_id is required" }, { status: 400 });
        }

        const payRes = await dbQuery(`SELECT * FROM payments WHERE id = $1`, [payment_id]);
        if (payRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Payment record not found" }, { status: 404 });
        }

        const currentPayment = payRes.rows[0];
        const totalPrice = Number(currentPayment.price || 0);

        let newStatus = status || currentPayment.status;
        let newPaid = Number(currentPayment.paid || 0);
        let newDue = Number(currentPayment.due || 0);
        let newNote = currentPayment.note || '';

        if (action === 'approve' || newStatus === 'paid') {
            newStatus = 'paid';
            newPaid = totalPrice;
            newDue = 0;
            if (note) newNote = `${newNote ? newNote + ' | ' : ''}Approved by ${staffName}: ${note}`;
        } else if (action === 'partial') {
            const paidVal = Number(paid || 0);
            if (paidVal >= totalPrice) {
                newStatus = 'paid';
                newPaid = totalPrice;
                newDue = 0;
            } else {
                newStatus = 'due';
                newPaid = paidVal;
                newDue = Math.max(0, totalPrice - paidVal);
            }
            if (note) newNote = `${newNote ? newNote + ' | ' : ''}Partial Payment: ${note}`;
        } else if (action === 'reject' || newStatus === 'rejected') {
            newStatus = 'rejected';
            if (note) newNote = `${newNote ? newNote + ' | ' : ''}Rejected by ${staffName}: ${note}`;
        } else if (status) {
            newStatus = status;
            if (paid !== undefined) {
                newPaid = Number(paid);
                newDue = Math.max(0, totalPrice - newPaid);
            }
            if (note) newNote = `${newNote ? newNote + ' | ' : ''}${note}`;
        }

        const updateRes = await dbQuery(
            `UPDATE payments
             SET status = $1, paid = $2, due = $3, note = $4, verified_by = $5, verified_at = now(), updated_at = now()
             WHERE id = $6
             RETURNING *`,
            [newStatus, newPaid, newDue, newNote, staffId, payment_id]
        );
        const updated = updateRes.rows[0];

        const purchaseStatus = newStatus === 'paid' ? 'complete' : (newStatus === 'rejected' ? 'cancelled' : 'pending');
        if (currentPayment.order_id) {
            await dbQuery(
                `UPDATE purchases SET status = $1, updated_at = now() WHERE order_id = $2`,
                [purchaseStatus, currentPayment.order_id]
            );
        } else if (currentPayment.purchase_id) {
            await dbQuery(
                `UPDATE purchases SET status = $1, updated_at = now() WHERE id = $2`,
                [purchaseStatus, currentPayment.purchase_id]
            );
        }

        if (currentPayment.user_id) {
            let notificationTitle = `Payment Update for Order #${currentPayment.order_id || currentPayment.id}`;
            let notificationMsg = `Your payment status is now "${newStatus.toUpperCase()}".`;

            if (newStatus === 'paid') {
                notificationTitle = `Payment Approved: Order #${currentPayment.order_id || currentPayment.id}`;
                notificationMsg = `Your payment has been verified and marked as Paid. Thank you!`;
            } else if (newStatus === 'rejected') {
                notificationTitle = `Payment Rejected: Order #${currentPayment.order_id || currentPayment.id}`;
                notificationMsg = `Your payment could not be verified.${note ? ` Reason: ${note}` : ''}`;
            }

            await dbQuery(
                `INSERT INTO notifications (user_id, title, message, type, link)
                 VALUES ($1, $2, $3, 'payment', '/user/purchases')`,
                [currentPayment.user_id, notificationTitle, notificationMsg]
            ).catch(() => {});
        }

        await dbQuery(
            `INSERT INTO activity_logs (staff_id, action, entity_type, entity_id, description)
             VALUES ($1, 'VERIFY_PAYMENT', 'payments', $2, $3)`,
            [staffId, payment_id, `Staff ${staffName} set payment #${payment_id} status to ${newStatus}`]
        ).catch(() => {});

        return NextResponse.json({
            success: true,
            message: `Payment updated successfully. Status: ${newStatus}`,
            data: updated
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const { searchParams } = new URL(req.url);
        const paymentId = searchParams.get('payment_id');

        if (!paymentId) {
            return NextResponse.json({ success: false, message: "payment_id is required" }, { status: 400 });
        }

        await dbQuery(`DELETE FROM payments WHERE id = $1`, [paymentId]);

        return NextResponse.json({
            success: true,
            message: "Payment transaction deleted successfully"
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
