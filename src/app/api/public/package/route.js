import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
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
