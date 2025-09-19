// Dashboard Types
export interface DustData {
    pm25: number;
    temperature: number;
    humidity: number;
    timestamp: string;
}

export interface HistoricalDustData {
    time: string;
    PM2: number;
    temperature: number;
    humidity: number;
}

export interface ApiDevice {
  device_id: string | number;
  device_name?: string;
  mac_id?: string;
  is_active?: boolean;
  location?: string; // เพิ่ม location property
  connection_key?: string;
  created_at?: string;
  // properties อื่นๆ จาก API
}

export interface Device {
  device_id: string | number;
  device_name?: string;
  name?: string;
  mac_id?: string;
  is_active?: boolean;
  location?: string; // เพิ่ม location property
  connection_key?: string;
  created_at?: string;
  // properties อื่นๆ ที่จำเป็น
}

// เพิ่ม interface สำหรับ React-Select
export interface DeviceOptionType {
  value: string;
  label: string;
  isActive?: boolean;
}
