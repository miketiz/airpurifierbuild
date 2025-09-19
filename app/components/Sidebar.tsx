"use client";
import "@/styles/sidebarstyle.css";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Settings, User, BarChart, Fan, Menu, LogOut, X } from "lucide-react";
import logo from "@/public/img/Logo/102.ico";
import { useTheme } from "../contexts/ThemeContext";
import { signOut } from "next-auth/react";
import { toast } from "react-hot-toast";

interface SidebarProps {
    className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { darkMode } = useTheme();

    const handleNavigation = (path: string) => {
        router.push(path);
    };

    // ตรวจสอบว่าเป็น mobile device หรือไม่
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth <= 768);
            // ถ้าเป็นมือถือให้ collapse sidebar โดยอัตโนมัติ
            if (window.innerWidth <= 768) {
                setIsCollapsed(true);
            }
        };

        // Check initially
        checkIfMobile();

        // Add listener
        window.addEventListener('resize', checkIfMobile);

        // Clean up
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    // เมื่อ route เปลี่ยน ให้ปิด sidebar บนมือถือ
    useEffect(() => {
        if (isMobile) {
            setIsCollapsed(true);
        }
    }, [pathname, isMobile]);

    // Toggle sidebar
    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);

        // ถ้าเปิด sidebar บนมือถือ ให้ป้องกันการ scroll ของหน้า
        if (isMobile && isCollapsed) {
            document.body.classList.add('sidebar-open');
        } else {
            document.body.classList.remove('sidebar-open');
        }
    };

    // แก้ไขฟังก์ชัน handleLogout
    const handleLogout = async () => {
        // แสดง toast ยืนยันการออกจากระบบ
        toast((t) => (
            <div className="confirm-logout-toast">
                <p className="confirm-logout-message">คุณต้องการออกจากระบบใช่หรือไม่?</p>
                <div className="confirm-logout-buttons">
                    <button
                        className="confirm-btn"
                        onClick={() => {
                            toast.dismiss(t.id);
                            performLogout();
                        }}
                    >
                        ยืนยัน
                    </button>
                    <button
                        className="cancel-btn"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        ยกเลิก
                    </button>
                </div>
            </div>
        ), {
            duration: 10000, // 10 วินาที
            position: 'top-center',
            style: {
                background: darkMode ? '#1f2937' : '#ffffff',
                color: darkMode ? '#f3f4f6' : '#1f2937',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                width: '300px',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
            }
        });
    };

    // ฟังก์ชันทำการออกจากระบบจริง
    const performLogout = async () => {
        try {
            await signOut({
                redirect: false,
                callbackUrl: "/login"
            });

            // แสดง Toast สำเร็จ
            toast.success("ออกจากระบบสำเร็จ", {
                icon: '👋',
                duration: 3000,
                style: {
                    borderRadius: '10px',
                    background: '#ffffff',
                    color: '#333333',
                    padding: '12px 18px',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    maxWidth: '280px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                },
                iconTheme: {
                    primary: '#22c55e',
                    secondary: '#ffffff'
                },
            });

            router.push("/login");
        } catch (error) {
            console.error("Logout error:", error);

            // แจ้งเตือนข้อผิดพลาด
            toast.error("เกิดข้อผิดพลาดขณะออกจากระบบ", {
                icon: '⚠️',
                duration: 4000,
                style: {
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
                    color: '#fff',
                    padding: '16px 24px',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                    fontSize: '15px',
                    fontWeight: '500',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                },
            });
        }
    };

    useEffect(() => {
        // เพิ่มหรือลบคลาส sidebar-collapsed จาก main-content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            if (isCollapsed) {
                mainContent.classList.add('sidebar-collapsed');
            } else {
                mainContent.classList.remove('sidebar-collapsed');
            }
        }
    }, [isCollapsed]);

    return (
        <>
            {/* Mobile menu button */}
            <button
                className={`mobile-menu-button ${darkMode ? 'dark' : ''}`}
                onClick={toggleSidebar}
                aria-label={isCollapsed ? "เปิดเมนู" : "ปิดเมนู"}
            >
                {isCollapsed ? <Menu size={24} /> : <X size={24} />}
            </button>

            {/* Sidebar overlay สำหรับมือถือ */}
            {isMobile && !isCollapsed && (
                <div
                    className="sidebar-overlay active"
                    onClick={() => setIsCollapsed(true)}
                />
            )}

            {/* Sidebar */}
            <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${className} ${darkMode ? 'dark' : ''}`}>
                <div className="sidebar-header">
                    <div
                        className="logo-container"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        style={{ cursor: 'pointer' }}
                    >
                        <Image src={logo} alt="Logo" width={50} height={50} />
                        <h1 className="logo-text">MM-AIR</h1>
                    </div>
                </div>
                <nav className="nav-menu">
                    <div
                        className={`nav-item ${pathname === '/' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/')}
                    >
                        <Home size={24} />
                        <span>หน้าหลัก</span>
                    </div>
                    <div
                        className={`nav-item ${pathname === '/devices' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/devices')}
                    >
                        <Fan size={24} />
                        <span>อุปกรณ์</span>
                    </div>
                    <div
                        className={`nav-item ${pathname === '/reports' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/reports')}
                    >
                        <BarChart size={24} />
                        <span>รายงาน</span>
                    </div>
                    <div
                        className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/profile')}
                    >
                        <User size={24} />
                        <span>โปรไฟล์</span>
                    </div>
                    <div
                        className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}
                        onClick={() => handleNavigation('/settings')}
                    >
                        <Settings size={24} />
                        <span>ตั้งค่า</span>
                    </div>
                    <div className="nav-item"
                        onClick={handleLogout}>
                        <LogOut size={24} />
                        <span>ออกจากระบบ</span>
                    </div>
                </nav>

                {/* Add close button inside sidebar for mobile */}
                {isMobile && !isCollapsed && (
                    <button
                        className="close-sidebar-btn"
                        onClick={() => setIsCollapsed(true)}
                        aria-label="ปิดเมนู"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>
        </>
    );
}
