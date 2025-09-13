import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
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

        // ส่งคำขอไปยัง Backend API จริงโดยใช้ axios
        try {
            const apiResponse = await axios.post(
                'https://fastapi.mm-air.online/devices/controller_speed',
                body,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000, // เพิ่ม timeout 10 วินาที
                }
            );

            // axios จะส่ง data โดยตรง ไม่ต้องแปลง response เป็น json
            return NextResponse.json({ 
                success: true, 
                data: apiResponse.data 
            });

        } catch (apiError) {
            // การจัดการข้อผิดพลาดแบบ axios
            if (axios.isAxiosError(apiError)) {
                console.error(`Backend API error:`, {
                    status: apiError.response?.status,
                    statusText: apiError.response?.statusText,
                    data: apiError.response?.data
                });

                // ส่งข้อผิดพลาดกลับไปยังไคลเอ็นต์
                return NextResponse.json(
                    { 
                        success: false, 
                        message: 'Backend API error', 
                        error: apiError.response?.data || apiError.message 
                    },
                    { status: apiError.response?.status || 500 }
                );
            }
            
            // กรณีเป็นข้อผิดพลาดที่ไม่ใช่ axios error
            throw apiError;
        }

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