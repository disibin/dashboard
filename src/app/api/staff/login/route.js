import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbQuery } from "@/lib/database/pg";
import { JWT_SECRET, NODE_ENV } from "@/lib/database/secret";
import { isStaffLogin } from "@/lib/auth/staff";

export async function POST(req) {
    try {

        const auth = await isStaffLogin();
        if (auth.success) {
            return NextResponse.json({ success: false, message: "Already logged in" }, { status: 403 });
        }

        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 });
        }


        const res = await dbQuery("SELECT * FROM staffs WHERE email = $1", [email]);
        const staff = res.rows[0];

        if (!staff) {
            return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 });
        }

        if (!staff.is_active) {
            return NextResponse.json(
                { success: false, message: "Account is deactivated. Please contact your manager." },
                { status: 403 }
            );
        }

        const isMatch = await bcrypt.compare(password, staff.password);
        if (!isMatch) {

            await dbQuery(
                `INSERT INTO staff_login_logs (staff_id, action, description, status) VALUES ($1, $2, $3, $4)`,
                [staff.id, 'login', 'Failed login attempt', 'fail']
            ).catch(() => {}); 
            return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 });
        }

        if (!staff.is_verified) {
            return NextResponse.json(
                { success: false, message: "Please verify your email address before logging in." },
                { status: 403 }
            );
        }


        await dbQuery("UPDATE staffs SET last_login = now() WHERE id = $1", [staff.id]);
        await dbQuery(
            `INSERT INTO staff_login_logs (staff_id, action, description, status) VALUES ($1, $2, $3, $4)`,
            [staff.id, 'login', 'Successful login', 'success']
        ).catch(() => {}); 


        const token = jwt.sign(
            { id: staff.id, email: staff.email, name: staff.name, role: staff.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        const response = NextResponse.json({ success: true, message: "Login successful" });

        response.cookies.set("disibin-staff", token, {
            httpOnly: true,
            secure: NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60,
            path: "/",
        });

        return response;

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
