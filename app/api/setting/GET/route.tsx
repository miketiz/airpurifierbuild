import { NextResponse } from "next/server";
import axios from "axios";

;;
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

        const response = await axios.get(`https://fastapi.mm-air.online/user/notification_get?user_id=${userId}`, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        console.log("GET API response:", response.data);
        
        // แปลงข้อมูลให้เป็นรูปแบบที่ frontend คาดหวัง
        const apiData = response.data.data;
        const transformedData = {
            userId: apiData.user_id,
            dustThreshold: Number(apiData.dust || 25),
            isEnabled: apiData.notification
        };
        
        return NextResponse.json(
            {
                success: true,
                message: "Notification settings retrieved successfully",
                data: transformedData,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error retrieving notification settings:", error);
        
        if (axios.isAxiosError(error)) {
            console.log("API error response:", error.response?.data);
            return NextResponse.json(
                {
                    error: "Failed to retrieve notification settings",
                    details: error.response?.data || error.message
                },
                { status: error.response?.status || 500 }
            );
        }
        
        return NextResponse.json(
            { error: "Failed to retrieve notification settings" },
            { status: 500 }
        );
    }
}