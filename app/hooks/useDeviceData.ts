"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deviceControlApi} from '../services/deviceApi';
import axios from 'axios';

;
// hook สำหรับดึงข้อมูลอุปกรณ์
export function useDevices(userId: string | undefined) {
    return useQuery({
        queryKey: ['devices', userId],
        queryFn: async () => {
            console.log('=== เรียก API devices ===');
            console.log('userId:', userId);
            
            if (!userId) {
                console.log('ไม่มี userId ไม่เรียก API');
                return { success: false, data: [] };
            }
            
            try {
                // สมมติว่าเป็นการเรียก API จริง
                const response = await fetch(`/api/devices?user_id=${userId}`);
                const data = await response.json();
                
                console.log('ผลลัพธ์ API devices:', data);
                
                return {
                    success: data.success || (data.status === 1),
                    data: data.data
                };
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการเรียก API devices:', error);
                return { success: false, data: [], error };
            }
        },
        enabled: !!userId,
    });
}

// hook สำหรับควบคุมเครื่อง
export function useDeviceControl() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deviceControlApi.controlSpeed,
    onSuccess: (data, variables) => {
      // เมื่อควบคุมสำเร็จ ให้ invalidate queries ที่เกี่ยวข้อง
      queryClient.invalidateQueries({ queryKey: ['deviceStatus', variables.connection_key] });
    },
  });
}

// hook สำหรับการดึงข้อมูลฝุ่น
export function useDustData() {
    return useQuery({
        queryKey: ['dustData'],
        queryFn: async () => {
            try {
                const response = await fetch('/api/dustdata');
                const data = await response.json();
                return {
                    success: data.success,
                    data: data.data
                };
            } catch (error) {
                console.error('เกิดข้อผิดพลาดในการเรียก API dustdata:', error);
                return { success: false, data: null, error };
            }
        },
        refetchInterval: 5 * 60 * 1000, // รีเฟรชทุก 5 นาที
    });
}

// hook สำหรับดึงข้อมูลสถานะเครื่อง
export function useDeviceStatus(connectionKey?: string, userId?: string) {
  return useQuery({
    queryKey: ['deviceStatus', connectionKey],
    queryFn: async () => {
      if (!connectionKey || !userId) return { success: false, data: null };
      
      try {
        const response = await axios.get(`/api/devices/status?connection_key=${connectionKey}&user_id=${userId}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching device status:', error);
        return { success: false, data: null, error };
      }
    },
    enabled: !!connectionKey && !!userId,
    refetchInterval: 30000, // ดึงข้อมูลทุก 30 วินาที
    staleTime: 25000, // ข้อมูลจะเก่าหลังจาก 25 วินาที
  });
}

// hook สำหรับดึงข้อมูลการตั้งเวลา
export function useWorkingTime(connectionKey?: string, userId?: string) {
  return useQuery({
    queryKey: ['workingTime', connectionKey],
    queryFn: async () => {
      if (!connectionKey || !userId) return { success: false, data: null };
      
      try {
        const response = await axios.get(`/api/devices/get_working_time?connection_key=${connectionKey}&user_id=${userId}`);
        return response.data;
      } catch (error) {
        console.error('Error fetching working time:', error);
        return { success: false, data: null, error };
      }
    },
    enabled: !!connectionKey && !!userId,
    staleTime: 5 * 60 * 1000, // ข้อมูลจะเก่าหลังจาก 5 นาที
  });
}

// hook สำหรับตั้งเวลา
export function useSetWorkingTime() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deviceControlApi.setWorkingTime,
    onSuccess: (data, variables) => {
      // เมื่อตั้งเวลาสำเร็จ ให้ invalidate queries ที่เกี่ยวข้อง
      queryClient.invalidateQueries({ queryKey: ['workingTime', variables.connection_key] });
    },
  });
}