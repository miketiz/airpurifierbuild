"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';


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

// Hook สำหรับข้อมูลกราฟย้อนหลัง
export function useHistoricalDustData(macId?: string, timeRange: string = "12:00:00") {
  return useQuery({
    queryKey: ["historicalDust", macId, timeRange],
    queryFn: async () => {
      if (!macId) return { 
        status: 1, 
        data: [], 
        message: "No mac_id provided" 
      };
      
      try {
        const response = await axios.get(`/api/avgweek?mac_id=${macId}&timestamp=${Date.now()}`);
        return response.data;
      } catch (error: unknown) {
        console.error('Error fetching weekly average data:', error);
        return {
          status: 0,
          data: [],
          message: error instanceof Error ? error.message : String(error)
        };
      }
    },
    enabled: !!macId,
    refetchInterval: 300000, // รีเฟรชทุก 5 นาที
    refetchOnWindowFocus: false,
    staleTime: 60000, // ข้อมูลจะเก่าหลังจาก 1 นาที
  });
}