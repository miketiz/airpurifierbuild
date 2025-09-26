"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useState } from 'react';


// ฟังก์ชันดึงข้อมูลประวัติฝุ่น
const fetchHistoricalDustData = async (
    macId?: string,
    days: number = 7,
    startDate?: Date | null,
    endDate?: Date | null
) => {
    if (!macId) return null;
    
    let url = `/api/avgweek?mac_id=${macId}`;
    
    // ถ้ามีการระบุวันเริ่มต้นและวันสิ้นสุด (กรณีเลือกช่วงเวลาเอง)
    if (startDate && endDate) {
        // ส่งเฉพาะวันที่ ไม่ส่งเวลา
        const start = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const end = endDate.toISOString().split('T')[0];     // YYYY-MM-DD
        url += `&start_date=${start}&end_date=${end}`;
    } else {
        url += `&days=${days}`;
    }
    
    console.log('Fetching historical data from:', url);
    
    try {
        const response = await fetch(url, {
            next: { revalidate: 0 } // ไม่ใช้ cache
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // เพิ่ม debug log
        if (data?.data?.length > 0) {
            const firstDate = new Date(data.data[0].time);
            const lastDate = new Date(data.data[data.data.length - 1].time);
            console.log(`Received data from ${firstDate.toLocaleString()} to ${lastDate.toLocaleString()}`);
            console.log(`Total data points: ${data.data.length}`);
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching historical dust data:', error);
        throw error;
    }
};

// Hook สำหรับข้อมูลฝุ่นปัจจุบัน
export function useCurrentDustData(connectionKey?: string) {
  return useQuery({
    queryKey: ["currentDust", connectionKey],
    queryFn: async () => {
      if (!connectionKey) return { 
        success: true, 
        data: { 
          pm25: '0', 
          temperature: '0', 
          humidity: '0', 
          timestamp: new Date().toISOString() 
        }, 
        message: "No connection key provided" 
      };
      
      try {
        const response = await axios.get(`/api/dustdata?connection_key=${connectionKey}&timestamp=${Date.now()}`);
        return response.data;
      } catch (error: unknown) {
        // จัดการกับ error 422 โดยเฉพาะ
        if (axios.isAxiosError(error) && error.response?.status === 422) {
          console.warn(`Error 422 when fetching dust data for ${connectionKey} - possibly no data available yet`);
          // คืนค่าข้อมูลเป็น 0 แทนที่จะโยน error
          return { 
            success: true, 
            data: {
              pm25: '0',
              temperature: '0',
              humidity: '0',
              timestamp: new Date().toISOString()
            },
            message: "No data available for this device yet" 
          };
        }
        
        // กรณี error อื่นๆ
        return {
          success: false,
          data: {
            pm25: '0',
            temperature: '0',
            humidity: '0',
            timestamp: new Date().toISOString()
          },
          error: error instanceof Error ? error.message : String(error),
          message: "Error fetching current dust data"
        };
      }
    },
    enabled: !!connectionKey,
    refetchInterval: 60000, // รีเฟรชทุก 1 นาที
    refetchOnWindowFocus: false,
    staleTime: 10000, // ข้อมูลจะเก่าหลังจาก 10 วินาที
  });
}

// Hook สำหรับดึงข้อมูลประวัติฝุ่น
export const useHistoricalDustData = (
    macId?: string,
    days: number = 7,
    startDate?: Date | null,
    endDate?: Date | null
) => {
    // เพิ่ม state สำหรับเก็บค่า timeRange
    const [timeRange, setTimeRange] = useState<string>('7days');
    
    // อัพเดต timeRange เมื่อ days เปลี่ยน
    useEffect(() => {
        if (days === 7) setTimeRange('7days');
        else if (days === 14) setTimeRange('14days');
        else if (days === 30) setTimeRange('30days');
        else setTimeRange('custom');
    }, [days]);
    
    return useQuery({
        // เพิ่ม timeRange ใน queryKey เพื่อให้ invalidate เมื่อเปลี่ยน range
        queryKey: ['historicalDust', macId, days, startDate?.toISOString(), endDate?.toISOString(), timeRange],
        queryFn: () => fetchHistoricalDustData(macId, days, startDate, endDate),
        enabled: !!macId,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 นาที
    });
};