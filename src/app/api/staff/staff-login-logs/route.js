import { NextResponse } from "next/server";
import { isStaffLogin } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

// GET — Fetch internal staff login audit logs (Staff staff only)
export async function GET(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search')?.trim() || '';
        const status = searchParams.get('status')?.trim() || '';

        let query = `
            SELECT l.id, l.staff_id, l.action, l.description, l.status, l.created_at,
                   t.name as staff_name, t.email as staff_email, t.role as staff_role
            FROM staff_login_logs l
            LEFT JOIN staffs t ON l.staff_id = t.id
        `;
        const params = [];
        const conditions = [];

        if (status && status !== 'all') {
            params.push(status);
            conditions.push(`l.status = $${params.length}`);
        }

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(t.name ILIKE $${params.length} OR t.email ILIKE $${params.length} OR l.description ILIKE $${params.length})`);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY l.created_at DESC LIMIT 200";

        const res = await dbQuery(query, params);

        return NextResponse.json({
            success: true,
            data: res.rows
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
