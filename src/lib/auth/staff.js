import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { JWT_SECRET } from "../database/secret";
import { dbQuery } from "../database/pg";
import { hasPanelAccess } from "./permissions";

export { hasPanelAccess };

export async function getAuthenticatedStaff() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('disibin-staff')?.value;

        if (!token) return null;

        const decoded = jwt.verify(token, JWT_SECRET);
        const staffId = decoded.id;
        if (!decoded || !staffId) return null;

        const res = await dbQuery(
            "SELECT id, name, email, role, is_active FROM staffs WHERE id = $1",
            [staffId]
        );

        if (res.rows.length > 0) {
            const staff = res.rows[0];
            if (!staff.is_active) return null;
            return {
                id: staff.id,
                name: staff.name,
                email: staff.email,
                role: staff.role,
            };
        }

        return null;
    } catch (error) {
        return null;
    }
}

export async function isStaffLogin() {
    const context = await getAuthenticatedStaff();
    if (!context) return { success: false, message: 'Please login' };
    return { success: true, data: context };
}

export async function isManager() {
    const context = await getAuthenticatedStaff();
    if (!context || context.role !== 'manager') {
        return { success: false, message: 'Access denied: Manager access required' };
    }
    return { success: true, data: context };
}

export async function isSupport() {
    const context = await getAuthenticatedStaff();
    if (!context || (context.role !== 'support' && context.role !== 'manager')) {
        return { success: false, message: 'Access denied: Support/Manager access required' };
    }
    return { success: true, data: context };
}

export async function isDeveloper() {
    const context = await getAuthenticatedStaff();
    if (!context || (context.role !== 'developer' && context.role !== 'manager')) {
        return { success: false, message: 'Access denied: Developer/Manager access required' };
    }
    return { success: true, data: context };
}

export async function isRoleAllowed(allowedRoles = []) {
    const context = await getAuthenticatedStaff();
    if (!context) return { success: false, message: 'Please login' };
    if (context.role === 'manager' || allowedRoles.includes(context.role)) {
        return { success: true, data: context };
    }
    return { success: false, message: 'Access denied: Unauthorized role for this action' };
}
