"use client";

import { User } from "lucide-react";

interface WelcomeSectionProps {
    userName: string | null | undefined;
}

export default function WelcomeSection({ userName }: WelcomeSectionProps) {
    return (
        <div className="welcome-section">
            <div className="user-info">
                <User size={32} className="user-icon" />
                <h1 className="font-sriracha">ยินดีต้อนรับ, คุณ {userName}</h1>
            </div>
        </div>
    );
}
