import { NextResponse } from "next/server";
import { isStaffLogin } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

// GET — List staff notes (Supports staff scope & manager oversight)
export async function GET(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const { searchParams } = new URL(req.url);
        const staffIdParam = searchParams.get("staff_id");

        // Managers can view all notes or specific staff's notes; staff view their own notes
        let query = `
            SELECT n.id, n.staff_id, n.title, n.description, n.created_at, n.updated_at,
                   st.name AS staff_name, st.email AS staff_email
            FROM staff_notes n
            JOIN staffs st ON st.id = n.staff_id
        `;
        let queryParams = [];

        if (auth.data.role !== 'manager' || staffIdParam) {
            const targetStaffId = staffIdParam || auth.data.id;
            query += ` WHERE n.staff_id = $1`;
            queryParams.push(targetStaffId);
        }

        query += ` ORDER BY n.updated_at DESC`;

        const res = await dbQuery(query, queryParams);

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST — Create staff note
export async function POST(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const body = await req.json();
        const { title, description, staff_id } = body;

        if (!title || !title.trim()) {
            return NextResponse.json({ success: false, message: "Note title is required" }, { status: 400 });
        }

        // Target staff ID defaults to logged in staff member
        const assignedStaffId = (auth.data.role === 'manager' && staff_id) ? staff_id : auth.data.id;

        const res = await dbQuery(
            `INSERT INTO staff_notes (staff_id, title, description)
             VALUES ($1, $2, $3)
             RETURNING id, staff_id, title, description, created_at, updated_at`,
            [assignedStaffId, title.trim(), description?.trim() || null]
        );

        return NextResponse.json({
            success: true,
            message: "Note created successfully",
            data: res.rows[0]
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// PUT — Update staff note
export async function PUT(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const body = await req.json();
        const { id, title, description } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "Note ID is required" }, { status: 400 });
        }

        // Verify note ownership unless manager
        if (auth.data.role !== 'manager') {
            const check = await dbQuery("SELECT staff_id FROM staff_notes WHERE id = $1", [id]);
            if (check.rows.length === 0 || check.rows[0].staff_id !== auth.data.id) {
                return NextResponse.json({ success: false, message: "Unauthorized to edit this note" }, { status: 403 });
            }
        }

        const res = await dbQuery(
            `UPDATE staff_notes
             SET title = COALESCE(NULLIF($1, ''), title),
                 description = COALESCE($2, description),
                 updated_at = now()
             WHERE id = $3
             RETURNING id, staff_id, title, description, created_at, updated_at`,
            [title?.trim() || '', description?.trim() || null, id]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Note not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Note updated successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE — Remove staff note
export async function DELETE(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "Note ID is required" }, { status: 400 });
        }

        // Verify note ownership unless manager
        if (auth.data.role !== 'manager') {
            const check = await dbQuery("SELECT staff_id FROM staff_notes WHERE id = $1", [id]);
            if (check.rows.length === 0 || check.rows[0].staff_id !== auth.data.id) {
                return NextResponse.json({ success: false, message: "Unauthorized to delete this note" }, { status: 403 });
            }
        }

        const res = await dbQuery("DELETE FROM staff_notes WHERE id = $1 RETURNING id, title", [id]);
        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Note not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Note deleted successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
