import { NextResponse } from "next/server";
import { isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

// GET — List all payments & invoices across purchases (Manager only)
export async function GET() {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const res = await dbQuery(`
            SELECT 
                pay.id as payment_id,
                pay.purchase_id,
                pay.price as total_price,
                pay.paid as paid_amount,
                pay.due as due_amount,
                pay.status as payment_status,
                pay.payment_method,
                pay.created_at,
                pay.updated_at,
                pur.package_id,
                pur.status as purchase_status,
                pkg.name as package_name,
                u.id as user_id,
                u.name as user_name,
                u.email as user_email
            FROM payments pay
            JOIN purchases pur ON pay.purchase_id = pur.id
            LEFT JOIN packages pkg ON pur.package_id = pkg.id
            LEFT JOIN users u ON pur.user_id = u.id
            ORDER BY pay.created_at DESC
        `);

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
