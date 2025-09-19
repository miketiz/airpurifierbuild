"use client";

import { Device } from "../types/dashboard";
import jsPDF from "jspdf";
import autoTable, { RowInput, CellHookData } from "jspdf-autotable";
import toast from "react-hot-toast";

// เพิ่ม type definition สำหรับ jsPDF ที่มี lastAutoTable
type JsPDFWithAutoTable = jsPDF & {
    lastAutoTable?: { finalY: number };
};

interface PDFExporterProps {
    weeklyData: {
        labels: string[];
        values: number[];
        average: string;
    };
    selectedDevice: Device | null;
}

const AIR_QUALITY_LEVELS = [
    { max: 15, label: "Very Good", color: [0, 228, 0] as [number, number, number] },
    { max: 25, label: "Good", color: [146, 208, 80] as [number, number, number] },
    { max: 37.5, label: "Moderate", color: [255, 255, 0] as [number, number, number] },
    { max: 50, label: "Unhealthy for Sensitive Groups", color: [255, 126, 0] as [number, number, number] },
    { max: 90, label: "Unhealthy", color: [255, 0, 0] as [number, number, number] },
    { max: Infinity, label: "Very Unhealthy", color: [153, 0, 76] as [number, number, number] },
];

function pmToLevel(v: number) {
    return AIR_QUALITY_LEVELS.find((l) => v <= l.max)!.label;
}
function pmToColor(v: number): [number, number, number] {
    return AIR_QUALITY_LEVELS.find((l) => v <= l.max)!.color;
}

// ✅ ฟังก์ชันใหม่: แปลง label วันที่ให้ทนทาน และล้างอักขระจุด/ตัวคั่น/zero-width
function formatDateFromLabel(label: string) {
    const cleaned = (label || "")
        .replace(/[\u200B-\u200D\u2060]/g, "") // zero-width
        .replace(/[.,|•]+/g, " ")             // จุด/ตัวคั่น
        .replace(/\s+/g, " ")
        .trim();

    const monthsFull = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const monthsShort: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const weekday = "(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\\.?";
    const monthPat = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)";

    const year = new Date().getFullYear();
    const curMonthIdx = new Date().getMonth();

    // 1) 14 Feb
    let m = cleaned.match(new RegExp(`^(\\d{1,2})\\s+(${monthPat})$`, "i"));
    if (m) {
        const day = parseInt(m[1], 10);
        const monIdx = monthsShort[m[2].toLowerCase()];
        return `${day} ${monthsFull[monIdx]} ${year}`;
    }

    // 2) Feb 14
    m = cleaned.match(new RegExp(`^(${monthPat})\\s+(\\d{1,2})$`, "i"));
    if (m) {
        const monIdx = monthsShort[m[1].toLowerCase()];
        const day = parseInt(m[2], 10);
        return `${day} ${monthsFull[monIdx]} ${year}`;
    }

    // 3) Sun 14 / Sun. 14 / 14 Sun.
    m =
        cleaned.match(new RegExp(`^(?:${weekday})\\s+(\\d{1,2})$`, "i")) ||
        cleaned.match(new RegExp(`^(\\d{1,2})\\s+(?:${weekday})$`, "i"));
    if (m) {
        const day = parseInt(m[1], 10);
        return `${day} ${monthsFull[curMonthIdx]} ${year}`;
    }

    // 4) มีแต่ตัวเลขวัน เช่น "14"
    m = cleaned.match(/^(\d{1,2})$/);
    if (m) {
        const day = parseInt(m[1], 10);
        return `${day} ${monthsFull[curMonthIdx]} ${year}`;
    }

    // ถ้าไม่เข้าเคสใดเลย ให้คืนค่า cleaned (ที่ล้างจุดแล้ว)
    return cleaned;
}

