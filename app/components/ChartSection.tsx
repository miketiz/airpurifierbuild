"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions
} from 'chart.js';
import { Line, Bar } from "react-chartjs-2";
import { Device } from "../types/dashboard";

// ลงทะเบียน Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface ChartSectionProps {
    selectedDevice: Device | null;
    isHistoryLoading: boolean;
    chartHours: string[];
    chartData: number[];
    chartTempData: number[];
    chartHumidityData: number[];
    chartType: 'line' | 'bar';
    showMultipleData: boolean;
    darkMode: boolean;
    onChartTypeChange: (type: 'line' | 'bar') => void;
    onDataTypeChange: (showMultiple: boolean) => void;
    daysToShow?: number; // เพิ่มพารามิเตอร์นี้
    dateRange?: string; // เพิ่มพารามิเตอร์นี้
    timeRange?: string; // เพิ่มพารามิเตอร์นี้
}

export default function ChartSection({
    selectedDevice,
    isHistoryLoading,
    chartHours,
    chartData,
    chartTempData,
    chartHumidityData,
    chartType,
    showMultipleData,
    darkMode,
    onChartTypeChange,
    onDataTypeChange,
    daysToShow = 7,
    dateRange = '',
    timeRange = '7days' // เพิ่มค่าเริ่มต้น
}: ChartSectionProps) {
    // ในกรณี timeRange เป็น custom ไม่ต้องจำกัดข้อมูล
    const shouldLimitData = timeRange !== 'custom';
    
    // ปรับฟังก์ชัน limitData ให้ไม่จำกัดข้อมูลถ้า timeRange เป็น custom
    const limitData = <T,>(data: T[], limit: number): T[] => {
        // ถ้าเป็น custom range หรือข้อมูลน้อยกว่าหรือเท่ากับจำนวนวัน ให้แสดงทั้งหมด
        if (!shouldLimitData || data.length <= limit) return data;
        // ถ้าข้อมูลมีมากกว่า ให้แสดงเฉพาะ limit วันล่าสุด
        return data.slice(-limit);
    };
    
    // ตัดข้อมูลตามจำนวนวันที่ต้องการแสดง
    const limitedHours = limitData(chartHours, daysToShow);
    const limitedChartData = limitData(chartData, daysToShow);
    const limitedTempData = limitData(chartTempData, daysToShow);
    const limitedHumidityData = limitData(chartHumidityData, daysToShow);

    // แก้ไขฟังก์ชัน getButtonClass
    const getButtonClass = (isActive: boolean) => {
        return `chart-control-btn ${isActive ? 'active' : ''}`;
    };

    // ฟังก์ชันสำหรับจัดกลุ่มข้อมูลตามวัน
    const groupDataByDay = <T,>(dates: string[], dataArray: T[]): [string[], T[]] => {
        // สร้าง Map เพื่อเก็บค่าเฉลี่ยของแต่ละวัน
        const dayMap = new Map<string, { sum: number, count: number }>();
        
        // วนลูปผ่านข้อมูลทั้งหมด
        dates.forEach((date, index) => {
            // ใช้วันที่เป็น key
            if (!dayMap.has(date)) {
                dayMap.set(date, { sum: Number(dataArray[index] || 0), count: 1 });
            } else {
                const current = dayMap.get(date)!;
                current.sum += Number(dataArray[index] || 0);
                current.count += 1;
            }
        });
        
        // แปลงกลับเป็น arrays
        const uniqueDates: string[] = [];
        const averagedData: T[] = [];
        
        dayMap.forEach((value, key) => {
            uniqueDates.push(key);
            // คำนวณค่าเฉลี่ย
            const average = value.sum / value.count;
            averagedData.push(average as unknown as T);
        });
        
        return [uniqueDates, averagedData];
    };

    // ใช้ฟังก์ชันจัดกลุ่มข้อมูลก่อนเตรียมข้อมูลสำหรับกราฟ
    const [uniqueDates, averagedPm25Data] = groupDataByDay(limitedHours, limitedChartData);
    const [, averagedTempData] = groupDataByDay(limitedHours, limitedTempData);
    const [, averagedHumidityData] = groupDataByDay(limitedHours, limitedHumidityData);

    // อัพเดต chartDataConfig โดยใช้ข้อมูลที่ถูกตัดแล้ว
    const chartDataConfig = {
        labels: uniqueDates, // ใช้วันที่ที่ไม่ซ้ำกัน
        datasets: showMultipleData ? [
            {
                label: 'PM 2.5 (µg/m³)',
                data: averagedPm25Data, // ใช้ข้อมูลที่เฉลี่ยแล้ว
                borderColor: '#d81b60', // สีเข้มขึ้น จาก e91e63
                borderWidth: 3, // เพิ่มความหนาของเส้น
                backgroundColor: 'rgba(216, 27, 96, 0.15)', // เพิ่มความทึบของสีพื้นหลัง
                fill: false,
                tension: 0.4,
                pointRadius: 5, // เพิ่มขนาดของจุด
                pointBackgroundColor: '#d81b60',
                pointBorderColor: darkMode ? '#383c3f' : '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7, // เพิ่มขนาดจุดเมื่อ hover
                yAxisID: 'y',
            },
            {
                label: 'อุณหภูมิ (°C)',
                data: averagedTempData, // ใช้ข้อมูลที่เฉลี่ยแล้ว
                borderColor: '#1976d2', // สีเข้มขึ้น จาก 3498db
                borderWidth: 2.5, // เพิ่มความหนาของเส้น
                backgroundColor: 'rgba(25, 118, 210, 0.15)', // เพิ่มความทึบของสีพื้นหลัง
                fill: false,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#1976d2',
                pointBorderColor: darkMode ? '#383c3f' : '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6, // เพิ่มขนาดจุดเมื่อ hover
                yAxisID: 'y1',
            },
            {
                label: 'ความชื้น (%)',
                data: averagedHumidityData, // ใช้ข้อมูลที่เฉลี่ยแล้ว
                borderColor: '#0097a7', // สีเข้มขึ้น จาก 00bcd4
                borderWidth: 2.5, // เพิ่มความหนาของเส้น
                backgroundColor: 'rgba(0, 151, 167, 0.15)', // เพิ่มความทึบของสีพื้นหลัง
                fill: false,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#0097a7',
                pointBorderColor: darkMode ? '#383c3f' : '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6, // เพิ่มขนาดจุดเมื่อ hover
                yAxisID: 'y2',
            }
        ] : [
            {
                label: 'PM 2.5 (µg/m³)',
                data: averagedPm25Data, // ใช้ข้อมูลที่เฉลี่ยแล้ว
                borderColor: '#d81b60', // สีเข้มขึ้น จาก e91e63
                borderWidth: 3, // เพิ่มความหนาของเส้น
                backgroundColor: darkMode ?
                    'rgba(216, 27, 96, 0.2)' : // ในโหมดมืดใช้ความทึบน้อยกว่า
                    'rgba(216, 27, 96, 0.25)', // ในโหมดสว่างใช้ความทึบมากกว่า
                fill: true,
                tension: 0.4,
                pointRadius: 5, // เพิ่มขนาดของจุด
                pointBackgroundColor: '#d81b60',
                pointBorderColor: darkMode ? '#383c3f' : '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7, // เพิ่มขนาดจุดเมื่อ hover
            },
        ],
    };

    // ถ้า chartType === 'bar' ให้ปรับแต่งกราฟแท่งให้เข้มขึ้น
    if (chartType === 'bar') {
        if (showMultipleData) {
            chartDataConfig.datasets[0].backgroundColor = darkMode ? 'rgba(216, 27, 96, 0.7)' : 'rgba(216, 27, 96, 0.8)';
            chartDataConfig.datasets[1].backgroundColor = darkMode ? 'rgba(25, 118, 210, 0.7)' : 'rgba(25, 118, 210, 0.8)';
            chartDataConfig.datasets[2].backgroundColor = darkMode ? 'rgba(0, 151, 167, 0.7)' : 'rgba(0, 151, 167, 0.8)';

            // เพิ่ม border ให้กับแท่ง
            chartDataConfig.datasets[0].borderWidth = 1;
            chartDataConfig.datasets[1].borderWidth = 1;
            chartDataConfig.datasets[2].borderWidth = 1;
        } else {
            // สำหรับกราฟแท่งที่แสดง PM2.5 อย่างเดียว
            chartDataConfig.datasets[0].backgroundColor = darkMode ?
                'rgba(216, 27, 96, 0.7)' :
                'rgba(216, 27, 96, 0.8)';
            chartDataConfig.datasets[0].borderWidth = 1;
            chartDataConfig.datasets[0].borderColor = darkMode ?
                'rgba(216, 27, 96, 0.9)' :
                'rgba(216, 27, 96, 1.0)';
        }
    }

    // แก้ไขการประกาศ ChartOptions
    const chartOptions: ChartOptions<'line' | 'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: darkMode ? 'rgba(233, 236, 239, 0.8)' : 'rgba(44, 62, 80, 0.8)',
                    font: {
                        family: "'Kanit', sans-serif",
                        size: 12
                    },
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            title: {
                display: true,
                text: showMultipleData
                    ? `ข้อมูลสิ่งแวดล้อมเฉลี่ยรายวัน ${timeRange === 'custom'
                        ? dateRange
                        : `ย้อนหลัง ${daysToShow} วัน${limitedHours.length < daysToShow ? ` (แสดงเฉพาะ ${limitedHours.length} วันที่มีข้อมูล)` : ''}`
                    }`
                    : `ค่าฝุ่น PM 2.5 เฉลี่ยรายวัน ${timeRange === 'custom'
                        ? dateRange
                        : `ย้อนหลัง ${daysToShow} วัน${limitedHours.length < daysToShow ? ` (แสดงเฉพาะ ${limitedHours.length} วันที่มีข้อมูล)` : ''}`
                    }`,
                color: darkMode ? 'rgba(233, 236, 239, 0.9)' : 'rgba(44, 62, 80, 0.9)',
                font: {
                    size: 16,
                    weight: 'bold',
                    family: "'Kanit', sans-serif",
                }
            },
            tooltip: {
                backgroundColor: darkMode ? 'rgba(55, 65, 81, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: darkMode ? '#e5e7eb' : '#1f2937',
                bodyColor: darkMode ? '#e5e7eb' : '#1f2937',
                borderColor: darkMode ? '#6b7280' : '#d1d5db',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        if (typeof value !== 'number') return `${label}: N/A`;

                        if (label.includes('PM 2.5')) {
                            return `${label}: ${value.toFixed(1)} µg/m³`;
                        } else if (label.includes('อุณหภูมิ')) {
                            return `${label}: ${value.toFixed(1)} °C`;
                        } else if (label.includes('ความชื้น')) {
                            return `${label}: ${value.toFixed(1)} %`;
                        }
                        return `${label}: ${value}`;
                    }
                }
            }
        },
        scales: {} // เริ่มต้นเป็น object เปล่า
    };

    // กำหนดค่า scales หลังจากนั้น
    if (showMultipleData) {
        chartOptions.scales = {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: darkMode ? 'rgba(233, 236, 239, 0.7)' : 'rgba(44, 62, 80, 0.7)',
                    font: {
                        family: "'Kanit', sans-serif",
                        size: 11
                    },
                    maxTicksLimit: 8
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'PM 2.5 (µg/m³)',
                    color: '#d81b60',
                    font: {
                        family: "'Kanit', sans-serif",
                        size: 13,
                        weight: 'bold'
                    }
                },
                grid: {
                    color: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    color: '#d81b60',
                    font: {
                        family: "'Kanit', sans-serif",
                        size: 11,
                        weight: 600
                    }
                },
                min: 0,
                max: Math.max(50, ...limitedChartData)
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'อุณหภูมิ (°C)',
                    color: '#1976d2',
                    font: {
                        family: "'Kanit', sans-serif",
                        size: 13,
                        weight: 'bold'
                    }
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    color: '#1976d2',
                    font: {
                        family: "'Kanit', sans-serif",
                        size: 11,
                        weight:600
                    }
                },
                min: 20,
                max: 35
            },
            y2: {
                type: 'linear',
                display: false,
                position: 'right',
                min: 0,
                max: 100,
                ticks: {
                    color: '#0097a7',
                }
            }
        };
    } else {
        chartOptions.scales = {
            y: {
                beginAtZero: true,
                grid: {
                    color: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    color: darkMode ? 'rgba(233, 236, 239, 0.7)' : 'rgba(44, 62, 80, 0.7)',
                    font: {
                        family: "'Kanit', sans-serif",
                    }
                },
                min: 0,
                // เพิ่ม max สำหรับกรณี PM2.5 อย่างเดียว
                max: Math.max(50, ...limitedChartData)
            },
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: darkMode ? 'rgba(233, 236, 239, 0.7)' : 'rgba(44, 62, 80, 0.7)',
                    font: {
                        family: "'Kanit', sans-serif",
                    },
                    maxTicksLimit: 8
                }
            }
        };
    }

    return (
        <div className="chart-container">
            <div className="card chart-card">
                {/* Chart Controls */}
                <div className={`chart-controls ${darkMode ? 'dark' : ''}`}>
                    <div className="chart-control-group">
                        <span className="chart-control-label">ประเภทกราฟ:</span>
                        <div className="chart-control-buttons">
                            <button
                                onClick={() => onChartTypeChange('line')}
                                className={getButtonClass(chartType === 'line')}
                                data-tooltip="แสดงกราฟแบบเส้น"
                            >
                                <span>กราฟเส้น</span>
                            </button>
                            <button
                                onClick={() => onChartTypeChange('bar')}
                                className={getButtonClass(chartType === 'bar')}
                                data-tooltip="แสดงกราฟแบบแท่ง"
                            >
                                <span>กราฟแท่ง</span>
                            </button>
                        </div>
                    </div>

                    <div className="chart-control-group">
                        <span className="chart-control-label">ข้อมูล:</span>
                        <div className="chart-control-buttons">
                            <button
                                onClick={() => onDataTypeChange(false)}
                                className={getButtonClass(!showMultipleData)}
                                data-tooltip="แสดงเฉพาะข้อมูล PM 2.5"
                            >
                                <span>PM 2.5 อย่างเดียว</span>
                            </button>
                            <button
                                onClick={() => onDataTypeChange(true)}
                                className={getButtonClass(showMultipleData)}
                                data-tooltip="แสดงข้อมูล PM 2.5, อุณหภูมิ, และความชื้น"
                            >
                                <span>ข้อมูลรวม</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Chart Display */}
                <div className="chart-wrapper">
                    {!selectedDevice?.is_active ? (
                        <div className="chart-inactive">อุปกรณ์ปิดอยู่ ไม่มีข้อมูลกราฟ</div>
                    ) : isHistoryLoading ? (
                        <div className="loading-chart">กำลังโหลดข้อมูลกราฟ...</div>
                    ) : chartData.length === 0 ? (
                        <div className="chart-inactive">
                            {selectedDevice?.is_active ? 'ไม่มีข้อมูลกราฟในช่วงเวลานี้' : 'อุปกรณ์ปิดอยู่ ไม่มีข้อมูลกราฟ'}
                        </div>
                    ) : chartType === "line" ? (
                        <Line data={chartDataConfig} options={chartOptions} />
                    ) : (
                        <Bar data={chartDataConfig} options={chartOptions} />
                    )}
                </div>
            </div>
        </div>
    );
}
