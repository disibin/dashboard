import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/database/pg";

// GET all published products (Public)
export async function GET() {
    try {
        const res = await dbQuery(`
            SELECT
                p.id,
                p.name,
                p.slug,
                p.description,
                p.demo_url,
                p.is_featured,
                p.is_published,
                p.created_at,
                p.updated_at,
                COALESCE(pp.setup_fee, 0) AS setup_fee,
                COALESCE(pp.price, 0) AS price,
                COALESCE(pp.service_charge, 0) AS service_charge,
                COALESCE(pp.discount, 0) AS discount,
                COALESCE(
                    (SELECT json_build_object(
                        'id', pp2.id,
                        'setup_fee', COALESCE(pp2.setup_fee, 0),
                        'price', COALESCE(pp2.price, 0),
                        'service_charge', COALESCE(pp2.service_charge, 0),
                        'discount', COALESCE(pp2.discount, 0)
                    ) FROM product_prices pp2 WHERE pp2.product_id = p.id LIMIT 1),
                    json_build_object('id', null, 'setup_fee', 0, 'price', 0, 'service_charge', 0, 'discount', 0)
                ) AS prices,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', pv.id,
                            'url', pv.url
                        ) ORDER BY pv.id ASC
                    )
                    FROM product_videos pv
                    WHERE pv.product_id = p.id),
                    '[]'::json
                ) AS videos,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', pi.id,
                            'title', pi.title,
                            'image', pi.image,
                            'public_id', pi.public_id,
                            'is_primary', pi.is_primary,
                            'created_at', pi.created_at
                        ) ORDER BY pi.is_primary DESC, pi.created_at ASC
                    )
                    FROM product_images pi
                    WHERE pi.product_id = p.id),
                    '[]'::json
                ) AS images,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', f.id,
                            'name', f.name,
                            'slug', f.slug,
                            'description', f.description,
                            'value', pf.value
                        ) ORDER BY f.name ASC
                    )
                    FROM product_features pf
                    JOIN features f ON pf.feature_id = f.id
                    WHERE pf.product_id = p.id),
                    '[]'::json
                ) AS features
            FROM products p
            LEFT JOIN product_prices pp ON pp.product_id = p.id
            WHERE p.is_published = true
            ORDER BY p.created_at DESC
        `);

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
