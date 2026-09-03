import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
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
            ORDER BY p.created_at DESC
        `);

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
