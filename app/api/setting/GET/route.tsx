import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

// เพิ่ม interfaces สำหรับ type safety
interface FastAPIResponse {
    status: number;
    message: string;
    data?: {
        user_id: number | string;
        dust: number | string;
        notification: boolean;
    };
}

interface ErrorResponse {
    message?: string;
    detail?: string;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({
                success: false,
                error: "userId parameter is required"
            }, { status: 400 });
        }

        console.log(`Fetching settings for user: ${userId}`);

        // ใช้ generic type สำหรับ axios response
        const response = await axios.get<FastAPIResponse>(
            `https://fastapi.mm-air.online/user/notification_get?user_id=${userId}`,
            {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log("FastAPI response:", response.data);

        // ตรวจสอบ response structure ตาม API ที่ให้มา
        if (response.data?.status === 1 && response.data?.data) {
            // แปลงข้อมูลให้ตรงกับ frontend
            const settings = {
                dustThreshold: parseInt(String(response.data.data.dust)) || 25,
                isEnabled: response.data.data.notification || false
            };

            return NextResponse.json({
                success: true,
                data: settings,
                message: response.data.message || "Settings retrieved successfully"
            });
        } else {
            // API ส่งกลับ status ไม่เป็น 1
            return NextResponse.json({
                success: false,
                data: null,
                error: "Invalid response from FastAPI",
                message: response.data?.message || "Unknown error"
            }, { status: 400 });
        }

    } catch (error) {
        console.error("Error retrieving notification settings:", error);

        // ใช้ type guard แทน any
        if (error instanceof AxiosError) {
            // จัดการ 404 - ไม่พบข้อมูลการตั้งค่า
            if (error.response?.status === 404) {
                return NextResponse.json({
                    success: false,
                    data: null,
                    error: "Settings not found for this user (404)",
                    message: "No settings configured yet"
                }, { status: 404 });
            }

            // จัดการ error อื่นๆ
            const statusCode = error.response?.status || 500;
            const errorData = error.response?.data as ErrorResponse;
            const errorMessage = errorData?.message || errorData?.detail || error.message || "Unknown error";

            return NextResponse.json({
                success: false,
                data: null,
                error: `Failed to retrieve settings: ${errorMessage}`,
                statusCode: statusCode
            }, { status: statusCode });
        }

        // จัดการ error ประเภทอื่น
        if (error instanceof Error) {
            return NextResponse.json({
                success: false,
                data: null,
                error: `Network error: ${error.message}`,
                statusCode: 500
            }, { status: 500 });
        }

        // Fallback สำหรับ error ที่ไม่ทราบประเภท
        return NextResponse.json({
            success: false,
            data: null,
            error: "An unknown error occurred",
            statusCode: 500
        }, { status: 500 });
    }
}