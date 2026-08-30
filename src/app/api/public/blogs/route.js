import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/database/pg";

// GET — List blogs for public / user panel
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get("tenant_id");
        const search = searchParams.get("search");

        let query = `
            SELECT b.id, b.title, b.slug, b.description, b.image, b.image_id, b.tenant_id,
                   b.created_by, b.created_at, b.updated_at,
                   t.name as tenant_name, s.name as creator_name
            FROM blogs b
            INNER JOIN tenants t ON b.tenant_id = t.id
            LEFT JOIN staffs s ON b.created_by = s.id
            WHERE 1=1
        `;
        const params = [];

        if (tenantId) {
            params.push(tenantId);
            query += ` AND b.tenant_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (b.title ILIKE $${params.length} OR b.description ILIKE $${params.length})`;
        }

        query += ` ORDER BY b.created_at DESC`;

        const res = await dbQuery(query, params);

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
