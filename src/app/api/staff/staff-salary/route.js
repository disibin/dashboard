import { NextResponse } from "next/server";
import { isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const [staffsRes, staffSalariesRes, payscalesRes] = await Promise.all([
            dbQuery("SELECT * FROM staffs"),
            dbQuery("SELECT * FROM staff_salary"),
            dbQuery("SELECT * FROM payscale")
        ]);

        const staffs = (staffsRes.rows || []).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        const staffSalaries = staffSalariesRes.rows || [];
        const payscales = payscalesRes.rows || [];

        const data = staffs.map((st) => {
            const ss = staffSalaries.find((s) => Number(s.staff_id) === Number(st.id));
            const ps = ss && ss.payscale_id ? payscales.find((p) => Number(p.id) === Number(ss.payscale_id)) : null;

            return {
                staff_id: st.id,
                staff_name: st.name,
                staff_email: st.email,
                staff_role: st.role,
                staff_active: st.is_active,
                staff_salary_id: ss ? ss.id : null,
                payscale_id: ss ? ss.payscale_id : null,
                custom_bonus: ss ? ss.custom_bonus : 0,
                custom_deduction: ss ? ss.custom_deduction : 0,
                net_salary: ss ? ss.net_salary : 0,
                salary_status: ss ? ss.status : 'active',
                grade_name: ps ? ps.grade_name : null,
                grade_level: ps ? ps.grade_level : null,
                basic_salary: ps ? ps.basic_salary : 0,
                house_rent: ps ? ps.house_rent : 0,
                medical_allowance: ps ? ps.medical_allowance : 0,
                other_allowance: ps ? ps.other_allowance : 0,
                payscale_total: ps ? ps.total_salary : 0
            };
        });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("GET /api/staff/staff-salary error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json();
        const { staff_id, payscale_id, custom_bonus, custom_deduction, status } = body;

        if (!staff_id) {
            return NextResponse.json({ success: false, message: "staff_id is required" }, { status: 400 });
        }

        const [payscalesRes, staffSalariesRes] = await Promise.all([
            dbQuery("SELECT * FROM payscale"),
            dbQuery("SELECT * FROM staff_salary")
        ]);

        const payscaleList = payscalesRes.rows || [];
        const staffSalariesList = staffSalariesRes.rows || [];

        let payscaleTotal = 0;
        if (payscale_id) {
            const foundPs = payscaleList.find((p) => Number(p.id) === Number(payscale_id));
            if (foundPs) {
                payscaleTotal = Number(foundPs.total_salary || 0);
            }
        }

        const bonus = Math.max(0, Number(custom_bonus || 0));
        const deduction = Math.max(0, Number(custom_deduction || 0));
        const net = Math.max(0, payscaleTotal + bonus - deduction);

        const existingSS = staffSalariesList.find((s) => Number(s.staff_id) === Number(staff_id));

        let res;
        if (existingSS) {
            res = await dbQuery(
                `UPDATE staff_salary
                 SET payscale_id = $1, custom_bonus = $2, custom_deduction = $3, net_salary = $4, status = $5, updated_at = now()
                 WHERE staff_id = $6
                 RETURNING *`,
                [payscale_id ? Number(payscale_id) : null, bonus, deduction, net, status || 'active', Number(staff_id)]
            );
        } else {
            res = await dbQuery(
                `INSERT INTO staff_salary (staff_id, payscale_id, custom_bonus, custom_deduction, net_salary, status)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [Number(staff_id), payscale_id ? Number(payscale_id) : null, bonus, deduction, net, status || 'active']
            );
        }

        return NextResponse.json({ success: true, message: "Staff salary configuration saved successfully", data: res.rows[0] });
    } catch (error) {
        console.error("POST /api/staff/staff-salary error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    return POST(req);
}
