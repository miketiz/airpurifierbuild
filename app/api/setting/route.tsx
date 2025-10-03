import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";

// เพิ่ม interfaces
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, dustThreshold, isNotificationEnabled } = body;

        if (!userId || dustThreshold === undefined || isNotificationEnabled === undefined) {
            return NextResponse.json({
                success: false,
                error: "Missing required parameters"
            }, { status: 400 });
        }

        console.log("Saving settings:", { userId, dustThreshold, isNotificationEnabled });

        // ใช้ generic type สำหรับ axios
        const response = await axios.post<FastAPIResponse>(
            'https://fastapi.mm-air.online/user/notification_post',
            {
                user_id: String(userId),
                dust: String(dustThreshold),
                notification: isNotificationEnabled
            },
            {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log("FastAPI save response:", response.data);

        if (response.data?.status === 1) {
            return NextResponse.json({
                success: true,
                message: response.data.message || "Settings saved successfully",
                data: {
                    userId: userId,
                    dustThreshold,
                    isNotificationEnabled
                }
            });
        } else {
            return NextResponse.json({
                success: false,
                error: "Failed to save settings",
                message: response.data?.message || "Unknown error"
            }, { status: 400 });
        }

    } catch (error) {
        console.error("Error saving notification settings:", error);

        // ใช้ type guard แทน any
        if (error instanceof AxiosError) {
            const statusCode = error.response?.status || 500;
            const errorData = error.response?.data as ErrorResponse;
            const errorMessage = errorData?.message || errorData?.detail || error.message || "Unknown error";

            return NextResponse.json({
                success: false,
                error: `Failed to save settings: ${errorMessage}`,
                statusCode: statusCode
            }, { status: statusCode });
        }

        if (error instanceof Error) {
            return NextResponse.json({
                success: false,
                error: `Network error: ${error.message}`,
                statusCode: 500
            }, { status: 500 });
        }

        return NextResponse.json({
            success: false,
            error: "An unknown error occurred",
            statusCode: 500
        }, { status: 500 });
    }
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

        if (response.data?.status === 1 && response.data?.data) {
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
            return NextResponse.json({
                success: false,
                data: null,
                error: "Invalid response from FastAPI",
                message: response.data?.message || "Unknown error"
            }, { status: 400 });
        }

    } catch (error) {
        console.error("Error retrieving notification settings:", error);

        if (error instanceof AxiosError) {
            if (error.response?.status === 404) {
                return NextResponse.json({
                    success: false,
                    data: null,
                    error: "Settings not found for this user (404)",
                    message: "No settings configured yet"
                }, { status: 404 });
            }

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

        if (error instanceof Error) {
            return NextResponse.json({
                success: false,
                data: null,
                error: `Network error: ${error.message}`,
                statusCode: 500
            }, { status: 500 });
        }

        return NextResponse.json({
            success: false,
            data: null,
            error: "An unknown error occurred",
            statusCode: 500
        }, { status: 500 });
    }
}