import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const auth = request.headers.get('Authorization');
        if (auth !== `Bearer ${process.env.ADMIN_SECRET}`) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type, count } = body; // type: 'lifetime' | 'monthly'
        const numCount = parseInt(count) || 1;

        if (!['lifetime', 'monthly'].includes(type)) {
            return NextResponse.json({ success: false, message: 'Invalid type' }, { status: 400 });
        }

        const keys: string[] = [];

        for (let i = 0; i < numCount; i++) {
            // Generate Key Format: TYPE-XXXX-XXXX-XXXX
            const random = uuidv4().toUpperCase().replace(/-/g, '').substring(0, 12);
            const prefix = type === 'lifetime' ? 'LIFE' : 'SUB';
            // Chunk it: LIFE-ABCD-EFGH-IJKL
            const cleanRandom = random.match(/.{1,4}/g)?.join('-') || random;
            const key = `${prefix}-${cleanRandom}`;

            // Calculate Expiry (If monthly, set generic future date? No, set when Activated? 
            // Or set Fixed Expiry from generation? Assume Fixed from Generation for now for simplicity of sales)
            // Let's say Monthly = 30 days from NOW.
            let expires_at = null;
            if (type === 'monthly') {
                const d = new Date();
                d.setDate(d.getDate() + 32); // Give 32 days buffer
                expires_at = d.toISOString();
            }

            // Insert
            await sql`
                INSERT INTO licenses (key, type, expires_at)
                VALUES (${key}, ${type}, ${expires_at})
            `;
            keys.push(key);
        }

        return NextResponse.json({ success: true, keys });

    } catch (error: any) {
        console.error("Generate Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
