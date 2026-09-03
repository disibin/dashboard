import { NextResponse } from "next/server";
import { isUserLogin } from "@/lib/auth/user";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;

        const res = await dbQuery(`
            SELECT 
                uc.id AS cart_id,
                uc.user_id,
                uc.package_id,
                uc.created_at AS added_at,
                pkg.name,
                pkg.slug,
                pkg.description,
                pkg.price,
                pkg.discount,
                pkg.image,
                t.name AS tenant_name
            FROM user_cart uc
            JOIN packages pkg ON uc.package_id = pkg.id
            LEFT JOIN tenants t ON pkg.tenant_id = t.id
            WHERE uc.user_id = $1
            ORDER BY uc.created_at DESC
        `, [userId]);

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const body = await req.json();
        const { package_id } = body;

        if (!package_id) {
            return NextResponse.json({ success: false, message: "package_id is required" }, { status: 400 });
        }

        const pkgRes = await dbQuery(`SELECT id, name FROM packages WHERE id = $1`, [package_id]);
        if (pkgRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Package not found" }, { status: 404 });
        }

        await dbQuery(`
            INSERT INTO user_cart (user_id, package_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, package_id) DO NOTHING
        `, [userId, package_id]);

        return NextResponse.json({
            success: true,
            message: `"${pkgRes.rows[0].name}" added to cart!`
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const auth = await isUserLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const userId = auth.data.id;
        const { searchParams } = new URL(req.url);
        const packageId = searchParams.get('package_id');
        const cartId = searchParams.get('cart_id');
        const clearAll = searchParams.get('clear') === 'true';

        if (clearAll) {
            await dbQuery(`DELETE FROM user_cart WHERE user_id = $1`, [userId]);
            return NextResponse.json({ success: true, message: "Cart cleared successfully" });
        }

        if (cartId) {
            await dbQuery(`DELETE FROM user_cart WHERE user_id = $1 AND id = $2`, [userId, cartId]);
            return NextResponse.json({ success: true, message: "Item removed from cart" });
        }

        if (packageId) {
            await dbQuery(`DELETE FROM user_cart WHERE user_id = $1 AND package_id = $2`, [userId, packageId]);
            return NextResponse.json({ success: true, message: "Item removed from cart" });
        }

        return NextResponse.json({ success: false, message: "package_id, cart_id or clear=true is required" }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
