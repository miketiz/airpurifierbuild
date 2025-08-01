'use client'
import { useEffect, useState } from "react";
import "@/styles/profilestyle.css";
import Sidebar from "../components/Sidebar";
import { Mail, Calendar, Lock } from "lucide-react";
import { useSession } from "next-auth/react";
import { formatThaiDateTime } from "@/app/utils/formatDatetime";
import Image from "next/image";
import LoadingSpinner from "../components/LoadingSpinner"; // เพิ่ม import LoadingSpinner
import axios from "axios"; // เพิ่ม import axios
import { toast, Toaster } from "react-hot-toast"; // เพิ่ม import toast

export default function Profile() {
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(true); // เพิ่ม state สำหรับการโหลด
    const [isSaving, setIsSaving] = useState(false); // เพิ่ม state สำหรับการบันทึก
    
    // เพิ่ม state สำหรับแสดง/ซ่อนรหัสผ่าน

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // ตรวจสอบข้อมูล
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('รหัสผ่านใหม่ไม่ตรงกัน');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        if (!session?.user?.id) {
            toast.error('ไม่พบข้อมูลผู้ใช้');
            return;
        }

        setIsSaving(true);
        
        try {
            const response = await axios.post('/api/changepassword', {
                user_id: String(session.user.id),
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            if (response.data.success) {
                toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
                setIsChangingPassword(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                toast.error(response.data.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
            }
        } finally {
            setIsSaving(false);
        }
    };

    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'loading') {
            setIsLoading(true);
        } else {
            // จำลองการโหลดข้อมูลเพิ่มเติม
            setTimeout(() => {
                setIsLoading(false);
            }, 800); // ให้แสดง loading spinner สักครู่เพื่อให้เห็นเอฟเฟกต์
        }
    }, [status]);

    return (
        <div className="dashboard-container">
            <Toaster />
            <Sidebar />
            <div className="main-content">
                {isLoading ? (
                    // แสดง LoadingSpinner ขณะโหลดข้อมูล
                    <LoadingSpinner message="กำลังโหลดข้อมูลผู้ใช้..." />
                ) : (
                    <div className="profile-container">
                        <div className="profile-header">
                            <div className="profile-cover">
                                <div className="profile-avatar">
                                    <Image
                                        src={session?.user.image || "/default-profile.png"}
                                        alt="profile"
                                        width={100}
                                        height={100}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        className="profile-img"
                                        priority
                                    />
                                </div>
                            </div>
                            <div className="profile-info">
                                <h1>{session?.user.name}</h1>
                                <p className="profile-title">ผู้ใช้งานทั่วไป</p>
                            </div>
                        </div>

                        <div className="profile-content">
                            <div className="profile-section">
                                <div className="section-header">
                                    <h2>ข้อมูลส่วนตัว</h2>
                                </div>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <Mail className="info-icon" />
                                        <div className="info-detail">
                                            <label>อีเมล</label>
                                            <p>{session?.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <Calendar className="info-icon" />
                                        <div className="info-detail">
                                            <label>วันที่สมัคร</label>
                                            {session?.user?.created_at && (
                                                <span className="text-gray-600">
                                                    {formatThaiDateTime(session.user.created_at)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-section">
                                <div className="section-header">
                                    <h2>การรักษาความปลอดภัย</h2>
                                </div>
                                <div className="security-options">
                                    <button
                                        className="change-password-btn"
                                        onClick={() => setIsChangingPassword(true)}
                                    >
                                        <Lock size={18} />
                                        เปลี่ยนรหัสผ่าน
                                    </button>
                                </div>
                            </div>
                        </div>

                        {isChangingPassword && (
                            <div className="modal-overlay">
                                <div className="password-modal">
                                    <h3>เปลี่ยนรหัสผ่าน</h3>
                                    <form onSubmit={handlePasswordChange}>
                                        <div className="form-group">
                                            <label>รหัสผ่านปัจจุบัน</label>
                                            <input
                                                type="password"
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                required
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>รหัสผ่านใหม่</label>
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                required
                                                minLength={6}
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>ยืนยันรหัสผ่านใหม่</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                required
                                                minLength={6}
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <div className="form-actions">
                                            <button 
                                                type="submit" 
                                                className="save-btn"
                                                disabled={isSaving}
                                            >
                                                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                                            </button>
                                            <button
                                                type="button"
                                                className="cancel-btn"
                                                disabled={isSaving}
                                                onClick={() => {
                                                    setIsChangingPassword(false);
                                                    setPasswordData({
                                                        currentPassword: '',
                                                        newPassword: '',
                                                        confirmPassword: ''
                                                    });
                                                }}
                                            >
                                                ยกเลิก
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}