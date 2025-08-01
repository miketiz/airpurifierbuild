import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { user_id, currentPassword, newPassword } = await request.json();

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!user_id || !currentPassword || !newPassword) {
            return NextResponse.json({
                success: false,
                message: 'ข้อมูลไม่ครบถ้วน'
            }, { status: 400 });
        }

        // ตรวจสอบความยาวรหัสผ่านใหม่
        if (newPassword.length < 6) {
            return NextResponse.json({
                success: false,
                message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'
            }, { status: 400 });
        }

        // เรียก API ภายนอก - ใช้ query parameters
        console.log('Sending data:', {
            user_id: user_id,
            old_password: currentPassword,
            new_password: newPassword
        });

        // สร้าง URL พร้อม query parameters
        const url = new URL('https://fastapi.mm-air.online/user/change_password');
        url.searchParams.append('user_id', user_id);
        url.searchParams.append('old_password', currentPassword);
        url.searchParams.append('new_password', newPassword);

        const response = await fetch(url.toString(), {
            method: 'POST'
        });

        const data = await response.json();

        console.log('External API response:', data);
        console.log('Response status:', response.status);

        // ตรวจสอบความสำเร็จจาก status code แทน
        if (response.ok) {
            return NextResponse.json({
                success: true,
                message: data.message || 'เปลี่ยนรหัสผ่านสำเร็จ'
            });
        } else {
            return NextResponse.json({
                success: false,
                message: data.message || data.detail || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน'
            }, { status: response.status || 400 });
        }

    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
        }, { status: 500 });
    }
}
