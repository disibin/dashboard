import { NextResponse } from "next/server";
import { isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const res = await dbQuery(`
            SELECT
                f.id,
                f.name,
                f.slug,
                f.created_at,
                COUNT(pf.id)::int AS package_count
            FROM features f
            LEFT JOIN package_features pf ON pf.feature_id = f.id
            GROUP BY f.id, f.name, f.slug, f.created_at
            ORDER BY f.name ASC
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

        const { name } = await req.json();

        if (!name || !name.trim()) {
            return NextResponse.json({ success: false, message: "Feature name is required" }, { status: 400 });
        }

        const nameTrimmed = name.trim();

        const dupCheck = await dbQuery(
            "SELECT id FROM features WHERE LOWER(name) = LOWER($1)",
            [nameTrimmed]
        );
        if (dupCheck.rows.length > 0) {
            return NextResponse.json({ success: false, message: "A feature with this name already exists" }, { status: 409 });
        }

        const baseSlug = nameTrimmed.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        let slug = baseSlug || 'feature';
        let counter = 1;
        while (true) {
            const existingSlug = await dbQuery("SELECT id FROM features WHERE slug = $1", [slug]);
            if (existingSlug.rows.length === 0) break;
            slug = `${baseSlug}-${counter++}`;
        }

        const res = await dbQuery(
            "INSERT INTO features (name, slug) VALUES ($1, $2) RETURNING *",
            [nameTrimmed, slug]
        );

        return NextResponse.json({
            success: true,
            message: "Feature created successfully",
            data: res.rows[0]
        }, { status: 201 });

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
            return NextResponse.json({ success: false, message: "Feature ID is required" }, { status: 400 });
        }

        const res = await dbQuery("DELETE FROM features WHERE id = $1 RETURNING id, name", [id]);
        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Feature not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Feature deleted successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
