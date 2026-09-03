import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";
import { sendEmail } from "@/lib/database/brevo";
import { BASE_URL, getBaseUrl } from "@/lib/database/secret";



export async function GET() {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const res = await dbQuery(
            `SELECT id, name, email, phone, role, is_active, is_verified,
                    city, country, last_login, created_at, updated_at
             FROM staffs
             ORDER BY created_at ASC`
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
        const { name, email, phone, role, password: rawPassword } = body;

        if (!name || !email || !role) {
            return NextResponse.json(
                { success: false, message: "Name, email, and role are required" },
                { status: 400 }
            );
        }

        if (!['support', 'manager', 'developer'].includes(role)) {
            return NextResponse.json(
                { success: false, message: "Role must be support, manager, or developer" },
                { status: 400 }
            );
        }

        const existing = await dbQuery("SELECT id FROM staffs WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
            return NextResponse.json({ success: false, message: "Email already registered" }, { status: 400 });
        }

        if (phone) {
            const phoneCheck = await dbQuery("SELECT id FROM staffs WHERE phone = $1", [phone]);
            if (phoneCheck.rows.length > 0) {
                return NextResponse.json({ success: false, message: "Phone number already registered" }, { status: 400 });
            }
        }

        const tempPassword = rawPassword || crypto.randomBytes(8).toString("hex");
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationExpiresAt = new Date(Date.now() + 7 * 24 * 3600000); 

        const res = await dbQuery(
            `INSERT INTO staffs (name, email, phone, password, role, verification_token, verification_expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, name, email, phone, role, is_active, is_verified, created_at`,
            [name, email, phone || null, hashedPassword, role, verificationToken, verificationExpiresAt]
        );
        const newMember = res.rows[0];

        const baseUrl = getBaseUrl(req);
        const verifyLink = `${baseUrl}/staff-auth/verify?token=${verificationToken}`;
        const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 10px;">
                <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 16px;">Welcome to Disibin Staff</h1>
                <p style="color: #64748b; line-height: 1.6;">Hi ${name}, you've been added as a <strong>${role}</strong> on the Disibin management staff.</p>
                <p style="color: #64748b; line-height: 1.6; margin-bottom: 8px;">Your login credentials:</p>
                <p style="color: #64748b;"><strong>Email:</strong> ${email}</p>
                <p style="color: #64748b; margin-bottom: 24px;"><strong>Temporary Password:</strong> ${rawPassword ? '(as provided by manager)' : tempPassword}</p>
                <p style="color: #64748b; margin-bottom: 24px;">Please click the button below to verify your email and activate your account:</p>
                <a href="${verifyLink}" style="display: inline-block; padding: 16px 32px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600;">Verify Email &amp; Activate</a>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">This verification link will expire in 7 days.</p>
            </div>
        `;
        await sendEmail({ to: email, subject: "Welcome to Disibin Staff — Verify Your Account", htmlContent });

        return NextResponse.json(
            { success: true, message: "Staff member created and invitation email sent", data: newMember },
            { status: 201 }
        );

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}




export async function PATCH(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "Staff member ID is required" }, { status: 400 });
        }


        const {
            password, verification_token, verification_expires_at,
            reset_token, token_expires_at, ...safeData
        } = updateData;

        if (Object.keys(safeData).length === 0) {
            return NextResponse.json({ success: false, message: "No fields to update" }, { status: 400 });
        }


        const memberRes = await dbQuery("SELECT role, is_active FROM staffs WHERE id = $1", [id]);
        if (memberRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Staff member not found" }, { status: 404 });
        }

        const current = memberRes.rows[0];
        const isBeingDemoted = safeData.role && safeData.role !== 'manager' && current.role === 'manager';
        const isBeingDeactivated = safeData.is_active === false && current.is_active === true && current.role === 'manager';

        if (isBeingDemoted || isBeingDeactivated) {
            const activeManagersRes = await dbQuery(
                "SELECT COUNT(*) AS cnt FROM staffs WHERE role = 'manager' AND is_active = TRUE"
            );
            const activeManagerCount = parseInt(activeManagersRes.rows[0].cnt, 10);
            if (activeManagerCount <= 1) {
                return NextResponse.json(
                    { success: false, message: "Cannot remove the last active manager. Promote another manager first." },
                    { status: 400 }
                );
            }
        }


        const keys = Object.keys(safeData);
        for (const key of keys) {
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
                return NextResponse.json({ success: false, message: "Invalid field name" }, { status: 400 });
            }
        }

        const values = Object.values(safeData);
        const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");

        const res = await dbQuery(
            `UPDATE staffs SET ${setClause}, updated_at = now()
             WHERE id = $${keys.length + 1}
             RETURNING id, name, email, phone, role, is_active, is_verified, updated_at`,
            [...values, id]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Staff member not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Staff member updated successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}




export async function DELETE(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: "Staff member ID is required" }, { status: 400 });
        }


        const memberRes = await dbQuery("SELECT id, role, is_active FROM staffs WHERE id = $1", [id]);
        if (memberRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Staff member not found" }, { status: 404 });
        }

        const target = memberRes.rows[0];


        if (target.role === 'manager' && target.is_active) {
            const activeManagersRes = await dbQuery(
                "SELECT COUNT(*) AS cnt FROM staffs WHERE role = 'manager' AND is_active = TRUE"
            );
            const activeManagerCount = parseInt(activeManagersRes.rows[0].cnt, 10);
            if (activeManagerCount <= 1) {
                return NextResponse.json(
                    { success: false, message: "Cannot remove the last active manager. Promote another manager first." },
                    { status: 400 }
                );
            }
        }

        const res = await dbQuery(
            "DELETE FROM staffs WHERE id = $1 RETURNING id, name, email, role",
            [id]
        );

        return NextResponse.json({
            success: true,
            message: "Staff member removed successfully",
            data: res.rows[0]
        });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
