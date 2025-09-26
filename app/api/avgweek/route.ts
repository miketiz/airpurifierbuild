import { NextRequest, NextResponse } from "next/server";

type WeeklyAverageDataItem = {
    time: string;
    temperature: number | null;
    humidity: number | null;
    PM1: number | null;
    PM2: number | null;
    PM10: number | null;
};

async function fetchWeeklyAverageFromInfluxDB(
    macId: string,
    days: number = 7,
    startDate?: string | null,
    endDate?: string | null
): Promise<WeeklyAverageDataItem[]> {
    try {
        // สร้าง URL พร้อมพารามิเตอร์ที่จำเป็น (ไม่ส่งข้อมูลเวลา)
        let apiUrl = `https://fastapi.mm-air.online/avg/day?mac_id=${macId}`;
        
        // ส่งเฉพาะพารามิเตอร์ที่จำเป็น ไม่ส่งข้อมูล timezone
        if (startDate && endDate) {
            // กรณีเลือก custom range - ส่งเฉพาะวันที่
            const cleanStartDate = startDate.split('T')[0]; // เอาเฉพาะ YYYY-MM-DD
            const cleanEndDate = endDate.split('T')[0];     // เอาเฉพาะ YYYY-MM-DD
            
            apiUrl += `&start_date=${cleanStartDate}&end_date=${cleanEndDate}`;
            console.log(`API call with custom date range: ${cleanStartDate} to ${cleanEndDate}`);
        } else {
            // กรณีเลือกจากประเภท 7วัน, 14วัน, 30วัน
            apiUrl += `&days=${days}`;
            console.log(`API call with days: ${days}`);
        }

        console.log(`Calling external API: ${apiUrl}`);
        
        // เรียก API โดยไม่ส่งข้อมูลเวลา
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'NextJS-Dashboard/1.0'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`API error: ${response.status} ${response.statusText}`);
            throw new Error(`External API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('API response received:', {
            status: result.status,
            dataLength: Array.isArray(result.data) ? result.data.length : 0,
            firstItem: result.data?.[0] ? {
                time: result.data[0].time,
                PM2: result.data[0].PM2
            } : null
        });
        
        // รับข้อมูลจาก API โดยไม่ปรับเวลา - ให้ FastAPI จัดการเอง
        if (result.status === 1 && Array.isArray(result.data)) {
            return result.data;
        } else if (Array.isArray(result)) {
            return result;
        } else {
            console.warn('Unexpected response format:', result);
            throw new Error('Invalid response format from external API');
        }

    } catch (error) {
        console.error('Error fetching data from external API:', error);
        throw error;
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const macId = searchParams.get('mac_id');
        const days = parseInt(searchParams.get('days') || '7');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        
        // ลบการใช้ tzOffset เนื่องจากไม่ต้องส่งไปที่ FastAPI
        // const tzOffset = parseInt(searchParams.get('tz_offset') || '0');
        
        if (!macId) {
            return NextResponse.json({
                status: 0,
                message: "mac_id parameter is required",
                data: []
            }, { status: 400 });
        }

        console.log(`API request received: mac_id=${macId}, days=${days}, start_date=${startDate}, end_date=${endDate}`);
        
        // เรียกข้อมูลจาก FastAPI โดยไม่ส่งข้อมูลเวลา
        const data = await fetchWeeklyAverageFromInfluxDB(macId, days, startDate, endDate);
        
        // ส่งข้อมูลกลับไปโดยไม่ปรับเวลา - ใช้ข้อมูลจาก FastAPI ตรงๆ
        return NextResponse.json({
            status: 1,
            message: "success",
            data: data, // ใช้ข้อมูลจาก FastAPI โดยตรงไม่ปรับแต่ง
            total_records: data.length,
            mac_id: macId,
            ...(startDate && endDate && {
                date_range: {
                    start: startDate.split('T')[0],
                    end: endDate.split('T')[0]
                }
            }),
            ...(!startDate && !endDate && {
                days_requested: days
            })
        });
    } catch (error) {
        console.error('Error in weekly average API:', error);
        return NextResponse.json({
            status: 0,
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            data: []
        }, { status: 500 });
    }
}