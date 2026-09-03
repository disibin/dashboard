import { NextResponse } from "next/server";
import { isStaffLogin, isManager } from "@/lib/auth/staff";
import { dbQuery } from "@/lib/database/pg";
import cloudinary from "@/lib/database/cloudinary";

function slugify(text) {
    if (!text) return `blog-${Date.now()}`;
    const slug = text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || `blog-${Date.now()}`;
}

export async function GET(req) {
    try {
        const auth = await isStaffLogin();
        if (!auth.success) return NextResponse.json(auth, { status: 401 });

        const { searchParams } = new URL(req.url);
        const tenantId = searchParams.get("tenant_id");

        let query = `
            SELECT b.id, b.title, b.slug, b.description, b.image, b.image_id, b.tenant_id,
                   b.created_by, b.created_at, b.updated_at,
                   t.name as tenant_name, s.name as creator_name
            FROM blogs b
            INNER JOIN tenants t ON b.tenant_id = t.id
            LEFT JOIN staffs s ON b.created_by = s.id
        `;
        const params = [];

        if (tenantId) {
            query += ` WHERE b.tenant_id = $1`;
            params.push(tenantId);
        }

        query += ` ORDER BY b.created_at DESC`;

        const res = await dbQuery(query, params);

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
        const { title, description, image, image_id, tenant_id } = body;

        if (!title || !title.trim()) {
            return NextResponse.json({ success: false, message: "Title is required" }, { status: 400 });
        }
        if (!tenant_id) {
            return NextResponse.json({ success: false, message: "Tenant is required" }, { status: 400 });
        }

        let blogSlug = slugify(title.trim());

        const dupCheck = await dbQuery("SELECT id FROM blogs WHERE slug = $1", [blogSlug]);
        if (dupCheck.rows.length > 0) {
            blogSlug = `${blogSlug}-${Date.now()}`;
        }

        const res = await dbQuery(`
            INSERT INTO blogs (title, slug, description, image, image_id, tenant_id, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [
            title.trim(),
            blogSlug,
            description || '',
            image || null,
            image_id || null,
            Number(tenant_id),
            auth.data.id
        ]);

        const record = res.rows[0];

        await dbQuery(`
            INSERT INTO activity_logs (staff_id, action, entity_type, entity_id, description)
            VALUES ($1, 'BLOG_CREATE', 'blogs', $2, $3)
        `, [auth.data.id, record.id, `Created blog "${record.title}"`]).catch(() => {});

        return NextResponse.json({ success: true, message: "Blog created successfully", data: record }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const auth = await isManager();
        if (!auth.success) return NextResponse.json(auth, { status: 403 });

        const body = await req.json();
        const { id, title, description, image, image_id, tenant_id } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
        }
        if (!tenant_id) {
            return NextResponse.json({ success: false, message: "Tenant is required" }, { status: 400 });
        }

        const checkRes = await dbQuery("SELECT * FROM blogs WHERE id = $1", [id]);
        if (checkRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Blog record not found" }, { status: 404 });
        }
        const existingBlog = checkRes.rows[0];

        const updatedTitle = title?.trim() || existingBlog.title;
        let blogSlug = slugify(updatedTitle);

        const dupCheck = await dbQuery("SELECT id FROM blogs WHERE slug = $1 AND id != $2", [blogSlug, id]);
        if (dupCheck.rows.length > 0) {
            blogSlug = `${blogSlug}-${Date.now()}`;
        }

        if (existingBlog.image_id && image_id && existingBlog.image_id !== image_id) {
            try {
                await cloudinary.uploader.destroy(existingBlog.image_id);
            } catch (err) {
                console.error("Failed to delete old image from Cloudinary:", err);
            }
        }

        const res = await dbQuery(`
            UPDATE blogs
            SET title = $1,
                slug = $2,
                description = COALESCE($3, description),
                image = $4,
                image_id = $5,
                tenant_id = $6,
                updated_at = now()
            WHERE id = $7
            RETURNING *
        `, [
            updatedTitle,
            blogSlug,
            description !== undefined ? description : existingBlog.description,
            image !== undefined ? image : existingBlog.image,
            image_id !== undefined ? image_id : existingBlog.image_id,
            Number(tenant_id),
            id
        ]);

        const record = res.rows[0];

        await dbQuery(`
            INSERT INTO activity_logs (staff_id, action, entity_type, entity_id, description)
            VALUES ($1, 'BLOG_UPDATE', 'blogs', $2, $3)
        `, [auth.data.id, record.id, `Updated blog "${record.title}"`]).catch(() => {});

        return NextResponse.json({ success: true, message: "Blog updated successfully", data: record });
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
            return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });
        }

        const res = await dbQuery("DELETE FROM blogs WHERE id = $1 RETURNING *", [id]);

        if (res.rows.length === 0) {
            return NextResponse.json({ success: false, message: "Blog record not found" }, { status: 404 });
        }

        const deleted = res.rows[0];

        if (deleted.image_id) {
            try {
                await cloudinary.uploader.destroy(deleted.image_id);
            } catch (err) {
                console.error("Cloudinary cleanup error:", err);
            }
        }

        await dbQuery(`
            INSERT INTO activity_logs (staff_id, action, entity_type, entity_id, description)
            VALUES ($1, 'BLOG_DELETE', 'blogs', $2, $3)
        `, [auth.data.id, deleted.id, `Deleted blog "${deleted.title}"`]).catch(() => {});

        return NextResponse.json({ success: true, message: "Blog deleted successfully", data: deleted });
    } catch (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
