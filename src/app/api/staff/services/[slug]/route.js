import { NextResponse } from "next/server";
import { isStaffLogin } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

// GET — Fetch single service by slug OR id (Staff / Panel)
export async function GET(req, { params }) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const resolvedParams = await params;
        const slugParam = resolvedParams.slug;

        if (!slugParam) {
            return NextResponse.json({ success: false, message: "Service slug or ID is required" }, { status: 400 });
        }

        const res = await dbQuery(`
            SELECT 
                srv.id, 
                srv.tenant_id, 
                srv.name, 
                srv.slug, 
                srv.description, 
                srv.price, 
                srv.discount, 
                srv.created_by, 
                srv.created_at, 
                srv.updated_at,
                t.name AS tenant_name,
                t.url AS tenant_url,
                stf.name AS creator_name
            FROM services srv
            LEFT JOIN tenants t ON srv.tenant_id = t.id
            LEFT JOIN staffs stf ON srv.created_by = stf.id
            WHERE srv.slug = $1 OR srv.id::text = $1
            LIMIT 1
        `, [slugParam]);

        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Service not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: res.rows[0] });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
