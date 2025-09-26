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

// เพิ่ม interface สำหรับ GroupedDustData (เหมือนใน Reports)
interface GroupedDustData {
    date: Date;
    displayDate: string;
    PM2: number;
    temperature: number;
    humidity: number;
    count: number;
}

export default function Dashboard() {
    // State เดิมที่จำเป็นต้องคงไว้
    const [temperature, setTemperature] = useState<number>(25);
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
    
    // State สำหรับ devices
    const [hasDevice, setHasDevice] = useState(false);
    const [deviceList, setDeviceList] = useState<Device[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    // Constants สำหรับ Dashboard - แสดง 7 วัน
    const DASHBOARD_DAYS = 7;

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

    // แก้ไข: ระบุพารามิเตอร์ให้ชัดเจน
    const {
        data: historicalData,
        isLoading: isHistoryLoading
    } = useHistoricalDustData(
        selectedDevice?.mac_id,
        DASHBOARD_DAYS,  // 7 วัน
        null,            // ไม่ใช้ startDate
        null             // ไม่ใช้ endDate
    );

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

    // แก้ไข: ใช้การประมวลผลแบบเดียวกับ Reports (Group by Day)
    useEffect(() => {
        console.log('=== DEBUG historicalData (Dashboard - 7 days) ===');
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
            console.log('จำนวนข้อมูลดิบ:', historicalData.data.length, 'รายการ');

            // เรียงลำดับข้อมูลตามเวลา (เหมือน Reports)
            const sortedData = [...historicalData.data].sort((a: HistoricalDustData, b: HistoricalDustData) => 
                new Date(a.time).getTime() - new Date(b.time).getTime()
            );
            
            // จัดกลุ่มข้อมูลตามวันเพื่อป้องกันการแสดงวันที่ซ้ำกัน (เหมือน Reports)
            const groupedByDay = new Map<string, GroupedDustData>();
            
            sortedData.forEach((item: HistoricalDustData) => {
                // ตัดเวลาออกเพื่อใช้เฉพาะวันที่เป็นตัวจัดกลุ่ม
                const date = new Date(item.time);
                const dateKey = date.toLocaleDateString('th-TH', { 
                    year: 'numeric', 
                    month: 'numeric', 
                    day: 'numeric' 
                });
                
                // เพิ่ม nullish coalescing operator เพื่อให้ค่าเป็น 0 หากไม่มีข้อมูล
                const pm2Value = item?.PM2 ?? 0;
                const tempValue = item?.temperature ?? 0;
                const humidityValue = item?.humidity ?? 0;
                
                if (!groupedByDay.has(dateKey)) {
                    groupedByDay.set(dateKey, {
                        date: date,
                        displayDate: date.toLocaleDateString('th-TH', { 
                            month: 'short', 
                            day: 'numeric',
                            weekday: 'short'
                        }),
                        PM2: pm2Value,
                        temperature: tempValue,
                        humidity: humidityValue,
                        count: 1
                    });
                } else {
                    const current = groupedByDay.get(dateKey)!;
                    current.PM2 += pm2Value;
                    current.temperature += tempValue;
                    current.humidity += humidityValue;
                    current.count += 1;
                }
            });
            
            // คำนวณค่าเฉลี่ยและสร้างอาร์เรย์ข้อมูลใหม่ (เหมือน Reports)
            const groupedData: GroupedDustData[] = Array.from(groupedByDay.values());
            
            // จัดเรียงตามวันที่อีกครั้ง
            groupedData.sort((a, b) => a.date.getTime() - b.date.getTime());
            
            // จำกัดข้อมูลให้แสดงเพียง 7 วันล่าสุด
            const limitedData = DASHBOARD_DAYS > 0 && DASHBOARD_DAYS < groupedData.length
                ? groupedData.slice(-DASHBOARD_DAYS)
                : groupedData;
            
            // Log ข้อมูล
            console.log(`Dashboard: Showing ${limitedData.length} days of data (after grouping) out of ${groupedData.length} available days`);
            
            // แปลงข้อมูลสำหรับกราฟจากข้อมูลที่จัดกลุ่มแล้ว (เหมือน Reports)
            const times = limitedData.map(item => item.displayDate);
            const pm25Values = limitedData.map(item => item.PM2 / item.count); // คำนวณค่าเฉลี่ย
            const tempValues = limitedData.map(item => item.temperature / item.count);
            const humidityValues = limitedData.map(item => item.humidity / item.count);

            console.log('Dashboard - วันที่ (จัดกลุ่มแล้ว):', times);
            console.log('Dashboard - ค่า PM2.5 เฉลี่ย:', pm25Values);
            console.log('Dashboard - ค่าอุณหภูมิ เฉลี่ย:', tempValues);
            console.log('Dashboard - ค่าความชื้น เฉลี่ย:', humidityValues);

            setChartHours(times);
            setChartData(pm25Values);
            setChartTempData(tempValues);
            setChartHumidityData(humidityValues);

        } else {
            if (historicalData?.status === 0) {
                console.log('API ส่งกลับ status 0:', historicalData.message);
            } else {
                console.log('ไม่พบข้อมูลเฉลี่ยรายวัน (7 วัน) หรือ API ไม่สำเร็จ');
            }
            // กรณีไม่มีข้อมูล แสดงเป็นอาเรย์ว่าง
            setChartHours([]);
            setChartData([]);
            setChartTempData([]);
            setChartHumidityData([]);
        }
    }, [historicalData, selectedDevice, isHistoryLoading, DASHBOARD_DAYS]);

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

    // Filter status logic
    const [filterStatus, setFilterStatus] = useState<"normal" | "abnormal" | "unknown">("unknown");
    const [filterSuggestion, setFilterSuggestion] = useState<string>("");

    // เมื่อเรียก API สำหรับสถานะกรอง
    useEffect(() => {
        const fetchFilterStatus = async () => {
            if (!selectedDevice?.connection_key) return;
            
            try {
                const response = await fetch(`/api/devices/filterstatus?connection_key=${selectedDevice.connection_key}`);
                const data = await response.json();
                
                console.log("Filter status response:", data);
                
                if (data.success && data.data) {
                    if (data.data.status === "normal") {
                        setFilterStatus("normal");
                    } else if (data.data.status === "abnormal") {
                        setFilterStatus("abnormal");
                    } else {
                        setFilterStatus("unknown");
                    }
                    
                    if (data.data.suggestion) {
                        setFilterSuggestion(data.data.suggestion);
                    } else {
                        setFilterSuggestion(data.data.status === "normal" ? "✅ กรองยังใช้งานได้ปกติ" : "⚠️ ควรเปลี่ยนไส้กรองใหม่");
                    }
                } else {
                    setFilterStatus("unknown");
                    setFilterSuggestion("");
                }
            } catch (error) {
                console.error("Error fetching filter status:", error);
                setFilterStatus("unknown");
                setFilterSuggestion("");
            }
        };
        
        if (selectedDevice?.is_active) {
            fetchFilterStatus();
        } else {
            setFilterStatus("unknown");
            setFilterSuggestion("");
        }
    }, [selectedDevice?.connection_key, selectedDevice?.is_active]);

    useEffect(() => {
        console.log('=== RENDER DASHBOARD ===', {
            isDeviceLoading,
            hasDevice,
            selectedDeviceId: selectedDevice?.device_id,
            deviceList: deviceList.length,
            chartDataPoints: chartData.length,
            daysToShow: DASHBOARD_DAYS
        });
    }, [isDeviceLoading, hasDevice, selectedDevice?.device_id, deviceList.length, chartData.length, DASHBOARD_DAYS]);

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
                            filterStatus={filterStatus}
                            filterSuggestion={filterSuggestion}
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
                            // ส่งพารามิเตอร์เพิ่มเติมให้ ChartSection
                            daysToShow={DASHBOARD_DAYS}
                            dateRange={`ข้อมูลย้อนหลัง ${DASHBOARD_DAYS} วัน`}
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