function sanitizeFileName(input?: string | null) {
    if (!input) return "unnamed";
    return input.replace(/[<>:"/\\|?*]/g, "_").replace(/\s+/g, "_").slice(0, 50);
}

const usePDFExporter = ({ weeklyData, selectedDevice }: PDFExporterProps) => {
    const exportToPDF = () => {
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        // ------- Layout constants -------
        const PAGE_W = doc.internal.pageSize.getWidth();
        const PAGE_H = doc.internal.pageSize.getHeight();
        const MARGIN = 15;
        const CONTENT_W = PAGE_W - 2 * MARGIN;
        const HEADER_H = 18;
        const SECTION_GAP = 8;
        const FOOTER_H = 10;

        // ------- Theme -------
        const primaryGreen: [number, number, number] = [76, 175, 80];
        const lightGreen: [number, number, number] = [139, 195, 74];
        const darkGreen: [number, number, number] = [46, 125, 50];

        // ------- Header / Footer / Paging helpers -------
        const drawHeader = () => {
            doc.setFillColor(...primaryGreen);
            doc.rect(MARGIN, MARGIN, CONTENT_W, HEADER_H, "F");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text("Air Quality Report", PAGE_W / 2, MARGIN + HEADER_H / 2 + 1, { align: "center" });

            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(0.6);
            doc.line(MARGIN + 15, MARGIN + HEADER_H - 3, PAGE_W - MARGIN - 15, MARGIN + HEADER_H - 3);
        };
        const drawFooterAllPages = () => {
            const total = doc.getNumberOfPages();
            for (let i = 1; i <= total; i++) {
                doc.setPage(i);
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.3);
                doc.line(MARGIN, PAGE_H - FOOTER_H, PAGE_W - MARGIN, PAGE_H - FOOTER_H);

                doc.setFontSize(8);
                doc.setTextColor(120, 120, 120);
                const now = new Date().toLocaleString("en-US");
                doc.text(`Report generated on: ${now} | Page ${i}/${total}`, PAGE_W / 2, PAGE_H - FOOTER_H + 5, { align: "center" });
            }
        };
        let cursorY = MARGIN + HEADER_H + SECTION_GAP;
        const ensureSpace = (neededHeight: number) => {
            const limit = PAGE_H - MARGIN - FOOTER_H;
            if (cursorY + neededHeight > limit) {
                doc.addPage();
                drawHeader();
                cursorY = MARGIN + HEADER_H + SECTION_GAP;
            }
        };

        // ------- First header -------
        drawHeader();

        // ------- Device info -------
        const drawDeviceBox = () => {
            const BOX_H = 30;
            ensureSpace(BOX_H);
            doc.setFillColor(...lightGreen);
            doc.roundedRect(MARGIN, cursorY, CONTENT_W, BOX_H, 4, 4, "F");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(...darkGreen);
            doc.text("Device Information", MARGIN + 10, cursorY + 10);

            doc.setDrawColor(...darkGreen);
            doc.setLineWidth(0.5);
            doc.line(MARGIN + 10, cursorY + 12, MARGIN + 80, cursorY + 12);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`Device Name: ${selectedDevice?.name || "Not specified"}`, MARGIN + 10, cursorY + 19);
            doc.text(`Device ID: ${selectedDevice?.mac_id || "Not specified"}`, MARGIN + 10, cursorY + 26);

            cursorY += BOX_H + SECTION_GAP;
        };

        // ------- Report date -------
        const drawReportDate = () => {
            const BOX_H = 14;
            ensureSpace(BOX_H);
            const todayStr = new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            doc.setFillColor(...lightGreen);
            doc.roundedRect(MARGIN, cursorY, CONTENT_W, BOX_H, 4, 4, "F");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.setTextColor(...darkGreen);
            doc.text(`Report Date: ${todayStr}`, MARGIN + 10, cursorY + 9);

            cursorY += BOX_H + SECTION_GAP;
        };

        // ------- Summary -------
        const drawSummary = () => {
            const BOX_H = 26;
            ensureSpace(BOX_H);
            doc.setFillColor(...lightGreen);
            doc.roundedRect(MARGIN, cursorY, CONTENT_W, BOX_H, 4, 4, "F");

            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(...darkGreen);
            doc.text("Summary", MARGIN + 10, cursorY + 10);
            doc.setDrawColor(...darkGreen);
            doc.setLineWidth(0.5);
            doc.line(MARGIN + 10, cursorY + 12, MARGIN + 45, cursorY + 12);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`Average PM 2.5: ${weeklyData.average} µg/m³`, MARGIN + 10, cursorY + 20);

            const avg = Number.parseFloat(weeklyData.average || "0");
            const c = pmToColor(avg);
            const label = pmToLevel(avg);

            // badge
            const badgeW = 75;
            const badgeH = 12;
            const badgeX = PAGE_W - MARGIN - badgeW - 5;
            const badgeY = cursorY + 7;
            doc.setFillColor(c[0], c[1], c[2]);
            doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 3, 3, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            doc.text(`Air Quality: ${label}`, badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5, { align: "center" });

            cursorY += BOX_H + SECTION_GAP;
        };

        // ------- Table -------
        const drawTable = () => {
            const rows: RowInput[] = weeklyData.labels.map((lb, i) => {
                const v = weeklyData.values[i] ?? 0;
                return [formatDateFromLabel(lb), v.toFixed(2), pmToLevel(v)];
            });

            ensureSpace(20);

            autoTable(doc, {
                head: [["Date", "PM 2.5 (µg/m³)", "Air Quality"]],
                body: rows,
                startY: cursorY,
                margin: { left: MARGIN, right: MARGIN, top: MARGIN + HEADER_H + SECTION_GAP },
                styles: { font: "helvetica", fontSize: 10, lineColor: [210, 210, 210], lineWidth: 0.1 },
                headStyles: { fillColor: primaryGreen, textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                columnStyles: {
                    0: { cellWidth: 90, halign: "left" },
                    1: { cellWidth: 40, halign: "center" },
                    2: { cellWidth: 50, halign: "center" },
                },
                didParseCell: function (data: CellHookData) {
                    if (data.section === "body" && data.column.index === 2) {
                        const label = String(data.cell.raw);
                        const color = AIR_QUALITY_LEVELS.find((l) => l.label === label)?.color ?? [255, 255, 255];
                        data.cell.styles.fillColor = color;
                        data.cell.styles.textColor = [255, 255, 255];
                        data.cell.styles.fontStyle = "bold";
                    }
                },
            });

            const finalY = (doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? 200;
            cursorY = finalY + SECTION_GAP;
        };

        // ------- Chart + Legend -------
        const drawChartAndLegend = () => {
            const NEED = 12 + 55 + 22;
            ensureSpace(NEED);

            // Title
            doc.setFillColor(...lightGreen);
            doc.roundedRect(MARGIN, cursorY, CONTENT_W, 10, 4, 4, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(...darkGreen);
            doc.text("Daily PM 2.5 Chart", PAGE_W / 2, cursorY + 7, { align: "center" });
            cursorY += 12;

            // Chart frame
            const chartX = MARGIN;
            const chartY = cursorY;
            const chartW = CONTENT_W;
            const chartH = 55;

            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.3);
            doc.rect(chartX, chartY, chartW, chartH);
            doc.setFillColor(250, 250, 250);
            doc.rect(chartX, chartY, chartW, chartH, "F");

            const values = weeklyData.values ?? [];
            const count = Math.max(values.length, 1);

            const dataMax = values.length ? Math.max(...values) : 0;
            const scaleMax = Math.max(90, 50, dataMax);

            const levels = [0, 15, 25, 37.5, 50, 90].filter((lv) => lv <= scaleMax);

            // Grid + labels
            levels.forEach((lv) => {
                const y = chartY + chartH - (lv / scaleMax) * chartH;
                doc.setDrawColor(210, 210, 210);
                doc.setLineWidth(0.2);
                doc.line(chartX, y, chartX + chartW, y);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text(`${lv}`, chartX - 3, y, { align: "right" });
            });

            // Color zones (soft)
            for (let i = 0; i < levels.length - 1; i++) {
                const from = levels[i];
                const to = levels[i + 1];
                const fromY = chartY + chartH - (from / scaleMax) * chartH;
                const toY = chartY + chartH - (to / scaleMax) * chartH;
                const height = fromY - toY;

                const c = pmToColor((from + to) / 2);
                const r = Math.floor(c[0] * 0.15 + 255 * 0.85);
                const g = Math.floor(c[1] * 0.15 + 255 * 0.85);
                const b = Math.floor(c[2] * 0.15 + 255 * 0.85);

                doc.setFillColor(r, g, b);
                doc.rect(chartX, toY, chartW, height, "F");
            }

            const innerPad = 2;
            const barW = Math.max(chartW / count - 2, 2);
            const showLabelStep = Math.max(1, Math.ceil(count / 12));

            if (values.length === 0) {
                doc.setFont("helvetica", "italic");
                doc.setFontSize(10);
                doc.setTextColor(130, 130, 130);
                doc.text("No data for this period", chartX + chartW / 2, chartY + chartH / 2, { align: "center" });
            } else {
                values.forEach((v, i) => {
                    const barH = (v / scaleMax) * chartH;
                    const x = chartX + i * (chartW / count) + innerPad;
                    const y = chartY + chartH - barH;
                    const c = pmToColor(v);
                    const border = c.map((n) => Math.max(0, n - 30)) as [number, number, number];

                    doc.setFillColor(...c);
                    doc.setDrawColor(...border);
                    doc.setLineWidth(0.4);
                    doc.rect(x, y, barW, barH, "FD");

                    // value
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(7);
                    doc.setTextColor(60, 60, 60);
                    doc.text(v.toFixed(1), x + barW / 2, y - 1.5, { align: "center" });

                    // date (sparse) — ✅ ลบชื่อวันทั้งมี/ไม่มีจุด และทำความสะอาดจุด/ช่องว่าง
                    if (i % showLabelStep === 0) {
                        const shortLabel = (weeklyData.labels[i] || "")
                            .replace(/(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\.?/g, "")
                            .replace(/[.,|•]+/g, " ")
                            .replace(/\s+/g, " ")
                            .trim();

                        doc.setFontSize(7);
                        doc.setTextColor(80, 80, 80);
                        doc.text(shortLabel, x + barW / 2, chartY + chartH + 4, { align: "center" });
                    }
                });
            }

            cursorY += chartH + 10;

            // Legend
            const legendPerRow = 2;
            const itemW = CONTENT_W / legendPerRow;
            const rows = Math.ceil(AIR_QUALITY_LEVELS.length / legendPerRow);
            const legendH = rows * 10 + 6;

            ensureSpace(legendH);

            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.2);
            doc.roundedRect(MARGIN, cursorY, CONTENT_W, legendH, 2, 2, "S");

            let lx = MARGIN + 8;
            let ly = cursorY + 7;
            AIR_QUALITY_LEVELS.forEach((lg, idx) => {
                doc.setFillColor(...lg.color);
                doc.roundedRect(lx, ly - 3, 4, 4, 1, 1, "F");

                doc.setFontSize(8);
                doc.setTextColor(50, 50, 50);
                const txt =
                    lg.max === Infinity
                        ? `${lg.label} (90+)`
                        : `${lg.label} (${idx === 0 ? 0 : AIR_QUALITY_LEVELS[idx - 1].max}-${lg.max})`;
                doc.text(txt, lx + 7, ly);

                const col = idx % legendPerRow;
                if (col === legendPerRow - 1) {
                    lx = MARGIN + 8;
                    ly += 10;
                } else {
                    lx += itemW;
                }
            });

            cursorY += legendH + SECTION_GAP;
        };

        // ------- Compose -------
        drawDeviceBox();
        drawReportDate();
        drawSummary();
        drawTable();
        drawChartAndLegend();

        // ------- Footer & Save -------
        drawFooterAllPages();

        const today = new Date();
        const formattedDate = today.toISOString().split("T")[0];
        const deviceName = sanitizeFileName(selectedDevice?.name);
        const fileName = `air_quality_report_${deviceName}_${formattedDate}.pdf`;

        doc.save(fileName);

        toast.success("Report saved successfully", {
            icon: "📊",
            style: { background: "#E8F5E9", color: "#2E7D32", border: "1px solid #4CAF50" },
        });
    };

    return { exportToPDF };
};

export default usePDFExporter;
