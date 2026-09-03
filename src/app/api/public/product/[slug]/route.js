import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/database/pg";

export async function GET(req, { params }) {
    try {
        const resolvedParams = await params;
        const slugParam = resolvedParams.slug;

        if (!slugParam) {
            return NextResponse.json({ success: false, message: "Slug or ID is required" }, { status: 400 });
        }

        const res = await dbQuery(`
            SELECT
                p.id,
                p.name,
                p.title,
                p.slug,
                p.image,
                p.image_id,
                p.link,
                p.created_by,
                p.created_at,
                p.updated_at
            FROM products p
            WHERE p.slug = $1 OR p.id::text = $1
            LIMIT 1
        `, [slugParam]);

        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: res.rows[0] });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
