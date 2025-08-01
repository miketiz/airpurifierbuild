// Dashboard Types
export interface DustData {
    pm25: number;
    temperature: number;
    humidity: number;
    timestamp: string;
}

export interface HistoricalDustData {
    time: string;
    temperature: number | null;
    humidity: number | null;
    PM1: number | null;
    PM2: number | null;
    PM10: number | null;
}

export interface ApiDevice {
    device_id: string | number;
    user_id: number;
    device_name: string | null;
    location: string | null;
    connection_key: string;
    mac_id: string;
    created_at: string;
    is_active: boolean;
}

export type Device = {
    device_id: string;
    connection_key: string;
    device_name?: string;
    location?: string;
    is_active?: boolean;
    mac_id?: string;
    created_at?: string;
};

export type DeviceOptionType = {
    value: string;
    label: string;
    isActive?: boolean;
};
