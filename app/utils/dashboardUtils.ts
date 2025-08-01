import { ApiDevice, Device } from "../types/dashboard";

// Type guard function เพื่อตรวจสอบข้อมูล
export function isApiDevice(obj: unknown): obj is ApiDevice {
    return obj !== null &&
        typeof obj === 'object' &&
        'device_id' in obj &&
        'connection_key' in obj;
}

// แปลงข้อมูลจาก API ให้เข้ากับ Device type
export function convertApiDeviceToDevice(apiDevice: ApiDevice): Device {
    return {
        device_id: String(apiDevice.device_id),
        connection_key: apiDevice.connection_key,
        device_name: apiDevice.device_name || undefined,
        location: apiDevice.location || undefined,
        is_active: apiDevice.is_active,
        mac_id: apiDevice.mac_id,
        created_at: apiDevice.created_at
    };
}

// Interface สำหรับ API response structure
interface DevicesApiResponse {
    success: boolean;
    data: ApiDevice | ApiDevice[];
}

// แปลงข้อมูล devices จาก API response
export function convertDevicesData(devicesData: DevicesApiResponse | undefined): Device[] {
    let devices: Device[] = [];

    if (devicesData?.success && devicesData.data) {
        if (Array.isArray(devicesData.data)) {
            const apiDevices = devicesData.data as ApiDevice[];
            devices = apiDevices.map(convertApiDeviceToDevice);
        } else if (devicesData.data) {
            const device = devicesData.data as ApiDevice;
            devices = [convertApiDeviceToDevice(device)];
        }
    }

    return devices;
}
