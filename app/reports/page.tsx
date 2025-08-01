"use client";

import Sidebar from "../components/Sidebar";
import { BarChart, Download } from "lucide-react";
import "@/styles/reportstyle.css";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { useEffect, useState } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import EmptyDeviceState from "../components/EmptyDeviceState";
import LoadingSpinner from "../components/LoadingSpinner";
import ChartSection from "../components/ChartSection";
import DeviceSelector from "../components/DeviceSelector";
import { useSession } from "next-auth/react";
import { useTheme } from "../contexts/ThemeContext";
import { useQueryClient } from "@tanstack/react-query";
import { useDevices } from "../hooks/useDeviceData";
import { useHistoricalDustData } from "../hooks/useDustData";
import { Device, HistoricalDustData } from "../types/dashboard";
import { convertDevicesData } from "../utils/dashboardUtils";

// Register autoTable with jsPDF
declare module 'jspdf' {
    interface jsPDF {
        autoTable: typeof autoTable;
        lastAutoTable?: {
            finalY: number;
        };
    }
}

// Type-safe registration of autoTable plugin
interface jsPDFWithAutoTable {
    autoTable: typeof autoTable;
}
(jsPDF.prototype as jsPDFWithAutoTable).autoTable = autoTable;

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function Reports() {
    // State สำหรับข้อมูลรายงาน
    const [weeklyData, setWeeklyData] = useState<{
        labels: string[];
        values: number[];
        average: string;
    }>({
        labels: [],
        values: [],
        average: "0.0"
    });

    const [deviceList, setDeviceList] = useState<Device[]>([]);
    const [hasDevice, setHasDevice] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    const [chartHours, setChartHours] = useState<string[]>([]);
    const [chartPm25Data, setChartPm25Data] = useState<number[]>([]);
    const [chartTempData, setChartTempData] = useState<number[]>([]);
    const [chartHumidityData, setChartHumidityData] = useState<number[]>([]);
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [showMultipleData, setShowMultipleData] = useState<boolean>(false);

    // Hooks
    const { data: session } = useSession();
    const { darkMode } = useTheme();
    const queryClient = useQueryClient();
    const userId = session?.user?.id as string | undefined;

    // React Query hooks
    const {
        data: devicesData,
        isLoading: isDeviceLoading
    } = useDevices(userId);

    const {
        data: historicalData,
        isLoading: isHistoryLoading,
    } = useHistoricalDustData(selectedDevice?.mac_id);

    // ดึงข้อมูล devices
    useEffect(() => {
        console.log('=== devicesData จาก API ===', devicesData);

        if (devicesData?.success && devicesData.data) {
            const devices = convertDevicesData(devicesData);
            
            setDeviceList(devices);
            setHasDevice(devices.length > 0);

            if (devices.length > 0 && !selectedDevice) {
                setSelectedDevice(devices[0]);
            }
        }
    }, [devicesData, selectedDevice]);

    // อัพเดตข้อมูลกราฟ
    useEffect(() => {
        if (!selectedDevice || !selectedDevice.is_active) {
            setChartHours([]);
            setChartPm25Data([]);
            setChartTempData([]);
            setChartHumidityData([]);
            return;
        }

        if (historicalData?.status === 1 && historicalData.data && Array.isArray(historicalData.data) && historicalData.data.length > 0) {
            // แปลงข้อมูลสำหรับกราห
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

            setChartHours(times);
            setChartPm25Data(pm25Values);
            setChartTempData(tempValues);
            setChartHumidityData(humidityValues);

            // อัพเดตข้อมูลสำหรับรายงาน - แก้ไข type error
            const average = (pm25Values.reduce((sum: number, val: number) => sum + val, 0) / pm25Values.length).toFixed(1);
            setWeeklyData({
                labels: times,
                values: pm25Values,
                average: average
            });
        } else {
            setChartHours([]);
            setChartPm25Data([]);
            setChartTempData([]);
            setChartHumidityData([]);
            setWeeklyData({
                labels: [],
                values: [],
                average: "0.0"
            });
        }
    }, [historicalData, selectedDevice]);

    const exportToPDF = () => {
        const doc = new jsPDF();
        
        // หัวข้อรายงาน
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text('PM 2.5 Weekly Report', 14, 20);
        
        // วันที่ออกรายงาน
        const today = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        doc.text(`Report Generated: ${today}`, 14, 42);
        
        // สร้างข้อมูลตาราง - แก้ไขการแสดงวันที่
        const tableData = weeklyData.labels.map((label, index) => {
            // แปลงวันที่ให้แสดงเป็นภาษาอังกฤษ
            let formattedDate = label;
            
            // ถ้ามีข้อมูลจาก historicalData ให้ใช้วันที่จริง
            if (historicalData?.data && historicalData.data[index]) {
                const date = new Date(historicalData.data[index].time);
                formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            }
            
            return [
                formattedDate,
                weeklyData.values[index].toFixed(2)
            ];
        });

        // สร้างตารางข้อมูล
        autoTable(doc, {
            head: [['Date', 'PM 2.5 (µg/m³)']],
            body: tableData,
            startY: 52,
            margin: {left: 37, right: 37},
            tableWidth: 'auto',
            styles: {
                font: "helvetica",
                fontSize: 11,
                cellPadding: 8,
                halign: 'center'
            },
            headStyles: {
                fillColor: [233, 30, 99],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center',
                fontSize: 12
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 70 },
                1: { halign: 'center', cellWidth: 70 }
            }
        });

        // เพิ่มค่าเฉลี่ย
        const finalY = doc.lastAutoTable?.finalY || 52;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(233, 30, 99);
        doc.text(`Weekly Average: ${weeklyData.average} µg/m³`, 14, finalY + 20);
        
        // เพิ่มสถิติเพิ่มเติม
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        const maxValue = weeklyData.values.length > 0 ? Math.max(...weeklyData.values).toFixed(1) : '0.0';
        const minValue = weeklyData.values.length > 0 ? Math.min(...weeklyData.values).toFixed(1) : '0.0';
        
        doc.text(`Highest Value: ${maxValue} µg/m³`, 14, finalY + 35);
        doc.text(`Lowest Value: ${minValue} µg/m³`, 14, finalY + 45);
        doc.text(`Total Data Points: ${weeklyData.values.length}`, 14, finalY + 55);
        
        const filedate = new Date().toISOString().split('T')[0];
        const devicename = selectedDevice?.device_name || 'Unknown_Device';

        const fileName = `PM25_Weekly_Report_${devicename}_${filedate}.pdf`;
        doc.save(fileName);
    };

    // ฟังก์ชันรีเฟรชข้อมูล
    const refreshDeviceList = () => {
        if (userId) {
            queryClient.invalidateQueries({ queryKey: ['devices', userId] });
            queryClient.invalidateQueries({ queryKey: ['historicalDust'] });
        }
    };

    return (
        <div className={`dashboard-container ${darkMode ? 'dark' : ''}`}>
            <Sidebar />
            <div className="main-content">
                {isDeviceLoading ? (
                    <LoadingSpinner message="กำลังโหลดข้อมูล..." />
                ) : !hasDevice ? (
                    <EmptyDeviceState onDeviceAdded={refreshDeviceList} />
                ) : (
                    <div className="report-container">
                        <div className="report-header">
                            <h1>รายงานและสถิติ</h1>
                            <div className="report-actions">
                                <button 
                                    className="export-btn"
                                    onClick={exportToPDF}
                                >
                                    <Download size={20} />
                                    ส่งออกรายงาน
                                </button>
                            </div>
                        </div>

                        {/* เพิ่ม DeviceSelector */}
                        <DeviceSelector
                            deviceList={deviceList}
                            selectedDevice={selectedDevice}
                            onDeviceSelect={setSelectedDevice}
                            onOfflineDeviceSelect={() => {}}
                        />

                        <div className="report-grid">
                            <div className="report-card summary-card">
                                <div className="summary-header">
                                    <BarChart className="summary-icon" />
                                    <h2>สรุปภาพรวม</h2>
                                </div>
                                <div className="summary-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">ค่าฝุ่นเฉลี่ย</span>
                                        <span className="stat-value">{weeklyData.average}</span>
                                        <span className="stat-unit">µg/m³</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">ชั่วโมงการทำงาน</span>
                                        <span className="stat-value">999</span>
                                        <span className="stat-unit">ชั่วโมง</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">ค่าสูงสุด</span>
                                        <span className="stat-value">
                                            {weeklyData.values.length > 0 ? Math.max(...weeklyData.values).toFixed(1) : '0.0'}
                                        </span>
                                        <span className="stat-unit">µg/m³</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">ค่าต่ำสุด</span>
                                        <span className="stat-value">
                                            {weeklyData.values.length > 0 ? Math.min(...weeklyData.values).toFixed(1) : '0.0'}
                                        </span>
                                        <span className="stat-unit">µg/m³</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* ใช้ ChartSection component แทน chart เดิม */}
                            <ChartSection
                                selectedDevice={selectedDevice}
                                isHistoryLoading={isHistoryLoading}
                                chartHours={chartHours}
                                chartData={chartPm25Data}
                                chartTempData={chartTempData}
                                chartHumidityData={chartHumidityData}
                                chartType={chartType}
                                showMultipleData={showMultipleData}
                                darkMode={darkMode}
                                onChartTypeChange={setChartType}
                                onDataTypeChange={setShowMultipleData}
                            />
                        </div>
                )}
            </div>
        </div>
    );
}