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
    startDate?: string,
    endDate?: string
): Promise<WeeklyAverageDataItem[]> {
    try {
        // สร้าง URL พร้อมพารามิเตอร์ที่จำเป็น
        let apiUrl = `https://fastapi.mm-air.online/avg/week?mac_id=${macId}`;
        
        // ถ้ามีการระบุจำนวนวัน
        if (days !== 7) {
            apiUrl += `&days=${days}`;
        }
        
        // ถ้ามีการระบุวันเริ่มต้นและวันสิ้นสุด (กรณีเลือกช่วงเวลาเอง)
        if (startDate && endDate) {
            apiUrl += `&start_date=${startDate}&end_date=${endDate}`;
        }
        
        console.log(`Calling API: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'NextJS-Dashboard/1.0'
            },
            signal: AbortSignal.timeout(15000) // เพิ่มเวลา timeout
        });

        if (!response.ok) {
            throw new Error(`External API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
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
        
        if (!macId) {
            return NextResponse.json({
                status: 0,
                message: "mac_id parameter is required",
                data: []
            }, { status: 400 });
        }

        const data = await fetchWeeklyAverageFromInfluxDB(macId, days, startDate || undefined, endDate || undefined);

        return NextResponse.json({
            status: 1,
            message: "success",
            data: data
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