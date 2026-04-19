import { useState } from "react";

const ERROR_TYPES = [
  "Pallet Not Found",
  "Pallet Mismatch",
  "Pallet Empty",
  "SKU Short",
  "SKU Mismatch",
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: string, note: string) => void;
}

export default function ErrorModal({ isOpen, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      {/* MODAL CONTAINER */}
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-red-600">Report Error</h2>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-3 mb-6">
            {ERROR_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setSelected(t)}
                className={`p-4 text-left text-lg rounded-xl border transition
                  ${
                    selected === t
                      ? "border-red-600 bg-red-50"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full h-28 border rounded-xl p-4 text-lg focus:outline-none focus:border-red-500"
          />
        </div>

        {/* FIXED FOOTER */}
        <div className="p-6 border-t flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 border rounded-xl text-lg hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              onSubmit(selected, note);
              onClose();
              setSelected("");
              setNote("");
            }}
            disabled={!selected}
            className="flex-1 py-4 bg-red-600 text-white rounded-xl text-lg disabled:opacity-50"
          >
            Save Error
          </button>
        </div>
      </div>
    </div>
  );
}
