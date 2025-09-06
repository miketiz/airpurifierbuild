import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

;;
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({
                success: false,
                message: "Email address is required"
            }, { status: 400 });
        }

        console.log("Starting to send test email to:", email);

        // ข้อมูลจำลองสำหรับการทดสอบ
        const mockDevice = {
            device_name: "เครื่องฟอกอากาศห้องนอน",
            location: "ห้องนอนใหญ่",
            device_id: "TEST00123"
        };
        const mockDustLevel = 65.3;  // จำลองค่าฝุ่น
        const mockThreshold = 35.0;  // จำลองค่าที่กำหนดไว้

        // สร้าง transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT) || 465,
            secure: true, // port 465 ใช้ secure: true
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // กำหนดชื่อเครื่องและตำแหน่ง
        const deviceName = mockDevice.device_name;
        const location = mockDevice.location || "ไม่ระบุตำแหน่ง";
        
        // คำนวณความรุนแรงของค่าฝุ่น (สำหรับการแสดงผลที่แตกต่างกัน)
        const dustSeverity = mockDustLevel > 50 ? 'critical' : (mockDustLevel > 30 ? 'warning' : 'moderate');
        
        // กำหนดสีตามความรุนแรง
        const severityColors = {
            critical: '#d9534f',  // สีแดง
            warning: '#f0ad4e',   // สีส้ม
            moderate: '#5cb85c'   // สีเขียว
        };
        
        const severityColor = severityColors[dustSeverity];

        // รูปแบบอีเมลที่ดูโดดเด่นและทันสมัย
        const info = await transporter.sendMail({
            from: `"ระบบแจ้งเตือนคุณภาพอากาศ" <${process.env.SMTP_USER}>`,
            to: email,
            subject: `🚨 แจ้งเตือนด่วน: ค่าฝุ่นเกินกำหนดที่เครื่อง ${deviceName}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #f7f7f7;">
                    <!-- ส่วนหัว -->
                    <div style="background-color: ${severityColor}; padding: 20px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
                        <h1 style="margin: 0; font-size: 28px;">⚠️ แจ้งเตือนค่าฝุ่นเกินกำหนด</h1>
                    </div>
                    
                    <!-- ส่วนเนื้อหา -->
                    <div style="background-color: white; padding: 25px; border-left: 1px solid #ddd; border-right: 1px solid #ddd;">
                        <p style="font-size: 16px; line-height: 1.5; color: #333;">ระบบตรวจพบว่าค่าฝุ่นในอากาศของเครื่องฟอกอากาศของคุณ<span style="font-weight: bold; color: ${severityColor};">เกินกว่าค่าที่กำหนดไว้</span> ดังนี้:</p>
                        
                        <!-- ข้อมูลอุปกรณ์ -->
                        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid ${severityColor};">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; width: 40%;"><strong>ชื่อเครื่อง:</strong></td>
                                    <td style="padding: 8px 0;">${deviceName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;"><strong>สถานที่/ห้อง:</strong></td>
                                    <td style="padding: 8px 0;">${location}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;"><strong>ค่าฝุ่นปัจจุบัน:</strong></td>
                                    <td style="padding: 8px 0; font-weight: bold; color: ${severityColor}; font-size: 18px;">${mockDustLevel.toFixed(1)} µg/m³</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;"><strong>ค่าฝุ่นที่กำหนด:</strong></td>
                                    <td style="padding: 8px 0;">${mockThreshold.toFixed(1)} µg/m³</td>
                                </tr>
                            </table>
                        </div>
                        
                        <!-- แสดงเกจวัดแบบง่ายๆ -->
                        <div style="margin: 25px 0; background-color: #eeeeee; height: 30px; border-radius: 15px; overflow: hidden; position: relative;">
                            <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${Math.min(100, (mockDustLevel / 100) * 100)}%; background: linear-gradient(to right, #5cb85c, ${severityColor}); transition: width 1s ease;"></div>
                            <div style="position: relative; text-align: center; line-height: 30px; color: white; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">PM 2.5: ${mockDustLevel.toFixed(1)} µg/m³</div>
                        </div>
                        
                        <!-- คำแนะนำ -->
                        <div style="background-color: #e8f4fb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #3498db;">
                            <h3 style="margin-top: 0; color: #3498db;">คำแนะนำเพื่อลดค่าฝุ่น</h3>
                            <ul style="padding-left: 20px; line-height: 1.6;">
                                <li><strong>เพิ่มความเร็วพัดลม</strong> - ปรับระดับความเร็วพัดลมของเครื่องฟอกอากาศให้สูงขึ้น</li>
                                <li><strong>ปิดประตูและหน้าต่าง</strong> - ลดการไหลเข้าของฝุ่นจากภายนอก</li>
                                <li><strong>ทำความสะอาดแผ่นกรอง</strong> - ตรวจสอบและทำความสะอาดแผ่นกรองอากาศของเครื่อง</li>
                                <li><strong>ลดแหล่งกำเนิดฝุ่น</strong> - หลีกเลี่ยงกิจกรรมที่ก่อให้เกิดฝุ่นในห้อง เช่น การจุดธูป หรือการทอด/ผัดอาหาร</li>
                            </ul>
                        </div>
                        
                        <!-- ปุ่มไปยังแอป -->
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://mm-air.online/devices" style="background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">เปิดแอปพลิเคชันเพื่อควบคุมอุปกรณ์</a>
                        </div>
                    </div>
                    
                    <!-- ส่วนท้าย -->
                    <div style="background-color: #f0f0f0; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none;">
                        <p style="color: #777; margin: 5px 0; font-size: 0.9em;">นี่เป็นอีเมลอัตโนมัติจากระบบ กรุณาอย่าตอบกลับ</p>
                        <p style="color: #777; margin: 5px 0; font-size: 0.8em;">© 2025 MM-Air. All rights reserved.</p>
                    </div>
                </div>
            `,
        });
        
        console.log(`Email sent successfully. Message ID: ${info.messageId}`);
        
        return NextResponse.json({
            success: true,
            message: "Test email sent successfully",
            messageId: info.messageId
        });
    } catch (error) {
        console.error("Error sending test email:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to send test email",
            error: String(error)
        }, { status: 500 });
    }
}