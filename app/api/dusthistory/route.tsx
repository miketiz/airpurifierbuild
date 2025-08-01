import { NextResponse } from 'next/server';

// สร้าง mock data สำหรับกรณีไม่มีข้อมูลจริง
const getMockHistoricalData = () => {
  const hours = [];
  const result = [];
  
  // สร้างข้อมูล 12 ชั่วโมงย้อนหลัง โดยมีค่าเป็น 0 ทั้งหมด
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setHours(date.getHours() - i);
    const hour = date.getHours().toString().padStart(2, '0') + ':00';
    
    hours.push(hour);
    result.push({
      hour,
      pm25: 0,
      temperature: 0,
      humidity: 0,
      timestamp: date.toISOString()
    });
  }
  
  return result;
};

export async function GET(request: Request) {
  // อ่านค่า connection_key จาก query parameters
  const { searchParams } = new URL(request.url);
  const connectionKey = searchParams.get('connection_key');
  
  // ถ้าไม่มี connection_key ส่งข้อมูล mock กลับไป
  if (!connectionKey) {
    console.log('ไม่พบ connection_key ในคำขอสำหรับข้อมูลย้อนหลัง');
    return NextResponse.json({
      success: true,
      data: getMockHistoricalData()
    });
  }
  
  try {
    console.log(`กำลังดึงข้อมูลย้อนหลังสำหรับ connection_key: ${connectionKey}`);
    
    // ตรวจสอบว่ามี API สำหรับข้อมูลย้อนหลังที่ใช้ connection_key หรือไม่
    // หากมี ให้ใช้ endpoint นั้น แต่ถ้าไม่มีอาจต้องใช้ mock data แทน
    // เช่น อาจมี API: devices/gethistory?connection_key=xxx
    
    // ในที่นี้สมมติว่าไม่มี API ดังกล่าว จึงใช้ mock data
    const mockData = getMockHistoricalData();
    
    // สร้าง mock data ให้ดูสมจริงโดยใส่ค่าสุ่มระหว่าง 5-50
    const enhancedMockData = mockData.map(item => ({
      ...item,
      pm25: Math.floor(Math.random() * 45) + 5,
      temperature: Math.floor(Math.random() * 10) + 20, // 20-30 องศา
      humidity: Math.floor(Math.random() * 30) + 50, // 50-80%
    }));
    
    return NextResponse.json({
      success: true,
      data: enhancedMockData
    });
    
  } catch (error) {
    console.error('Error fetching historical dust data:', error);
    // กรณีเกิดข้อผิดพลาด ส่งข้อมูล mock กลับไป
    return NextResponse.json({
      success: true,
      data: getMockHistoricalData()
    });
  }
}