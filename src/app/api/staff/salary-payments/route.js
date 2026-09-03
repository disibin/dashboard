import { NextResponse } from "next/server";
import { isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

async function ensureMonthlySalaryPayments(targetMonth, targetYear) {
    try {
        const [staffsRes, staffSalariesRes, paymentsRes] = await Promise.all([
            dbQuery("SELECT * FROM staffs"),
            dbQuery("SELECT * FROM staff_salary"),
            dbQuery("SELECT * FROM salary_payments")
        ]);

        const staffs = staffsRes.rows || [];
        const staffSalaries = staffSalariesRes.rows || [];
        const payments = paymentsRes.rows || [];

        const activeStaffs = staffs.filter((s) => s.is_active);
        const activeSalaries = staffSalaries.filter((ss) => ss.status === 'active');
        const validSalaries = activeSalaries.filter((ss) => activeStaffs.some((st) => Number(st.id) === Number(ss.staff_id)));

        let count = 0;
        for (const ss of validSalaries) {
            const exists = payments.some(
                (p) => Number(p.staff_id) === Number(ss.staff_id) && Number(p.month) === Number(targetMonth) && Number(p.year) === Number(targetYear)
            );
            if (!exists) {
                await dbQuery(
                    `INSERT INTO salary_payments (staff_id, staff_salary_id, month, year, amount, paid_amount, due_amount, status)
                     VALUES ($1, $2, $3, $4, $5, 0, $5, 'unpaid')`,
                    [ss.staff_id, ss.id, targetMonth, targetYear, ss.net_salary]
                ).catch(() => {});
                count++;
            }
        }
        return count;
    } catch (e) {
        console.error("ensureMonthlySalaryPayments error:", e);
        return 0;
    }
}

export async function GET(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const now = new Date();
        const curMonth = now.getMonth() + 1;
        const curYear = now.getFullYear();
        await ensureMonthlySalaryPayments(curMonth, curYear);

        const { searchParams } = new URL(req.url);
        const monthFilter = searchParams.get('month');
        const yearFilter = searchParams.get('year');
        const staffIdFilter = searchParams.get('staff_id');

        const [paymentsRes, staffsRes, staffSalariesRes, payscalesRes] = await Promise.all([
            dbQuery("SELECT * FROM salary_payments"),
            dbQuery("SELECT * FROM staffs"),
            dbQuery("SELECT * FROM staff_salary"),
            dbQuery("SELECT * FROM payscale")
        ]);

        let list = paymentsRes.rows || [];
        const staffs = staffsRes.rows || [];
        const staffSalaries = staffSalariesRes.rows || [];
        const payscales = payscalesRes.rows || [];

        if (monthFilter) {
            list = list.filter((sp) => Number(sp.month) === Number(monthFilter));
        }
        if (yearFilter) {
            list = list.filter((sp) => Number(sp.year) === Number(yearFilter));
        }
        if (staffIdFilter) {
            list = list.filter((sp) => Number(sp.staff_id) === Number(staffIdFilter));
        }

        const data = list.map((sp) => {
            const st = staffs.find((s) => Number(s.id) === Number(sp.staff_id));
            const ss = staffSalaries.find((s) => Number(s.staff_id) === Number(sp.staff_id));
            const ps = ss && ss.payscale_id ? payscales.find((p) => Number(p.id) === Number(ss.payscale_id)) : null;
            const pb = sp.paid_by ? staffs.find((s) => Number(s.id) === Number(sp.paid_by)) : null;

            return {
                id: sp.id,
                staff_id: sp.staff_id,
                staff_salary_id: sp.staff_salary_id,
                month: sp.month,
                year: sp.year,
                amount: sp.amount,
                paid_amount: sp.paid_amount,
                due_amount: sp.due_amount,
                payment_method: sp.payment_method,
                transaction_id: sp.transaction_id,
                note: sp.note,
                status: sp.status,
                paid_at: sp.paid_at,
                created_at: sp.created_at,
                staff_name: st ? st.name : null,
                staff_email: st ? st.email : null,
                staff_role: st ? st.role : null,
                grade_name: ps ? ps.grade_name : null,
                grade_level: ps ? ps.grade_level : null,
                paid_by_name: pb ? pb.name : null
            };
        });

        data.sort((a, b) => (b.year - a.year) || (b.month - a.month) || (a.staff_name || '').localeCompare(b.staff_name || ''));

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("GET /api/staff/salary-payments error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json();
        const { month, year } = body;

        const targetMonth = Number(month || (new Date().getMonth() + 1));
        const targetYear = Number(year || new Date().getFullYear());

        const count = await ensureMonthlySalaryPayments(targetMonth, targetYear);

        return NextResponse.json({
            success: true,
            message: `Generated monthly salary dues for ${targetMonth}/${targetYear} (${count} new records)`
        });
    } catch (error) {
        console.error("POST /api/staff/salary-payments error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json();
        const { payment_id, amount, payment_method, transaction_id, note } = body;

        if (!payment_id || !amount || Number(amount) <= 0) {
            return NextResponse.json({ success: false, message: "Valid payment_id and amount are required" }, { status: 400 });
        }

        const paymentsRes = await dbQuery("SELECT * FROM salary_payments");
        const sp = (paymentsRes.rows || []).find((p) => Number(p.id) === Number(payment_id));

        if (!sp) {
            return NextResponse.json({ success: false, message: "Salary payment record not found" }, { status: 404 });
        }

        const payAmt = Number(amount);
        const newPaid = Number(sp.paid_amount || 0) + payAmt;
        const newDue = Math.max(0, Number(sp.amount || 0) - newPaid);
        const newStatus = newDue === 0 ? 'paid' : 'partially_paid';

        const res = await dbQuery(
            `UPDATE salary_payments
             SET paid_amount = $1, due_amount = $2, payment_method = $3, transaction_id = $4, note = $5, status = $6, paid_by = $7, paid_at = now(), updated_at = now()
             WHERE id = $8
             RETURNING *`,
            [
                newPaid,
                newDue,
                payment_method || 'bank_transfer',
                transaction_id ? transaction_id.trim() : null,
                note ? note.trim() : null,
                newStatus,
                auth.data.id,
                Number(payment_id)
            ]
        );

        await dbQuery(
            `INSERT INTO activity_logs (staff_id, action, entity_type, entity_id, description)
             VALUES ($1, 'SALARY_PAYMENT_DISBURSED', 'salary_payments', $2, $3)`,
            [auth.data.id, Number(payment_id), `Disbursed ৳${payAmt} salary payment for Staff ID ${sp.staff_id} (${sp.month}/${sp.year})`]
        ).catch(() => {});

        return NextResponse.json({
            success: true,
            message: "Salary payment disbursed successfully",
            data: res.rows[0]
        });
    } catch (error) {
        console.error("PATCH /api/staff/salary-payments error:", error);
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
            return NextResponse.json({ success: false, message: "Payment ID is required" }, { status: 400 });
        }

        const res = await dbQuery("DELETE FROM salary_payments WHERE id = $1 RETURNING id", [Number(id)]);
        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Payment record not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Salary payment record deleted successfully" });
    } catch (error) {
        console.error("DELETE /api/staff/salary-payments error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
