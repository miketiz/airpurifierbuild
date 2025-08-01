"use client";

import Select, {
    components,
    OptionProps,
    SingleValueProps,
    DropdownIndicatorProps,
    GroupBase
} from "react-select";
import { AirVent, Wind } from "lucide-react";
import { Device, DeviceOptionType } from "../types/dashboard";

interface DeviceSelectorProps {
    deviceList: Device[];
    selectedDevice: Device | null;
    onDeviceSelect: (device: Device | null) => void;
    onOfflineDeviceSelect: () => void;
}

// Custom component สำหรับ React Select Options
const DeviceOption = (props: OptionProps<DeviceOptionType, false, GroupBase<DeviceOptionType>>) => (
    <components.Option {...props}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 0" }}>
            <div style={{
                backgroundColor: props.isSelected ? "#e6f7ff" : "#f0f8ff",
                borderRadius: "50%",
                padding: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <AirVent
                    size={18}
                    style={{
                        color: props.isSelected ? "#0095ff" : "#66b3ff"
                    }}
                />
            </div>
            <span>{props.data.label}</span>
            {/* แสดงสถานะทำงาน/ไม่ทำงาน */}
            {props.data.isActive ? (
                <span style={{
                    fontSize: "12px",
                    background: "#e6ffed",
                    color: "#52c41a",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    marginLeft: "auto"
                }}>กำลังทำงาน</span>
            ) : (
                <span style={{
                    fontSize: "12px",
                    background: "#fff2f0",
                    color: "#ff4d4f",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    marginLeft: "auto"
                }}>ไม่ทำงาน</span>
            )}
        </div>
    </components.Option>
);

// Component สำหรับแสดงค่าที่เลือก
const DeviceSingleValue = (props: SingleValueProps<DeviceOptionType, false, GroupBase<DeviceOptionType>>) => (
    <components.SingleValue {...props}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
                backgroundColor: "#f0f8ff",
                borderRadius: "50%",
                padding: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <AirVent size={16} style={{ color: "#0095ff" }} />
            </div>
            <span>{props.data.label}</span>
            {/* แสดงสถานะ */}
            {props.data.isActive !== undefined && (
                <span style={{
                    fontSize: "12px",
                    background: props.data.isActive ? "#e6ffed" : "#fff2f0",
                    color: props.data.isActive ? "#52c41a" : "#ff4d4f",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    marginLeft: "8px"
                }}>
                    {props.data.isActive ? "กำลังทำงาน" : "ไม่ทำงาน"}
                </span>
            )}
        </div>
    </components.SingleValue>
);

// Component สำหรับไอคอน dropdown
const DropdownIndicator = (props: DropdownIndicatorProps<DeviceOptionType, false, GroupBase<DeviceOptionType>>) => {
    return (
        <components.DropdownIndicator {...props}>
            <Wind size={18} style={{ color: "#66b3ff" }} />
        </components.DropdownIndicator>
    );
};

export default function DeviceSelector({ 
    deviceList, 
    selectedDevice, 
    onDeviceSelect, 
    onOfflineDeviceSelect 
}: DeviceSelectorProps) {
    return (
        <div className="device-select-row" style={{ marginBottom: 24 }}>
            <label htmlFor="select-device" className="device-select-label">
                เลือกเครื่อง:
            </label>
            <Select<DeviceOptionType, false, GroupBase<DeviceOptionType>>
                className="react-select-container"
                classNamePrefix="react-select"
                options={deviceList.map((device, idx) => ({
                    value: String(device.device_id),
                    label: device.device_name
                        ? `${device.device_name}`
                        : `เครื่อง ${idx + 1}`,
                    isActive: device.is_active
                }))}
                value={
                    selectedDevice
                        ? {
                            value: String(selectedDevice.device_id),
                            label: selectedDevice.device_name || `เครื่อง ${deviceList.findIndex(d => d.device_id === selectedDevice.device_id) + 1}`,
                            isActive: selectedDevice.is_active
                        }
                        : null
                }
                onChange={(option) => {
                    if (option && typeof option === 'object' && 'value' in option) {
                        const found = deviceList.find(d => String(d.device_id) === option.value);
                        if (found && found.is_active === false) {
                            onOfflineDeviceSelect();
                        }
                        onDeviceSelect(found ?? null);
                    } else {
                        onDeviceSelect(null);
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
                        minWidth: 'auto',
                        maxWidth: '100%',
                        width: '100%',
                        '@media (min-width: 768px)': {
                            minWidth: 320,
                            maxWidth: 380,
                            width: 'auto'
                        }
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
        </div>
    );
}
