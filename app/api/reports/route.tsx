import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
    
    // รับ mac_id จาก query parameter
    const { searchParams } = new URL(request.url);
    const macId = searchParams.get('mac_id') || '';

    try {
        // ส่ง mac_id ไปยัง API อย่างถูกต้อง
        const response = await axios.get(`https://fastapi.mm-air.online/avg/week?mac_id=${macId}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000
        });

        if (response.status !== 200) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const rawData = response.data;
        if (!rawData.data || rawData.status !== 1) {
            return NextResponse.json({
                success: true,
                data: getMockData()
            });
        }

        // ดึงข้อมูลจาก array
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const values: number[] = [];
        const labels: string[] = [];

        rawData.data.forEach((item: { time: string; PM2: number }) => {
            const dateObj = new Date(item.time);
            labels.push(`${days[dateObj.getDay()]} ${dateObj.getDate()}/${dateObj.getMonth() + 1}`);
            values.push(item.PM2); // หรือเปลี่ยนเป็น field ที่ต้องการ
        });

        const average = values.length > 0
            ? (values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(1)
            : "0.0";

        const formattedData = {
            labels: labels,
            values: values,
            average: average
        };

        return NextResponse.json({
            success: true,
            data: formattedData
        });

    } catch (error) {
        console.error('Error fetching weekly data:', error);
        return NextResponse.json({
            success: true,
            data: getMockData()
        });
    }
}

// ฟังก์ชันสร้างข้อมูลตัวอย่างเมื่อไม่สามารถเชื่อมต่อกับ API ได้
function getMockData() {
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const labels = [];
    const values = [];
    
    // สร้างข้อมูลย้อนหลัง 7 วัน
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(`${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`);
        // สร้างค่าสุ่มระหว่าง 10-50
        values.push(Math.floor(Math.random() * 40) + 10);
    }
    
    // คำนวณค่าเฉลี่ย
    const average = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
    
    return {
        labels: labels,
        values: values,
        average: average
    };
}