import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const connectionKey = searchParams.get('connection_key');

        if (!connectionKey) {
            return NextResponse.json({
                success: false,
                message: "Connection key is required"
            }, { status: 400 });
        }

        try {
            // ใช้ connection_key โดยตรง
            const apiUrl = `https://fastapi.mm-air.online/filter/check?connection_key=${connectionKey}`;
            console.log("Calling API:", apiUrl);
            
            const response = await axios.get(apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            // แสดงข้อมูล response
            console.log("=== FULL API RESPONSE ===");
            console.log(JSON.stringify(response.data, null, 2));
            console.log("=== END RESPONSE ===");
            
            // ตรวจสอบข้อมูลที่ได้รับจาก API
            const deviceData = response.data;
            
            if (deviceData.status === 1 && deviceData.data) {
                return NextResponse.json({
                    success: true,
                    data: {
                        status: deviceData.data.clogged ? "abnormal" : "normal",
                        message: deviceData.message || "success",
                        suggestion: deviceData.data.suggestion || (deviceData.data.clogged ? "⚠️ ควรเปลี่ยนไส้กรองใหม่" : "✅ กรองยังใช้งานได้ปกติ"),
                        lastChecked: new Date().toISOString(),
                        baseline: deviceData.data.baseline || 0,
                        currentNow: deviceData.data.current_now || 0,
                        deltaPercent: deviceData.data.delta_percent || 0,
                        clogged: deviceData.data.clogged || false
                    }
                });
            } else {
                return NextResponse.json({
                    success: true,
                    data: {
                        status: "unknown",
                        lastChecked: new Date().toISOString(),
                        message: deviceData.message || "ไม่มีข้อมูลเพียงพอ"
                    }
                });
            }
        } catch (error) {
            console.error("Error fetching filter status from backend:", error);
            
            if (axios.isAxiosError(error)) {
                const axiosError = error;
                
                if (axiosError.response) {
                    console.error("Axios error details:", {
                        status: axiosError.response.status,
                        statusText: axiosError.response.statusText,
                        url: axiosError.config?.url
                    });
                }
            }
            
            // ส่งข้อมูล mock data แทน
            const mockStatus = Math.random() > 0.7 ? "abnormal" : "normal";
            console.log(`Returning mock data for device ${connectionKey} with status ${mockStatus}`);
            
            return NextResponse.json({
                success: true,
                data: {
                    status: mockStatus,
                    message: mockStatus === "abnormal" ? "ไส้กรองผิดปกติ" : "ไส้กรองปกติ",
                    suggestion: mockStatus === "abnormal" ? "⚠️ ควรเปลี่ยนไส้กรองใหม่" : "✅ กรองยังใช้งานได้ปกติ",
                    lastChecked: new Date().toISOString(),
                    baseline: 0.4 + Math.random() * 0.1,
                    currentNow: 0.5 + Math.random() * 0.1,
                    deltaPercent: -1 * (20 + Math.random() * 10),
                    clogged: mockStatus === "abnormal",
                    note: "Mock data - API connection failed"
                }
            });
        }
    } catch (error) {
        console.error("Error in filter status API route:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to fetch filter status",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}