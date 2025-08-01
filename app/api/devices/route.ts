import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { deviceManagementApi } from "@/app/lib/deviceApi";

const BASE_URL = "https://fastapi.mm-air.online/";

// GET: ดึง device ตาม user_id
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const user_id = searchParams.get("user_id");
        if (!user_id) {
            return NextResponse.json({ success: false, message: "Missing user_id" }, { status: 400 });
        }

        // ใช้ deviceManagementApi แทนการเรียก axios โดยตรง
        const result = await deviceManagementApi.getDevices(user_id);
        
        if (result.success) {
            console.log("API /devices/get_device response:", result.data);
            return NextResponse.json({ success: true, data: result.data });
        } else {
            console.error("API error:", result.message);
            return NextResponse.json({ success: false, message: result.message }, { status: 500 });
        }
    } catch (err) {
        console.error("Unexpected error:", err);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}

// PATCH: อัปเดตชื่อหรือที่ตั้ง device
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    console.log("API session", session);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { connection_key, device_name, location } = body;
    if (!connection_key) {
        return NextResponse.json({ success: false, message: "Missing connection_key" }, { status: 400 });
    }
    const user_id = session.user.id;
    console.log("PATCH payload", { user_id, connection_key, device_name, location }); // เพิ่ม log ตรงนี้
    try {
        const res = await axios.patch(`${BASE_URL}/devices/update_device`, {
            user_id,
            connection_key,
            device_name,
            location
        });
        return NextResponse.json({ success: true, data: res.data });
    } catch (err) {
        // แก้ไขการจัดการ error โดยไม่ใช้ any type
        console.error("API error", err);
        return NextResponse.json({ success: false, message: "API error" }, { status: 500 });
    }
}