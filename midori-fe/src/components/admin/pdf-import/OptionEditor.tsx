import React from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface OptionEditorProps {
  options: string[];
  correctIndex: number;
  onChangeOptions: (newOptions: string[]) => void;
  onChangeCorrectIndex: (index: number) => void;
}

export const OptionEditor: React.FC<OptionEditorProps> = React.memo(
  ({ options, correctIndex, onChangeOptions, onChangeCorrectIndex }) => {
    const handleOptionTextChange = (index: number, text: string) => {
      const updated = [...options];
      updated[index] = text;
      onChangeOptions(updated);
    };

    const handleAddOption = () => {
      onChangeOptions([...options, ""]);
    };

    const handleRemoveOption = (index: number) => {
      if (options.length <= 1) return;
      const updated = options.filter((_, i) => i !== index);
      onChangeOptions(updated);
      if (correctIndex === index) {
        onChangeCorrectIndex(0);
      } else if (correctIndex > index) {
        onChangeCorrectIndex(correctIndex - 1);
      }
    };

    const handleMoveOption = (index: number, direction: "up" | "down") => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= options.length) return;

      const updated = [...options];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      onChangeOptions(updated);

      if (correctIndex === index) {
        onChangeCorrectIndex(targetIndex);
      } else if (correctIndex === targetIndex) {
        onChangeCorrectIndex(index);
      }
    };

    return (
      <div className="space-y-2 mt-3">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-secondary-col uppercase tracking-wider">
            Answer Options
          </label>
          <button
            type="button"
            onClick={handleAddOption}
            className="flex items-center gap-1 text-xs text-primary font-semibold hover:opacity-80 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Option</span>
          </button>
        </div>

        <div className="space-y-2">
          {options.map((option, idx) => {
            const label = String.fromCharCode(65 + idx); // A, B, C, D...
            const isCorrect = correctIndex === idx;

            return (
              <div key={idx} className="flex items-center gap-2">
                {/* Radio button select correct */}
                <input
                  type="radio"
                  checked={isCorrect}
                  onChange={() => onChangeCorrectIndex(idx)}
                  className="w-4 h-4 cursor-pointer text-primary focus:ring-primary"
                  title="Mark as Correct Answer"
                />

                {/* Option Label (A, B, C...) */}
                <span className="text-xs font-mono font-bold text-muted-col w-4">
                  {label}
                </span>

                {/* Option Text Input */}
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-1 focus:ring-primary/40 transition"
                  placeholder={`Option ${label}`}
                />

                {/* Move Actions */}
                <button
                  type="button"
                  onClick={() => handleMoveOption(idx, "up")}
                  disabled={idx === 0}
                  className="p-1 rounded hover:bg-[var(--accent)] text-muted-col disabled:opacity-30"
                  title="Move Option Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveOption(idx, "down")}
                  disabled={idx === options.length - 1}
                  className="p-1 rounded hover:bg-[var(--accent)] text-muted-col disabled:opacity-30"
                  title="Move Option Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                {/* Delete Option */}
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  disabled={options.length <= 2}
                  className="p-1.5 rounded hover:bg-red-500/10 text-red-500 disabled:opacity-30 transition"
                  title="Delete Option"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

OptionEditor.displayName = "OptionEditor";
