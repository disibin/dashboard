import { NextResponse } from "next/server";
import { isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const res = await dbQuery(
            `SELECT id, name, url, created_at, updated_at 
             FROM tenants 
             ORDER BY created_at DESC`
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
        const { name, url } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ success: false, message: "Tenant name is required" }, { status: 400 });
        }
        if (!url || !url.trim()) {
            return NextResponse.json({ success: false, message: "Tenant URL is required" }, { status: 400 });
        }

        const nameTrimmed = name.trim();
        const urlFormatted = url.trim().toLowerCase().replace(/^https?:\/\//, '');

        const dupCheck = await dbQuery("SELECT id FROM tenants WHERE LOWER(url) = $1", [urlFormatted]);
        if (dupCheck.rows.length > 0) {
            return NextResponse.json({ success: false, message: "A tenant with this URL already exists" }, { status: 409 });
        }

        const res = await dbQuery(
            `INSERT INTO tenants (name, url) 
             VALUES ($1, $2) 
             RETURNING id, name, url, created_at, updated_at`,
            [nameTrimmed, urlFormatted]
        );

        await dbQuery(
            `INSERT INTO activity_logs (staff_id, action, entity_type, entity_id, description)
             VALUES ($1, 'TENANT_CREATE', 'tenants', $2, $3)`,
            [auth.data.id, res.rows[0].id, `Created tenant "${res.rows[0].name}" (${res.rows[0].url})`]
        ).catch(() => {});

        return NextResponse.json({
            success: true,
            message: "Tenant created successfully",
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

        const body = await req.json();
        const { id, name, url } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "Tenant ID is required" }, { status: 400 });
        }

        const urlFormatted = url ? url.trim().toLowerCase().replace(/^https?:\/\//, '') : '';

        const res = await dbQuery(
            `UPDATE tenants 
             SET name = COALESCE(NULLIF($1, ''), name),
                 url = COALESCE(NULLIF($2, ''), url),
                 updated_at = now()
             WHERE id = $3
             RETURNING id, name, url, created_at, updated_at`,
            [name?.trim() || '', urlFormatted || '', id]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Tenant not found" }, { status: 404 });
        }

        await dbQuery(
            `INSERT INTO activity_logs (staff_id, action, entity_type, entity_id, description)
             VALUES ($1, 'TENANT_UPDATE', 'tenants', $2, $3)`,
            [auth.data.id, id, `Updated tenant "${res.rows[0].name}"`]
        ).catch(() => {});

        return NextResponse.json({
            success: true,
            message: "Tenant updated successfully",
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
            return NextResponse.json({ success: false, message: "Tenant ID is required" }, { status: 400 });
        }

        const res = await dbQuery("DELETE FROM tenants WHERE id = $1 RETURNING id, name, url", [id]);
        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Tenant not found" }, { status: 404 });
        }

        const deleted = res.rows[0];

        await dbQuery(
            `INSERT INTO activity_logs (staff_id, action, entity_type, entity_id, description)
             VALUES ($1, 'TENANT_DELETE', 'tenants', $2, $3)`,
            [auth.data.id, id, `Deleted tenant "${deleted.name}" (${deleted.url})`]
        ).catch(() => {});

        return NextResponse.json({
            success: true,
            message: "Tenant deleted successfully",
            data: deleted
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
