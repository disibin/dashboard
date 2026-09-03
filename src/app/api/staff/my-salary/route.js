import { NextResponse } from "next/server";
import { isStaffLogin } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const staffId = auth.data.id;

        const [staffsRes, staffSalariesRes, payscalesRes, paymentsRes] = await Promise.all([
            dbQuery("SELECT * FROM staffs"),
            dbQuery("SELECT * FROM staff_salary"),
            dbQuery("SELECT * FROM payscale"),
            dbQuery("SELECT * FROM salary_payments")
        ]);

        const staffs = staffsRes.rows || [];
        const staffSalaries = staffSalariesRes.rows || [];
        const payscales = payscalesRes.rows || [];
        const salaryPayments = paymentsRes.rows || [];

        const staffObj = staffs.find((s) => Number(s.id) === Number(staffId)) || null;
        const salaryConfigRaw = staffSalaries.find((s) => Number(s.staff_id) === Number(staffId)) || null;
        const payscaleObj = salaryConfigRaw && salaryConfigRaw.payscale_id
            ? payscales.find((p) => Number(p.id) === Number(salaryConfigRaw.payscale_id))
            : null;

        const salaryConfig = salaryConfigRaw
            ? {
                ...salaryConfigRaw,
                grade_name: payscaleObj ? payscaleObj.grade_name : null,
                grade_level: payscaleObj ? payscaleObj.grade_level : null,
                basic_salary: payscaleObj ? payscaleObj.basic_salary : 0,
                house_rent: payscaleObj ? payscaleObj.house_rent : 0,
                medical_allowance: payscaleObj ? payscaleObj.medical_allowance : 0,
                other_allowance: payscaleObj ? payscaleObj.other_allowance : 0,
                payscale_total: payscaleObj ? payscaleObj.total_salary : 0
            }
            : null;

        const rawPayments = salaryPayments.filter((sp) => Number(sp.staff_id) === Number(staffId));
        const records = rawPayments
            .map((sp) => ({
                ...sp,
                grade_name: payscaleObj ? payscaleObj.grade_name : null
            }))
            .sort((a, b) => (b.year - a.year) || (b.month - a.month) || (new Date(b.created_at) - new Date(a.created_at)));

        const totalEarned = records.reduce((sum, r) => sum + Number(r.amount || 0), 0);
        const totalPaid = records.reduce((sum, r) => sum + Number(r.paid_amount || 0), 0);
        const totalDue = records.reduce((sum, r) => sum + Number(r.due_amount || 0), 0);

        return NextResponse.json({
            success: true,
            data: {
                staff: staffObj,
                salary_config: salaryConfig,
                summary: {
                    net_salary: salaryConfig?.net_salary || 0,
                    grade_name: salaryConfig?.grade_name || 'Unassigned',
                    total_earned: totalEarned,
                    total_paid: totalPaid,
                    total_due: totalDue
                },
                payments: records
            }
        });
    } catch (error) {
        console.error("GET /api/staff/my-salary error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
