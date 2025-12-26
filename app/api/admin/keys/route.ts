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

// PATCH: Renew/Extend a key
export async function PATCH(request: Request) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, days } = body;

        if (!id || !days) return NextResponse.json({ success: false, message: 'Missing id or days' }, { status: 400 });

        // Get current key
        const result = await sql`SELECT * FROM licenses WHERE id = ${id} LIMIT 1;`;
        if (result.rowCount === 0) return NextResponse.json({ success: false, message: 'Key not found' }, { status: 404 });

        const license = result.rows[0];
        if (license.type !== 'monthly') {
            return NextResponse.json({ success: false, message: 'Only monthly keys can be extended' }, { status: 400 });
        }

        // Calculate new expiry
        let currentExpiry = new Date(license.expires_at);
        const now = new Date();
        // If expired, start from now. If active, add to current expiry.
        if (currentExpiry < now) currentExpiry = now;

        currentExpiry.setDate(currentExpiry.getDate() + parseInt(days));
        const newExpiresAt = currentExpiry.toISOString();

        await sql`UPDATE licenses SET expires_at = ${newExpiresAt}, status = 'active' WHERE id = ${id};`;

        return NextResponse.json({ success: true, message: `Extended by ${days} days` });

    } catch (error) {
        return NextResponse.json({ success: false, message: 'Update Failed' }, { status: 500 });
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
