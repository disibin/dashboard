import { NextResponse } from "next/server";
import { getAuthenticatedStaff } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {
        const staff = await getAuthenticatedStaff();
        if (!staff) {
            return NextResponse.json({ success: false, message: "Please login" }, { status: 401 });
        }

        const [
            projectsRes,
            supportsRes,
            reportsRes,
            ticketsRes,
            usersRes,
            paymentsRes,
            clientLeadsRes,
            businessLeadsRes,
            reviewsRes,
            staffsRes,
            activityLogsRes,
        ] = await Promise.all([
            dbQuery(`
                SELECT 
                    COUNT(*)::int as total,
                    COUNT(*) FILTER (WHERE status = 'waiting')::int as waiting,
                    COUNT(*) FILTER (WHERE status IN ('progress', 'working'))::int as working,
                    COUNT(*) FILTER (WHERE status = 'completed')::int as completed
                FROM project_chats
            `),
            dbQuery(`
                SELECT 
                    COUNT(*)::int as total,
                    COUNT(*) FILTER (WHERE status = 'pending')::int as pending
                FROM supports
            `),
            dbQuery(`
                SELECT 
                    COUNT(*)::int as total,
                    COUNT(*) FILTER (WHERE status = 'pending')::int as pending
                FROM reports
            `),
            dbQuery(`
                SELECT COUNT(*)::int as total FROM tickets
            `),
            dbQuery(`
                SELECT 
                    COUNT(*)::int as total,
                    COUNT(*) FILTER (WHERE is_verified = TRUE)::int as verified
                FROM users
            `),
            dbQuery(`
                SELECT 
                    COALESCE(SUM(paid), 0)::int as total_revenue,
                    COUNT(*) FILTER (WHERE status = 'pending')::int as pending_payments,
                    COUNT(*)::int as total_payments
                FROM payments
            `),
            dbQuery(`
                SELECT COUNT(*)::int as total FROM client_leads
            `),
            dbQuery(`
                SELECT COUNT(*)::int as total FROM business_leads
            `),
            dbQuery(`
                SELECT 
                    COUNT(*)::int as total,
                    COUNT(*) FILTER (WHERE is_approved = FALSE)::int as pending
                FROM reviews
            `),
            dbQuery(`
                SELECT 
                    COUNT(*)::int as total,
                    COUNT(*) FILTER (WHERE role = 'manager')::int as managers,
                    COUNT(*) FILTER (WHERE role = 'developer')::int as developers,
                    COUNT(*) FILTER (WHERE role = 'support')::int as support_count
                FROM staffs 
                WHERE is_active = TRUE
            `),
            dbQuery(`
                SELECT 
                    a.id, 
                    a.action, 
                    a.entity_type, 
                    a.description, 
                    a.created_at, 
                    s.name as staff_name, 
                    s.role as staff_role
                FROM activity_logs a 
                LEFT JOIN staffs s ON a.staff_id = s.id 
                ORDER BY a.created_at DESC 
                LIMIT 6
            `),
        ]);

        const overview = {
            projects: projectsRes.rows[0] || { total: 0, waiting: 0, working: 0, completed: 0 },
            supports: supportsRes.rows[0] || { total: 0, pending: 0 },
            reports: reportsRes.rows[0] || { total: 0, pending: 0 },
            tickets: ticketsRes.rows[0] || { total: 0 },
            users: usersRes.rows[0] || { total: 0, verified: 0 },
            payments: paymentsRes.rows[0] || { total_revenue: 0, pending_payments: 0, total_payments: 0 },
            leads: {
                client: clientLeadsRes.rows[0]?.total || 0,
                business: businessLeadsRes.rows[0]?.total || 0,
                total: (clientLeadsRes.rows[0]?.total || 0) + (businessLeadsRes.rows[0]?.total || 0),
            },
            reviews: reviewsRes.rows[0] || { total: 0, pending: 0 },
            staffs: staffsRes.rows[0] || { total: 0, managers: 0, developers: 0, support_count: 0 },
            recent_activity: activityLogsRes.rows || [],
        };

        return NextResponse.json({
            success: true,
            data: overview,
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
