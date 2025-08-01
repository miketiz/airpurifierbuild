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
    onDataTypeChange
}: ChartSectionProps) {
    // Utility function for button classes
    const getButtonClass = (isActive: boolean) => 
        `chart-btn ${isActive ? 'active' : ''} ${darkMode ? 'dark' : ''}`;

    const chartDataConfig = {
        labels: chartHours,
        datasets: showMultipleData ? [
            {
                label: 'PM 2.5 (µg/m³)',
                data: chartData,
                borderColor: '#e91e63',
                backgroundColor: 'rgba(233, 30, 99, 0.1)',
                fill: false,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#e91e63',
                pointBorderColor: darkMode ? '#383c3f' : '#fff',
                pointBorderWidth: 2,
                yAxisID: 'y',
            },
            {
                label: 'อุณหภูมิ (°C)',
                data: chartTempData,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: false,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#3498db',
                pointBorderColor: darkMode ? '#383c3f' : '#fff',
                pointBorderWidth: 2,
                yAxisID: 'y1',
            },
            {
                label: 'ความชื้น (%)',
                data: chartHumidityData,
                borderColor: '#00bcd4',
                backgroundColor: 'rgba(0, 188, 212, 0.1)',
                fill: false,
                tension: 0.4,
                pointRadius: 3,
                pointBackgroundColor: '#00bcd4',
                pointBorderColor: darkMode ? '#383c3f' : '#fff',
                pointBorderWidth: 2,
                yAxisID: 'y2',
            }
        ] : [
            {
                label: 'PM 2.5 (µg/m³)',
                data: chartData,
                borderColor: '#e91e63',
                backgroundColor: 'rgba(233, 30, 99, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#e91e63',
                pointBorderColor: darkMode ? '#383c3f' : '#fff',
                pointBorderWidth: 2,
            },
        ],
    };

    const chartOptions: ChartOptions<'line' | 'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
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
                text: showMultipleData ? 'ข้อมูลสิ่งแวดล้อมเฉลี่ยรายวันย้อนหลัง 7 วัน' : 'ค่าฝุ่น PM 2.5 เฉลี่ยรายวันย้อนหลัง 7 วัน',
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
                    label: function(context) {
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
        scales: showMultipleData ? {
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
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: {
                    display: true,
                    text: 'PM 2.5 (µg/m³)',
                    color: '#e91e63',
                    font: {
                        family: "'Kanit', sans-serif",
                        size: 12,
                        weight: 'bold'
                    }
                },
                grid: {
                    color: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    color: '#e91e63',
                    font: {
                        family: "'Kanit', sans-serif",
                        size: 11
                    }
                },
                min: 0,
                max: 10
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: {
                    display: true,
                    text: 'อุณหภูมิ (°C)',
                    color: '#3498db',
                    font: {
                        family: "'Kanit', sans-serif",
                        size: 12,
                        weight: 'bold'
                    }
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    color: '#3498db',
                    font: {
                        family: "'Kanit', sans-serif",
                        size: 11
                    }
                },
                min: 20,
                max: 35
            },
            y2: {
                type: 'linear' as const,
                display: false,
                position: 'right' as const,
                min: 0,
                max: 100,
                ticks: {
                    color: '#00bcd4',
                }
            }
        } : {
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
                }
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
            },
        },
    };

    return (
        <div className="chart-container">
            <div className="card chart-card">
                {/* Chart Controls */}
                <div className={`chart-controls ${darkMode ? 'dark' : ''}`}>
                    <div className="chart-control-group">
                        <span className="chart-control-label">ประเภทกราฟ:</span>
                        <button
                            onClick={() => onChartTypeChange('line')}
                            className={getButtonClass(chartType === 'line')}
                        >
                            เส้น
                        </button>
                        <button
                            onClick={() => onChartTypeChange('bar')}
                            className={getButtonClass(chartType === 'bar')}
                        >
                            แท่ง
                        </button>
                    </div>
                    
                    <div className="chart-control-group">
                        <span className="chart-control-label">ข้อมูล:</span>
                        <button
                            onClick={() => onDataTypeChange(false)}
                            className={getButtonClass(!showMultipleData)}
                        >
                            PM 2.5 อย่างเดียว
                        </button>
                        <button
                            onClick={() => onDataTypeChange(true)}
                            className={getButtonClass(showMultipleData)}
                        >
                            ข้อมูลรวม
                        </button>
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
