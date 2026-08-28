import { NextResponse } from "next/server";
import { isStaffLogin } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

// GET — Fetch system activity logs (Staff staff only)
export async function GET(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search')?.trim() || '';

        let query = `
            SELECT l.id, l.staff_id, l.action, l.entity_type, l.entity_id, l.description, l.created_at,
                   t.name as staff_name, t.email as staff_email, t.role as staff_role
            FROM activity_logs l
            LEFT JOIN staffs t ON l.staff_id = t.id
        `;
        const params = [];

        if (search) {
            query += " WHERE l.action ILIKE $1 OR l.description ILIKE $1 OR t.name ILIKE $1 OR t.email ILIKE $1";
            params.push(`%${search}%`);
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
