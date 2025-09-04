import cron from 'node-cron';
import axios from 'axios';

let isRunning = false;

// เริ่มระบบตรวจสอบค่าฝุ่นอัตโนมัติ
export function startDustMonitor() {
  if (isRunning) {
    console.log("Dust monitoring is already running");
    return;
  }

  console.log("Starting dust monitoring scheduler");
  
  // ตรวจสอบค่าฝุ่นทุก 30 นาที (ปรับได้ตามต้องการ)
  cron.schedule('*/30 * * * *', async () => {
    try {
      console.log("Running scheduled dust check:", new Date().toISOString());
      
      // เรียก API ตรวจสอบค่าฝุ่น
      const baseUrl = process.env.NEXTJS_URL || 'http://localhost:3000';
      const response = await axios.get(`${baseUrl}/api/dust-checker`);
      
      console.log("Dust check completed:", 
        `${response.data.results?.alerts || 0} alerts, ` +
        `${response.data.results?.skipped || 0} skipped, ` +
        `${response.data.results?.errors || 0} errors`
      );
    } catch (error) {
      console.error("Error in scheduled dust check:", error);
    }
  });
  
  isRunning = true;
}

// หยุดระบบตรวจสอบค่าฝุ่นอัตโนมัติ
export function stopDustMonitor() {
  if (!isRunning) {
    console.log("Dust monitoring is not running");
    return;
  }
  
  // หยุดงานตามกำหนดการทั้งหมด
  cron.getTasks().forEach(task => task.stop());
  isRunning = false;
  console.log("Dust monitoring stopped");
}