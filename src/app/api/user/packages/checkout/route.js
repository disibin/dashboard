import { NextResponse } from "next/server";
import { isUserLogin } from "@/lib/auth/user";
import { dbQuery } from "@/lib/database/pg";

// POST — Checkout single or multiple packages with payment details
export async function POST(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const body = await req.json();
        const {
            package_ids,
            payment_method,
            transaction_id,
            sender_number,
            note,
            proof_url
        } = body;

        if (!Array.isArray(package_ids) || package_ids.length === 0) {
            return NextResponse.json({ success: false, message: "At least one package must be selected" }, { status: 400 });
        }

        // 1. Fetch all selected packages
        const placeholders = package_ids.map((_, i) => `$${i + 1}`).join(',');
        const pkgRes = await dbQuery(
            `SELECT id, name, price, discount FROM packages WHERE id IN (${placeholders})`,
            package_ids
        );

        if (pkgRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Selected packages not found" }, { status: 404 });
        }

        const selectedPackages = pkgRes.rows;
        const orderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        let totalGross = 0;
        let totalDiscount = 0;
        let totalNet = 0;

        // 2. Insert each package purchase with the generated order_id
        const createdPurchases = [];
        for (const pkg of selectedPackages) {
            const pkgPrice = Number(pkg.price || 0);
            const pkgDiscount = Number(pkg.discount || 0);
            const pkgNet = Math.max(0, pkgPrice - pkgDiscount);

            totalGross += pkgPrice;
            totalDiscount += pkgDiscount;
            totalNet += pkgNet;

            const purRes = await dbQuery(
                `INSERT INTO purchases (package_id, user_id, order_id, price, discount, status)
                 VALUES ($1, $2, $3, $4, $5, 'pending')
                 RETURNING id, package_id, order_id, price, discount, status, created_at`,
                [pkg.id, userId, orderId, pkgPrice, pkgDiscount]
            );
            createdPurchases.push(purRes.rows[0]);
        }

        // 3. Insert consolidated payments record
        const paymentRes = await dbQuery(
            `INSERT INTO payments (
                order_id, user_id, price, paid, due, 
                payment_method, transaction_id, sender_number, note, proof_url, status
             )
             VALUES ($1, $2, $3, 0, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id, order_id, price, paid, due, payment_method, transaction_id, sender_number, status, created_at`,
            [
                orderId,
                userId,
                totalNet,
                totalNet,
                payment_method || 'manual',
                transaction_id ? transaction_id.trim() : null,
                sender_number ? sender_number.trim() : null,
                note ? note.trim() : null,
                proof_url ? proof_url.trim() : null,
                transaction_id ? 'pending' : 'unpaid'
            ]
        );
        const newPayment = paymentRes.rows[0];

        // 4. Send notification to user
        const packageNames = selectedPackages.map(p => p.name).join(', ');
        await dbQuery(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES ($1, $2, $3, 'payment', $4)`,
            [
                userId,
                `Order Received: ${orderId}`,
                `Your order for ${selectedPackages.length} package(s) (${packageNames}) has been received and is pending staff payment verification.`,
                '/user/purchases'
            ]
        ).catch(() => {});

        // 5. Notify staff via activity logs
        await dbQuery(
            `INSERT INTO activity_logs (action, entity_type, description)
             VALUES ('NEW_ORDER_PAYMENT', 'payments', $1)`,
            [`User ID ${userId} submitted payment for Order ${orderId} (${selectedPackages.length} packages). Trx: ${transaction_id || 'N/A'}`]
        ).catch(() => {});

        // 6. Clear user_cart for purchased packages
        await dbQuery(
            `DELETE FROM user_cart WHERE user_id = $1 AND package_id = ANY($2::int[])`,
            [userId, selectedPackages.map(p => p.id)]
        ).catch(() => {});

        return NextResponse.json({
            success: true,
            message: "Order placed successfully! Pending staff verification.",
            data: {
                order_id: orderId,
                purchases: createdPurchases,
                payment: newPayment,
                total: totalNet,
                items_count: selectedPackages.length
            }
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
