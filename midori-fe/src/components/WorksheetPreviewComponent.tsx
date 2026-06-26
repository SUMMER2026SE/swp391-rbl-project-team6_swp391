import { useState, useEffect } from "react";
import type { KanjiCharacter } from "@/data/kanji-data";
import { Trash2, Download, Printer, Loader2, X, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

// Helper to generate cumulative stroke order images
function generateStrokeOrderImages(kanji: KanjiCharacter): string[] {
  const images: string[] = [];
  const size = 100; // High resolution for premium printing

  kanji.svgPaths.forEach((path, idx) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw previous strokes in light gray
    const prevPathStr = kanji.svgPaths.slice(0, idx).join(" ");
    if (prevPathStr) {
      ctx.beginPath();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 5;
      const prevP2D = new Path2D(prevPathStr);
      ctx.stroke(prevP2D);
    }

    // Draw current stroke in deep indigo
    ctx.beginPath();
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 7;
    const currentP2D = new Path2D(path);
    ctx.stroke(currentP2D);

    images.push(canvas.toDataURL("image/png"));
  });

  return images;
}

interface WorksheetPreviewProps {
  kanjiList: KanjiCharacter[];
  onRemoveKanji: (char: string) => void;
  onClearAll: () => void;
  onDownloadPDF: () => void;
  isExporting: boolean;
}

