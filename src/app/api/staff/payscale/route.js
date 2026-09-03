import { NextResponse } from "next/server";
import { isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const res = await dbQuery("SELECT * FROM payscale");
        const list = (res.rows || []).sort((a, b) => (a.grade_level || 0) - (b.grade_level || 0));

        return NextResponse.json({ success: true, data: list });
    } catch (error) {
        console.error("GET /api/staff/payscale error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json();
        const { grade_name, grade_level, basic_salary, house_rent, medical_allowance, other_allowance, description } = body;

        if (!grade_name || !grade_name.trim()) {
            return NextResponse.json({ success: false, message: "Grade name is required" }, { status: 400 });
        }

        const basic = Math.max(0, Number(basic_salary || 0));
        const house = Math.max(0, Number(house_rent || 0));
        const medical = Math.max(0, Number(medical_allowance || 0));
        const other = Math.max(0, Number(other_allowance || 0));
        const total = basic + house + medical + other;

        const res = await dbQuery(
            `INSERT INTO payscale (grade_name, grade_level, basic_salary, house_rent, medical_allowance, other_allowance, total_salary, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [grade_name.trim(), Number(grade_level || 1), basic, house, medical, other, description ? description.trim() : null]
        );

        await dbQuery(
            `INSERT INTO activity_logs (staff_id, action, entity_type, entity_id, description)
             VALUES ($1, 'PAYSCALE_CREATE', 'payscale', $2, $3)`,
            [auth.data.id, res.rows[0].id, `Created payscale grade "${grade_name.trim()}" (Total: ৳${total})`]
        ).catch(() => {});

        return NextResponse.json({ success: true, message: "Payscale grade created successfully", data: res.rows[0] }, { status: 201 });
    } catch (error) {
        console.error("POST /api/staff/payscale error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json();
        const { id, grade_name, grade_level, basic_salary, house_rent, medical_allowance, other_allowance, description } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "Payscale ID is required" }, { status: 400 });
        }

        const allPayscales = await dbQuery("SELECT * FROM payscale");
        const curr = (allPayscales.rows || []).find(p => Number(p.id) === Number(id));

        if (!curr) {
            return NextResponse.json({ success: false, message: "Payscale grade not found" }, { status: 404 });
        }

        const gName = grade_name !== undefined ? grade_name.trim() : curr.grade_name;
        const gLevel = grade_level !== undefined ? Number(grade_level) : curr.grade_level;
        const basic = basic_salary !== undefined ? Math.max(0, Number(basic_salary)) : Number(curr.basic_salary);
        const house = house_rent !== undefined ? Math.max(0, Number(house_rent)) : Number(curr.house_rent);
        const medical = medical_allowance !== undefined ? Math.max(0, Number(medical_allowance)) : Number(curr.medical_allowance);
        const other = other_allowance !== undefined ? Math.max(0, Number(other_allowance)) : Number(curr.other_allowance);
        const total = basic + house + medical + other;
        const desc = description !== undefined ? (description ? description.trim() : null) : curr.description;

        const res = await dbQuery(
            `UPDATE payscale 
             SET grade_name = $1, grade_level = $2, basic_salary = $3, house_rent = $4, medical_allowance = $5, other_allowance = $6, total_salary = $7, description = $8, updated_at = now()
             WHERE id = $9
             RETURNING *`,
            [gName, gLevel, basic, house, medical, other, total, desc, Number(id)]
        );

        const allStaffSalaries = await dbQuery("SELECT * FROM staff_salary").catch(() => ({ rows: [] }));
        const assigned = (allStaffSalaries.rows || []).filter(ss => Number(ss.payscale_id) === Number(id));

        for (const ss of assigned) {
            const newNet = Math.max(0, total + Number(ss.custom_bonus || 0) - Number(ss.custom_deduction || 0));
            await dbQuery("UPDATE staff_salary SET net_salary = $1, updated_at = now() WHERE id = $2", [newNet, ss.id]).catch(() => {});
        }

        return NextResponse.json({ success: true, message: "Payscale grade updated successfully", data: res.rows[0] });
    } catch (error) {
        console.error("PATCH /api/staff/payscale error:", error);
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
            return NextResponse.json({ success: false, message: "Payscale ID is required" }, { status: 400 });
        }

        const res = await dbQuery("DELETE FROM payscale WHERE id = $1 RETURNING id, grade_name", [Number(id)]);
        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Payscale grade not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Payscale grade deleted successfully", data: res.rows[0] });
    } catch (error) {
        console.error("DELETE /api/staff/payscale error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
