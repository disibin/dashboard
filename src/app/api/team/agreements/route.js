import { NextResponse } from "next/server";
import { isTeamLogin } from "@/lib/auth/team";
import { dbQuery } from "@/lib/database/pg";

let tableInitialized = false;

async function ensureAgreementsTable() {
    if (tableInitialized) return;
    try {
        await dbQuery(`
            CREATE TABLE IF NOT EXISTS agreements (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                project_id INT,
                user_id INT,
                description TEXT,
                start_date TIMESTAMP DEFAULT NOW(),
                expire_date TIMESTAMP,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        tableInitialized = true;
    } catch (error) {
        console.error("Failed to initialize agreements table:", error);
    }
}

// GET — List all agreements for staff
export async function GET() {
    try {
        const auth = await isTeamLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        await ensureAgreementsTable();

        const res = await dbQuery(`
            SELECT a.id, a.title, a.project_id, a.user_id, a.description, a.start_date, a.expire_date, a.status, a.created_at, a.updated_at,
                   p.title as project_title, u.name as user_name, u.email as user_email
            FROM agreements a
            LEFT JOIN projects p ON a.project_id = p.id
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
        `);

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        console.error("GET /api/team/agreements Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST — Create agreement with description, start_date, expire_date
export async function POST(req) {
    try {
        const auth = await isTeamLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        await ensureAgreementsTable();

        const contentType = req.headers.get("content-type") || "";
        let body = {};

        if (contentType.includes("application/json")) {
            body = await req.json();
        } else {
            const formData = await req.formData();
            body = {
                title: formData.get("title"),
                project_id: formData.get("project_id"),
                user_id: formData.get("user_id"),
                description: formData.get("description"),
                start_date: formData.get("start_date"),
                expire_date: formData.get("expire_date"),
                status: formData.get("status") || "pending"
            };
        }

        const { title, project_id, user_id, description, start_date, expire_date, status = "pending" } = body;

        if (!title || !project_id) {
            return NextResponse.json({ success: false, message: "Title and Project ID are required" }, { status: 400 });
        }

        // Get user_id from project if not passed explicitly
        let targetUserId = user_id;
        if (!targetUserId) {
            const pRes = await dbQuery("SELECT user_id FROM projects WHERE id = $1", [project_id]);
            if (pRes.rows.length > 0) targetUserId = pRes.rows[0].user_id;
        }

        const res = await dbQuery(`
            INSERT INTO agreements (title, project_id, user_id, description, start_date, expire_date, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            title.trim(),
            project_id,
            targetUserId || null,
            description || '',
            start_date ? new Date(start_date) : new Date(),
            expire_date ? new Date(expire_date) : null,
            status || 'pending'
        ]);

        return NextResponse.json({
            success: true,
            message: "Agreement created successfully!",
            data: res.rows[0]
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// PATCH — Staff updates agreement
export async function PATCH(req) {
    try {
        const auth = await isTeamLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        await ensureAgreementsTable();

        const { id, title, description, start_date, expire_date, status } = await req.json();
        if (!id) return NextResponse.json({ success: false, message: "Agreement ID is required" }, { status: 400 });

        const res = await dbQuery(`
            UPDATE agreements
            SET title = COALESCE($1, title),
                description = COALESCE($2, description),
                start_date = COALESCE($3, start_date),
                expire_date = COALESCE($4, expire_date),
                status = COALESCE($5, status),
                updated_at = NOW()
            WHERE id = $6
            RETURNING *
        `, [
            title ? title.trim() : null,
            description !== undefined ? description : null,
            start_date ? new Date(start_date) : null,
            expire_date ? new Date(expire_date) : null,
            status || null,
            id
        ]);

        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Agreement not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Agreement updated successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
