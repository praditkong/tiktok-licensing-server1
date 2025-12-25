import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const verifyAdmin = (request: Request) => {
    const password = request.headers.get('x-admin-password');
    // Default password if not set in env: "admin123" (User should change this!)
    const correctPassword = process.env.ADMIN_PASSWORD || "admin123";
    return password === correctPassword;
};

// GET: List all keys
export async function GET(request: Request) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await sql`SELECT * FROM licenses ORDER BY created_at DESC;`;
        return NextResponse.json({ success: true, keys: result.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'DB Error' }, { status: 500 });
    }
}

// POST: Create a new key
export async function POST(request: Request) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { type, days, note } = body; // type: 'lifetime' | 'monthly'

        // Generate Key
        const prefix = type === 'lifetime' ? 'LIFE' : (days + 'D');
        const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase() +
            '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const key = `${prefix}-${randomPart}`;

        let expiresAt = null;
        if (days && days > 0) {
            const date = new Date();
            date.setDate(date.getDate() + parseInt(days));
            expiresAt = date.toISOString();
        }

        await sql`
            INSERT INTO licenses (key, type, status, expires_at, note)
            VALUES (${key}, ${type}, 'active', ${expiresAt}, ${note || ''});
        `;

        return NextResponse.json({ success: true, key, message: 'Key Created' });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, message: 'Creation Failed' }, { status: 500 });
    }
}

// DELETE: Remove a key
export async function DELETE(request: Request) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ success: false }, { status: 400 });

        await sql`DELETE FROM licenses WHERE id = ${id};`;
        return NextResponse.json({ success: true, message: 'Key Deleted' });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Delete Failed' }, { status: 500 });
    }
}
