import { NextRequest, NextResponse } from "next/server";

type WeeklyAverageDataItem = {
    time: string;
    temperature: number | null;
    humidity: number | null;
    PM1: number | null;
    PM2: number | null;
    PM10: number | null;
};

async function fetchWeeklyAverageFromInfluxDB(macId: string): Promise<WeeklyAverageDataItem[]> {
    try {
        // ลองใช้ fetch แทน axios และเพิ่ม headers เพิ่มเติม
        const response = await fetch(`https://fastapi.mm-air.online/avg/week?mac_id=${macId}`, {
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
        
        if (!macId) {
            return NextResponse.json({
                status: 0,
                message: "mac_id parameter is required",
                data: []
            }, { status: 400 });
        }

        const data = await fetchWeeklyAverageFromInfluxDB(macId);

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