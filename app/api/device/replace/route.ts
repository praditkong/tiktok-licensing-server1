import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { key, newDeviceId, oldDeviceIdToReplace } = body;

        if (!key || !newDeviceId || !oldDeviceIdToReplace) {
            return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
        }

        // 1. Find License
        const result = await sql`SELECT * FROM licenses WHERE key = ${key} LIMIT 1;`;
        if (result.rowCount === 0) {
            return NextResponse.json({ success: false, message: 'Invalid License Key' }, { status: 404 });
        }
        const license = result.rows[0];

        // 2. Parsed Devices
        let deviceIds: any[] = license.device_ids || [];
        if (typeof deviceIds === 'string') {
            try { deviceIds = JSON.parse(deviceIds); } catch (e) { deviceIds = []; }
        }

        // 3. Remove Old Device
        // Filter out the one to replace (matches ID)
        const initialLength = deviceIds.length;
        // Handle migration case just in case: if strings, convert first? 
        // We assume verify logic already handled migration or we handle mixed here.
        // Let's safe filter:
        deviceIds = deviceIds.filter((d: any) => {
            if (typeof d === 'string') return d !== oldDeviceIdToReplace;
            return d.id !== oldDeviceIdToReplace;
        });

        if (deviceIds.length === initialLength) {
            return NextResponse.json({ success: false, message: 'Old device not found' }, { status: 404 });
        }

        // 4. Add New Device
        const now = new Date().toISOString();
        const newDevice = {
            id: newDeviceId,
            name: body.deviceName || 'Replaced Device',
            last_seen: now
        };
        deviceIds.push(newDevice);

        // 5. Save
        await sql`UPDATE licenses SET device_ids = ${JSON.stringify(deviceIds)} WHERE id = ${license.id};`;

        return NextResponse.json({ success: true, message: 'Device replaced successfully' });

    } catch (error: any) {
        console.error("Replace Error:", error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
