import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/database/pg";

export async function GET() {
    try {

        const usersRes = await dbQuery("SELECT COUNT(*) as count FROM users", []);
        const projectsRes = await dbQuery("SELECT COUNT(*) as count FROM projects", []);

        const usersCount = parseInt(usersRes.rows[0].count) || 0;
        const projectsCount = parseInt(projectsRes.rows[0].count) || 0;


        const businesses = 120 + usersCount;
        const projects = 50 + projectsCount;
        const years = 6; 

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    businesses,
                    projects,
                    years
                }
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
