import { startDustMonitor } from '../lib/scheduler';

// เริ่มต้นระบบตรวจสอบค่าฝุ่นอัตโนมัติเมื่อแอปเริ่มทำงาน
if (process.env.NODE_ENV === 'production') {
  console.log("Initializing dust monitor in production mode");
  startDustMonitor();
} else {
  console.log("Dust monitor not started in development mode");
  // ถ้าต้องการทดสอบในโหมด development ให้เอา comment บรรทัดด้านล่างออก
  // startDustMonitor();
}

export {}; // เพื่อให้ TypeScript ถือว่านี่เป็น module