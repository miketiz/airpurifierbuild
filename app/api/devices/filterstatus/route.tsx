import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('device_id');

        if (!deviceId) {
            return NextResponse.json({
                success: false,
                message: "Device ID is required"
            }, { status: 400 });
        }

        try {
            // เรียกใช้ API จาก backend เพื่อดึงข้อมูลสถานะไส้กรอง
            const response = await axios.get(`https://fastapi.mm-air.online/device/filterstatus/${deviceId}`);
            
            // ตรวจสอบข้อมูลที่ได้รับจาก backend
            if (response.data) {
                // แปลงข้อมูลจาก backend ให้เป็นรูปแบบที่ต้องการ (normal/abnormal)
                const filterStatus = response.data.status === "normal" ? "normal" : "abnormal";
                
                return NextResponse.json({
                    success: true,
                    data: {
                        status: filterStatus,
                        lastChecked: response.data.last_checked || new Date().toISOString()
                    }
                });
            } else {
                throw new Error("Invalid response data");
            }
        } catch (error) {
            console.error("Error fetching filter status from backend:", error);
            
            // กรณีที่ยังไม่มี API จริง หรือการเชื่อมต่อล้มเหลว
            // สามารถ mock ข้อมูลโดยใช้ device_id เพื่อกำหนดสถานะ
            // ในโปรดักชันควรลบส่วนนี้ออกและใช้ API จริงเท่านั้น
            
            // ใช้ digit สุดท้ายของ deviceId เพื่อกำหนดสถานะ (เพื่อการทดสอบ)
            const lastChar = deviceId.slice(-1);
            const lastDigit = parseInt(lastChar);
            
            // ถ้าตัวเลขสุดท้ายเป็นเลขคู่ให้เป็น normal ถ้าเป็นเลขคี่ให้เป็น abnormal
            const mockStatus = isNaN(lastDigit) || lastDigit % 2 === 0 ? "normal" : "abnormal";
            
            return NextResponse.json({
                success: true,
                data: {
                    status: mockStatus,
                    lastChecked: new Date().toISOString(),
                    note: "Mock data - in production, use actual API"
                }
            });
        }
    } catch (error) {
        console.error("Error in filter status API route:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to fetch filter status",
            error: String(error)
        }, { status: 500 });
    }
}