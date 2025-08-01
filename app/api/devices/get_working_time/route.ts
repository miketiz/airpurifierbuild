import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // อ่านค่า connection_key และ user_id จาก query parameters
    const searchParams = request.nextUrl.searchParams;
    const connectionKey = searchParams.get('connection_key');
    const userId = searchParams.get('user_id');

    if (!connectionKey || !userId) {
      return NextResponse.json(
        { success: false, message: 'connection_key and user_id are required' },
        { status: 400 }
      );
    }

    try {
      // เรียก API backend
      const url = `https://fastapi.mm-air.online/devices/get_working_time?connection_key=${connectionKey}&user_id=${userId}`;

      console.log('เรียก API get_working_time:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        // ถ้าเป็น 404 แสดงว่าอุปกรณ์ไม่มีข้อมูล working time ตั้งค่าไว้ (เป็นเรื่องปกติ)
        if (response.status === 404) {
          console.log(`ไม่พบข้อมูล working time สำหรับ connection_key: ${connectionKey} (404 - ปกติ)`);
          throw new Error('No working time data found');
        }
        throw new Error(`Backend API responded with ${response.status}`);
      }

      const responseData = await response.json();
      console.log('API Response get_working_time:', responseData);

      if (responseData.status === "1" && responseData.data) {
        return NextResponse.json({
          success: true,
          data: responseData.data
        });
      } else {
        throw new Error('Invalid response format from backend');
      }

    } catch {
      console.log('ใช้ข้อมูลเริ่มต้นสำหรับ working time ของ connection_key:', connectionKey);

      // กรณีไม่สามารถเชื่อมต่อ Backend ได้หรือไม่มีข้อมูล ส่งข้อมูลเริ่มต้นกลับไป
      return NextResponse.json({
        success: true,
        data: {
          user_id: Number(userId),
          connection_key: connectionKey,
          switch_mode: false,
          start_time: "08:00",
          stop_time: "18:00",
          sunday: false,
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          time_mode: 2 // medium
        }
      });
    }

  } catch (error: unknown) {
    console.error('Error in get_working_time API route:', error);

    // เพิ่ม type checking สำหรับ unknown
    const message = error instanceof Error ? error.message : 'Internal Server Error';

    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}