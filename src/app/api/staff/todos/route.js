import { NextResponse } from "next/server";
import { isStaffLogin } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const { searchParams } = new URL(req.url);
        const staffIdParam = searchParams.get("staff_id");

        let query = `
            SELECT t.id, t.staff_id, t.title, t.description, t.start_time, t.end_time, 
                   t.is_completed, t.created_at, t.updated_at,
                   st.name AS staff_name, st.email AS staff_email
            FROM staff_todos t
            JOIN staffs st ON st.id = t.staff_id
        `;
        let queryParams = [];

        if (auth.data.role === 'manager') {
            if (staffIdParam) {
                query += ` WHERE t.staff_id = $1`;
                queryParams.push(staffIdParam);
            }
        } else {
            query += ` WHERE t.staff_id = $1`;
            queryParams.push(auth.data.id);
        }

        query += ` ORDER BY t.is_completed ASC, t.start_time ASC NULLS LAST, t.created_at DESC`;

        const res = await dbQuery(query, queryParams);

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const body = await req.json();
        const { title, description, start_time, end_time, staff_id } = body;

        if (!title || !title.trim()) {
            return NextResponse.json({ success: false, message: "To-do title is required" }, { status: 400 });
        }

        const assignedStaffId = (auth.data.role === 'manager' && staff_id) ? staff_id : auth.data.id;

        const res = await dbQuery(
            `INSERT INTO staff_todos (staff_id, title, description, start_time, end_time)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, staff_id, title, description, start_time, end_time, is_completed, created_at, updated_at`,
            [
                assignedStaffId,
                title.trim(),
                description?.trim() || null,
                start_time || null,
                end_time || null
            ]
        );

        return NextResponse.json({
            success: true,
            message: "To-do item created successfully",
            data: res.rows[0]
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const body = await req.json();
        const { id, title, description, start_time, end_time, is_completed } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "To-do ID is required" }, { status: 400 });
        }

        if (auth.data.role !== 'manager') {
            const check = await dbQuery("SELECT staff_id FROM staff_todos WHERE id = $1", [id]);
            if (check.rows.length === 0 || check.rows[0].staff_id !== auth.data.id) {
                return NextResponse.json({ success: false, message: "Unauthorized to edit this to-do" }, { status: 403 });
            }
        }

        const res = await dbQuery(
            `UPDATE staff_todos
             SET title = COALESCE(NULLIF($1, ''), title),
                 description = COALESCE($2, description),
                 start_time = COALESCE($3, start_time),
                 end_time = COALESCE($4, end_time),
                 is_completed = COALESCE($5, is_completed),
                 updated_at = now()
             WHERE id = $6
             RETURNING id, staff_id, title, description, start_time, end_time, is_completed, created_at, updated_at`,
            [title?.trim() || '', description?.trim() || null, start_time || null, end_time || null, is_completed, id]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "To-do not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "To-do updated successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const body = await req.json();
        const { id, is_completed } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "To-do ID is required" }, { status: 400 });
        }

        if (auth.data.role !== 'manager') {
            const check = await dbQuery("SELECT staff_id FROM staff_todos WHERE id = $1", [id]);
            if (check.rows.length === 0 || check.rows[0].staff_id !== auth.data.id) {
                return NextResponse.json({ success: false, message: "Unauthorized to update this to-do" }, { status: 403 });
            }
        }

        const res = await dbQuery(
            `UPDATE staff_todos 
             SET is_completed = $1, updated_at = now() 
             WHERE id = $2 
             RETURNING id, is_completed`,
            [!!is_completed, id]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "To-do not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Status updated successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "To-do ID is required" }, { status: 400 });
        }

        if (auth.data.role !== 'manager') {
            const check = await dbQuery("SELECT staff_id FROM staff_todos WHERE id = $1", [id]);
            if (check.rows.length === 0 || check.rows[0].staff_id !== auth.data.id) {
                return NextResponse.json({ success: false, message: "Unauthorized to delete this to-do" }, { status: 403 });
            }
        }

        const res = await dbQuery("DELETE FROM staff_todos WHERE id = $1 RETURNING id, title", [id]);
        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "To-do not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "To-do deleted successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
