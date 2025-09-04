"use client";

import "@/styles/dashboardstyle.css";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import EmptyDeviceState from "./components/EmptyDeviceState";
import LoadingSpinner from "./components/LoadingSpinner";
import DeviceSelector from "./components/DeviceSelector";
import DashboardCards from "./components/DashboardCards";
import ChartSection from "./components/ChartSection";
import UpdateStatus from "./components/UpdateStatus";
import WelcomeSection from "./components/WelcomeSection";
import OfflineModal from "./components/OfflineModal";
import { useTheme } from "./contexts/ThemeContext";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useDevices } from "./hooks/useDeviceData";
import { useCurrentDustData, useHistoricalDustData } from "./hooks/useDustData";
import { Device, HistoricalDustData } from "./types/dashboard";
import { convertDevicesData } from "./utils/dashboardUtils";

export default function Dashboard() {
    // State เดิมที่จำเป็นต้องคงไว้
    const [temperature, setTemperature] = useState<number>(25);
    // state สำหรับ modal อุปกรณ์ออฟไลน์
    const [showOfflineModal, setShowOfflineModal] = useState(false);
    const [humidity, setHumidity] = useState<number>(60);
    const [pm25, setPm25] = useState<number>(25);
    // State สำหรับข้อมูลกราฟ
    const [chartHours, setChartHours] = useState<string[]>([]);
    const [chartData, setChartData] = useState<number[]>([]);
    const [chartTempData, setChartTempData] = useState<number[]>([]);
    const [chartHumidityData, setChartHumidityData] = useState<number[]>([]);
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [showMultipleData, setShowMultipleData] = useState<boolean>(false);
    const { darkMode } = useTheme();
    // State ที่อาจไม่จำเป็นแล้วเมื่อใช้ React Query แต่คงไว้ก่อนเพื่อไม่ให้โค้ดพัง
    const [hasDevice, setHasDevice] = useState(false);
    const [deviceList, setDeviceList] = useState<Device[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    // session และ queryClient
    const { data: session } = useSession();
    const userId = session?.user?.id as string | undefined;
    const queryClient = useQueryClient();

    // React Query hooks
    const {
        data: devicesData,
        isLoading: isDeviceLoading
    } = useDevices(userId);

    const {
        data: currentDustData,
        isLoading: isDustLoading,
        isRefetching: isRefetchingDust
    } = useCurrentDustData(selectedDevice?.connection_key);

    const {
        data: historicalData,
        isLoading: isHistoryLoading
    } = useHistoricalDustData(selectedDevice?.mac_id); // ใช้ข้อมูลเฉลี่ยรายสัปดาห์

    // อัพเดต state เมื่อข้อมูล devices เปลี่ยน
    useEffect(() => {
        console.log('=== devicesData จาก API ===', devicesData);

        if (devicesData?.success && devicesData.data) {
            const devices = convertDevicesData(devicesData);
            
            setDeviceList(devices);
            setHasDevice(devices.length > 0);
            console.log('จำนวน devices ที่ได้:', devices.length, 'มีอุปกรณ์?', devices.length > 0);

            if (devices.length > 0 && !selectedDevice) {
                setSelectedDevice(devices[0]);
                console.log('เลือกอุปกรณ์แรก:', devices[0]);
            }
        } else {
            console.log('ไม่พบข้อมูล devices หรือ API ไม่สำเร็จ');
        }
    }, [devicesData, selectedDevice]);

    // อัพเดต state เมื่อข้อมูลฝุ่นปัจจุบันเปลี่ยน
    useEffect(() => {
        console.log('=== currentDustData จาก API ===', currentDustData);

        // ถ้าเครื่องปิดอยู่ หรือไม่มีเครื่องที่เลือก ให้แสดงค่าเป็น 0
        if (!selectedDevice || !selectedDevice.is_active) {
            setTemperature(0);
            setHumidity(0);
            setPm25(0);
            return;
        }

        if (currentDustData?.success && currentDustData.data) {
            console.log('ข้อมูลฝุ่นปัจจุบัน:', {
                temperature: parseFloat(currentDustData.data.temperature) || 0,
                humidity: parseFloat(currentDustData.data.humidity) || 0,
                pm25: parseFloat(currentDustData.data.pm25) || 0
            });

            // ใช้ || 0 เพื่อป้องกันค่า NaN
            setTemperature(parseFloat(currentDustData.data.temperature) || 0);
            setHumidity(parseFloat(currentDustData.data.humidity) || 0);
            setPm25(parseFloat(currentDustData.data.pm25) || 0);
        } else {
            console.log('ไม่พบข้อมูลฝุ่นปัจจุบัน หรือ API ไม่สำเร็จ');
            // กรณีไม่มีข้อมูล แสดงเป็น 0
            setTemperature(0);
            setHumidity(0);
            setPm25(0);
        }
    }, [currentDustData, selectedDevice]);

    // อัพเดต state เมื่อข้อมูลฝุ่นย้อนหลังเปลี่ยน
    useEffect(() => {
        console.log('=== DEBUG historicalData ===');
        console.log('selectedDevice?.mac_id:', selectedDevice?.mac_id);
        console.log('selectedDevice?.is_active:', selectedDevice?.is_active);
        console.log('historicalData:', historicalData);
        console.log('isHistoryLoading:', isHistoryLoading);

        // ถ้าเครื่องปิดอยู่ หรือไม่มีเครื่องที่เลือก ให้แสดงค่าเป็นอาเรย์ว่าง
        if (!selectedDevice || !selectedDevice.is_active) {
            console.log('อุปกรณ์ปิดอยู่หรือไม่ได้เลือก');
            setChartHours([]);
            setChartData([]);
            setChartTempData([]);
            setChartHumidityData([]);
            return;
        }

        if (historicalData?.status === 1 && historicalData.data && Array.isArray(historicalData.data) && historicalData.data.length > 0) {
            console.log('จำนวนข้อมูลเฉลี่ยรายวัน:', historicalData.data.length, 'รายการ');

            // แปลงข้อมูลสำหรับกราฟ
            const times = historicalData.data.map((item: HistoricalDustData) => {
                const date = new Date(item.time);
                return date.toLocaleDateString('th-TH', { 
                    month: 'short', 
                    day: 'numeric',
                    weekday: 'short'
                });
            });
            const pm25Values = historicalData.data.map((item: HistoricalDustData) => item.PM2 || 0);
            const tempValues = historicalData.data.map((item: HistoricalDustData) => item.temperature || 0);
            const humidityValues = historicalData.data.map((item: HistoricalDustData) => item.humidity || 0);

            console.log('วันที่:', times);
            console.log('ค่า PM2.5 เฉลี่ย:', pm25Values);

            setChartHours(times);
            setChartData(pm25Values);
            setChartTempData(tempValues);
            setChartHumidityData(humidityValues);
        } else {
            if (historicalData?.status === 0) {
                console.log('API ส่งกลับ status 0:', historicalData.message);
            } else {
                console.log('ไม่พบข้อมูลเฉลี่ยรายวัน หรือ API ไม่สำเร็จ');
            }
            // กรณีไม่มีข้อมูล แสดงเป็นอาเรย์ว่าง
            setChartHours([]);
            setChartData([]);
            setChartTempData([]);
            setChartHumidityData([]);
        }
    }, [historicalData, selectedDevice, isHistoryLoading]);

    // ฟังก์ชันรีเฟรชข้อมูล
    const refreshDeviceList = () => {
        if (userId) {
            queryClient.invalidateQueries({ queryKey: ['devices', userId] });
            queryClient.invalidateQueries({ queryKey: ['currentDust'] });
            queryClient.invalidateQueries({ queryKey: ['historicalDust'] });
        }
    };

    // ส่วนแสดงเวลาอัพเดทล่าสุด
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // เพิ่ม state สำหรับเก็บเวลาอัพเดตล่าสุดและตัวนับการอัพเดต
    const [updateCount, setUpdateCount] = useState(0);

    // useEffect สำหรับอัพเดตเวลาล่าสุดเมื่อข้อมูลเปลี่ยน
    useEffect(() => {
        if (currentDustData?.success && currentDustData.data) {
            setLastUpdated(new Date());
            setUpdateCount(prev => prev + 1);

            // เพิ่ม animation effect เมื่อมีการอัพเดตข้อมูล
            const elements = document.querySelectorAll('.dust-value, .env-value');
            elements.forEach(el => {
                el.classList.add('pulse-update');
                setTimeout(() => {
                    el.classList.remove('pulse-update');
                }, 1000);
            });
        }
    }, [currentDustData]);

    useEffect(() => {
        console.log('=== RENDER DASHBOARD ===', {
            isDeviceLoading,
            hasDevice,
            selectedDeviceId: selectedDevice?.device_id,  // ใช้ device_id แทน object ทั้งหมด
            deviceList: deviceList.length
        });
    }, [isDeviceLoading, hasDevice, selectedDevice?.device_id, deviceList.length]);  // แก้ dependency

    return (
        <div className={`dashboard-container ${darkMode ? 'dark' : ''}`}>
            <Sidebar />
            <div className="main-content fade-in">
                {isDeviceLoading ? (
                    <LoadingSpinner message="กำลังโหลดข้อมูลอุปกรณ์..." />
                ) : !hasDevice ? (
                    <EmptyDeviceState onDeviceAdded={refreshDeviceList} />
                ) : (
                    <div className="mm">
                        <WelcomeSection userName={session?.user.name} />
                        
                        <DeviceSelector
                            deviceList={deviceList}
                            selectedDevice={selectedDevice}
                            onDeviceSelect={setSelectedDevice}
                            onOfflineDeviceSelect={() => setShowOfflineModal(true)}
                        />

                        <OfflineModal
                            isOpen={showOfflineModal}
                            onClose={() => setShowOfflineModal(false)}
                        />

                        <DashboardCards
                            selectedDevice={selectedDevice}
                            isDustLoading={isDustLoading}
                            pm25={pm25}
                            temperature={temperature}
                            humidity={humidity}
                        />

                        <ChartSection
                            selectedDevice={selectedDevice}
                            isHistoryLoading={isHistoryLoading}
                            chartHours={chartHours}
                            chartData={chartData}
                            chartTempData={chartTempData}
                            chartHumidityData={chartHumidityData}
                            chartType={chartType}
                            showMultipleData={showMultipleData}
                            darkMode={darkMode}
                            onChartTypeChange={setChartType}
                            onDataTypeChange={setShowMultipleData}
                        />

                        <UpdateStatus
                            lastUpdated={lastUpdated}
                            updateCount={updateCount}
                            isRefetchingDust={isRefetchingDust}
                            queryClient={queryClient}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
