// ไฟล์ใหม่ app/components/PasswordModal.tsx
'use client'
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface PasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export default function PasswordModal({ isOpen, onClose, userId }: PasswordModalProps) {
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    
    useEffect(() => {
        // จัดการ body overflow
        if (isOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        
        // Clean up
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [isOpen]);
    
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

        setIsSaving(true);
        
        try {
            const response = await axios.post('/api/changepassword', {
                user_id: userId,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            if (response.data.success) {
                toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
                onClose();
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
    
    if (!isOpen) return null;
    
    return (
        <div 
            className="modal-overlay" 
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="password-modal">
                <button 
                    className="modal-close-btn" 
                    onClick={onClose}
                    aria-label="ปิด"
                >
                    <X size={24} />
                </button>
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
                            onClick={onClose}
                        >
                            ยกเลิก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}