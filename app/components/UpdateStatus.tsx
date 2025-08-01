"use client";

import { QueryClient } from "@tanstack/react-query";

interface UpdateStatusProps {
    lastUpdated: Date | null;
    updateCount: number;
    isRefetchingDust: boolean;
    queryClient: QueryClient;
}

export default function UpdateStatus({
    lastUpdated,
    updateCount,
    isRefetchingDust,
    queryClient
}: UpdateStatusProps) {
    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['currentDust'] });
        queryClient.invalidateQueries({ queryKey: ['historicalDust'] });
        queryClient.invalidateQueries({ queryKey: ['devices'] });
    };

    return (
        <div className="update-status-container">
            <div className="last-updated-info">
                <div>
                    <span>อัพเดตล่าสุด: </span>
                    <span className="time-value">
                        {lastUpdated ? lastUpdated.toLocaleTimeString('th-TH') : '-'}
                    </span>
                </div>
                <div className="update-stats">
                    <span className="update-count">
                        อัพเดตแล้ว {updateCount} ครั้ง
                    </span>
                    {isRefetchingDust ? (
                        <span className="refreshing">กำลังดึงข้อมูล...</span>
                    ) : (
                        <span className="update-indicator"></span>
                    )}
                </div>
            </div>
            
            <button 
                className="refresh-button" 
                onClick={handleRefresh}
                disabled={isRefetchingDust}
            >
                รีเฟรชข้อมูลตอนนี้
            </button>
        </div>
    );
}
