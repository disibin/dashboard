import { NextResponse } from "next/server";
import { isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const res = await dbQuery(
            `SELECT 
                p.id, p.tenant_id, p.name, p.slug, p.description, p.price, p.discount, p.image, p.image_id, p.created_at, p.updated_at,
                t.name AS tenant_name, t.url AS tenant_url,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', pf.id,
                            'feature_id', f.id,
                            'feature_name', f.name,
                            'value', pf.value
                        ) ORDER BY f.name ASC
                    )
                    FROM package_features pf
                    JOIN features f ON f.id = pf.feature_id
                    WHERE pf.package_id = p.id),
                    '[]'::json
                ) AS features
             FROM packages p
             LEFT JOIN tenants t ON t.id = p.tenant_id
             ORDER BY p.created_at DESC`
        );

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json();
        const { tenant_id, name, description, price, discount, image, image_id, feature_ids } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ success: false, message: "Package name is required" }, { status: 400 });
        }

        const nameTrimmed = name.trim();
        const baseSlug = nameTrimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let slug = baseSlug || 'package';
        let counter = 1;

        while (true) {
            const check = await dbQuery("SELECT id FROM packages WHERE slug = $1", [slug]);
            if (check.rows.length === 0) break;
            slug = `${baseSlug}-${counter++}`;
        }

        const pkgRes = await dbQuery(
            `INSERT INTO packages (tenant_id, name, slug, description, price, discount, image, image_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [tenant_id || null, nameTrimmed, slug, description?.trim() || null, price || 0, discount || 0, image || null, image_id || null]
        );

        const packageId = pkgRes.rows[0].id;

        if (Array.isArray(feature_ids) && feature_ids.length > 0) {
            for (const fId of feature_ids) {
                await dbQuery(
                    `INSERT INTO package_features (package_id, feature_id, value)
                     VALUES ($1, $2, true)
                     ON CONFLICT (package_id, feature_id) DO NOTHING`,
                    [packageId, fId]
                );
            }
        }

        await dbQuery(
            `INSERT INTO activity_logs (staff_id, action, entity_type, entity_id, description)
             VALUES ($1, 'PACKAGE_CREATE', 'packages', $2, $3)`,
            [auth.data.id, packageId, `Created package "${nameTrimmed}" ($${price})`]
        ).catch(() => {});

        return NextResponse.json({
            success: true,
            message: "Package created successfully",
            data: pkgRes.rows[0]
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json();
        const { id, tenant_id, name, description, price, discount, image, image_id, feature_ids } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "Package ID is required" }, { status: 400 });
        }

        const pkgRes = await dbQuery(
            `UPDATE packages
             SET tenant_id = $1,
                 name = COALESCE(NULLIF($2, ''), name),
                 description = $3,
                 price = COALESCE($4, price),
                 discount = COALESCE($5, discount),
                 image = $6,
                 image_id = $7,
                 updated_at = now()
             WHERE id = $8
             RETURNING *`,
            [tenant_id || null, name?.trim() || '', description?.trim() || null, price, discount, image || null, image_id || null, id]
        );

        if (pkgRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Package not found" }, { status: 404 });
        }

        if (Array.isArray(feature_ids)) {
            await dbQuery("DELETE FROM package_features WHERE package_id = $1", [id]);
            for (const fId of feature_ids) {
                await dbQuery(
                    `INSERT INTO package_features (package_id, feature_id, value)
                     VALUES ($1, $2, true)
                     ON CONFLICT DO NOTHING`,
                    [id, fId]
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: "Package updated successfully",
            data: pkgRes.rows[0]
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
            return NextResponse.json({ success: false, message: "Package ID is required" }, { status: 400 });
        }

        const res = await dbQuery("DELETE FROM packages WHERE id = $1 RETURNING id, name", [id]);
        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Package not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Package deleted successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
