import { NextResponse } from "next/server";
import { isStaffLogin } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";

export async function GET(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const res = await dbQuery(`
            SELECT 
                p.id,
                p.id AS purchase_id,
                p.order_id,
                p.price,
                p.discount,
                p.status AS purchase_status,
                p.created_at,
                p.updated_at,
                u.id AS user_id,
                u.name AS user_name,
                u.email AS user_email,
                u.phone AS user_phone,
                pkg.id AS package_id,
                pkg.name AS package_name,
                pkg.slug AS package_slug,
                pkg.image AS package_image,
                pay.id AS payment_id,
                pay.payment_method,
                pay.transaction_id,
                pay.sender_number,
                pay.status AS payment_status,
                pay.proof_url,
                pay.paid AS paid_amount,
                pay.due AS due_amount
            FROM purchases p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN packages pkg ON p.package_id = pkg.id
            LEFT JOIN payments pay ON (
                (p.order_id IS NOT NULL AND pay.order_id = p.order_id)
                OR
                (p.order_id IS NULL AND pay.purchase_id = p.id)
            )
            ORDER BY p.created_at DESC
        `);

        return NextResponse.json({ success: true, data: res.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const body = await req.json();
        const { purchase_id, status, create_project } = body;

        if (!purchase_id) {
            return NextResponse.json({ success: false, message: "Purchase ID is required" }, { status: 400 });
        }

        const validStatuses = ['incomplete', 'pending', 'complete', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return NextResponse.json({ success: false, message: "Invalid status value" }, { status: 400 });
        }

        const currentRes = await dbQuery(`
            SELECT p.id, p.user_id, p.package_id, p.order_id, p.status, pkg.name as package_name
            FROM purchases p
            LEFT JOIN packages pkg ON p.package_id = pkg.id
            WHERE p.id = $1
        `, [purchase_id]);

        if (currentRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Purchase record not found" }, { status: 404 });
        }

        const purchase = currentRes.rows[0];

        if (status) {
            await dbQuery(`
                UPDATE purchases
                SET status = $1, updated_at = now()
                WHERE id = $2
            `, [status, purchase_id]);

            if (status === 'complete') {
                await dbQuery(`
                    UPDATE payments
                    SET status = 'paid', updated_at = now()
                    WHERE purchase_id = $1
                `, [purchase_id]).catch(() => {});
            } else if (status === 'cancelled') {
                await dbQuery(`
                    UPDATE payments
                    SET status = 'rejected', updated_at = now()
                    WHERE purchase_id = $1
                `, [purchase_id]).catch(() => {});
            }
        }

        let newProjectId = null;
        if (create_project && purchase.user_id) {
            const projectTitle = `Project - ${purchase.package_name || 'Deliverable'} (#${purchase.id})`;
            
            const existingChat = await dbQuery(`
                SELECT pc.id 
                FROM project_chats pc
                JOIN project_chats_participants pcp ON pc.id = pcp.chat_id
                WHERE pcp.user_id = $1 AND pc.title = $2
            `, [purchase.user_id, projectTitle]);

            if (existingChat.rows.length > 0) {
                newProjectId = existingChat.rows[0].id;
            } else {
                const projectRes = await dbQuery(`
                    INSERT INTO project_chats (title, description, status, created_by)
                    VALUES ($1, $2, 'working', $3)
                    RETURNING id
                `, [projectTitle, `Automated workspace created for package purchase #${purchase.id}`, auth.data.id]);

                newProjectId = projectRes.rows[0].id;

                await dbQuery(`
                    INSERT INTO project_chats_participants (chat_id, user_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                `, [newProjectId, purchase.user_id]);

                await dbQuery(`
                    INSERT INTO project_chats_participants (chat_id, staff_id)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                `, [newProjectId, auth.data.id]);

                await dbQuery(`
                    INSERT INTO project_chats_messages (chat_id, staff_id, content)
                    VALUES ($1, $2, $3)
                    `, [newProjectId, auth.data.id, `Welcome! Your project workspace for purchase "${purchase.package_name}" (#${purchase.id}) has been activated.`]);
            }
        }

        await dbQuery(`
            INSERT INTO activity_logs (staff_id, action, entity_type, entity_id, description)
            VALUES ($1, 'PURCHASE_UPDATE', 'purchases', $2, $3)
        `, [auth.data.id, purchase_id, `Updated purchase #${purchase_id} status to ${status || purchase.status}`]).catch(() => {});

        return NextResponse.json({
            success: true,
            message: "Purchase updated successfully",
            project_id: newProjectId
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const { searchParams } = new URL(req.url);
        const purchase_id = searchParams.get("purchase_id") || searchParams.get("id");

        if (!purchase_id) {
            return NextResponse.json({ success: false, message: "Purchase ID is required" }, { status: 400 });
        }

        const res = await dbQuery("DELETE FROM purchases WHERE id = $1 RETURNING id, order_id", [purchase_id]);
        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Purchase record not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Purchase record deleted successfully"
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
