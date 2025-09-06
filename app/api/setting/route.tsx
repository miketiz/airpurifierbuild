import { NextResponse } from "next/server";
import axios from "axios";

;;
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, dustThreshold, isNotificationEnabled } = body;

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        console.log("Sending to API:", { userId, dustThreshold, isNotificationEnabled });

        // แก้ไขชื่อฟิลด์ให้ตรงกับที่ API ต้องการ
        const response = await axios.post('https://fastapi.mm-air.online/user/notification_post', {
            user_id: userId,                // ชื่อฟิลด์ตรงตาม API
            dust: String(dustThreshold),    // เปลี่ยนเป็น dust และแปลงเป็น string ตาม API spec
            notification: isNotificationEnabled  // เปลี่ยนเป็น notification ตาม API spec
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        console.log("API response:", response.data);

        return NextResponse.json(
            {
                success: true,
                message: "Notification settings updated successfully",
                data: response.data,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating notification settings:", error);

        if (axios.isAxiosError(error)) {
            console.log("API error response:", error.response?.data);
            return NextResponse.json(
                {
                    error: "Failed to update notification settings",
                    details: error.response?.data || error.message
                },
                { status: error.response?.status || 500 }
            );
        }

        return NextResponse.json(
            { error: "Failed to update notification settings" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        console.log("Fetching settings for userId:", userId);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}