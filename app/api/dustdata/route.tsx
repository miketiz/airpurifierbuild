import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
    // อ่านค่า connection_key จาก query parameters
    const { searchParams } = new URL(request.url);
    const connectionKey = searchParams.get('connection_key');

    // เพิ่มการตั้งค่า Cache-Control
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    headers.set('Pragma', 'no-cache');

    // ถ้าไม่มี connection_key ส่งข้อมูลเป็น 0 ทั้งหมด
    if (!connectionKey) {
        console.log('ไม่พบ connection_key ในคำขอ');
        return NextResponse.json({
            success: true,
            data: { pm25: '0', temperature: '0', humidity: '0', timestamp: new Date().toISOString() }
        }, { headers });
    }

    try {
        console.log(`กำลังดึงข้อมูลล่าสุดสำหรับ connection_key: ${connectionKey}`);

        // แก้ไขการส่ง payload ไปยัง API - เพิ่มฟิลด์ที่จำเป็น
        const response = await axios.post(
            `https://fastapi.mm-air.online/devices/getdata?connection_key=${connectionKey}`,
            {},
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            }
        );

        const rawData = response.data;
        console.log('API Response (devices/getdata):', rawData);

        // เช็คว่าข้อมูลมีรูปแบบที่ถูกต้อง
        if (!rawData || rawData.status !== 1 || !rawData.data) {
            console.log(`ไม่มีข้อมูลฝุ่นสำหรับ connection_key: ${connectionKey} (ใช้ค่าเริ่มต้น)`);
            return NextResponse.json({
                success: true,
                data: {
                    pm25: '0',
                    temperature: '0',
                    humidity: '0',
                    timestamp: new Date().toISOString()
                }
            }, { headers });
        }

        // แปลงข้อมูลจากรูปแบบใหม่
        return NextResponse.json({
            success: true,
            data: {
                pm25: rawData.data.PM2?.toString() || '0',
                temperature: rawData.data.temperature?.toString() || '0',
                humidity: rawData.data.humidity?.toString() || '0',
                timestamp: rawData.data.time || rawData.latest_update_time || new Date().toISOString()
            }
        }, { headers });
    } catch (error: unknown) {
        // บันทึก response error ถ้ามี เพื่อการดีบัก
        if (axios.isAxiosError(error) && error.response) {
            if (error.response.status === 404) {
                console.log(`ไม่พบข้อมูลฝุ่นสำหรับ connection_key: ${connectionKey} (404 - ปกติ)`);
            } else {
                console.error('Error fetching dust data - Status:', error.response.status);
                console.log('Error response data:', error.response.data);
            }
        } else {
            console.error('Error fetching dust data (network/other):', error);
        }

        // กรณีเกิด error ใช้ข้อมูลเป็น 0
        const errorInfo = axios.isAxiosError(error) && error.response?.status === 422 
            ? "Device data not available" 
            : "Connection error";
            
        return NextResponse.json({
            success: true,
            data: {
                pm25: '0',
                temperature: '0',
                humidity: '0',
                timestamp: new Date().toISOString()
            },
            device_key: connectionKey,
            error_info: errorInfo
        }, { headers });
    }
}
