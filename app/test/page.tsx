"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar";

export default function TestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // ทดสอบส่งอีเมลโดยตรง
  const testSendEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("ส่งอีเมลทดสอบสำเร็จ!");
      } else {
        toast.error(`ไม่สามารถส่งอีเมลได้: ${data.message}`);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการส่งอีเมล");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ทดสอบระบบตรวจสอบฝุ่น
  const testDustChecker = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dust-checker");
      const data = await response.json();

      toast.success(
        `ตรวจสอบสำเร็จ! แจ้งเตือน: ${data.results.alerts}, ข้าม: ${data.results.skipped}, ผิดพลาด: ${data.results.errors}`
      );
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบค่าฝุ่น");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <div className="settings-container fade-in">
          <h1 className="settings-title">ทดสอบการส่งอีเมล</h1>

          <div className="settings-grid">
            <div className="settings-card">
              <div className="settings-header">
                <h2>ทดสอบส่งอีเมลโดยตรง</h2>
              </div>
              <div className="settings-content">
                <div className="settings-item">
                  <label>อีเมล</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="กรอกอีเมลที่ต้องการทดสอบ"
                    className="input-field"
                    style={{
                      padding: "8px",
                      width: "100%",
                      marginTop: "5px",
                    }}
                  />
                </div>
                <div className="settings-item">
                  <button
                    className="save-threshold-btn"
                    onClick={testSendEmail}
                    disabled={loading || !email}
                  >
                    {loading ? "กำลังส่ง..." : "ส่งอีเมลทดสอบ"}
                  </button>
                </div>
              </div>
            </div>

            <div className="settings-card">
              <div className="settings-header">
                <h2>ทดสอบระบบตรวจสอบค่าฝุ่น</h2>
              </div>
              <div className="settings-content">
                <div className="settings-item">
                  <p>
                    การทดสอบนี้จะตรวจสอบค่าฝุ่นสำหรับผู้ใช้ทุกคนและส่งการแจ้งเตือนหากเกินกำหนด
                  </p>
                </div>
                <div className="settings-item">
                  <button
                    className="save-threshold-btn"
                    onClick={testDustChecker}
                    disabled={loading}
                  >
                    {loading ? "กำลังตรวจสอบ..." : "ทดสอบตรวจสอบค่าฝุ่น"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
