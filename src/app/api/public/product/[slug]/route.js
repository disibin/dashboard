import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/database/pg";

// GET single product by slug (Public)
export async function GET(req, { params }) {
    try {
        const { slug } = await params;

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
            WHERE p.slug = $1
            LIMIT 1
        `, [slug]);

        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: res.rows[0] });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
