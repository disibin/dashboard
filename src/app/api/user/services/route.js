import { NextResponse } from "next/server";
import { isUserLogin } from "@/lib/auth/user";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const res = await dbQuery(
            `SELECT 
                srv.id, srv.tenant_id, srv.name, srv.slug, srv.description, 
                srv.price, srv.discount, srv.created_at, srv.updated_at,
                t.name AS tenant_name, t.url AS tenant_url,
                sp.id AS payment_id,
                COALESCE(sp.paid, 0) AS paid_amount,
                COALESCE(sp.due, srv.price - srv.discount) AS due_amount,
                COALESCE(sp.status, 'unpaid') AS payment_status
             FROM services srv
             LEFT JOIN tenants t ON t.id = srv.tenant_id
             LEFT JOIN service_payments sp ON sp.service_id = srv.id
             ORDER BY srv.created_at DESC`
        );

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
