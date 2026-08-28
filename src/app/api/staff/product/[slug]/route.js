import { NextResponse } from "next/server";
import { isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";
import slugify from "slugify";

export async function GET(req, { params }) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

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
                p.updated_at,
                s.name AS created_by_name
            FROM products p
            LEFT JOIN staffs s ON p.created_by = s.id
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

export async function PUT(req, { params }) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const { slug } = await params;
        const body = await req.json().catch(() => ({}));
        const { name, title, image, image_id, link } = body;

        const existingRes = await dbQuery("SELECT id FROM products WHERE slug = $1", [slug]);
        if (existingRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
        }
        const productId = existingRes.rows[0].id;

        const prodName = name && name.trim() ? name.trim() : "Updated Product";
        const prodTitle = title && title.trim() ? title.trim() : prodName;

        const baseSlug = slugify(prodName, { lower: true, strict: true }) || 'product';
        let finalSlug = baseSlug;
        let counter = 1;
        while (true) {
            const existing = await dbQuery("SELECT id FROM products WHERE slug = $1 AND id != $2", [finalSlug, productId]);
            if (existing.rows.length === 0) break;
            finalSlug = `${baseSlug}-${counter++}`;
        }

        const res = await dbQuery(`
            UPDATE products
            SET name = $1, title = $2, slug = $3, image = $4, image_id = $5, link = $6, updated_at = now()
            WHERE id = $7
            RETURNING *
        `, [
            prodName,
            prodTitle,
            finalSlug,
            image || null,
            image_id || null,
            link || null,
            productId
        ]);

        return NextResponse.json({
            success: true,
            message: "Product updated successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const { slug } = await params;

        const res = await dbQuery("DELETE FROM products WHERE slug = $1 RETURNING id, name", [slug]);

        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Product deleted successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
