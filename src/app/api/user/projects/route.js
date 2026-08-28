import { NextResponse } from "next/server";
import { isUserLogin } from "@/lib/auth/user";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;

        const servicesRes = await dbQuery(
            `SELECT 
                srv.id, 
                srv.name AS project_title, 
                'service' AS project_type,
                srv.status AS project_status, 
                srv.description,
                srv.price - srv.discount AS net_price,
                srv.created_at,
                t.name AS tenant_name,
                sp.status AS payment_status
             FROM services srv
             LEFT JOIN tenants t ON t.id = srv.tenant_id
             LEFT JOIN service_payments sp ON sp.service_id = srv.id
             WHERE srv.user_id = $1`,
            [userId]
        );

        const purchasesRes = await dbQuery(
            `SELECT 
                pur.id, 
                pkg.name AS project_title, 
                'package' AS project_type,
                pur.status AS project_status, 
                pkg.description,
                pur.price - pur.discount AS net_price,
                pur.created_at,
                t.name AS tenant_name,
                pay.status AS payment_status
             FROM purchases pur
             LEFT JOIN packages pkg ON pur.package_id = pkg.id
             LEFT JOIN tenants t ON t.id = pkg.tenant_id
             LEFT JOIN payments pay ON pur.id = pay.purchase_id
             WHERE pur.user_id = $1`,
            [userId]
        );

        const combinedProjects = [
            ...servicesRes.rows,
            ...purchasesRes.rows
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return NextResponse.json({ success: true, data: combinedProjects });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
