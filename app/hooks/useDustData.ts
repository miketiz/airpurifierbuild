"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';


// ฟังก์ชันดึงข้อมูลประวัติฝุ่น
const fetchHistoricalDustData = async (
    macId?: string,
    days: number = 7,
    startDate?: Date | null,
    endDate?: Date | null
) => {
    if (!macId) return null;
    
    let url = `/api/avgweek?mac_id=${macId}&days=${days}`;
    
    // ถ้ามีการระบุวันเริ่มต้นและวันสิ้นสุด (กรณีเลือกช่วงเวลาเอง)
    if (startDate && endDate) {
        const startIsoDate = startDate.toISOString().split('T')[0];
        const endIsoDate = endDate.toISOString().split('T')[0];
        url += `&start_date=${startIsoDate}&end_date=${endIsoDate}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    return data;
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
    return useQuery({
        queryKey: ['historicalDust', macId, days, startDate?.toISOString(), endDate?.toISOString()],
        queryFn: () => fetchHistoricalDustData(macId, days, startDate, endDate),
        enabled: !!macId,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 นาที
    });
};