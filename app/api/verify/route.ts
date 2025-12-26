import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { key, deviceId } = body;

        if (!key || !deviceId) {
            return NextResponse.json({ success: false, message: 'Missing key or deviceId' }, { status: 400 });
        }

        // 1. Find License
        const result = await sql`SELECT * FROM licenses WHERE key = ${key} LIMIT 1;`;
        if (result.rowCount === 0) {
            return NextResponse.json({ success: false, message: 'Invalid License Key' }, { status: 404 });
        }

        const license = result.rows[0];

        // 2. Check Status & Expiry
        if (license.status !== 'active') {
            return NextResponse.json({ success: false, message: 'License is inactive' }, { status: 403 });
        }

        if (license.type === 'monthly' && license.expires_at) {
            const expiry = new Date(license.expires_at);
            if (new Date() > expiry) {
                return NextResponse.json({ success: false, message: 'License Expired' }, { status: 403 });
            }
        }

        // 3. Device Logic (The 2-Device Limit)
        let deviceIds: any[] = license.device_ids || [];

        // Ensure it's an array (Postgres JSONB handling)
        if (typeof deviceIds === 'string') {
            try { deviceIds = JSON.parse(deviceIds); } catch (e) { deviceIds = []; }
        }

        // --- MIGRATION: Convert String[] to Object[] ---
        // If the first element is a string, assume all are strings and migrate.
        if (deviceIds.length > 0 && typeof deviceIds[0] === 'string') {
            deviceIds = deviceIds.map(id => ({
                id: id,
                name: 'Unknown Device',
                last_seen: new Date().toISOString()
            }));
            // Save migration immediately? Or wait for update? 
            // Better to wait for update loop to save writes, but for safety lets assuming we update later.
        }

        // Find current device in list
        const existingDeviceIndex = deviceIds.findIndex((d: any) => d.id === deviceId);
        const now = new Date().toISOString();

        if (existingDeviceIndex !== -1) {
            // ALREADY REGISTERED -> UPDATE Last Seen
            deviceIds[existingDeviceIndex].last_seen = now;
            // Also update name if provided (optional)
            if (body.deviceName) deviceIds[existingDeviceIndex].name = body.deviceName;

            await sql`UPDATE licenses SET device_ids = ${JSON.stringify(deviceIds)} WHERE id = ${license.id};`;

            return NextResponse.json({
                success: true,
                info: {
                    key: license.key,
                    type: license.type,
                    status: 'active',
                    expiryDate: license.expires_at,
                    deviceId: deviceId
                }
            });
        } else {
            // NEW DEVICE
            if (deviceIds.length >= 2) {
                // Return Limit Reached with Current Devices (for Selection UI)
                return NextResponse.json({
                    success: false,
                    message: 'Maximum device limit (2) reached.',
                    code: 'LIMIT_REACHED',
                    currentDevices: deviceIds // Return list for selection
                }, { status: 403 });
            }

            // ADD DEVICE
            const newDevice = {
                id: deviceId,
                name: body.deviceName || 'New Device',
                last_seen: now
            };
            deviceIds.push(newDevice);
            await sql`UPDATE licenses SET device_ids = ${JSON.stringify(deviceIds)} WHERE id = ${license.id};`;

            return NextResponse.json({
                success: true,
                info: {
                    key: license.key,
                    type: license.type,
                    status: 'active',
                    expiryDate: license.expires_at,
                    deviceId: deviceId
                }
            });
        }

    } catch (error: any) {
        console.error("Verify Error:", error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
