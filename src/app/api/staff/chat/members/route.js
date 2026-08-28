import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/database/pg";
import { isStaffLogin } from "@/lib/auth/staff";

// GET — List active staff members (excluding current staff user)
export async function GET() {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const currentStaffId = auth.data.id;

        const res = await dbQuery(
            `SELECT id, name, email, role 
             FROM staffs 
             WHERE is_active = true AND id != $1 
             ORDER BY name ASC`,
            [currentStaffId]
        );

        return NextResponse.json({ success: true, data: res.rows });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