export function WorksheetPreviewComponent({
  kanjiList,
  onRemoveKanji,
  onClearAll,
  onDownloadPDF,
  isExporting,
}: WorksheetPreviewProps) {
  const [strokeImages, setStrokeImages] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const newImages: Record<string, string[]> = {};
    kanjiList.forEach((k) => {
      newImages[k.char] = generateStrokeOrderImages(k);
    });
    setStrokeImages(newImages);
  }, [kanjiList]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6">
      {/* CSS Styles for Print Mode */}
      <style>{`
        @media print {
          /* Hide everything except the worksheet print area */
          body * {
            visibility: hidden;
            background: none !important;
          }
          #worksheet-print-area, #worksheet-print-area * {
            visibility: visible;
          }
          #worksheet-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background-color: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          #worksheet-print-area table {
            border: 2px solid #000000 !important;
            border-collapse: collapse !important;
          }
          #worksheet-print-area td {
            border: 1px solid #cbd5e1 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-row {
            page-break-inside: avoid !important;
            margin-bottom: 30px !important;
          }
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
      `}</style>

      {/* Main A4 Print / Preview Canvas */}
      {kanjiList.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-250 dark:border-white/10 rounded-2xl bg-white dark:bg-slate-900 w-full max-w-[750px] mx-auto shadow-[0_8px_30px_rgb(0,0,0,0.02)] no-print">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Chưa có chữ Kanji nào được thêm vào Worksheet.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Chọn từ danh sách hoặc nhập nhanh bên trái để xem trước.
          </p>
        </div>
      ) : (
        <div
          id="worksheet-print-area"
          className="w-full max-w-[750px] mx-auto border border-slate-200/80 dark:border-white/10 rounded-[24px] p-6 sm:p-10 bg-white dark:bg-slate-900 shadow-[0_15px_50px_rgba(0,0,0,0.05)] dark:shadow-2xl space-y-6 text-[#111827] dark:text-slate-100 font-japanese"
        >
          {/* Sheet Header Area */}
          <div className="mb-6">
            <div className="flex justify-between items-end pb-3">
              <div>
                <h1 className="text-2xl font-black tracking-widest text-[#0F172A] dark:text-white">
                  LUYỆN VIẾT KANJI
                </h1>
                <span className="text-[10px] text-slate-400 font-semibold">
                  midori-japanese.pages.dev
                </span>
              </div>
              <div className="flex gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400 pb-1">
                <span>Họ tên: _________________</span>
                <span>Ngày: ___/___/______</span>
              </div>
            </div>
            <div className="border-t border-slate-200 dark:border-white/10 w-full" />
          </div>

          {/* Kanji Rows */}
          <div className="space-y-6">
            {kanjiList.map((kanji) => (
              <div
                key={kanji.char}
                className="print-row border border-slate-150/80 dark:border-white/5 p-5 rounded-2xl bg-slate-50/20 dark:bg-slate-900/10 space-y-4 relative group"
              >
                {/* Individual delete button (hidden in print) */}
                <button
                  onClick={() => onRemoveKanji(kanji.char)}
                  className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition opacity-0 group-hover:opacity-100 no-print cursor-pointer"
                  title="Xóa chữ này"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-3">
                  <div className="space-y-1 max-w-[420px]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-extrabold text-[#111827] dark:text-slate-100 uppercase tracking-widest leading-none">
                        {kanji.sinoVietnamese}
                      </span>
                      <span className="text-xs text-[#475569] dark:text-slate-500 font-medium leading-none">
                        — {kanji.meaning}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#475569] dark:text-slate-400 leading-relaxed font-medium">
                      <span className="font-bold text-[#111827] dark:text-slate-350">Mẹo nhớ:</span>{" "}
                      {kanji.mnemonic ||
                        "Hình dáng giống như một mái nhà che chở cho những người ở bên trong hiện tại."}
                    </p>
                  </div>

                  {/* Stroke Order Sequence */}
                  <div className="flex gap-1.5 items-center flex-wrap">
                    {strokeImages[kanji.char]?.map((imgSrc, sIdx) => (
                      <div
                        key={sIdx}
                        className="w-8 h-8 rounded border border-slate-200 dark:border-white/10 bg-white flex items-center justify-center shrink-0 shadow-sm"
                      >
                        <img
                          src={imgSrc}
                          alt={`Nét ${sIdx + 1}`}
                          className="w-7 h-7 object-contain"
                        />
                      </div>
                    ))}
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded shrink-0 ml-1">
                      ({kanji.strokes} nét)
                    </span>
                  </div>
                </div>

                {/* Practice grid (10x2 table) */}
                <div className="w-full">
                  <table className="w-full border-collapse border border-slate-200 dark:border-slate-800 bg-white table-fixed">
                    <tbody>
                      <tr className="border-b border-slate-200 dark:border-slate-850">
                        {Array.from({ length: 10 }).map((_, cIdx) => {
                          const isFirst = cIdx === 0;
                          const isTracing = cIdx > 0 && cIdx <= 3;
                          return (
                            <td
                              key={cIdx}
                              className={cn(
                                "relative aspect-square p-0 text-center align-middle border-r border-slate-200 dark:border-slate-800 last:border-r-0",
                                isFirst ? "border-2 border-slate-950 dark:border-white z-20" : "",
                              )}
                              style={{ width: "10%" }}
                            >
                              {/* Inner cross guidelines */}
                              <div
                                className="absolute inset-0 border-t border-dashed border-slate-200 dark:border-slate-850/60 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                                style={{ borderStyle: "dashed" }}
                              />
                              <div
                                className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-slate-200 dark:border-slate-850/60 -translate-x-1/2 z-10 pointer-events-none"
                                style={{ borderStyle: "dashed" }}
                              />

                              {isFirst && (
                                <span
                                  className="relative z-20 text-[2rem] sm:text-[2.2rem] font-bold text-[#111827] dark:text-white leading-none select-none"
                                  style={{
                                    fontFamily: "var(--font-japanese), 'Arial', sans-serif",
                                  }}
                                >
                                  {kanji.char}
                                </span>
                              )}
                              {!isFirst && <div className="w-full aspect-square" />}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        {Array.from({ length: 10 }).map((_, cIdx) => (
                          <td
                            key={cIdx}
                            className="relative aspect-square border-r border-slate-200 dark:border-slate-800 last:border-r-0 p-0 text-center align-middle"
                            style={{ width: "10%" }}
                          >
                            {/* Inner cross guidelines */}
                            <div
                              className="absolute inset-0 border-t border-dashed border-slate-200 dark:border-slate-850/60 top-1/2 -translate-y-1/2 z-10 pointer-events-none"
                              style={{ borderStyle: "dashed" }}
                            />
                            <div
                              className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-slate-200 dark:border-slate-850/60 -translate-x-1/2 z-10 pointer-events-none"
                              style={{ borderStyle: "dashed" }}
                            />
                            <div className="w-full aspect-square" />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-white/5 pt-3 mt-6">
            Bản quyền thuộc về Midori Japanese Platform © 2026. Tất cả các quyền được bảo lưu.
          </div>
        </div>
      )}
    </div>
  );
}
