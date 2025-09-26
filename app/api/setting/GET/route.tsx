import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: 'Missing userId parameter',
                    data: null 
                }, 
                { status: 400 }
            );
        }

        console.log(`Fetching settings for user: ${userId}`);

        const response = await axios.get(
            `https://fastapi.mm-air.online/notification/setting/${userId}`,
            {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log("GET API response:", response.data);

        // ตรวจสอบ status code จาก FastAPI
        if (response.data.status === 0) {
            // ผู้ใช้ไม่พบ - ส่งค่าเริ่มต้น
            console.log("User not found, returning default settings");
            return NextResponse.json({
                success: true,
                message: 'User not found, using default settings',
                data: {
                    userId: parseInt(userId),
                    dustThreshold: 25, // ค่าเริ่มต้น
                    isEnabled: false   // ค่าเริ่มต้น
                },
                isDefault: true // แฟล็กบอกว่าเป็นค่าเริ่มต้น
            });
        }

        // ผู้ใช้พบ - แปลงข้อมูล
        if (response.data.status === 1 && response.data.data) {
            const apiData = response.data.data;
            const transformedData = {
                userId: apiData.user_id,
                dustThreshold: Number(apiData.dust) || 25,
                isEnabled: Boolean(apiData.notification)
            };

            return NextResponse.json({
                success: true,
                message: 'Settings retrieved successfully',
                data: transformedData,
                isDefault: false
            });
        }

        // กรณีอื่นๆ ที่ไม่คาดคิด
        console.warn("Unexpected API response structure:", response.data);
        return NextResponse.json({
            success: true,
            message: 'Unexpected response, using default settings',
            data: {
                userId: parseInt(userId),
                dustThreshold: 25,
                isEnabled: false
            },
            isDefault: true
        });

    } catch (error) {
        console.error("Error retrieving notification settings:", error);

        // ส่งค่าเริ่มต้นแทนการ error
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        return NextResponse.json({
            success: true,
            message: 'Error occurred, using default settings',
            data: {
                userId: userId ? parseInt(userId) : 1,
                dustThreshold: 25,
                isEnabled: false
            },
            isDefault: true,
            error: process.env.NODE_ENV === 'development' ? 
                (error instanceof Error ? error.message : String(error)) : 
                undefined
        });
    }
}