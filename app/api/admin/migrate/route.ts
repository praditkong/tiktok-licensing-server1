import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const verifyAdmin = (request: Request) => {
    const password = request.headers.get('x-admin-password');
    const correctPassword = process.env.ADMIN_PASSWORD || "admin123";
    return password === correctPassword;
};

export async function GET(request: Request) {
    if (!verifyAdmin(request)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Migration: Add 'note' column
        await sql`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS note TEXT;`;
        return NextResponse.json({ success: true, message: "Migration Successful: Added 'note' column" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
