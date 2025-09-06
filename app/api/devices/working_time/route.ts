import { NextRequest, NextResponse } from 'next/server';

;;
// เพิ่ม GET handler
export async function GET(request: NextRequest) {
  try {
    // อ่านค่า connection_key และ user_id จาก query params
    const searchParams = request.nextUrl.searchParams;
    const connectionKey = searchParams.get('connection_key');
    const userId = searchParams.get('user_id');
    
    if (!connectionKey || !userId) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters: connection_key and user_id' },
        { status: 400 }
      );
    }
    
    try {
      // เรียกใช้ API backend จริง
      const response = await fetch(`https://fastapi.mm-air.online/devices/working_time?connection_key=${connectionKey}&user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // timeout 5 วินาที
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Backend API responded with ${response.status}: ${errorText}`);
        throw new Error(`Backend API responded with ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      return NextResponse.json({ success: true, data });
      
    } catch (error) {
      console.error('Error connecting to real backend, using mock data instead:', error);
      
      // ถ้าไม่สามารถเชื่อมต่อ backend ได้ ส่งข้อมูลจำลอง
      return NextResponse.json({
        success: true,
        data: {
          connection_key: connectionKey,
          switch_mode: false, // ค่าเริ่มต้นคือปิด
          start_time: "08:00",
          stop_time: "18:00",
          sunday: false,
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          time_mode: 2 // medium speed
        }
      });
    }
    
  } catch (error: unknown) {
    console.error('Error in working_time GET API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

// POST handler ที่มีอยู่แล้ว
export async function POST(request: NextRequest) {
  try {
    // อ่านข้อมูลจาก request
    const body = await request.json();
    console.log('กำลังส่งคำสั่งตั้งเวลาไปยัง backend:', body);
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!body.user_id || !body.connection_key) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: user_id and connection_key' },
        { status: 400 }
      );
    }
    
    try {
      // ส่งคำขอไปยัง Backend API
      const response = await fetch('https://fastapi.mm-air.online/devices/working_time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000) // timeout 5 วินาที
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Backend API responded with ${response.status}: ${errorText}`);
        return NextResponse.json(
          { success: false, message: 'Backend API error', error: errorText },
          { status: response.status }
        );
      }
      
      // ส่งการตอบกลับจาก Backend ไปยังไคลเอ็นต์
      const data = await response.json();
      return NextResponse.json({ success: true, data });
      
    } catch (error: unknown) {
      console.error('Error connecting to backend API:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return NextResponse.json(
        { success: false, message: 'Failed to connect to backend API', error: errorMessage },
        { status: 500 }
      );
    }
    
  } catch (error: unknown) {
    console.error('Error in working_time API route:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}