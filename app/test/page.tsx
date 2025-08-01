"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function TestEmailPage() {
    const { data: session } = useSession();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        if (session?.user?.email) {
            setEmail(session.user.email);
        }
    }, [session]);

    const handleSendEmail = async () => {
        setStatus("กำลังส่ง...");
        try {
            const res = await fetch("/api/notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus("✅ ส่งอีเมลแจ้งเตือนเรียบร้อยแล้ว");
            } else {
                setStatus(`❌ ${data.message || "เกิดข้อผิดพลาด"}`);
            }
        } catch (err) {
            setStatus("❌ ไม่สามารถเชื่อมต่อ API ได้");
            console.error(err);
        }
    };

    return (
        <main className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">ทดสอบส่งแจ้งเตือนทางอีเมล</h1>

            <label className="block mb-2">อีเมล</label>
            <input
                className="w-full p-2 border rounded mb-4"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
            />

            <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleSendEmail}
                disabled={!email}
            >
                ส่งแจ้งเตือน
            </button>

            {status && <p className="mt-4">{status}</p>}
        </main>
    );
}
