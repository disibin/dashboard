import { NextResponse } from "next/server";
import { isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const res = await dbQuery(
            `SELECT 
                p.id, p.title, p.month, p.year, p.total_amount, p.status, p.created_at, p.updated_at,
                stf.name AS creator_name,
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id', s.id,
                            'staff_id', s.staff_id,
                            'staff_name', st.name,
                            'staff_email', st.email,
                            'staff_role', st.role,
                            'amount', s.amount,
                            'paid_amount', s.paid_amount,
                            'due_amount', s.due_amount,
                            'status', s.status
                        ) ORDER BY st.name ASC
                    )
                    FROM salary s
                    JOIN staffs st ON st.id = s.staff_id
                    WHERE s.payroll_id = p.id),
                    '[]'::json
                ) AS salaries
             FROM payroll p
             LEFT JOIN staffs stf ON stf.id = p.created_by
             ORDER BY p.year DESC, p.month DESC, p.created_at DESC`
        );

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json();
        const { title, month, year, staff_salaries } = body;

        if (!month || !year) {
            return NextResponse.json({ success: false, message: "Month and year are required" }, { status: 400 });
        }

        const monthNum = Number(month);
        const yearNum = Number(year);
        const payrollTitle = title?.trim() || `Payroll ${monthNum}/${yearNum}`;

        const check = await dbQuery(
            "SELECT id FROM payroll WHERE month = $1 AND year = $2",
            [monthNum, yearNum]
        );
        if (check.rows.length > 0) {
            return NextResponse.json({ success: false, message: `Payroll for ${monthNum}/${yearNum} already exists` }, { status: 409 });
        }

        let totalSum = 0;
        if (Array.isArray(staff_salaries)) {
            totalSum = staff_salaries.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
        }

        const pRes = await dbQuery(
            `INSERT INTO payroll (title, month, year, total_amount, status, created_by)
             VALUES ($1, $2, $3, $4, 'pending', $5)
             RETURNING *`,
            [payrollTitle, monthNum, yearNum, totalSum, auth.data.id]
        );

        const payrollId = pRes.rows[0].id;

        if (Array.isArray(staff_salaries) && staff_salaries.length > 0) {
            for (const item of staff_salaries) {
                const amt = Number(item.amount) || 0;
                if (item.staff_id && amt > 0) {
                    await dbQuery(
                        `INSERT INTO salary (staff_id, payroll_id, amount, paid_amount, due_amount, status)
                         VALUES ($1, $2, $3, 0, $3, 'unpaid')`,
                        [item.staff_id, payrollId, amt]
                    );
                }
            }
        }

        await dbQuery(
            `INSERT INTO activity_logs (staff_id, action, entity_type, entity_id, description)
             VALUES ($1, 'PAYROLL_CREATE', 'payroll', $2, $3)`,
            [auth.data.id, payrollId, `Generated payroll "${payrollTitle}" ($${totalSum})`]
        ).catch(() => {});

        return NextResponse.json({
            success: true,
            message: "Payroll created successfully",
            data: pRes.rows[0]
        }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json();
        const { salary_id, amount, payment_method, note, payroll_id, status } = body;

        if (payroll_id && status) {
            await dbQuery(
                `UPDATE payroll SET status = $1, updated_at = now() WHERE id = $2`,
                [status, payroll_id]
            );
            return NextResponse.json({ success: true, message: "Payroll status updated" });
        }

        if (salary_id && amount && amount > 0) {
            const salQuery = await dbQuery("SELECT * FROM salary WHERE id = $1", [salary_id]);
            if (salQuery.rows.length === 0) {
                return NextResponse.json({ success: false, message: "Salary entry not found" }, { status: 404 });
            }

            const sal = salQuery.rows[0];
            const payAmt = Number(amount);
            const newPaid = Number(sal.paid_amount || 0) + payAmt;
            const newDue = Math.max(0, Number(sal.amount || 0) - newPaid);
            const newStatus = newDue === 0 ? 'paid' : 'partially_paid';

            await dbQuery(
                `UPDATE salary 
                 SET paid_amount = $1, due_amount = $2, status = $3, updated_at = now() 
                 WHERE id = $4`,
                [newPaid, newDue, newStatus, salary_id]
            );

            await dbQuery(
                `INSERT INTO salary_payments (salary_id, amount, payment_method, note, created_by)
                 VALUES ($1, $2, $3, $4, $5)`,
                [salary_id, payAmt, payment_method || 'bank_transfer', note || null, auth.data.id]
            );

            return NextResponse.json({
                success: true,
                message: "Salary payment recorded successfully"
            });
        }

        return NextResponse.json({ success: false, message: "Invalid parameters" }, { status: 400 });

    } catch (error) {
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
            return NextResponse.json({ success: false, message: "Payroll ID is required" }, { status: 400 });
        }

        const res = await dbQuery("DELETE FROM payroll WHERE id = $1 RETURNING id, title", [id]);
        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Payroll not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Payroll deleted successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
