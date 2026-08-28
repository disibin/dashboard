import { NextResponse } from "next/server";
import { isUserLogin } from "@/lib/auth/user";
import { dbQuery } from "@/lib/database/pg";

// GET — List user's purchases & payments
export async function GET() {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;

        const res = await dbQuery(`
            SELECT 
                pur.id AS purchase_id, 
                pur.package_id, 
                pur.price, 
                pur.discount, 
                pur.status AS purchase_status, 
                pur.created_at,
                pkg.title AS package_title, 
                pkg.description AS package_description,
                pay.id AS payment_id, 
                pay.price AS payment_price, 
                pay.paid, 
                pay.due, 
                pay.status AS payment_status
            FROM purchases pur
            LEFT JOIN packages pkg ON pur.package_id = pkg.id
            LEFT JOIN payments pay ON pur.id = pay.purchase_id
            WHERE pur.user_id = $1
            ORDER BY pur.created_at DESC
        `, [userId]);

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
