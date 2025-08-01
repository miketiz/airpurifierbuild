"use client";

import { useQuery } from '@tanstack/react-query';

// ฟังก์ชันดึงข้อมูลรายงาน
const fetchReportsData = async () => {
    const response = await fetch('/api/reports');
    const data = await response.json();
    return data;
};

// Hook สำหรับข้อมูลรายงาน
export function useReportsData() {
    return useQuery({
        queryKey: ['reports'],
        queryFn: fetchReportsData,
        refetchInterval: 24 * 60 * 60 * 1000, // refresh ทุก 24 ชั่วโมง
    });
}