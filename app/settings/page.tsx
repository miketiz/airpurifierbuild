'use client'
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Bell, Moon } from "lucide-react";
import "@/styles/settingstyle.css";
import "@/styles/components.css";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

;
export default function Settings() {
    const { darkMode, toggleDarkMode } = useTheme();
    const { data: session } = useSession();
    const [dustThreshold, setDustThreshold] = useState(25);
    const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
    const [userId, setUserId] = useState("1"); // กำหนดค่าเริ่มต้นเพื่อไม่ให้เกิด error
    const [isLoading, setIsLoading] = useState(true);

    // ดึงข้อมูลเมื่อโหลดหน้า (ไม่ต้องรอ session)
    useEffect(() => {
        const fetchUserSettings = async () => {
            try {
                // ถ้ามี session และมี user.id ให้ใช้ค่านั้น
                if (session?.user?.id) {
                    setUserId(String(session.user.id));
                } else {
                    console.log("No session or user ID found, using default userId:", userId);
                }
                
                // GET ข้อมูลโดยใช้ userId ที่มีอยู่ (ค่าเริ่มต้นหรือจาก session)
                const response = await fetch(`/api/setting/GET?userId=${userId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                if (response.ok) {
                    const responseData = await response.json();
                    console.log("Settings API response:", responseData);
                    
                    // อัพเดต state ด้วยข้อมูลที่ได้รับ
                    if (responseData?.data) {
                        setDustThreshold(responseData.data.dustThreshold || 25);
                        setIsNotificationEnabled(responseData.data.isEnabled || false);
                    }
                } else {
                    console.error("Failed to fetch user settings");
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserSettings();
    }, [session, userId]); // เพิ่ม dependencies ที่จำเป็น

    // การทำงานเมื่อ session มีการเปลี่ยนแปลง (เช่น login หรือ logout)
    useEffect(() => {
        if (session?.user?.id) {
            setUserId(String(session.user.id));
        }
    }, [session]); // ไม่จำเป็นต้องมี userId เป็น dependency เพราะเราต้องการให้ทำงานเฉพาะเมื่อ session เปลี่ยน

    const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDustThreshold(Number(e.target.value));
    };

    const handleNotificationToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsNotificationEnabled(e.target.checked);
    };

    const saveThreshold = async () => {
        try {
            const response = await fetch('/api/setting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    userId, 
                    dustThreshold,  
                    isNotificationEnabled 
                }),
            });
            
            if (response.ok) {
                toast.success('บันทึกการตั้งค่าสำเร็จ');
            } else {
                const errorData = await response.json();
                toast.error(`เกิดข้อผิดพลาด: ${errorData.error || 'ไม่สามารถบันทึกการตั้งค่าได้'}`);
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
        }
    };

    // แสดง loading indicator หากกำลังโหลดข้อมูล
    if (isLoading) {
        return (
            <div className="dashboard-container">
                <Sidebar />
                <div className="main-content">
                    <div className="settings-container fade-in">
                        <h1 className="settings-title">กำลังโหลดข้อมูล...</h1>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="main-content">
                <div className="settings-container fade-in">
                    <h1 className="settings-title">ตั้งค่า</h1>
                    
                    <div className="settings-grid">
                        <div className="settings-card">
                            <div className="settings-header">
                                <Bell className="settings-icon" size={24} />
                                <h2>การแจ้งเตือน</h2>
                            </div>
                            <div className="settings-content">
                                <div className="settings-item">
                                    <label>แจ้งเตือนค่าฝุ่นเกินกำหนด</label>
                                    <input 
                                        type="checkbox" 
                                        className="toggle-switch"
                                        checked={isNotificationEnabled}
                                        onChange={handleNotificationToggle}
                                    />
                                </div>
                                <div className="settings-item">
                                    <label>ค่าฝุ่นที่ต้องการแจ้งเตือน (µg/m³)</label>
                                    <input 
                                        type="range" 
                                        min="10" 
                                        max="100" 
                                        value={dustThreshold} 
                                        onChange={handleThresholdChange} 
                                        className="threshold-slider" 
                                    />
                                    <span className="threshold-value">{dustThreshold}</span>
                                </div>
                                <div className="settings-item">
                                    <button className="save-threshold-btn" onClick={saveThreshold}>บันทึกการตั้งค่า</button>
                                </div>
                            </div>
                        </div>

                        <div className="settings-card">
                            <div className="settings-header">
                                <Moon className="settings-icon" size={24} />
                                <h2>ธีม</h2>
                            </div>
                            <div className="settings-content">
                                <div className="settings-item">
                                    <label>โหมดกลางคืน</label>
                                    <input 
                                        type="checkbox" 
                                        className="toggle-switch"
                                        checked={darkMode}
                                        onChange={toggleDarkMode}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}