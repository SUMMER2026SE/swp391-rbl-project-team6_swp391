import { useState, useEffect } from "react";
import type { KanjiCharacter } from "@/data/kanji-data";
import { Trash2, Download, Printer, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Helper to generate cumulative stroke order images
function generateStrokeOrderImages(kanji: KanjiCharacter): string[] {
  const images: string[] = [];
  const size = 80;
  
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
    
    // Draw previous strokes in gray
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 4;
    for (let pIdx = 0; pIdx < idx; pIdx++) {
      const p2d = new Path2D(kanji.svgPaths[pIdx]);
      ctx.stroke(p2d);
    }
    
    // Draw current stroke in blue/violet
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 5;
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[32px] p-6 shadow-xl space-y-6">
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
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: white !important;
            color: black !important;
          }
          #worksheet-print-area table {
            border: 2px solid #6b7280 !important;
            border-collapse: collapse !important;
          }
          #worksheet-print-area td {
            border: 1px solid #9ca3af !important;
          }
          .no-print {
            display: none !important;
          }
          .print-row {
            page-break-inside: avoid !important;
            margin-bottom: 35px !important;
          }
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
      `}</style>

      {/* Header controls (not printed) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-4 no-print">
        <div>
          <h3 className="font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-500" />
            Xem trước Worksheet ({kanjiList.length} chữ)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Bản xem trước hiển thị chính xác bố cục bản in / PDF.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {kanjiList.length > 0 && (
            <>
              <button
                onClick={onClearAll}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa hết
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition"
              >
                <Printer className="w-3.5 h-3.5" /> In ngay
              </button>
              <button
                onClick={onDownloadPDF}
                disabled={isExporting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-500/10"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang tải PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> Tải file PDF
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Print / Preview Area */}
      {kanjiList.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 no-print">
          <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có chữ Kanji nào được thêm vào Worksheet.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Chọn từ danh sách hoặc nhập nhanh bên trái để xem trước.</p>
        </div>
      ) : (
        <div 
          id="worksheet-print-area" 
          className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 bg-white dark:bg-slate-950 max-h-[600px] overflow-y-auto shadow-inner space-y-8"
        >
          {/* Printable title */}
          <div className="hidden @media-print:block text-center border-b-2 border-double border-slate-300 pb-2 mb-6">
            <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-800">Bảng Luyện Viết Kanji</h1>
          </div>

          {kanjiList.map((kanji) => (
            <div 
              key={kanji.char} 
              className="print-row border-b border-slate-200 dark:border-white/10 last:border-b-0 pb-8 last:pb-0 pt-4 space-y-4 relative group"
            >
              {/* Individual delete button (hidden in print) */}
              <button
                onClick={() => onRemoveKanji(kanji.char)}
                className="absolute right-0 top-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition opacity-0 group-hover:opacity-100 no-print"
                title="Xóa chữ này"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Line 1: [Han Viet Reading] [Stroke order images] centered vertically */}
              <div className="flex items-center gap-6">
                <span className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  {kanji.sinoVietnamese}
                </span>
                
                {/* Stroke Order Sequence */}
                <div className="flex gap-2 items-center flex-wrap">
                  {strokeImages[kanji.char]?.map((imgSrc, sIdx) => (
                    <img 
                      key={sIdx}
                      src={imgSrc} 
                      alt={`Nét ${sIdx + 1}`}
                      className="w-10 h-10 rounded border border-slate-200 dark:border-slate-700 bg-white"
                    />
                  ))}
                </div>
              </div>

              {/* Line 2: Meaning */}
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {kanji.meaning}
              </div>

              {/* Line 3: Practice grid (10x2 table) */}
              <div className="pt-2 w-full max-w-[800px]">
                <table className="w-full border-collapse border-2 border-[#9CA3AF] bg-white table-fixed">
                  <tbody>
                    <tr className="border-b border-[#d9d9d9]">
                      {Array.from({ length: 10 }).map((_, cIdx) => (
                        <td key={cIdx} className="relative aspect-square border-r border-[#d9d9d9] last:border-r-0 p-0 text-center align-middle">
                          {/* guidelines */}
                          <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-[#e2e8f0] -translate-y-1/2 z-10 pointer-events-none" />
                          <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-[#e2e8f0] -translate-x-1/2 z-10 pointer-events-none" />
                          <span className="relative z-20 text-[2.5rem] font-normal text-[#D9D9D9] leading-none select-none" style={{ fontFamily: "var(--font-japanese), 'Arial', sans-serif" }}>
                            {kanji.char}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      {Array.from({ length: 10 }).map((_, cIdx) => (
                        <td key={cIdx} className="relative aspect-square border-r border-[#d9d9d9] last:border-r-0 p-0 text-center align-middle">
                          {/* guidelines */}
                          <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-[#e2e8f0] -translate-y-1/2 z-10 pointer-events-none" />
                          <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-[#e2e8f0] -translate-x-1/2 z-10 pointer-events-none" />
                          {/* Empty spacer to force cell height and ratio */}
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
      )}
    </div>
  );
}
