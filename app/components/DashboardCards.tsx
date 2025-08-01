"use client";

import { Thermometer, Droplets, Wind } from "lucide-react";
import { Device } from "../types/dashboard";

interface DashboardCardsProps {
    selectedDevice: Device | null;
    isDustLoading: boolean;
    pm25: number;
    temperature: number;
    humidity: number;
}

export default function DashboardCards({
    selectedDevice,
    isDustLoading,
    pm25,
    temperature,
    humidity
}: DashboardCardsProps) {
    // ฟังก์ชันแสดงสถานะคุณภาพอากาศ
    const getAirQualityStatus = (pm25Value: number) => {
        if (pm25Value <= 25) return "ดี";
        if (pm25Value <= 50) return "ปานกลาง";
        if (pm25Value <= 100) return "แย่";
        return "อันตราย";
    };

    return (
        <div className="dashboard-grid">
            {/* Status Card */}
            <div className="card status-card">
                <h2 className="font-sriracha status-working">สถานะการทำงาน</h2>
                <div className="status-badge">
                    {selectedDevice?.is_active ? (
                        <span className="status-active">กำลังทำงาน</span>
                    ) : (
                        <span className="status-inactive">ไม่ทำงาน</span>
                    )}
                </div>
            </div>

            {/* Dust Card */}
            <div className="card dust-card">
                <h2 className="font-sriracha">ฝุ่นภายในห้อง</h2>
                <div className="dust-info">
                    <Wind size={40} className="dust-icon" />
                    <div className="dust-value">
                        {!selectedDevice?.is_active ? (
                            <span className="device-inactive">อุปกรณ์ปิดอยู่</span>
                        ) : isDustLoading ? (
                            <span className="loading font-sriracha">กำลังโหลด...</span>
                        ) : (
                            <>
                                <span className="value">{pm25}</span>
                                <span className="unit">µg/m³</span>
                            </>
                        )}
                    </div>
                </div>
                {selectedDevice?.is_active && (
                    <p className="dust-status">คุณภาพอากาศ: {getAirQualityStatus(pm25)}</p>
                )}
            </div>

            {/* Environment Card */}
            <div className="card env-card">
                <h2 className="font-sriracha">สภาพแวดล้อม</h2>

                {!selectedDevice?.is_active ? (
                    <div className="env-inactive">
                        <span className="device-inactive">อุปกรณ์ปิดอยู่</span>
                    </div>
                ) : (
                    <div className="env-info">
                        <div className="env-item">
                            <Thermometer size={32} className="env-icon" />
                            <div className="env-value">
                                {isDustLoading ? (
                                    <span className="loading">กำลังโหลด...</span>
                                ) : (
                                    <>
                                        <span className="value">{temperature}</span>
                                        <span className="unit">°C</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="env-item">
                            <Droplets size={32} className="env-icon" />
                            <div className="env-value">
                                {isDustLoading ? (
                                    <span className="loading">กำลังโหลด...</span>
                                ) : (
                                    <>
                                        <span className="value">{humidity}</span>
                                        <span className="unit">%</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
