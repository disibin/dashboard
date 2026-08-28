import { NextResponse } from "next/server";
import { isManager } from "@/lib/auth/team";
import { dbQuery, transaction } from "@/lib/database/pg";

// GET all products (Manager only — includes unpublished)
export async function GET() {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const res = await dbQuery(`
            SELECT
                p.id,
                p.name,
                p.slug,
                p.description,
                p.demo_url,
                p.is_featured,
                p.is_published,
                p.created_by,
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
                            'is_primary', pi.is_primary
                        ) ORDER BY pi.is_primary DESC, pi.created_at ASC
                    )
                    FROM product_images pi
                    WHERE pi.product_id = p.id),
                    '[]'::json
                ) AS images,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object('id', f.id, 'name', f.name, 'slug', f.slug, 'value', pf.value)
                        ORDER BY f.name ASC
                    )
                    FROM product_features pf
                    JOIN features f ON pf.feature_id = f.id
                    WHERE pf.product_id = p.id),
                    '[]'::json
                ) AS features
            FROM products p
            LEFT JOIN product_prices pp ON pp.product_id = p.id
            ORDER BY p.created_at DESC
        `);

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST create product (Manager only)
export async function POST(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json().catch(() => ({}));
        const {
            name, description, demo_url,
            price, discount, setup_fee, service_charge,
            is_featured, is_published, images, features, videos
        } = body;

        const productName = (name && name.trim()) ? name.trim() : "enter title";

        const product = await transaction(async (client) => {
            // Auto-generate unique slug from name
            const baseSlug = productName.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            let slug = baseSlug || 'product';
            let counter = 1;
            while (true) {
                const existing = await client.query("SELECT id FROM products WHERE slug = $1", [slug]);
                if (existing.rows.length === 0) break;
                slug = `${baseSlug}-${counter++}`;
            }

            // Insert core product
            const productRes = await client.query(`
                INSERT INTO products (name, slug, description, demo_url, is_featured, is_published, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [
                productName,
                slug,
                description || null,
                demo_url || null,
                is_featured !== undefined ? is_featured : false,
                is_published !== undefined ? is_published : false,
                auth.data.id
            ]);

            const prod = productRes.rows[0];

            // Insert product_prices
            await client.query(`
                INSERT INTO product_prices (product_id, setup_fee, price, service_charge, discount)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (product_id) DO UPDATE SET
                    setup_fee = EXCLUDED.setup_fee,
                    price = EXCLUDED.price,
                    service_charge = EXCLUDED.service_charge,
                    discount = EXCLUDED.discount
            `, [
                prod.id,
                Number(setup_fee) || 0,
                Number(price) || 0,
                Number(service_charge) || 0,
                Number(discount) || 0
            ]);

            // Insert product_videos
            if (videos && Array.isArray(videos) && videos.length > 0) {
                for (const vid of videos) {
                    const videoUrl = typeof vid === 'string' ? vid : vid.url;
                    if (!videoUrl || !videoUrl.trim()) continue;
                    await client.query(`
                        INSERT INTO product_videos (product_id, url)
                        VALUES ($1, $2)
                    `, [prod.id, videoUrl.trim()]);
                }
            }

            // Insert product images
            if (images && Array.isArray(images) && images.length > 0) {
                for (const img of images) {
                    if (!img.image || !img.public_id) continue;
                    await client.query(`
                        INSERT INTO product_images (title, image, public_id, product_id, is_primary)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [
                        img.title || prod.name,
                        img.image,
                        img.public_id,
                        prod.id,
                        img.is_primary || false
                    ]);
                }
            }

            // Insert product features
            if (features && Array.isArray(features) && features.length > 0) {
                for (const feat of features) {
                    if (!feat.name || !feat.name.trim()) continue;

                    const trimmed = feat.name.trim();
                    let featureId = feat.id;

                    if (featureId) {
                        const existingFeat = await client.query("SELECT id FROM features WHERE id = $1", [featureId]);
                        if (existingFeat.rows.length === 0) {
                            featureId = null;
                        }
                    }

                    if (!featureId) {
                        const existingByName = await client.query(
                            "SELECT id FROM features WHERE LOWER(name) = LOWER($1)",
                            [trimmed]
                        );
                        if (existingByName.rows.length > 0) {
                            featureId = existingByName.rows[0].id;
                        } else {
                            const baseSlug = trimmed.toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '');

                            let featureSlug = baseSlug || 'feature';
                            let counter = 1;
                            while (true) {
                                const existingSlug = await client.query("SELECT id FROM features WHERE slug = $1", [featureSlug]);
                                if (existingSlug.rows.length === 0) break;
                                featureSlug = `${baseSlug}-${counter++}`;
                            }

                            const newFeat = await client.query(
                                "INSERT INTO features (name, slug, description) VALUES ($1, $2, $3) RETURNING id",
                                [trimmed, featureSlug, feat.description || null]
                            );
                            featureId = newFeat.rows[0].id;
                        }
                    }

                    await client.query(`
                        INSERT INTO product_features (product_id, feature_id, value)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (product_id, feature_id) DO UPDATE SET value = EXCLUDED.value
                    `, [prod.id, featureId, feat.value !== undefined ? feat.value : true]);
                }
            }

            // Log action
            try {
                await client.query(`
                    INSERT INTO activity_logs (team_id, action, entity_type, entity_id, description)
                    VALUES ($1, $2, $3, $4, $5)
                `, [auth.data.id, 'CREATE', 'product', prod.id, `Created product: ${prod.name}`]);
            } catch (err) {
                // Ignore activity log failure
            }

            return prod;
        });

        return NextResponse.json({
            success: true,
            message: "Product created successfully",
            data: product
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
