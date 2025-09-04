import { NextResponse } from "next/server";
import axios from "axios";
import nodemailer from "nodemailer";

// สร้าง TypeScript interfaces สำหรับข้อมูลผลลัพธ์
interface AlertItem {
    userId: string | number;
    deviceId: string | number;
    deviceName?: string;
    location?: string;
    currentDust: number;
    threshold: number;
    emailSent: boolean;
}

interface SkippedItem {
    userId: string | number;
    deviceId?: string | number;
    reason: string;
}

interface ErrorItem {
    userId: string | number;
    deviceId?: string | number;
    error: string;
    details?: unknown;  // แทนที่ any ด้วย unknown
}

// เพิ่ม interface สำหรับ device
interface Device {
    device_id: string | number;
    device_name?: string;
    name?: string;  // สำหรับรองรับกรณีที่ API ส่งค่ามาในชื่อ property ที่แตกต่างกัน
    location?: string;
    [key: string]: unknown;  // อนุญาตให้มี properties อื่นๆ ได้
}

interface Results {
    alerts: AlertItem[];
    skipped: SkippedItem[];
    errors: ErrorItem[];
}

// ฟังก์ชันสำหรับส่งอีเมลแจ้งเตือน - แก้ไข any เป็น Device
async function sendAlertEmail(userEmail: string, device: Device, currentDust: number, threshold: number) {
    try {
        // สร้าง transporter สำหรับส่งอีเมล - ใช้การตั้งค่าเดียวกันกับ test-email
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
        const deviceName = device.device_name || `เครื่องฟอกอากาศ #${device.device_id}`;
        const location = device.location || "ไม่ระบุตำแหน่ง";

        console.log(`Sending alert email to ${userEmail} for device ${deviceName}`);

        // รายละเอียดอีเมล
        const mailOptions = {
            from: `"ระบบแจ้งเตือนคุณภาพอากาศ" <${process.env.SMTP_USER}>`,
            to: userEmail,
            subject: `⚠️ แจ้งเตือน: ค่าฝุ่นเกินกำหนดที่เครื่อง ${deviceName}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #d9534f;">⚠️ แจ้งเตือนค่าฝุ่นเกินกำหนด</h2>
          <p>ระบบตรวจพบว่าค่าฝุ่นในอากาศของเครื่องฟอกอากาศของคุณเกินกว่าค่าที่กำหนดไว้:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>ชื่อเครื่อง:</strong> ${deviceName}</p>
            <p><strong>สถานที่/ห้อง:</strong> ${location}</p>
            <p><strong>ค่าฝุ่นปัจจุบัน:</strong> ${currentDust} µg/m³</p>
            <p><strong>ค่าฝุ่นที่กำหนดไว้:</strong> ${threshold} µg/m³</p>
          </div>
          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">คำแนะนำ</h3>
            <ul>
              <li>เพิ่มความเร็วพัดลมของเครื่องฟอกอากาศ</li>
              <li>ปิดประตูและหน้าต่างเพื่อลดฝุ่นจากภายนอก</li>
              <li>ทำความสะอาดแผ่นกรองอากาศของเครื่อง</li>
              <li>หลีกเลี่ยงกิจกรรมที่ก่อให้เกิดฝุ่นในห้อง</li>
            </ul>
          </div>
          <p>คุณสามารถตรวจสอบสถานะปัจจุบันและควบคุมเครื่องฟอกอากาศได้ผ่านแอปพลิเคชันของเรา</p>
          <p style="color: #777; margin-top: 30px; font-size: 0.9em;">นี่เป็นอีเมลอัตโนมัติจากระบบ กรุณาอย่าตอบกลับ</p>
        </div>
      `,
        };

        // ส่งอีเมล
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${userEmail} for device ${device.device_id}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`Failed to send email to ${userEmail}:`, error);
        return { success: false, error };
    }
}

