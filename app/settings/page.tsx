'use client'
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Bell, Moon } from "lucide-react";
import "@/styles/settingstyle.css";
import "@/styles/components.css";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";

export default function Settings() {
    const { darkMode, toggleDarkMode } = useTheme();
    const { data: session } = useSession();
    const [dustThreshold, setDustThreshold] = useState(25);
    const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // ดึงข้อมูลการตั้งค่าเมื่อโหลดหน้า
    useEffect(() => {
        const fetchUserSettings = async () => {
            try {
                setIsLoading(true);
                
                const currentUserId = session?.user?.id ? String(session.user.id) : "1";
                
                console.log("Fetching settings for user:", currentUserId);
                
                const response = await fetch(`/api/setting/GET?userId=${currentUserId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                const responseData = await response.json();
                console.log("Settings API response:", responseData);
                
                if (response.ok && responseData.success && responseData.data) {
                    // มีข้อมูลการตั้งค่า - ใช้ค่าที่บันทึกไว้
                    setDustThreshold(responseData.data.dustThreshold || 25);
                    setIsNotificationEnabled(responseData.data.isEnabled || false);
                    
                    console.log("✅ Loaded saved settings:", {
                        dustThreshold: responseData.data.dustThreshold || 25,
                        isNotificationEnabled: responseData.data.isEnabled || false
                    });
                    
                    toast.success(`โหลดการตั้งค่าสำเร็จ - ค่าฝุ่น: ${responseData.data.dustThreshold || 25} µg/m³`, {
                        duration: 2000
                    });
                    
                } else if (response.status === 404 || responseData.error?.includes('404')) {
                    // ไม่พบข้อมูลการตั้งค่า - ใช้ค่าเริ่มต้น
                    console.log("ℹ️ No settings found, using default values");
                    setDustThreshold(25);
                    setIsNotificationEnabled(false);
                    toast("ยังไม่มีการตั้งค่า จะใช้ค่าเริ่มต้น", {
                        duration: 2000,
                        icon: "ℹ️"
                    });
                } else {
                    // เกิดข้อผิดพลาดอื่นๆ
                    console.error("❌ Error fetching settings:", responseData.error);
                    setDustThreshold(25);
                    setIsNotificationEnabled(false);
                    toast.error("ไม่สามารถโหลดการตั้งค่าได้ ใช้ค่าเริ่มต้น", {
                        duration: 3000
                    });
                }
                
            } catch (error) {
                console.error("❌ Network error fetching settings:", error);
                
                setDustThreshold(25);
                setIsNotificationEnabled(false);
                toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ ใช้ค่าเริ่มต้น", {
                    duration: 3000
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserSettings();
    }, [session?.user?.id]); // ใช้เฉพาะ session?.user?.id เป็น dependency

    const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDustThreshold(Number(e.target.value));
    };

    const handleNotificationToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsNotificationEnabled(e.target.checked);
    };

    const saveThreshold = async () => {
        try {
            const currentUserId = session?.user?.id ? String(session.user.id) : "1";
            
            console.log("💾 Saving settings:", {
                userId: currentUserId,
                dustThreshold,
                isNotificationEnabled
            });
            
            toast.loading("กำลังบันทึก...", { id: "save-settings" });
            
            const response = await fetch('/api/setting', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    userId: currentUserId, 
                    dustThreshold,  
                    isNotificationEnabled 
                }),
            });
            
            const responseData = await response.json();
            
            if (response.ok && responseData.success) {
                console.log("✅ Settings saved successfully");
                toast.success(`บันทึกสำเร็จ - ค่าฝุ่น: ${dustThreshold} µg/m³`, { 
                    id: "save-settings",
                    duration: 3000
                });
            } else {
                console.error("❌ Failed to save settings:", responseData);
                toast.error(`เกิดข้อผิดพลาด: ${responseData.error || 'ไม่สามารถบันทึกการตั้งค่าได้'}`, {
                    id: "save-settings"
                });
            }
        } catch (error) {
            console.error("❌ Error saving settings:", error);
            toast.error('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า', {
                id: "save-settings"
            });
        }
    };

    // แสดง loading indicator หากกำลังโหลดข้อมูล
    if (isLoading) {
        return (
            <div className={`dashboard-container ${darkMode ? 'dark' : ''}`}>
                <Sidebar />
                <div className="main-content">
                    <div className="settings-container fade-in">
                        <h1 className="settings-title">กำลังโหลดการตั้งค่า...</h1>
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`dashboard-container ${darkMode ? 'dark' : ''}`}>
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
                                    <button className="save-threshold-btn" onClick={saveThreshold}>
                                        บันทึกการตั้งค่า
                                    </button>
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