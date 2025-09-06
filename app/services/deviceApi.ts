import axios from 'axios';

;
// กำหนดค่า API URL หลัก
const BASE_URL = '/api';

// กำหนด interfaces สำหรับ payload
export interface ControlDevicePayload {
    user_id: string | number;
    connection_key: string;
    // แก้ไขให้สอดคล้องกับค่าที่ใช้จริง
    mode: number; // เปลี่ยนจาก string เป็น number
}

export interface SchedulePayload {
    user_id: string | number;
    connection_key: string;
    enabled: boolean;
    start_time: string;
    end_time: string;
    days: boolean[];
    mode: string;
}

export interface UpdateDevicePayload {
    connection_key: string;
    device_name?: string;
    location?: string;
}

// Interface สำหรับการตั้งเวลา
export interface WorkingTimePayload {
    user_id: string | number;
    connection_key: string;
    switch_mode: boolean;      // เปิด/ปิดการทำงานตามเวลา
    start_time: string;        // เวลาเริ่มทำงาน (รูปแบบ "HH:MM")
    stop_time: string;         // เวลาหยุดทำงาน (รูปแบบ "HH:MM")
    sunday: boolean;           // ทำงานวันอาทิตย์
    monday: boolean;           // ทำงานวันจันทร์
    tuesday: boolean;          // ทำงานวันอังคาร
    wednesday: boolean;        // ทำงานวันพุธ
    thursday: boolean;         // ทำงานวันพฤหัสบดี
    friday: boolean;           // ทำงานวันศุกร์
    saturday: boolean;         // ทำงานวันเสาร์
    time_mode: number;         // โหมดการทำงาน (ตัวเลขตามที่ backend กำหนด)
}

// API เกี่ยวกับการควบคุมอุปกรณ์
export const deviceControlApi = {
    // ควบคุมความเร็วพัดลม
    controlSpeed: async (payload: ControlDevicePayload) => {
        try {
            console.log('กำลังส่งคำสั่งควบคุมความเร็ว:', payload);
            // endpoint ที่ถูกต้องคือ controller_speed
            const response = await axios.post(`${BASE_URL}/devices/controller_speed`, payload);
            console.log('ผลลัพธ์การควบคุม:', response.data);

            return {
                success: response.status === 200,
                data: response.data,
            };
        } catch (error: unknown) {
            console.error('Error controlling device speed:', error);
            // แสดงข้อมูลเพิ่มเติมเพื่อการ Debug
            if (axios.isAxiosError(error)) {
                console.error('Status:', error.response?.status);
                console.error('Response data:', error.response?.data);
            }
            return {
                success: false,
                error,
                message: error instanceof Error ? error.message : String(error)
            };
        }
    },

    // ตั้งค่าเวลาการทำงาน
    setSchedule: async (payload: SchedulePayload) => {
        try {
            console.log('กำลังส่งคำสั่งตั้งเวลา:', payload);
            const response = await axios.post(`${BASE_URL}/devices/schedule`, payload);
            return {
                success: response.status === 200,
                data: response.data,
            };
        } catch (error: unknown) {
            console.error('Error setting schedule:', error);
            if (axios.isAxiosError(error)) {
                console.error('Status:', error.response?.status);
                console.error('Response data:', error.response?.data);
            }
            return {
                success: false,
                error,
                message: error instanceof Error ? error.message : String(error)
            };
        }
    },

    // เพิ่มฟังก์ชันสำหรับตั้งเวลาการทำงาน
    setWorkingTime: async (payload: WorkingTimePayload) => {
        try {
            console.log('กำลังตั้งเวลาการทำงาน:', payload);
            const response = await axios.post(`${BASE_URL}/devices/working_time`, payload);
            console.log('ผลลัพธ์การตั้งเวลา:', response.data);

            return {
                success: response.status === 200,
                data: response.data,
            };
        } catch (error: unknown) {
            console.error('Error setting working time:', error);
            // แสดงข้อมูลเพิ่มเติมเพื่อการ Debug
            if (axios.isAxiosError(error)) {
                console.error('Status:', error.response?.status);
                console.error('Response data:', error.response?.data);
            }
            return {
                success: false,
                error,
                message: error instanceof Error ? error.message : String(error)
            };
        }
    }
};

// API เกี่ยวกับการจัดการอุปกรณ์
export const deviceManagementApi = {
    // ดึงรายการอุปกรณ์ตาม user_id
    getDevices: async (userId: string | number) => {
        try {
            console.log('กำลังดึงข้อมูลอุปกรณ์ของผู้ใช้:', userId);
            const response = await axios.get(`${BASE_URL}/devices?user_id=${userId}`);
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
            // แสดงข้อมูล error เพิ่มเติมเพื่อ debug
            if (axios.isAxiosError(error) && error.response) {
                console.error('Error status:', error.response.status);
                console.error('Error data:', error.response.data);
            }

            return {
                success: false,
                error,
                message: error instanceof Error ? error.message : String(error),
                data: [], // ส่ง empty array กลับไปเสมอเพื่อป้องกัน error
            };
        }
    },

    // สร้าง PIN สำหรับการลงทะเบียนอุปกรณ์
    generatePin: async (userId: string | number) => {
        try {
            console.log('กำลังสร้าง PIN สำหรับผู้ใช้:', userId);
            const response = await axios.post(`${BASE_URL}/device-pin`, {
                user_id: userId,
            });
            console.log('PIN ที่สร้าง:', response.data);
            return {
                success: true,
                pin_key: response.data.pin_key,
            };
        } catch (error: unknown) {
            console.error('Error generating PIN:', error);
            return {
                success: false,
                error,
                message: error instanceof Error ? error.message : String(error)
            };
        }
    },

    // อัพเดตข้อมูลอุปกรณ์
    updateDevice: async (payload: UpdateDevicePayload) => {
        try {
            console.log('กำลังอัพเดตข้อมูลอุปกรณ์:', payload);
            const response = await axios.patch(`${BASE_URL}/devices`, payload);
            console.log('ผลการอัพเดต:', response.data);
            return {
                success: response.status === 200,
                data: response.data,
            };
        } catch (error: unknown) {
            console.error('Error updating device:', error);
            return {
                success: false,
                error,
                message: error instanceof Error ? error.message : String(error)
            };
        }
    },

    // ลบอุปกรณ์
    deleteDevice: async (connectionKey: string) => {
        try {
            console.log('กำลังลบอุปกรณ์:', connectionKey);
            const response = await axios.delete(`${BASE_URL}/delete-device`, {
                data: { connection_key: connectionKey }
            });
            console.log('ผลการลบ:', response.data);
            return {
                success: response.status === 200,
                data: response.data,
            };
        } catch (error: unknown) {
            console.error('Error deleting device:', error);
            return {
                success: false,
                error,
                message: error instanceof Error ? error.message : String(error)
            };
        }
    },
};

// เพิ่มส่วนนี้เข้าไป
export const dustDataApi = {
    // ดึงข้อมูลฝุ่นปัจจุบัน
    getCurrentData: async () => {
        try {
            const response = await fetch('/api/dustdata');
            const data = await response.json();
            return {
                success: data.success,
                data: data.data,
            };
        } catch (error) {
            console.error('Error fetching current dust data:', error);
            return {
                success: false,
                error,
                data: null
            };
        }
    }
};