// API endpoint สำหรับตรวจสอบค่าฝุ่นและส่งการแจ้งเตือน
export async function GET() {
    try {
        console.log("Starting dust level monitoring...");

        // 1. ดึงข้อมูลผู้ใช้ทั้งหมด
        const usersResponse = await axios.get('https://fastapi.mm-air.online/users');
        const users = usersResponse.data || [];

        console.log(`Found ${users.length} users`);

        // กำหนด type ให้กับ results object
        const results: Results = {
            alerts: [],
            skipped: [],
            errors: []
        };

        // 2. ตรวจสอบแต่ละผู้ใช้
        for (const user of users) {
            try {
                // ตรวจสอบว่า user.id มีค่าหรือไม่
                if (!user.id) {
                    console.log(`User with no ID found, skipping`);
                    continue;
                }

                const userId = user.id; // เก็บไว้ใช้ให้สอดคล้องกันทั้งไฟล์
                console.log(`Checking user: ${userId}`);

                // 3. ดึงการตั้งค่าการแจ้งเตือนของผู้ใช้
                const settingsResponse = await axios.get(`https://fastapi.mm-air.online/user/notification_get?user_id=${userId}`);
                const userSettings = settingsResponse.data.data;

                // 4. ตรวจสอบว่าผู้ใช้เปิดการแจ้งเตือนไว้หรือไม่
                if (!userSettings.notification) {
                    console.log(`User ${userId}: notifications disabled, skipping`);
                    results.skipped.push({
                        userId: userId,
                        reason: "notifications_disabled"
                    });
                    continue;
                }

                const dustThreshold = Number(userSettings.dust) || 25;
                console.log(`User ${userId}: checking devices with threshold ${dustThreshold}`);

                // 5. ดึงข้อมูลอุปกรณ์ของผู้ใช้
                const devicesResponse = await axios.get(`https://fastapi.mm-air.online/user/${userId}/devices`);
                const devices = devicesResponse.data.data || [];

                console.log(`User ${userId} has ${devices.length} devices`);

                // 6. ตรวจสอบแต่ละอุปกรณ์
                for (const device of devices as Device[]) {
                    try {
                        // ตรวจสอบว่า device.device_id มีค่าหรือไม่
                        if (!device.device_id) {
                            console.log(`Device with no ID found for user ${userId}, skipping`);
                            continue;
                        }

                        const deviceId = device.device_id; // เก็บไว้ใช้ให้สอดคล้องกันทั้งไฟล์
                        console.log(`Checking device ${deviceId}`);

                        // 7. ดึงข้อมูลค่าฝุ่นล่าสุดของอุปกรณ์
                        const dustResponse = await axios.get(`https://fastapi.mm-air.online/device/dust/${deviceId}`);
                        const currentDust = dustResponse.data.dust;

                        console.log(`Device ${deviceId}: current dust ${currentDust}, threshold ${dustThreshold}`);

                        // 8. ตรวจสอบว่าค่าฝุ่นเกินกำหนดหรือไม่
                        if (currentDust > dustThreshold) {
                            console.log(`Alert needed: Device ${deviceId} has dust level ${currentDust} > ${dustThreshold}`);

                            // 9. ตรวจสอบว่าเคยส่งการแจ้งเตือนไปเมื่อไม่นานมานี้หรือไม่
                            const recentNotificationsResponse = await axios.get(
                                `https://fastapi.mm-air.online/notification/recent?user_id=${userId}&device_id=${deviceId}&hours=1`
                            );

                            if (recentNotificationsResponse.data.has_recent) {
                                console.log(`Skipping alert for device ${deviceId} - already sent recently`);
                                results.skipped.push({
                                    userId: userId,
                                    deviceId: deviceId,
                                    reason: "recently_notified"
                                });
                                continue;
                            }

                            // 10. ส่งอีเมลแจ้งเตือน
                            const emailResult = await sendAlertEmail(
                                user.email,
                                device,
                                currentDust,
                                dustThreshold
                            );

                            // 11. บันทึกการแจ้งเตือน
                            if (emailResult.success) {
                                await axios.post('https://fastapi.mm-air.online/notification/log', {
                                    user_id: userId,
                                    device_id: deviceId,
                                    message: `ค่าฝุ่น ${currentDust} µg/m³ เกินค่าที่กำหนด ${dustThreshold} µg/m³`,
                                    dust_level: currentDust,
                                    notification_type: 'email',
                                    status: 'sent'
                                });

                                // แก้ไข property device_name เป็น deviceName และ location ให้ถูกต้อง
                                results.alerts.push({
                                    userId: userId,
                                    deviceId: deviceId,
                                    deviceName: device.device_name || device.name,
                                    location: device.location,
                                    currentDust,
                                    threshold: dustThreshold,
                                    emailSent: true
                                });
                            } else {
                                results.errors.push({
                                    userId: userId,
                                    deviceId: deviceId,
                                    error: "Failed to send email",
                                    details: emailResult.error
                                });
                            }
                        }
                    } catch (deviceError) {
                        console.error(`Error checking device ${device.device_id}:`, deviceError);
                        results.errors.push({
                            userId: userId,
                            deviceId: device.device_id,
                            error: String(deviceError)
                        });
                    }
                }
            } catch (userError) {
                console.error(`Error processing user ${user.id}:`, userError);
                results.errors.push({
                    userId: user.id,
                    error: String(userError)
                });
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results: {
                alerts: results.alerts.length,
                skipped: results.skipped.length,
                errors: results.errors.length,
                details: {
                    alerts: results.alerts,
                    skipped: results.skipped,
                    errors: results.errors
                }
            }
        });
    } catch (error) {
        console.error("Error in dust monitoring:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to monitor dust levels",
            error: String(error)
        }, { status: 500 });
    }
}