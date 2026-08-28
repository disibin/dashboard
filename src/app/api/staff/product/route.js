import { NextResponse } from "next/server";
import { isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";
import slugify from "slugify";

export async function GET() {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

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
            ORDER BY p.created_at DESC
        `);

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json().catch(() => ({}));
        const { name, title, image, image_id, link } = body;

        const prodName = name && name.trim() ? name.trim() : "New Product";
        const prodTitle = title && title.trim() ? title.trim() : prodName;

        const baseSlug = slugify(prodName, { lower: true, strict: true }) || 'product';
        let finalSlug = baseSlug;
        let counter = 1;
        while (true) {
            const existing = await dbQuery("SELECT id FROM products WHERE slug = $1", [finalSlug]);
            if (existing.rows.length === 0) break;
            finalSlug = `${baseSlug}-${counter++}`;
        }

        const res = await dbQuery(`
            INSERT INTO products (name, title, slug, image, image_id, link, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            prodName,
            prodTitle,
            finalSlug,
            image || null,
            image_id || null,
            link || null,
            auth.data.id
        ]);

        return NextResponse.json({
            success: true,
            message: "Product created successfully",
            data: res.rows[0]
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json().catch(() => ({}));
        const { id, name, title, image, image_id, link } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 });
        }

        const prodName = name && name.trim() ? name.trim() : "Updated Product";
        const prodTitle = title && title.trim() ? title.trim() : prodName;

        const baseSlug = slugify(prodName, { lower: true, strict: true }) || 'product';
        let finalSlug = baseSlug;
        let counter = 1;
        while (true) {
            const existing = await dbQuery("SELECT id FROM products WHERE slug = $1 AND id != $2", [finalSlug, id]);
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
            id
        ]);

        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Product updated successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 });
        }

        const res = await dbQuery("DELETE FROM products WHERE id = $1 RETURNING id, name", [id]);

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
