import { NextResponse } from "next/server";
import { isStaffLogin } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET(req, { params }) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const resolvedParams = await params;
        const idOrSlug = resolvedParams.id;

        if (!idOrSlug) {
            return NextResponse.json({ success: false, message: "ID or slug is required" }, { status: 400 });
        }

        const res = await dbQuery(`
            SELECT b.id, b.title, b.slug, b.description, b.image, b.image_id, b.tenant_id,
                   b.created_by, b.created_at, b.updated_at,
                   t.name as tenant_name, s.name as creator_name
            FROM blogs b
            INNER JOIN tenants t ON b.tenant_id = t.id
            LEFT JOIN staffs s ON b.created_by = s.id
            WHERE b.id::text = $1 OR b.slug = $1
            LIMIT 1
        `, [idOrSlug]);

        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: res.rows[0] });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
