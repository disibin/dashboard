import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { isStaffLogin } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";
import { sendEmail } from "@/lib/database/brevo";

// Legacy verification helper for initial invitation/verification token
async function verifyTeamToken(token) {
    if (!token) {
        return { success: false, message: "Verification token is required", status: 400 };
    }

    const res = await dbQuery(
        `SELECT id, email, verification_expires_at FROM staffs WHERE verification_token = $1 AND verification_expires_at > now()`,
        [token]
    );
    const staff = res.rows[0];

    if (!staff) {
        return { success: false, message: "Invalid or expired verification token", status: 400 };
    }

    await dbQuery(
        `UPDATE staffs SET is_verified = TRUE, verification_token = NULL, verification_expires_at = NULL, updated_at = now() WHERE id = $1`,
        [staff.id]
    );

    return {
        success: true,
        message: "Email verified successfully. You can now login.",
        status: 200
    };
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const { action, token } = body;

        // Legacy invitation token check
        if (token && !action) {
            const result = await verifyTeamToken(token);
            return NextResponse.json({ success: result.success, message: result.message }, { status: result.status });
        }

        // Authenticated staff security actions
        const auth = await isStaffLogin();
        if (!auth.success) {
            return NextResponse.json(auth, { status: 401 });
        }

        const staffId = auth.data.id;

        // 0. TOGGLE 2FA
        if (action === 'toggle-2fa') {
            const { is2faActive } = body;
            await dbQuery(
                "UPDATE staffs SET is_2fa_active = $1, updated_at = now() WHERE id = $2",
                [!!is2faActive, staffId]
            );
            return NextResponse.json({
                success: true,
                message: `Two-Factor Authentication has been ${is2faActive ? 'enabled' : 'disabled'}.`,
                is2faActive: !!is2faActive
            });
        }

        // 1. CHANGE PASSWORD
        if (action === 'change-password') {
            const { currentPassword, newPassword } = body;
            if (!currentPassword || !newPassword) {
                return NextResponse.json({ success: false, message: "Current and new password are required" }, { status: 400 });
            }

            if (newPassword.length < 6) {
                return NextResponse.json({ success: false, message: "New password must be at least 6 characters" }, { status: 400 });
            }

            const staffRes = await dbQuery("SELECT password FROM staffs WHERE id = $1", [staffId]);
            if (staffRes.rows.length === 0) {
                return NextResponse.json({ success: false, message: "Staff member not found" }, { status: 404 });
            }

            const isMatch = await bcrypt.compare(currentPassword, staffRes.rows[0].password);
            if (!isMatch) {
                return NextResponse.json({ success: false, message: "Current password is incorrect" }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await dbQuery("UPDATE staffs SET password = $1, updated_at = now() WHERE id = $2", [hashedPassword, staffId]);

            return NextResponse.json({ success: true, message: "Password updated successfully" });
        }

        // 2. REQUEST EMAIL CHANGE (Sends verification code to current/old email)
        if (action === 'request-email-change') {
            const { newEmail } = body;
            if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
                return NextResponse.json({ success: false, message: "A valid new email address is required" }, { status: 400 });
            }

            const currentTeamRes = await dbQuery("SELECT email, name FROM staffs WHERE id = $1", [staffId]);
            if (currentTeamRes.rows.length === 0) {
                return NextResponse.json({ success: false, message: "Staff member not found" }, { status: 404 });
            }

            const currentEmail = currentTeamRes.rows[0].email;
            const teamName = currentTeamRes.rows[0].name;

            if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
                return NextResponse.json({ success: false, message: "New email must be different from current email" }, { status: 400 });
            }

            // Check uniqueness in both staffs and users
            const existingStaff = await dbQuery("SELECT id FROM staffs WHERE email = $1", [newEmail]);
            if (existingStaff.rows.length > 0) {
                return NextResponse.json({ success: false, message: "This email address is already in use by another staff account" }, { status: 400 });
            }

            const existingUser = await dbQuery("SELECT id FROM users WHERE email = $1", [newEmail]);
            if (existingUser.rows.length > 0) {
                return NextResponse.json({ success: false, message: "This email address is already in use by a user account" }, { status: 400 });
            }

            // Generate 6-digit verification code & 15-min expiration
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

            await dbQuery(
                `UPDATE staffs 
                 SET pending_email = $1, email_change_code = $2, email_change_expires_at = $3, updated_at = now() 
                 WHERE id = $4`,
                [newEmail, verificationCode, expiresAt, staffId]
            );

            // Send Brevo email to OLD/CURRENT registered email address
            const htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 12px; background: #ffffff;">
                    <h1 style="color: #0f172a; font-size: 22px; font-weight: 700; margin-bottom: 12px;">Staff Email Change Verification Code</h1>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6;">Hello ${teamName},</p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6;">A request was received to update your Disibin Staff email address to <strong>${newEmail}</strong>.</p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6;">Please use the following 6-digit verification code to confirm this change:</p>
                    <div style="margin: 24px 0; padding: 18px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; text-align: center;">
                        <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">${verificationCode}</span>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">This code will expire in 15 minutes. If you did not request this email change, please notify your staff manager immediately.</p>
                </div>
            `;

            await sendEmail({
                to: currentEmail,
                subject: "Disibin Staff Email Change Verification Code",
                htmlContent
            });

            return NextResponse.json({
                success: true,
                message: `Verification code sent to your current email (${currentEmail}). Please enter the code to confirm.`,
                pendingEmail: newEmail
            });
        }

        // 3. VERIFY EMAIL CHANGE (Verifies 6-digit code)
        if (action === 'verify-email-change') {
            const { code } = body;
            if (!code) {
                return NextResponse.json({ success: false, message: "Verification code is required" }, { status: 400 });
            }

            const staffRes = await dbQuery(
                `SELECT pending_email, email_change_code, email_change_expires_at 
                 FROM staffs WHERE id = $1`,
                [staffId]
            );

            if (staffRes.rows.length === 0) {
                return NextResponse.json({ success: false, message: "Staff member not found" }, { status: 404 });
            }

            const { pending_email, email_change_code, email_change_expires_at } = staffRes.rows[0];

            if (!pending_email || !email_change_code) {
                return NextResponse.json({ success: false, message: "No email change request pending" }, { status: 400 });
            }

            if (new Date() > new Date(email_change_expires_at)) {
                return NextResponse.json({ success: false, message: "Verification code has expired. Please request a new code." }, { status: 400 });
            }

            if (email_change_code.trim() !== code.trim()) {
                return NextResponse.json({ success: false, message: "Invalid verification code" }, { status: 400 });
            }

            // Code verified! Update email and clear pending fields
            await dbQuery(
                `UPDATE staffs 
                 SET email = $1, pending_email = NULL, email_change_code = NULL, email_change_expires_at = NULL, updated_at = now() 
                 WHERE id = $2`,
                [pending_email, staffId]
            );

            return NextResponse.json({
                success: true,
                message: "Staff email address updated successfully!",
                newEmail: pending_email
            });
        }

        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// GET — Verify with token in query string (?token=...)
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");
        const result = await verifyTeamToken(token);
        return NextResponse.json({ success: result.success, message: result.message }, { status: result.status });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
