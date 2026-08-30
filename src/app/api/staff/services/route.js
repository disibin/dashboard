import { NextResponse } from "next/server";
import { isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

// GET — List services & service payments (Staff)
export async function GET() {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const res = await dbQuery(
            `SELECT 
                srv.id, srv.tenant_id, srv.name, srv.slug, srv.description, 
                srv.price, srv.discount, srv.created_by, srv.created_at, srv.updated_at,
                t.name AS tenant_name, t.url AS tenant_url,
                stf.name AS staff_name,
                sp.id AS payment_id,
                COALESCE(sp.paid, 0) AS paid_amount,
                COALESCE(sp.due, srv.price - srv.discount) AS due_amount,
                COALESCE(sp.status, 'unpaid') AS payment_status
             FROM services srv
             LEFT JOIN tenants t ON t.id = srv.tenant_id
             LEFT JOIN staffs stf ON stf.id = srv.created_by
             LEFT JOIN service_payments sp ON sp.service_id = srv.id
             ORDER BY srv.created_at DESC`
        );

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST — Create client service & initial payment record (Manager only)
export async function POST(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json();
        const { tenant_id, name, description, price, discount } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ success: false, message: "Service name is required" }, { status: 400 });
        }

        const nameTrimmed = name.trim();
        const baseSlug = nameTrimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let slug = baseSlug || 'service';
        let counter = 1;

        while (true) {
            const check = await dbQuery("SELECT id FROM services WHERE slug = $1", [slug]);
            if (check.rows.length === 0) break;
            slug = `${baseSlug}-${counter++}`;
        }

        const totalPrice = price || 0;
        const totalDiscount = discount || 0;
        const netPrice = Math.max(0, totalPrice - totalDiscount);

        const srvRes = await dbQuery(
            `INSERT INTO services (tenant_id, name, slug, description, price, discount, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                tenant_id || null,
                nameTrimmed,
                slug,
                description?.trim() || null,
                totalPrice,
                totalDiscount,
                auth.data.id
            ]
        );

        const serviceId = srvRes.rows[0].id;

        // Initialize service_payments record
        await dbQuery(
            `INSERT INTO service_payments (service_id, price, paid, due, status)
             VALUES ($1, $2, 0, $3, 'unpaid')`,
            [serviceId, netPrice, netPrice]
        );

        // Audit Log
        await dbQuery(
            `INSERT INTO activity_logs (staff_id, action, entity_type, entity_id, description)
             VALUES ($1, 'SERVICE_CREATE', 'services', $2, $3)`,
            [auth.data.id, serviceId, `Created service "${nameTrimmed}" ($${netPrice})`]
        ).catch(() => {});

        return NextResponse.json({
            success: true,
            message: "Service created successfully",
            data: srvRes.rows[0]
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// PATCH — Update service status or record payment (Manager only)
export async function PATCH(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json();
        const { id, add_payment } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "Service ID is required" }, { status: 400 });
        }

        // Record partial or full payment if provided
        if (add_payment && typeof add_payment === 'number' && add_payment > 0) {
            const currentPay = await dbQuery("SELECT * FROM service_payments WHERE service_id = $1", [id]);
            if (currentPay.rows.length > 0) {
                const row = currentPay.rows[0];
                const newPaid = Number(row.paid || 0) + add_payment;
                const newDue = Math.max(0, Number(row.price || 0) - newPaid);
                const newStatus = newDue === 0 ? 'paid' : newPaid > 0 ? 'due' : 'unpaid';

                await dbQuery(
                    `UPDATE service_payments 
                     SET paid = $1, due = $2, status = $3, updated_at = now() 
                     WHERE service_id = $4`,
                    [newPaid, newDue, newStatus, id]
                );
            }
        }

        return NextResponse.json({
            success: true,
            message: "Service updated successfully"
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE — Remove service (Manager only)
export async function DELETE(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "Service ID is required" }, { status: 400 });
        }

        const res = await dbQuery("DELETE FROM services WHERE id = $1 RETURNING id, name", [id]);
        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Service not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Service deleted successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
