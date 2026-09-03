import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/database/pg";

export async function GET(req, { params }) {
    try {
        const resolvedParams = await params;
        const slugParam = resolvedParams.slug;

        if (!slugParam) {
            return NextResponse.json({ success: false, message: "Package slug or ID is required" }, { status: 400 });
        }

        const pkgRes = await dbQuery(`
            SELECT 
                p.id, 
                p.tenant_id, 
                p.name, 
                p.slug, 
                p.description, 
                p.price, 
                p.discount, 
                p.image, 
                p.image_id, 
                p.created_at, 
                p.updated_at,
                t.name AS tenant_name,
                t.url AS tenant_url
            FROM packages p
            LEFT JOIN tenants t ON p.tenant_id = t.id
            WHERE p.slug = $1 OR p.id::text = $1
            LIMIT 1
        `, [slugParam]);

        if (pkgRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Package not found" }, { status: 404 });
        }

        const pkg = pkgRes.rows[0];

        const featuresRes = await dbQuery(`
            SELECT 
                pf.id, 
                pf.package_id, 
                pf.feature_id, 
                pf.value,
                f.name AS feature_name, 
                f.slug AS feature_slug
            FROM package_features pf
            JOIN features f ON pf.feature_id = f.id
            WHERE pf.package_id = $1
        `, [pkg.id]).catch(() => ({ rows: [] }));

        return NextResponse.json({
            success: true,
            data: {
                ...pkg,
                features: featuresRes.rows
            }
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
