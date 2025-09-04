"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "../components/Sidebar";
import {
    Fan, Power, Moon, Gauge, Thermometer, Droplets, Clock,
    PlusCircle, Settings, AirVent, Wind
} from "lucide-react";
import "@/styles/devicestyle.css";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import Select, {
    components,
    OptionProps,
    SingleValueProps,
    DropdownIndicatorProps,
    GroupBase
} from "react-select";
import EmptyDeviceState from "../components/EmptyDeviceState"; // เพิ่ม import
import LoadingSpinner from "../components/LoadingSpinner";
// นำเข้า API Services
import { deviceManagementApi, ControlDevicePayload, WorkingTimePayload } from '../services/deviceApi';
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentDustData } from "../hooks/useDustData";
import {
    useDevices,
    useDeviceStatus,
    useDeviceControl,
    useWorkingTime,
    useSetWorkingTime
} from "../hooks/useDeviceData";


// กำหนด type สำหรับ device
type Device = {
    device_id: string;
    connection_key: string;
    device_name?: string;
    location?: string;
    is_active?: boolean;
};

// กำหนด type สำหรับ option ของ react-select
type DeviceOptionType = {
    value: string;
    label: string;
    isActive?: boolean;
};

// Custom components สำหรับ react-select
const DeviceOption = (props: OptionProps<DeviceOptionType, false, GroupBase<DeviceOptionType>>) => (
    <components.Option {...props}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
            <div
                style={{
                    backgroundColor: props.isSelected ? '#e6f7ff' : '#f0f8ff',
                    borderRadius: '50%',
                    padding: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <AirVent size={18} style={{ color: props.isSelected ? '#0095ff' : '#66b3ff' }} />
            </div>
            <span>{props.data.label}</span>
            <span
                style={{
                    fontSize: '12px',
                    background: props.data.isActive ? '#e6ffed' : '#ffeaea',
                    color: props.data.isActive ? '#52c41a' : '#ff4d4f',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    marginLeft: 'auto',
                }}
            >
                {props.data.isActive ? 'กำลังทำงาน' : 'ไม่ทำงาน'}
            </span>
        </div>
    </components.Option>
);

const DeviceSingleValue = (props: SingleValueProps<DeviceOptionType, false, GroupBase<DeviceOptionType>>) => (
    <components.SingleValue {...props}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
                style={{
                    backgroundColor: '#f0f8ff',
                    borderRadius: '50%',
                    padding: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <AirVent size={16} style={{ color: '#0095ff' }} />
            </div>
            <span>{props.data.label}</span>
            <span
                style={{
                    fontSize: '12px',
                    background: props.data.isActive ? '#e6ffed' : '#ffeaea',
                    color: props.data.isActive ? '#52c41a' : '#ff4d4f',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    marginLeft: 10,
                }}
            >
                {props.data.isActive ? 'กำลังทำงาน' : 'ไม่ทำงาน'}
            </span>
        </div>
    </components.SingleValue>
);

const DropdownIndicator = (props: DropdownIndicatorProps<DeviceOptionType, false, GroupBase<DeviceOptionType>>) => {
    return (
        <components.DropdownIndicator {...props}>
            <Wind size={18} style={{ color: "#66b3ff" }} />
        </components.DropdownIndicator>
    );
};

export default function Devices() {
    const [power, setPower] = useState(false);
    // state สำหรับ modal อุปกรณ์ออฟไลน์
    const [showOfflineModal, setShowOfflineModal] = useState(false);
    const [mode, setMode] = useState('off');
    const [pm25, setPm25] = useState(0);
    const [temperature, setTemperature] = useState(0);
    const [humidity, setHumidity] = useState(0);
    const [aqi, setAqi] = useState(0);
    const [airQualityStatus, setAirQualityStatus] = useState('');
    const [scheduleEnabled, setScheduleEnabled] = useState(false);
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('18:00');
    const [scheduleDays, setScheduleDays] = useState([
        false, true, true, true, true, true, false
    ]);
    const [scheduleMode, setScheduleMode] = useState('medium');

    // เพิ่ม state สำหรับจำลองว่ามีเครื่องหรือไม่
    const [hasDevice, setHasDevice] = useState(false);

    const { data: session } = useSession();
    const [generatedPin, setGeneratedPin] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [deviceList, setDeviceList] = useState<Device[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [editName, setEditName] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [showPinModal, setShowPinModal] = useState(false);
    const [showDeviceSetting, setShowDeviceSetting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteDeviceId, setDeleteDeviceId] = useState<string | null>(null);

    const [isControlling, setIsControlling] = useState<boolean>(false); // เพิ่ม state เพื่อเก็บสถานะ loading

    // เพิ่ม state สำหรับการอัพเดตล่าสุด
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    
    // เพิ่ม state เพื่อระบุว่าเป็นเครื่องใหม่หรือไม่
    const [isNewDeviceAdded, setIsNewDeviceAdded] = useState<boolean>(false);

    const queryClient = useQueryClient();

    const calculateAQI = (pm25Value: number) => {
        if (pm25Value <= 12.0) return Math.round((50 - 0) / (12.0 - 0) * (pm25Value - 0) + 0);
        else if (pm25Value <= 35.4) return Math.round((100 - 51) / (35.4 - 12.1) * (pm25Value - 12.1) + 51);
        else if (pm25Value <= 55.4) return Math.round((150 - 101) / (55.4 - 35.5) * (pm25Value - 35.5) + 101);
        else if (pm25Value <= 150.4) return Math.round((200 - 151) / (150.4 - 55.5) * (pm25Value - 55.5) + 151);
        else if (pm25Value <= 250.4) return Math.round((300 - 201) / (250.4 - 150.5) * (pm25Value - 150.5) + 201);
        else if (pm25Value <= 350.4) return Math.round((400 - 301) / (350.4 - 250.5) * (pm25Value - 250.5) + 301);
        else return Math.round((500 - 401) / (500.4 - 350.5) * (pm25Value - 350.5) + 401);
    };

    const getAirQualityStatus = (aqiValue: number) => {
        if (aqiValue <= 50) return "ดีมาก";
        if (aqiValue <= 100) return "ดี";
        if (aqiValue <= 150) return "ปานกลาง";
        if (aqiValue <= 200) return "แย่";
        if (aqiValue <= 300) return "แย่มาก";
        return "อันตราย";
    };

    // ใช้ React Query สำหรับข้อมูลอุปกรณ์
    const {
        data: devicesData,
        isLoading: isDeviceDataLoading
    } = useDevices(session?.user?.id ? String(session.user.id) : undefined);

    // ใช้ React Query สำหรับสถานะเครื่อง
    const {
        data: deviceStatusData
    } = useDeviceStatus(selectedDevice?.connection_key, session?.user?.id ? String(session.user.id) : undefined);

    // ใช้ React Query สำหรับการตั้งเวลา
    const {
        data: workingTimeData
    } = useWorkingTime(selectedDevice?.connection_key, session?.user?.id ? String(session.user.id) : undefined);

    // ใช้ Mutation สำหรับการควบคุมเครื่อง
    const deviceControl = useDeviceControl();

    // ใช้ Mutation สำหรับการตั้งเวลา
    const setWorkingTime = useSetWorkingTime();

    // ใช้ React Query สำหรับข้อมูลฝุ่น
    const {
        data: currentDustData,
        isLoading: isDustLoading,
        isRefetching: isRefetchingDust
    } = useCurrentDustData(selectedDevice?.connection_key);

    // แก้ไข useEffect เพื่ออัพเดต state จากข้อมูลอุปกรณ์
    useEffect(() => {
        if (devicesData?.success && devicesData.data) {
            const devices: Device[] = Array.isArray(devicesData.data)
                ? devicesData.data
                : devicesData.data
                    ? [devicesData.data]
                    : [];

            setDeviceList(devices);
            setHasDevice(devices.length > 0);

            // ป้องกันการเขียนทับเครื่องที่เลือกแล้ว
            if (devices.length > 0 && !selectedDevice) {
                const firstDevice = devices[0];
                setSelectedDevice(firstDevice);
                
                // ตั้งสถานะเริ่มต้น แต่ไม่ดึงจาก backend ทันที
                setPower(false);
                setMode('off');
            }
        }
    }, [devicesData, selectedDevice]);

    // แก้ไข useEffect เพื่ออัพเดต state จากข้อมูลสถานะเครื่อง
    useEffect(() => {
        // ถ้าเครื่องไม่ทำงาน ให้แสดงสถานะเป็นปิดเลย
        if (selectedDevice && !selectedDevice.is_active) {
            setPower(false);
            setMode('off');
            return;
        }
        
        if (deviceStatusData?.success && deviceStatusData.data && selectedDevice) {
            const deviceStatus = deviceStatusData.data;

            // แปลงค่า mode จากตัวเลขเป็นข้อความ
            const modeNumber = Number(deviceStatus.mode);
            const stringMode = getStringMode(modeNumber);

            // อัพเดตสถานะ UI ตามข้อมูลจริงจาก backend เฉพาะเมื่อไม่ใช่เครื่องใหม่
            if (deviceStatus.connection_key === selectedDevice.connection_key && !isNewDeviceAdded) {
                setPower(modeNumber !== 0); // mode 0 คือ off
                setMode(stringMode);
            }
        }
    }, [deviceStatusData, selectedDevice, isNewDeviceAdded]);

    // แก้ไข useEffect เพื่ออัพเดต state จากข้อมูลการตั้งเวลา
    useEffect(() => {
        if (workingTimeData?.success && workingTimeData.data) {
            const scheduleData = workingTimeData.data;

            // อัพเดตข้อมูลการตั้งเวลาใน UI
            setScheduleEnabled(scheduleData.switch_mode);
            setStartTime(scheduleData.start_time);
            setEndTime(scheduleData.stop_time);
            setScheduleDays([
                scheduleData.sunday,
                scheduleData.monday,
                scheduleData.tuesday,
                scheduleData.wednesday,
                scheduleData.thursday,
                scheduleData.friday,
                scheduleData.saturday
            ]);

            // แปลง time_mode เป็นชื่อโหมด
            const timeMode = getStringMode(scheduleData.time_mode);
            setScheduleMode(timeMode);
        }
    }, [workingTimeData]);

    // เพิ่ม useEffect สำหรับอัพเดตข้อมูลฝุ่น ใส่หลังจาก useEffect ของ workingTimeData
    useEffect(() => {
        if (currentDustData?.success && currentDustData.data) {
            try {
                const dustData = currentDustData.data;

                // แปลงค่า PM2.5 หรือใช้ค่า 0 ถ้าไม่มีข้อมูล
                const pm25Value = dustData.pm25 ? parseFloat(dustData.pm25) : 0;
                if (!isNaN(pm25Value)) {
                    setPm25(pm25Value);

                    // คำนวณ AQI จากค่า PM2.5
                    const aqiValue = calculateAQI(pm25Value);
                    setAqi(aqiValue);
                    setAirQualityStatus(getAirQualityStatus(aqiValue));
                } else {
                    setPm25(0);
                    setAqi(0);
                    setAirQualityStatus("ไม่มีข้อมูล");
                }

                // แปลงค่าอุณหภูมิหรือใช้ค่า 0 ถ้าไม่มีข้อมูล
                const tempValue = dustData.temperature ? parseFloat(dustData.temperature) : 0;
                setTemperature(!isNaN(tempValue) ? tempValue : 0);

                // แปลงค่าความชื้นหรือใช้ค่า 0 ถ้าไม่มีข้อมูล
                const humidValue = dustData.humidity ? parseFloat(dustData.humidity) : 0;
                setHumidity(!isNaN(humidValue) ? humidValue : 0);

                // อัพเดตเวลาล่าสุด
                setLastUpdated(new Date());
            } catch (err) {
                console.error("Error processing dust data:", err);
                // หากเกิดข้อผิดพลาดในการประมวลผลข้อมูล ให้แสดงค่าเป็น 0 ทั้งหมด
                setPm25(0);
                setAqi(0);
                setTemperature(0);
                setHumidity(0);
                setAirQualityStatus("ไม่มีข้อมูล");
            }
        } else {
            // กรณีไม่มีข้อมูลหรือ API ไม่สำเร็จ
            setPm25(0);
            setAqi(0);
            setTemperature(0);
            setHumidity(0);
        }
    }, [currentDustData, selectedDevice]);

    // อัพเดตการจัดการค่าฝุ่นเมื่อเปลี่ยนเครื่อง
    useEffect(() => {
        // ถ้าเปลี่ยนเครื่องให้รีเซ็ตค่าเป็น 0 ก่อน
        if (!currentDustData || !selectedDevice) {
            setPm25(0);
            setAqi(0);
            setTemperature(0);
            setHumidity(0);
            setAirQualityStatus("ไม่มีข้อมูล");
            setLastUpdated(null);
            return;
        }

        if (currentDustData?.success && currentDustData.data) {
            try {
                const dustData = currentDustData.data;

                // แปลงค่า PM2.5 หรือใช้ค่า 0 ถ้าไม่มีข้อมูล
                const pm25Value = dustData.pm25 ? parseFloat(dustData.pm25) : 0;
                if (!isNaN(pm25Value)) {
                    setPm25(pm25Value);

                    // คำนวณ AQI จากค่า PM2.5
                    const aqiValue = calculateAQI(pm25Value);
                    setAqi(aqiValue);
                    setAirQualityStatus(getAirQualityStatus(aqiValue));
                } else {
                    setPm25(0);
                    setAqi(0);
                    setAirQualityStatus("ไม่มีข้อมูล");
                }

                // แปลงค่าอุณหภูมิหรือใช้ค่า 0 ถ้าไม่มีข้อมูล
                const tempValue = dustData.temperature ? parseFloat(dustData.temperature) : 0;
                setTemperature(!isNaN(tempValue) ? tempValue : 0);

                // แปลงค่าความชื้นหรือใช้ค่า 0 ถ้าไม่มีข้อมูล
                const humidValue = dustData.humidity ? parseFloat(dustData.humidity) : 0;
                setHumidity(!isNaN(humidValue) ? humidValue : 0);

                // อัพเดตเวลาล่าสุด
                setLastUpdated(new Date());
            } catch (err) {
                console.error("Error processing dust data:", err);
                // หากเกิดข้อผิดพลาดในการประมวลผลข้อมูล ให้แสดงค่าเป็น 0 ทั้งหมด
                setPm25(0);
                setAqi(0);
                setTemperature(0);
                setHumidity(0);
                setAirQualityStatus("ไม่มีข้อมูล");
            }
        } else {
            // กรณีไม่มีข้อมูลหรือ API ไม่สำเร็จ
            setPm25(0);
            setAqi(0);
            setTemperature(0);
            setHumidity(0);
            setAirQualityStatus("ไม่มีข้อมูล");
        }
    }, [currentDustData, selectedDevice]);  // แก้ไขให้ใช้ selectedDevice แทน selectedDevice?.connection_key

    // แก้ไขฟังก์ชัน handlePowerToggle
    const handlePowerToggle = () => {
        // ตรวจสอบสถานะเครื่องก่อน
        if (!selectedDevice?.is_active) {
            toast.error("ไม่สามารถควบคุมเครื่องได้ เนื่องจากเครื่องไม่ได้เชื่อมต่อ");
            return;
        }

        // ถ้าปัจจุบันปิดอยู่ ให้เปิดด้วยโหมด medium, ถ้าเปิดอยู่ให้ปิด
        const newMode = !power ? 'medium' : 'off';
        controlDeviceSpeed(newMode);
        // ไม่ต้อง set state ตรงนี้แล้ว เพราะจะ set ใน controlDeviceSpeed หลังจาก API สำเร็จ
    };

    // แก้ไขฟังก์ชัน handleModeChange
    const handleModeChange = (newMode: string) => {
        // ตรวจสอบสถานะเครื่องก่อน
        if (!selectedDevice?.is_active) {
            toast.error("ไม่สามารถควบคุมเครื่องได้ เนื่องจากเครื่องไม่ได้เชื่อมต่อ");
            return;
        }

        if (power) {
            // แปลงค่า sleep เป็น night เพื่อให้ตรงกับ API
            const apiMode = newMode === 'sleep' ? 'night' : newMode;
            controlDeviceSpeed(apiMode);
        }
    };

    // ฟังก์ชัน post switch_mode (service ในไฟล์เดียว)
    const updateWorkingTimeSwitchMode = async (payload: { user_id: string | number, connection_key: string, switch_mode: boolean, time_mode: number }) => {
        try {
            const res = await fetch('/api/devices/working_time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                return { success: false, message: 'API error', error: await res.text() };
            }
            const data = await res.json();
            return data;
        } catch (error: unknown) {
            return { success: false, message: (error as Error)?.message || 'Unknown error', error };
        }
    };

    // เมื่อกด toggle ให้ post switch_mode ไป backend
    const handleScheduleToggle = async () => {
        if (!selectedDevice || !session?.user?.id) {
            toast.error("กรุณาเลือกอุปกรณ์และเข้าสู่ระบบ");
            return;
        }

        // ตรวจสอบสถานะเครื่องก่อน
        if (!selectedDevice.is_active) {
            toast.error("ไม่สามารถตั้งเวลาได้ เนื่องจากเครื่องไม่ได้เชื่อมต่อ");
            return;
        }

        const newSwitchMode = !scheduleEnabled;
        setScheduleEnabled(newSwitchMode); // อัพเดต UI ทันที

        // เตรียม payload สำหรับอัพเดต switch_mode และ time_mode (ต้องส่ง time_mode ด้วย)
        const payload = {
            user_id: session.user.id,
            connection_key: selectedDevice.connection_key,
            switch_mode: newSwitchMode,
            time_mode: getTimeModeName(scheduleMode)
        };

        try {
            const loadingToast = toast.loading("กำลังอัปเดตสถานะการตั้งเวลา...");
            const result = await updateWorkingTimeSwitchMode(payload);
            toast.dismiss(loadingToast);
            if (result.success) {
                toast.success("อัปเดตสถานะการตั้งเวลาสำเร็จ");
            } else {
                toast.error("อัปเดตสถานะการตั้งเวลาไม่สำเร็จ");
                setScheduleEnabled(!newSwitchMode); // rollback UI
            }
        } catch {
            toast.dismiss();
            toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะการตั้งเวลา");
            setScheduleEnabled(!newSwitchMode); // rollback UI
        }
    };

    const handleDayToggle = (index: number) => {
        const newDays = [...scheduleDays];
        newDays[index] = !newDays[index];
        setScheduleDays(newDays);
    };

    const handleScheduleModeChange = (mode: string) => {
        setScheduleMode(mode);
    };

    const handleGeneratePin = async (showModal = false) => {
        setIsGenerating(true);
        if (!session?.user?.id) {
            alert("ไม่พบ user id");
            setIsGenerating(false);
            return;
        }

        const result = await deviceManagementApi.generatePin(session.user.id);

        if (result.success && result.pin_key) {
            setGeneratedPin(result.pin_key);
            if (showModal) setShowPinModal(true);
            
            // รีเฟรชรายการเครื่องหลังจากสร้าง PIN สำเร็จ
            // เพื่อให้ดึงข้อมูลเครื่องใหม่ที่เพิ่งเพิ่มเข้ามา
            setTimeout(async () => {
                try {
                    const devicesResult = await deviceManagementApi.getDevices(session.user.id);
                    if (devicesResult.success && devicesResult.data) {
                        const devices: Device[] = Array.isArray(devicesResult.data)
                            ? devicesResult.data
                            : devicesResult.data
                                ? [devicesResult.data]
                                : [];

                        setDeviceList(devices);
                        setHasDevice(devices.length > 0);

                        // ถ้ามีเครื่องใหม่ ให้เลือกเครื่องล่าสุดและตั้งสถานะเป็นปิด
                        if (devices.length > 0) {
                            const latestDevice = devices[devices.length - 1]; // เลือกเครื่องล่าสุด
                            setSelectedDevice(latestDevice);
                            
                            // ตั้ง flag ว่าเป็นเครื่องใหม่
                            setIsNewDeviceAdded(true);
                            
                            // ตั้งสถานะเริ่มต้นเป็นปิดเครื่องสำหรับเครื่องใหม่
                            setPower(false);
                            setMode('off');
                            
                            // รีเซ็ตข้อมูลฝุ่นและสิ่งแวดล้อม
                            setPm25(0);
                            setAqi(0);
                            setTemperature(0);
                            setHumidity(0);
                            setAirQualityStatus("ไม่มีข้อมูล");
                            setLastUpdated(null);
                            
                            // รีเซ็ตการตั้งเวลา
                            setScheduleEnabled(false);
                            setStartTime('08:00');
                            setEndTime('18:00');
                            setScheduleDays([false, true, true, true, true, true, false]);
                            setScheduleMode('medium');
                            
                            // รีเซ็ต flag หลังจาก 3 วินาที
                            setTimeout(() => {
                                setIsNewDeviceAdded(false);
                            }, 3000);
                            
                            console.log('เครื่องใหม่ตั้งสถานะเป็น "ปิด" เรียบร้อย');
                        }
                    }
                } catch (error) {
                    console.error("Error refreshing device list after PIN generation:", error);
                }
            }, 2000); // รอ 2 วินาทีเพื่อให้ backend ประมวลผลเสร็จ
        } else {
            toast.error("ไม่สามารถสร้าง PIN ได้");
        }

        setIsGenerating(false);
    };

    // เพิ่มฟังก์ชันนี้ก่อนฟังก์ชัน handleGeneratePin
    const fetchDeviceStatus = useCallback(async (connectionKey: string, isNewDevice = false) => {
        if (!session?.user?.id) return;

        try {
            // ถ้าเป็นเครื่องใหม่ ให้รอสักครู่เพื่อให้ตั้งค่าเริ่มต้นเสร็จก่อน
            if (isNewDevice) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // ให้รีเฟรชข้อมูล deviceStatus แทนการเรียก API โดยตรง
            await queryClient.invalidateQueries({
                queryKey: ['deviceStatus', connectionKey, String(session.user.id)]
            });

            // รีเฟรชข้อมูลฝุ่นด้วย
            await queryClient.invalidateQueries({
                queryKey: ['currentDust', connectionKey]
            });
        } catch (err) {
            console.error("Error fetching device status:", err);
            // กรณีเกิดข้อผิดพลาด สถานะเป็น off
            setPower(false);
            setMode('off');
        }
    }, [session?.user?.id, queryClient]);

    // แก้ไขส่วน useEffect ที่ดึงข้อมูลอุปกรณ์
    useEffect(() => {
        if (!session?.user?.id) {
            console.log("session ยังไม่มี user id", session);
            return;
        }

        // โหลดข้อมูลตามปกติเพื่อให้ตรงกับ API

        deviceManagementApi.getDevices(session.user.id)
            .then(result => {
                console.log("ผลลัพธ์จาก getDevices:", result);

                if (result.success && result.data) {
                    const devices: Device[] = Array.isArray(result.data)
                        ? result.data
                        : result.data
                            ? [result.data]
                            : [];

                    // อัพเดต state ทั้งหมด
                    if (devices.length > 0) {
                        setHasDevice(true);
                        setDeviceList(devices);
                        
                        // ถ้ายังไม่มีเครื่องที่เลือกอยู่ ให้เลือกเครื่องแรก
                        if (!selectedDevice) {
                            const firstDevice = devices[0];
                            setSelectedDevice(firstDevice);
                            
                            // ตั้งสถานะเริ่มต้นเป็นปิดเครื่องสำหรับเครื่องใหม่
                            setPower(false);
                            setMode('off');
                            
                            // ดึงสถานะของเครื่องจาก backend (แต่ไม่ใช่เครื่องใหม่)
                            if (firstDevice.connection_key) {
                                try {
                                    fetchDeviceStatus(firstDevice.connection_key, false);
                                } catch (err) {
                                    console.error("Error fetching device status:", err);
                                    // กรณีเกิดข้อผิดพลาด สถานะเป็น off
                                    setPower(false);
                                    setMode('off');
                                }
                            }
                        }
                    } else {
                        setHasDevice(false);
                        setDeviceList([]);
                        setSelectedDevice(null);
                    }
                } else {
                    // จัดการกรณี API สำเร็จแต่ไม่มีข้อมูล
                    setHasDevice(false);
                    setDeviceList([]);
                    setSelectedDevice(null);
                    console.log("ไม่พบข้อมูลอุปกรณ์หรือเกิดข้อผิดพลาด");
                }
            })
            .catch((error) => {
                console.error("Error in getDevices effect:", error);
                setHasDevice(false);
                setDeviceList([]);
                setSelectedDevice(null);
                // แจ้งเตือนผู้ใช้
                toast.error("ไม่สามารถโหลดข้อมูลอุปกรณ์ได้ กรุณาลองใหม่อีกครั้ง");
            });
    }, [session, generatedPin, fetchDeviceStatus, selectedDevice]);

    const handleUpdateDevice = async () => {
        if (!selectedDevice || !session?.user?.id) {
            toast.error("กรุณาเข้าสู่ระบบก่อน");
            return;
        }

        const payload = {
            connection_key: selectedDevice.connection_key,
            device_name: editName,
            location: editLocation
        };

        const result = await deviceManagementApi.updateDevice(payload);

        if (result.success) {
            toast.success("บันทึกข้อมูลสำเร็จ");
        } else {
            toast.error("เปลี่ยนชื่อ/ที่ตั้งไม่สำเร็จ");
        }
    };

    // ฟังก์ชันสำหรับลบอุปกรณ์ในส่วนของปุ่มยืนยันการลบ
    const handleDeleteDevice = async (connectionKey: string) => {
        if (!session?.user?.id) {
            toast.error("กรุณาเข้าสู่ระบบก่อน");
            return;
        }

        const result = await deviceManagementApi.deleteDevice(connectionKey);

        if (result.success) {
            toast.success("ลบอุปกรณ์สำเร็จ");
            setShowDeleteModal(false);
            setDeleteDeviceId(null);

            // รีเฟรช device list
            const devicesResult = await deviceManagementApi.getDevices(session.user.id);

            if (devicesResult.success && devicesResult.data) {
                const devices: Device[] = Array.isArray(devicesResult.data)
                    ? devicesResult.data
                    : devicesResult.data
                        ? [devicesResult.data]
                        : [];

                setDeviceList(devices);
                setHasDevice(devices.length > 0);
                
                if (devices.length > 0) {
                    const firstDevice = devices[0];
                    setSelectedDevice(firstDevice);
                    
                    // รีเซ็ตสถานะเป็นปิดเครื่องก่อน
                    setPower(false);
                    setMode('off');
                    
                    // รีเซ็ตข้อมูลฝุ่นและสิ่งแวดล้อม
                    setPm25(0);
                    setAqi(0);
                    setTemperature(0);
                    setHumidity(0);
                    setAirQualityStatus("ไม่มีข้อมูล");
                    setLastUpdated(null);
                    
                    // ดึงสถานะจริงจาก backend (ไม่ใช่เครื่องใหม่)
                    if (firstDevice.connection_key) {
                        setTimeout(() => {
                            fetchDeviceStatus(firstDevice.connection_key, false);
                        }, 100);
                    }
                } else {
                    setSelectedDevice(null);
                    // รีเซ็ตสถานะทั้งหมดเมื่อไม่มีเครื่อง
                    setPower(false);
                    setMode('off');
                    setPm25(0);
                    setAqi(0);
                    setTemperature(0);
                    setHumidity(0);
                    setAirQualityStatus("ไม่มีข้อมูล");
                    setLastUpdated(null);
                }
            }
        } else {
            toast.error("ลบอุปกรณ์ไม่สำเร็จ");
        }
    };

    // สร้าง options สำหรับ react-select
    const deviceOptions = deviceList.map((device, idx) => ({
        value: String(device.device_id),
        label: device.device_name ? `${device.device_name}` : `เครื่อง ${idx + 1}`,
        isActive: !!device.is_active,
    }));

    const selectedDeviceOption = selectedDevice
        ? {
            value: String(selectedDevice.device_id),
            label: selectedDevice.device_name || `เครื่อง ${deviceList.findIndex(d => d.device_id === selectedDevice.device_id) + 1}`,
            isActive: selectedDevice.is_active
        }
        : null;

    useEffect(() => {
        if (selectedDevice) {
            setEditName(selectedDevice.device_name || '');
            setEditLocation(selectedDevice.location || '');
        }
    }, [selectedDevice]);

    // แปลง mode string เป็นตัวเลขตามโลจิกใหม่
    const getModeNumber = (mode: string): number => {
        switch (mode) {
            case 'auto': return 5;
            case 'night': case 'sleep': return 4;
            case 'high': return 3;
            case 'medium': return 2;
            case 'low': return 1;
            case 'off': return 0;
            default: return 0;
        }
    };

    // แปลงเลข mode กลับเป็น string
    const getStringMode = (modeNumber: number): string => {
        switch (modeNumber) {
            case 5: return 'auto';
            case 4: return 'night'; // เราใช้ night แทน sleep ในระบบ
            case 3: return 'high';
            case 2: return 'medium';
            case 1: return 'low';
            case 0: default: return 'off';
        }
    };

    // เพิ่มฟังก์ชันสำหรับควบคุมความเร็ว
    const controlDeviceSpeed = async (mode: string) => {
        if (!selectedDevice || !session?.user?.id) {
            toast.error("กรุณาเลือกอุปกรณ์และเข้าสู่ระบบ");
            return;
        }

        setIsControlling(true); // เริ่ม loading

        try {
            // สร้าง payload ตาม interface และแปลง mode เป็นตัวเลข
            const payload: ControlDevicePayload = {
                user_id: String(session.user.id), // แปลงเป็น string
                connection_key: selectedDevice.connection_key,
                mode: getModeNumber(mode) // ส่งเป็นตัวเลขแทนข้อความ
            };

            // แสดง toast กำลังส่งคำสั่ง
            const loadingToast = toast.loading("กำลังส่งคำสั่ง...");

            // ใช้ mutation แทนการเรียก API โดยตรง
            const result = await deviceControl.mutateAsync(payload);

            // ปิด toast loading
            toast.dismiss(loadingToast);

            if (result.success) {
                // อัพเดตสถานะในแอปด้วย
                setPower(mode !== 'off');
                setMode(mode); // เก็บเป็น string เพื่อการแสดงผลที่ UI
                toast.success(`เปลี่ยนโหมดเป็น ${getModeName(mode)} สำเร็จ`);
            } else {
                console.error('ข้อผิดพลาดจากการควบคุม:', result.error);
                toast.error("เกิดข้อผิดพลาดในการควบคุม: " + (result.message || "ไม่ทราบสาเหตุ"));
            }
        } catch (error: unknown) {
            console.error("Error controlling device:", error);
            if (axios.isAxiosError(error)) {
                toast.error(`ไม่สามารถควบคุมอุปกรณ์ได้: ${error.message || "ไม่ทราบสาเหตุ"}`);
            } else {
                toast.error(`ไม่สามารถควบคุมอุปกรณ์ได้: ${String(error)}`);
            }
        } finally {
            setIsControlling(false); // สิ้นสุด loading ไม่ว่าจะสำเร็จหรือไม่
        }
    };

    // เพิ่มฟังก์ชันแปลชื่อโหมดเป็นภาษาไทย
    const getModeName = (mode: string) => {
        switch (mode) {
            case 'high': return 'แรง';
            case 'medium': return 'ปานกลาง';
            case 'low': return 'เบา';
            case 'auto': return 'อัตโนมัติ';
            case 'night':
            case 'sleep': return 'กลางคืน';
            case 'off': return 'ปิด';
            default: return mode;
        }
    };

    // เพิ่ม console.log ใน useEffect ที่ดึงข้อมูลอุปกรณ์
    useEffect(() => {
        console.log('=== DEVICE STATE ===', {
            power,
            mode,
            selectedDevice,
            hasDevice
        });
    }, [power, mode, selectedDevice, hasDevice]);

    // เพิ่ม effect เพื่อตรวจสอบสถานะอัตโนมัติเมื่อเลือกเครื่อง
    useEffect(() => {
        if (selectedDevice?.connection_key && session?.user?.id) {
            // ดึงสถานะครั้งแรกเมื่อเลือกเครื่อง (ไม่ใช่เครื่องใหม่)
            fetchDeviceStatus(selectedDevice.connection_key, false);

            // ตั้ง interval ให้ตรวจสอบทุก 30 วินาที (ไม่ใช่เครื่องใหม่)
            const intervalId = setInterval(() => {
                if (selectedDevice?.connection_key) {
                    fetchDeviceStatus(selectedDevice.connection_key, false);
                }
            }, 30000); // 30 วินาที

            // ล้าง interval เมื่อ unmount หรือเปลี่ยนเครื่อง
            return () => clearInterval(intervalId);
        }
    }, [selectedDevice?.connection_key, session?.user?.id, fetchDeviceStatus]);

    // ฟังก์ชันสำหรับแปลงโหมดเป็นตัวเลข (เพิ่มในไฟล์ page.tsx ก่อนฟังก์ชัน handleSetSchedule)
    const getTimeModeName = (mode: string): number => {
        switch (mode) {
            case 'auto': return 5;   // Auto mode
            case 'night': return 4;  // Night mode
            case 'high': return 3;   // High speed
            case 'medium': return 2; // Medium speed
            case 'low': return 1;    // Low speed
            default: return 0;       // Off
        }
    };

    // เพิ่มฟังก์ชันสำหรับบันทึกการตั้งเวลา
    const handleSetSchedule = async () => {
        if (!selectedDevice || !session?.user?.id) {
            toast.error("กรุณาเลือกอุปกรณ์และเข้าสู่ระบบ");
            return;
        }

        // ตรวจสอบสถานะเครื่องก่อน
        if (!selectedDevice.is_active) {
            toast.error("ไม่สามารถบันทึกการตั้งเวลาได้ เนื่องจากเครื่องไม่ได้เชื่อมต่อ");
            return;
        }

        // สร้าง payload สำหรับตั้งเวลา
        const schedulePayload: WorkingTimePayload = {
            user_id: session.user.id,
            connection_key: selectedDevice.connection_key,
            switch_mode: scheduleEnabled,
            start_time: startTime,
            stop_time: endTime,
            sunday: scheduleDays[0],
            monday: scheduleDays[1],
            tuesday: scheduleDays[2],
            wednesday: scheduleDays[3],
            thursday: scheduleDays[4],
            friday: scheduleDays[5],
            saturday: scheduleDays[6],
            time_mode: getTimeModeName(scheduleMode)
        };

        // แสดง toast กำลังตั้งเวลา
        const loadingToast = toast.loading("กำลังตั้งเวลาการทำงาน...");

        try {
            // ใช้ mutation แทนการเรียก API โดยตรง
            const result = await setWorkingTime.mutateAsync(schedulePayload);

            // ปิด toast loading
            toast.dismiss(loadingToast);

            if (result.success) {
                toast.success("ตั้งเวลาการทำงานสำเร็จ");
            } else {
                console.error('ข้อผิดพลาดจากการตั้งเวลา:', result.error);
                toast.error("เกิดข้อผิดพลาดในการตั้งเวลา: " + (result.message || "ไม่ทราบสาเหตุ"));
            }
        } catch (error: unknown) {
            toast.dismiss(loadingToast);
            console.error("Error setting schedule:", error);
            if (axios.isAxiosError(error)) {
                toast.error(`ไม่สามารถตั้งเวลาได้: ${error.message || "ไม่ทราบสาเหตุ"}`);
            } else {
                toast.error(`ไม่สามารถตั้งเวลาได้: ${String(error)}`);
            }
        }
    };

    // สร้าง loading state รวม
    const isLoading = isDeviceDataLoading || !session;

    // อัพเดต UI แสดงสถานะ loading
    return (
        <div className="dashboard-container">
            <Toaster />
            <Sidebar />
            <div className="main-content">
                <div className="device-container">
                    {isLoading ? (
                        // แสดง Loading Spinner ระหว่างโหลดข้อมูล
                        <LoadingSpinner message="กำลังโหลดข้อมูลอุปกรณ์..." />
                    ) : !hasDevice ? (
                        // แสดง EmptyDeviceState หลังจากโหลดเสร็จแล้วและไม่มีเครื่อง
                        <EmptyDeviceState onDeviceAdded={() => {
                            if (!session?.user?.id) return;
                            axios.get(`/api/devices?user_id=${session.user.id}`)
                                .then(res => {
                                    const data = res.data;
                                    const devices: Device[] = Array.isArray(data.data)
                                        ? data.data
                                        : data.data
                                            ? [data.data]
                                            : [];
                                    if (devices.length > 0) {
                                        setHasDevice(true);
                                        setDeviceList(devices);
                                        const newDevice = devices[devices.length - 1]; // เลือกเครื่องใหม่ล่าสุด
                                        setSelectedDevice(newDevice);
                                        
                                        // ตั้งสถานะเริ่มต้นเป็นปิดเครื่องสำหรับเครื่องใหม่
                                        setPower(false);
                                        setMode('off');
                                        
                                        // รีเซ็ตข้อมูลฝุ่นและสิ่งแวดล้อม
                                        setPm25(0);
                                        setAqi(0);
                                        setTemperature(0);
                                        setHumidity(0);
                                        setAirQualityStatus("ไม่มีข้อมูล");
                                        setLastUpdated(null);
                                        
                                        // รีเซ็ตการตั้งเวลา
                                        setScheduleEnabled(false);
                                        setStartTime('08:00');
                                        setEndTime('18:00');
                                        setScheduleDays([false, true, true, true, true, true, false]);
                                        setScheduleMode('medium');
                                        
                                        // ไม่ต้องดึงสถานะจาก backend สำหรับเครื่องใหม่
                                        console.log('เครื่องใหม่จาก EmptyDeviceState ตั้งสถานะเป็น "ปิด" เรียบร้อย');
                                    }
                                })
                                .catch(error => {
                                    console.error("Error fetching devices:", error);
                                });
                        }} />
                    ) : (
                        // แสดงหน้าควบคุมเครื่องเมื่อมีเครื่อง
                        <>
                            <h1 className="device-title">ควบคุมเครื่องฟอกอากาศ</h1>
                            {/* Dropdown หลัก */}
                            <div className="device-select-row" style={{ marginBottom: 24 }}>
                                <label htmlFor="select-device" className="device-select-label">
                                    เลือกเครื่อง:
                                </label>
                                <Select<DeviceOptionType, false, GroupBase<DeviceOptionType>>
                                    className="react-select-container"
                                    classNamePrefix="react-select"
                                    options={deviceOptions}
                                    value={selectedDeviceOption}
                                    onChange={(option) => {
                                        if (option && typeof option === 'object' && 'value' in option) {
                                            const found = deviceList.find(d => String(d.device_id) === option.value);
                                            if (found && found.is_active === false) {
                                                setShowOfflineModal(true);
                                            }
                                            
                                            // เมื่อเปลี่ยนเครื่อง ให้รีเซ็ตสถานะเป็นสถานะเริ่มต้น
                                            if (found && found !== selectedDevice) {
                                                setSelectedDevice(found);
                                                
                                                // รีเซ็ตสถานะเป็นปิดเครื่องก่อน
                                                setPower(false);
                                                setMode('off');
                                                
                                                // รีเซ็ตข้อมูลฝุ่นและสิ่งแวดล้อม
                                                setPm25(0);
                                                setAqi(0);
                                                setTemperature(0);
                                                setHumidity(0);
                                                setAirQualityStatus("ไม่มีข้อมูล");
                                                setLastUpdated(null);
                                                
                                                // ถ้าเครื่องไม่ทำงาน ให้คงสถานะปิดไว้ ไม่ต้องดึงจาก backend
                                                if (found.is_active && found.connection_key) {
                                                    setTimeout(() => {
                                                        fetchDeviceStatus(found.connection_key, false);
                                                    }, 100); // รอ state update เสร็จก่อน
                                                }
                                            } else if (!found) {
                                                setSelectedDevice(null);
                                            }
                                        } else {
                                            setSelectedDevice(null);
                                        }
                                    }}
                                    placeholder="เลือกเครื่อง..."
                                    isSearchable={false}
                                    components={{
                                        Option: DeviceOption,
                                        SingleValue: DeviceSingleValue,
                                        DropdownIndicator
                                    }}
                                    styles={{
                                        container: base => ({
                                            ...base,
                                            minWidth: 320,
                                            maxWidth: 380,
                                        }),
                                        control: base => ({
                                            ...base,
                                            borderRadius: 12,
                                            border: "1px solid #e2e8f0",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                            minHeight: 48,
                                            transition: "all 0.2s ease",
                                            "&:hover": {
                                                borderColor: "#90cdf4"
                                            }
                                        }),
                                        menu: base => ({
                                            ...base,
                                            zIndex: 9999,
                                            overflow: "hidden",
                                            borderRadius: 12,
                                            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                                        }),
                                        menuList: base => ({
                                            ...base,
                                            padding: "8px"
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            borderRadius: 8,
                                            padding: "10px 12px",
                                            cursor: "pointer",
                                            backgroundColor: state.isSelected
                                                ? "#ebf8ff"
                                                : state.isFocused
                                                    ? "#f7fafc"
                                                    : "white",
                                            color: state.isSelected ? "#2b6cb0" : "#4a5568",
                                            fontWeight: state.isSelected ? 500 : 400,
                                            "&:hover": {
                                                backgroundColor: state.isSelected ? "#ebf8ff" : "#f7fafc"
                                            },
                                            transition: "all 0.2s ease"
                                        }),
                                        singleValue: base => ({
                                            ...base,
                                            color: "#2d3748",
                                        }),
                                        placeholder: base => ({
                                            ...base,
                                            color: "#a0aec0",
                                        }),
                                        valueContainer: base => ({
                                            ...base,
                                            padding: "2px 16px"
                                        })
                                    }}
                                />
                                <button
                                    onClick={() => handleGeneratePin(true)}
                                    disabled={isGenerating}
                                    className="select-device-btn"
                                    type="button"
                                >
                                    <PlusCircle size={20} />
                                    {isGenerating ? "กำลังสร้าง..." : "เพิ่มเครื่อง"}
                                </button>
                                {/* ปุ่มตั้งค่าเครื่อง */}
                                <button
                                    className="delete-device-btn"
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteModal(true);
                                    }}
                                >
                                    ลบเครื่อง
                                </button>
                                <button
                                    className="device-setting-btn"
                                    type="button"
                                    style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 4 }}
                                    onClick={() => setShowDeviceSetting(true)}
                                    disabled={!selectedDevice}
                                >
                                    <Settings size={20} />
                                    ตั้งค่าเครื่อง
                                </button>
                            </div>
                            <div className="air-quality-grid">
                                <div className="air-quality-card">
                                    <h3>PM 2.5</h3>
                                    <div className="value">
                                        {!selectedDevice ? "0" :
                                            isDustLoading ? "0" : pm25}
                                    </div>
                                    <div className="unit">µg/m³</div>
                                </div>
                                <div className="air-quality-card">
                                    <h3>AQI</h3>
                                    <div className="value">
                                        {!selectedDevice ? "0" :
                                            isDustLoading ? "0" : aqi}
                                    </div>
                                    <div className="status">คุณภาพอากาศ
                                        {!selectedDevice ? "ไม่มีข้อมูล" :
                                            isDustLoading ? "กำลังโหลด..." : airQualityStatus}
                                    </div>
                                </div>
                                <div className="air-quality-card temp-humid-card">
                                    <h3>สภาพแวดล้อม</h3>
                                    <div className="temp-humid-container">
                                        <div className="temp-section">
                                            <Thermometer size={30} />
                                            <div className="value">{isDustLoading ? "..." : temperature}</div>
                                            <div className="unit">°C</div>
                                        </div>
                                        <div className="humid-section">
                                            <Droplets size={30} />
                                            <div className="value">{isDustLoading ? "..." : humidity}</div>
                                            <div className="unit">%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="last-updated-info">
                                <div>
                                    <span>อัพเดตล่าสุด: </span>
                                    <span className="time-value">
                                        {lastUpdated ? lastUpdated.toLocaleTimeString('th-TH') : '-'}
                                    </span>
                                    {isRefetchingDust && <span className="refreshing"> (กำลังอัพเดต...)</span>}
                                </div>
                                <button
                                    className="refresh-dust-btn"
                                    onClick={() => {
                                        if (selectedDevice?.connection_key) {
                                            // เพิ่ม timestamp เพื่อป้องกัน cache
                                            queryClient.invalidateQueries({
                                                queryKey: ['currentDust', selectedDevice.connection_key]
                                            });

                                            // อัพเดต UI ให้แสดงว่ากำลังโหลด
                                            setLastUpdated(new Date());
                                        }
                                    }}
                                    disabled={isRefetchingDust || !selectedDevice}
                                    style={{
                                        marginLeft: '10px',
                                        padding: '4px 10px',
                                        backgroundColor: '#4299e1',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        opacity: isRefetchingDust || !selectedDevice ? 0.6 : 1
                                    }}
                                >
                                    รีเฟรชข้อมูล
                                </button>
                            </div>

                            <div className="device-status-card">
                                <div className="status-header">
                                    <Fan
                                        className={`device-icon${power && mode !== 'off' ? ' spinning' : ''}`}
                                        size={48}
                                    />
                                    <h2>สถานะการทำงาน</h2>
                                </div>
                                <div className="status-content">
                                    {/* แสดงสถานะการเชื่อมต่อ */}
                                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
                                        <p className={`connection-status ${selectedDevice?.is_active ? 'online' : 'offline'}`}>
                                            สถานะการเชื่อมต่อ: {selectedDevice?.is_active ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}
                                        </p>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "center" }}>
                                        <p
                                            className={
                                                `current-mode-highlight${mode === 'off' ? ' mode-off' : ''}`
                                            }
                                        >
                                            โหมดปัจจุบัน: {
                                                mode === 'high' ? 'แรง' :
                                                    mode === 'medium' ? 'ปานกลาง' :
                                                        mode === 'low' ? 'เบา' :
                                                            mode === 'auto' ? 'อัตโนมัติ' :
                                                                mode === 'sleep' ? 'กลางคืน' : 'ปิด'
                                            }
                                        </p>
                                    </div>
                                    {/* แสดงข้อความเตือนเมื่อเครื่องไม่ทำงาน */}
                                    {!selectedDevice?.is_active && (
                                        <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
                                            <p className="warning-message" style={{ 
                                                color: '#ff4d4f', 
                                                fontSize: '14px', 
                                                textAlign: 'center',
                                                padding: '8px 16px',
                                                backgroundColor: '#fff2f0',
                                                borderRadius: '6px',
                                                border: '1px solid #ffccc7'
                                            }}>
                                                ⚠️ ไม่สามารถควบคุมเครื่องได้ เนื่องจากเครื่องไม่ได้เชื่อมต่อ
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="device-controls">
                                <button
                                    className={`control-btn power-btn ${power ? 'active' : ''} ${!selectedDevice?.is_active ? 'disabled' : ''}`}
                                    onClick={handlePowerToggle}
                                    disabled={isControlling || !selectedDevice?.is_active}
                                >
                                    {isControlling ? (
                                        <span className="loading-spinner-small"></span>
                                    ) : (
                                        <Power size={24} />
                                    )}
                                    <span>{power ? 'ปิด' : 'เปิด'}</span>
                                </button>
                                
                                <button
                                    className={`control-btn ${mode === 'low' ? 'active' : ''} ${!selectedDevice?.is_active ? 'disabled' : ''}`}
                                    onClick={() => handleModeChange('low')}
                                    disabled={!power || isControlling || !selectedDevice?.is_active}
                                >
                                    <Gauge size={24} /><span>เบา</span>
                                </button>
                                <button
                                    className={`control-btn ${mode === 'medium' ? 'active' : ''} ${!selectedDevice?.is_active ? 'disabled' : ''}`}
                                    onClick={() => handleModeChange('medium')}
                                    disabled={!power || isControlling || !selectedDevice?.is_active}
                                >
                                    <Gauge size={24} /><span>ปานกลาง</span>
                                </button>
                                <button
                                    className={`control-btn ${mode === 'high' ? 'active' : ''} ${!selectedDevice?.is_active ? 'disabled' : ''}`}
                                    onClick={() => handleModeChange('high')}
                                    disabled={!power || isControlling || !selectedDevice?.is_active}
                                >
                                    <Gauge size={24} /><span>แรง</span>
                                </button>
                                <button
                                    className={`control-btn ${mode === 'auto' ? 'active' : ''} ${!selectedDevice?.is_active ? 'disabled' : ''}`}
                                    onClick={() => handleModeChange('auto')}
                                    disabled={!power || isControlling || !selectedDevice?.is_active}
                                >
                                    <Fan size={24} /><span>อัตโนมัติ</span>
                                </button>
                                <button
                                    className={`control-btn ${mode === 'sleep' || mode === 'night' ? 'active' : ''} ${!selectedDevice?.is_active ? 'disabled' : ''}`}
                                    onClick={() => handleModeChange('sleep')}
                                    disabled={!power || isControlling || !selectedDevice?.is_active}
                                >
                                    <Moon size={24} /><span>กลางคืน</span>
                                </button>
                            </div>

                            {/* การ์ดตั้งเวลา */}
                            <div className="schedule-card">
                                <div className="schedule-header">
                                    <Clock className="schedule-icon" size={32} />
                                    <h2>ตั้งเวลาการทำงาน</h2>
                                    <div className="toggle-switch">
                                        <input 
                                            type="checkbox" 
                                            id="schedule-toggle" 
                                            checked={scheduleEnabled} 
                                            onChange={handleScheduleToggle}
                                            disabled={!selectedDevice?.is_active}
                                        />
                                        <label htmlFor="schedule-toggle"></label>
                                    </div>
                                </div>
                                <div className={`schedule-content ${!scheduleEnabled || !selectedDevice?.is_active ? 'disabled' : ''}`}>
                                    <div className="time-settings">
                                        <div className="time-group">
                                            <label htmlFor="start-time">เวลาเริ่มทำงาน</label>
                                            <input type="time" id="start-time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                                        </div>
                                        <div className="time-group">
                                            <label htmlFor="end-time">เวลาหยุดทำงาน</label>
                                            <input type="time" id="end-time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="days-selection">
                                        <h3>วันที่ทำงาน</h3>
                                        <div className="days-grid">
                                            {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, index) => (
                                                <div key={index} className={`day-item ${scheduleDays[index] ? 'active' : ''}`} onClick={() => handleDayToggle(index)}>
                                                    {day}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="schedule-mode">
                                        <h3>โหมดการทำงาน</h3>
                                        <div className="mode-buttons">
                                            {['high', 'medium', 'low', 'auto'].map((m) => (
                                                <button key={m} className={`mode-btn ${scheduleMode === m ? 'active' : ''}`} onClick={() => handleScheduleModeChange(m)}>
                                                    <Gauge size={20} /><span>{m === 'high' ? 'แรง' : m === 'medium' ? 'ปานกลาง' : m === 'low' ? 'เบา' : 'อัตโนมัติ'}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* เพิ่มปุ่มบันทึกไว้ในส่วนนี้เลย */}
                                    <div className="schedule-actions" style={{ marginTop: '20px', textAlign: 'center' }}>
                                        <button
                                            className="save-schedule-btn"
                                            onClick={handleSetSchedule}
                                            disabled={!selectedDevice?.is_active}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: !selectedDevice?.is_active ? '#cccccc' : '#26c42e',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '16px',
                                                cursor: !selectedDevice?.is_active ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {scheduleEnabled
                                                ? "บันทึกการตั้งเวลา"
                                                : "บันทึกการปิดการตั้งเวลา"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Popup ตั้งเวลาเครื่อง */}
                            {showDeviceSetting && (
                                <div className="device-setting-modal-backdrop" onClick={() => setShowDeviceSetting(false)}>
                                    <div className="device-setting-modal" onClick={e => e.stopPropagation()}>
                                        <h2>ตั้งค่าเครื่อง</h2>
                                        <div style={{ marginBottom: 16 }}>
                                            <label>ชื่อเครื่อง:</label>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                placeholder="ตั้งชื่อเครื่อง"
                                                style={{ width: "100%", maxWidth: "300px", padding: 8, marginTop: 4, borderRadius: 6, border: "1px solid #ccc" }}
                                            />
                                        </div>
                                        <div style={{ marginBottom: 16 }}>
                                            <label>ที่ตั้ง:</label>
                                            <input
                                                type="text"
                                                value={editLocation}
                                                onChange={e => setEditLocation(e.target.value)}
                                                placeholder="ที่ตั้งของเครื่อง"
                                                style={{ width: "100%", maxWidth: "300px", padding: 8, marginTop: 4, borderRadius: 6, border: "1px solid #ccc" }}
                                            />
                                        </div>
                                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                            <button
                                                className="cancel-setting-btn"
                                                type="button"
                                                onClick={() => setShowDeviceSetting(false)}
                                                style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#bbb", color: "#fff" }}
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                className="save-setting-btn"
                                                type="button"
                                                onClick={async () => {
                                                    await handleUpdateDevice();
                                                    setShowDeviceSetting(false);
                                                }}
                                                style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#26c42e", color: "#fff" }}
                                            >
                                                บันทึก
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modal ยืนยันการลบอุปกรณ์ */}
                            {showDeleteModal && (
                                <div className="delete-modal-backdrop" onClick={() => setShowDeleteModal(false)}>
                                    <div className="delete-modal" onClick={e => e.stopPropagation()}>
                                        <h2>ยืนยันการลบอุปกรณ์</h2>
                                        <p>เลือกอุปกรณ์ที่ต้องการลบ (การลบจะไม่สามารถกู้คืนได้)</p>
                                        <select
                                            style={{ width: "100%", padding: 8, marginBottom: 16, borderRadius: 6, border: "1px solid #ccc" }}
                                            value={deleteDeviceId || ""}
                                            onChange={e => setDeleteDeviceId(e.target.value)}
                                        >
                                            <option value="">-- เลือกเครื่อง --</option>
                                            {deviceList.map(device => (
                                                <option key={device.device_id} value={device.connection_key}>
                                                    {device.device_name
                                                        ? `${device.device_name} (${device.connection_key})`
                                                        : `เครื่อง ${device.device_id} (${device.connection_key})`}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="delete-modal-actions">
                                            <button
                                                className="cancel-delete-btn"
                                                type="button"
                                                onClick={() => setShowDeleteModal(false)}
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                className="confirm-delete-btn"
                                                type="button"
                                                disabled={!deleteDeviceId}
                                                onClick={async () => {
                                                    if (deleteDeviceId) {
                                                        await handleDeleteDevice(deleteDeviceId);
                                                    }
                                                }}
                                            >
                                                ยืนยันการลบ
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Modal อุปกรณ์ออฟไลน์ */}
                            {showOfflineModal && (
                                <div style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    width: '100vw',
                                    height: '100vh',
                                    background: 'rgba(0,0,0,0.35)',
                                    zIndex: 99999,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                    onClick={() => setShowOfflineModal(false)}
                                >
                                    <div style={{
                                        background: 'white',
                                        borderRadius: 16,
                                        padding: '40px 32px',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                                        minWidth: 320,
                                        textAlign: 'center',
                                        position: 'relative',
                                    }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Fan size={48} style={{ color: '#ff4d4f', marginBottom: 16 }} />
                                        <h2 style={{ color: '#ff4d4f', marginBottom: 12 }}>อุปกรณ์ออฟไลน์</h2>
                                        <div style={{ color: '#444', fontSize: 18, marginBottom: 24 }}>
                                            ไม่สามารถเชื่อมต่อกับอุปกรณ์นี้ได้ในขณะนี้ กรุณาตรวจสอบการเชื่อมต่อ
                                        </div>
                                        <button
                                            style={{
                                                padding: '10px 28px',
                                                background: '#ff4d4f',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 8,
                                                fontSize: 16,
                                                cursor: 'pointer',
                                                fontWeight: 500
                                            }}
                                            onClick={() => setShowOfflineModal(false)}
                                        >
                                            ปิด
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal แสดง PIN เฉพาะปุ่มข้าง select */}
            {showPinModal && (
                <div className="pin-modal-backdrop" onClick={() => setShowPinModal(false)}>
                    <div className="pin-modal" onClick={e => e.stopPropagation()}>
                        <div className="pin-title">PIN 6 หลัก ของคุณคือ</div>
                        <div className="pin-value">{generatedPin}</div>
                        <div className="pin-desc">นำ PIN นี้ไปเพิ่มอุปกรณ์ในแอปหรืออุปกรณ์จริง</div>
                        <button className="close-pin-modal-btn" onClick={() => setShowPinModal(false)}>ปิด</button>
                    </div>
                </div>
            )}
        </div>
    );
}
