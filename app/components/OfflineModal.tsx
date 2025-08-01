"use client";

import { Wind } from "lucide-react";

interface OfflineModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function OfflineModal({ isOpen, onClose }: OfflineModalProps) {
    if (!isOpen) return null;

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.35)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    background: 'white',
                    borderRadius: 16,
                    padding: '40px 32px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    minWidth: 320,
                    textAlign: 'center',
                    position: 'relative',
                }}
                onClick={e => e.stopPropagation()}
            >
                <Wind size={48} style={{ color: '#ff4d4f', marginBottom: 16 }} />
                <h2 style={{ color: '#ff4d4f', marginBottom: 12 }}>อุปกรณ์ออฟไลน์</h2>
                <div style={{ color: '#444', fontSize: 18, marginBottom: 24 }}>
                    ไม่สามารถเชื่อมต่อกับอุปกรณ์นี้ได้ในขณะนี้ กรุณาตรวจสอบการเชื่อมต่อ
                </div>
                <button
                    style={{
                        padding: '10px 28px',
                        background: '#ff4d4f',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 16,
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                    onClick={onClose}
                >
                    ปิด
                </button>
            </div>
        </div>
    );
}
