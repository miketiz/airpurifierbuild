import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // อ่านค่า connection_key และ user_id จาก query params
    const searchParams = request.nextUrl.searchParams;
    const connectionKey = searchParams.get('connection_key');
    const userId = searchParams.get('user_id');
    
    if (!connectionKey) {
      return NextResponse.json(
        { success: false, message: 'connection_key is required' },
        { status: 400 }
      );
    }
    
    try {
      // เรียกใช้ API ที่ถูกต้อง get_controller_speed แทน status
      const url = `https://fastapi.mm-air.online/devices/get_controller_speed?connection_key=${connectionKey}&user_id=${userId || 1}`;
      
      console.log('เรียก API:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // ตั้ง timeout 5 วินาที
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        // ถ้าเป็น 404 แสดงว่าอุปกรณ์ไม่ได้เชื่อมต่อหรือไม่มีข้อมูลสถานะ (เป็นเรื่องปกติ)
        if (response.status === 404) {
          console.log(`ไม่พบข้อมูลสถานะสำหรับ connection_key: ${connectionKey} (404 - ปกติ)`);
          throw new Error('No device status data found');
        }
        throw new Error(`Backend API responded with ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('API Response:', responseData);
      
      if (responseData.status === 1 && responseData.data) {
        // ส่งข้อมูลกลับไปในรูปแบบที่ frontend ต้องการ
        return NextResponse.json({ 
          success: true, 
          data: {
            connection_key: responseData.data.connection_key,
            mode: responseData.data.mode,
            speedrpm: responseData.data.speedrpm,
            power: responseData.data.mode !== 0, // ถ้า mode ไม่เป็น 0 แสดงว่าเปิดอยู่
            is_active: responseData.data.is_active,
          }
        });
      } else {
        throw new Error('Invalid response format from backend');
      }
      
    } catch  {
      console.log('ใช้ข้อมูลเริ่มต้นสำหรับสถานะของ connection_key:', connectionKey);
      
      // กรณีไม่สามารถเชื่อมต่อ Backend ได้หรือไม่มีข้อมูล ส่งข้อมูลเริ่มต้นกลับไป
      return NextResponse.json({ 
        success: true, 
        data: {
          connection_key: connectionKey,
          mode: 2, // default to medium
          speedrpm: 100,
          power: true,
          timestamp: new Date().toISOString(),
          is_active: false
        } 
      });
    }
    
  } catch (error: unknown) {
    console.error('Error in status API route:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
        { success: false, message }, // ใช้ message variable ที่สร้างไว้
        { status: 500 }
    );
}
}