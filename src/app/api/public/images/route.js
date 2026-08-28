import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/database/pg";

// GET all product showcase images (Public)
export async function GET() {
    try {
        const res = await dbQuery(`
            SELECT 
                p.id,
                p.name AS product_name,
                p.title AS product_title,
                p.slug AS product_slug,
                p.image,
                p.image_id AS public_id,
                p.link,
                p.created_at
            FROM products p
            WHERE p.image IS NOT NULL AND p.image != ''
            ORDER BY p.created_at DESC
        `);

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
