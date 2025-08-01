import axios from 'axios';

const BASE_URL = "https://fastapi.mm-air.online";

// device management API
export const deviceManagementApi = {
    // ดึงรายการอุปกรณ์ตาม user_id
    getDevices: async (userId: string | number) => {
        try {
            console.log('กำลังดึงข้อมูลอุปกรณ์ของผู้ใช้:', userId);
            const response = await axios.get(`${BASE_URL}/devices/get_device?user_id=${userId}`);
            console.log('ข้อมูลอุปกรณ์ที่ได้:', response.data);

            // ตรวจสอบรูปแบบข้อมูลที่ได้รับก่อนส่งกลับ
            if (response.data && (Array.isArray(response.data.data) || response.data.data)) {
                return {
                    success: true,
                    data: response.data.data,
                };
            } else {
                // กรณีข้อมูลไม่ตรงรูปแบบที่คาดหวัง
                console.warn('ข้อมูลไม่ตรงรูปแบบที่คาดหวัง:', response.data);
                return {
                    success: true,
                    data: [],
                };
            }
        } catch (error: unknown) {
            console.error('Error fetching devices:', error);

            // ตรวจสอบ type ก่อนใช้งาน
            let message = 'ไม่สามารถดึงข้อมูลอุปกรณ์ได้';

            if (error instanceof Error) {
                message = error.message;
            }

            // ตรวจสอบ axios error
            if (axios.isAxiosError(error) && error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);

                // ถ้า backend ตอบ 404 ให้ส่ง data: [] แทน (เหมือนกับไฟล์ route เดิม)
                if (error.response.status === 404) {
                    return {
                        success: true,
                        data: [],
                    };
                }

                // ใช้ข้อมูล error จาก response ถ้ามี
                if (error.response.data?.message) {
                    message = error.response.data.message;
                }
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error), // แปลง error ให้เป็น string
                message,
                data: [],
            };
        }
    },
};

// เพิ่มในไฟล์ app/lib/deviceApi.ts
export const getDevices = async (userId: string | number) => {
    return await deviceManagementApi.getDevices(userId);
};