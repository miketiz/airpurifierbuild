import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // อ่านข้อมูลจาก request
        const body = await request.json();
        console.log('กำลังส่งคำสั่งควบคุมความเร็วไปยัง backend:', body);

        // ตรวจสอบข้อมูล
        if (body.mode === undefined || typeof body.mode !== 'number') {
            return NextResponse.json(
                { success: false, message: 'Mode must be a number between 0-5' },
                { status: 422 }
            );
        }

        // ส่งคำขอไปยัง Backend API จริง
        const apiResponse = await fetch('https://fastapi.mm-air.online/devices/controller_speed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        // ตรวจสอบการตอบกลับ
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error(`Backend API responded with ${apiResponse.status}: ${errorText}`);
            return NextResponse.json(
                { success: false, message: 'Backend API error', error: errorText },
                { status: apiResponse.status }
            );
        }

        // ส่งการตอบกลับจาก Backend ไปยังไคลเอ็นต์
        const data = await apiResponse.json();
        return NextResponse.json({ success: true, data });

    } catch (error: unknown) {
        console.error('Error in API route:', error);

        // Type guard เพื่อตรวจสอบว่าเป็น Error object
        const message = error instanceof Error ? error.message : 'Internal Server Error';

        return NextResponse.json(
            { success: false, message },
            { status: 500 }
        );
    }
}