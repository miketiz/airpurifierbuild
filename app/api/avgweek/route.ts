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
        // สร้าง URL พร้อมพารามิเตอร์ที่จำเป็น
        let apiUrl = `https://fastapi.mm-air.online/avg/week?mac_id=${macId}`;
        
        // ส่งพารามิเตอร์ตามที่เลือก
        if (startDate && endDate) {
            // กรณีเลือก custom range
            apiUrl += `&start_date=${startDate}&end_date=${endDate}`;
            console.log(`API call with custom range: ${startDate} to ${endDate}`);
        } else {
            // กรณีเลือกจากประเภท 7วัน, 14วัน, 30วัน
            apiUrl += `&days=${days}`;
            console.log(`API call with days: ${days}`);
        }

        console.log(`Calling external API: ${apiUrl}`);
        
        // เพิ่ม timeout และ retry
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
        console.log('API response:', JSON.stringify(result).substring(0, 200) + '...');
        
        // Adapt to the actual response format from the external API
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
        const tzOffset = parseInt(searchParams.get('tz_offset') || '0');
        
        if (!macId) {
            return NextResponse.json({
                status: 0,
                message: "mac_id parameter is required",
                data: []
            }, { status: 400 });
        }

        console.log(`API request received: mac_id=${macId}, days=${days}, start_date=${startDate}, end_date=${endDate}, timezone_offset=${tzOffset}`);
        
        // เรียกข้อมูลจาก API
        const data = await fetchWeeklyAverageFromInfluxDB(macId, days, startDate, endDate);
        
        // แปลงเวลาตาม timezone ของผู้ใช้
        const adjustedData = data.map(item => {
            // แปลงวันที่ตาม timezone ของผู้ใช้
            const originalDate = new Date(item.time);
            
            // สร้างวันที่ที่ปรับตาม timezone แล้ว (เนื่องจาก API ส่งเวลา UTC มา)
            const localDate = new Date(originalDate.getTime() - (tzOffset * 60 * 1000));
            
            // log เพื่อ debug
            console.log(`Converting date: ${item.time} => ${localDate.toISOString()}`);
            
            return {
                ...item,
                time: localDate.toISOString(),
                original_time: item.time // เก็บเวลาดั้งเดิมไว้ด้วยเผื่อต้องใช้
            };
        });

        return NextResponse.json({
            status: 1,
            message: "success",
            data: adjustedData
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