import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: "กรุณาระบุอีเมล" }, { status: 400 });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: `"MM-AIR" <purifiermmair@gmail.com>`,
            to: email,
            subject: "🔔 แจ้งเตือนจากระบบ 🔔",
            html: `
        <h2>สวัสดีครับ</h2>
        <p>นี่คืออีเมลแจ้งเตือนจากระบบ MM-AIR</p>
        <p>คุณได้รับการแจ้งเตือนเมื่อ ${new Date().toLocaleString()}</p>
        `,
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: "ส่งอีเมลแจ้งเตือนเรียบร้อยแล้ว" });
    } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error);
        return NextResponse.json({ message: "ไม่สามารถส่งอีเมลได้" }, { status: 500 });
    }
}
