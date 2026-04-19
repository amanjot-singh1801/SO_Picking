import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePickingStore } from "../store/usePickingStore";
import { db, type SODetail } from "../lib/db";
import { api } from "../lib/api";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import ErrorModal from "../components/ErrorModal";

function PalletMismatchModal({
  isOpen,
  scanned,
  expected,
  onRetry,
  onError,
}: {
  isOpen: boolean;
  scanned: string;
  expected: string;
  onRetry: () => void;
  onError: () => void;
}) {
  const retryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => retryRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl p-12 max-w-lg w-full shadow-2xl border-4 border-red-400">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-red-600">Pallet Mismatch</h2>
        </div>

        <div className="bg-red-50 rounded-2xl p-6 mb-10 space-y-4 text-2xl">
          <div className="flex justify-between">
            <span className="text-gray-500">Scanned:</span>
            <span className="font-mono font-bold text-red-700">
              {scanned || "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Expected:</span>
            <span className="font-mono font-bold text-green-700">
              {expected}
            </span>
          </div>
        </div>

        <div className="flex gap-6">
          <button
            ref={retryRef}
            onClick={onRetry}
            className="flex-1 py-3 text-xl font-semibold bg-blue-600 text-white rounded-xl focus:ring-2 focus:ring-blue-300 outline-none"
          >
            Retry
          </button>
          <button
            onClick={onError}
            className="flex-1 py-3 text-xl font-semibold border-2 border-red-500 text-red-600 rounded-xl focus:ring-2 focus:ring-red-300 outline-none"
          >
            Error
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PickingPage() {
  const { so } = useParams<{ so: string }>();
  const navigate = useNavigate();
  const { reset } = usePickingStore();

  const [details, setDetails] = useState<SODetail[]>([]);
  const [skuMaster, setSkuMaster] = useState<Record<string, string>>({});

  const [step, setStep] = useState<"pallet" | "sku">("pallet");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allDone, setAllDone] = useState(false);

  const [currentTag, setCurrentTag] = useState("");
  const [scannedSKU, setScannedSKU] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  // submitFailed drives the retry button instead of a recursive call
  const [submitFailed, setSubmitFailed] = useState(false);

  const [showMismatch, setShowMismatch] = useState(false);
  const [showError, setShowError] = useState(false);

  const currentDetail = details[currentIndex];

  useEffect(() => {
    if (!so) return;
    db.soDetails
      .where("SO")
      .equals(so)
      .toArray()
      .then((data: any) => {
        if (data.length === 0) {
          alert(
            "No data found.\nPlease go back and click 'Start Picking' first.",
          );
          navigate("/");
        } else {
          setDetails(data);
        }
      });
  }, [so, navigate]);

  useEffect(() => {
    api
      .getSKUMaster()
      .then((data) => {
        const map: Record<string, string> = {};
        data.forEach((row) => {
          map[row.SKU] = row.Name;
        });
        setSkuMaster(map);
      })
      .catch(() => {
        console.warn("SKU Master could not be loaded.");
      });
  }, []);

  useBarcodeScanner((barcode: string) => {
    if (step === "pallet") handlePalletScan(barcode);
    else if (step === "sku") setScannedSKU(barcode);
  });

  const handlePalletScan = (barcode: string) => {
    setCurrentTag(barcode);
    if (barcode === currentDetail?.TAG) {
      setStep("sku");
    } else {
      setShowMismatch(true);
    }
  };

  const handleMismatchRetry = () => {
    setShowMismatch(false);
    setCurrentTag("");
  };

  const handleMismatchError = () => {
    setShowMismatch(false);
    setShowError(true);
  };

  // Shared helper: advance to next location or mark all done
  const advanceLocation = () => {
    const isLastLocation = currentIndex + 1 >= details.length;
    if (!isLastLocation) {
      setCurrentIndex(currentIndex + 1);
      setStep("pallet");
      setScannedSKU("");
      setCurrentTag("");
    } else {
      setAllDone(true);
    }
  };

  const handlePicked = async () => {
    if (!currentDetail) return;
    await db.pickedLocations.add({
      SO: so!,
      LOCATION: currentDetail.LOCATION,
      completedAt: new Date(),
    });
    advanceLocation();
  };

  const handleErrorSubmit = async (type: string, note: string) => {
    if (!currentDetail) return;
    try {
      await db.errors.add({
        SO: so!,
        Location: currentDetail.LOCATION,
        Tag: currentDetail.TAG,
        SKU: currentDetail.SKU,
        ERROR: type,
        Note: note,
        createdAt: new Date(),
      });
      setShowError(false);
      // After logging an error the picker must be able to continue.
      // Advance to the next location so they are never stuck.
      advanceLocation();
    } catch (error) {
      console.log("Failed to save error locally. Please try again. : ", error);
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitLoading(true);
    setSubmitFailed(false);
    try {
      const errors = await db.errors.where("SO").equals(so!).toArray();
      const result = await api.submit(so!, errors);
      alert(`Order Submitted!\nStatus: ${result.finalStatus}`);
      await db.errors.where("SO").equals(so!).delete();
      await db.pickedLocations.where("SO").equals(so!).delete();
      reset();
      navigate("/");
    } catch {
      // Do NOT call handleFinalSubmit() recursively — it grows the call stack
      // on repeated failures. Instead expose a Retry button.
      setSubmitFailed(true);
    } finally {
      setSubmitLoading(false);
    }
  };

  const progressCompleted = allDone ? details.length : currentIndex;
  const progressTotal = details.length;

  if (!currentDetail && !allDone) {
    return (
      <div className="p-12 text-center text-4xl">
        Loading from local database...
      </div>
    );
  }

  const isSKUValid =
    (currentDetail?.SCAN_SKU || "No") === "No" ||
    scannedSKU === currentDetail?.SKU;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold">SO : {so}</h1>
        <div className="text-right">
          <div className="text-xl text-gray-500">Progress</div>
          <div className="text-2xl font-mono font-bold">
            {progressCompleted} / {progressTotal}
          </div>
          <div className="h-4 bg-gray-200 rounded-3xl mt-3 overflow-hidden">
            <div
              className="h-4 bg-blue-600 transition-all"
              style={{ width: `${(progressCompleted / progressTotal) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {step === "pallet" && !allDone && currentDetail && (
        <div className="bg-white rounded-3xl p-12 border-4 border-blue-200">
          <h2 className="text-xl mb-6 text-gray-600">
            Location:{" "}
            <span className="font-bold text-black">
              {currentDetail.LOCATION}
            </span>
          </h2>
          <input
            autoFocus
            type="text"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handlePalletScan(currentTag);
              }
            }}
            placeholder="SCAN PALLET BARCODE"
            className="w-full p-4 text-2xl border-2 border-gray-400 rounded-3xl text-center focus:border-blue-600 outline-none"
          />
          <p className="text-center text-xl mt-6 text-gray-500">
            Expected Tag:{" "}
            <span className="font-mono font-bold text-black">
              {currentDetail.TAG}
            </span>
          </p>
        </div>
      )}

      {step === "sku" && !allDone && currentDetail && (
        <div className="bg-white rounded-3xl p-12 border-4 border-gray-200">
          <div className="text-2xl font-mono font-bold mb-4">
            {currentDetail.SKU}
          </div>

          <div className="text-xl font-medium mb-8 text-gray-800">
            {skuMaster[currentDetail.SKU] ?? (
              <span className="text-gray-400 italic text-3xl">
                Name not in SKU Master
              </span>
            )}
          </div>

          <div className="text-xl font-bold mb-10 bg-blue-50 rounded-2xl p-3 text-center">
            Qty: <span className="text-blue-700">{currentDetail.QUANTITY}</span>
          </div>

          {(currentDetail.SCAN_SKU || "No") === "Yes" && (
            <input
              autoFocus
              type="text"
              value={scannedSKU}
              onChange={(e) => setScannedSKU(e.target.value)}
              placeholder="SCAN SKU BARCODE"
              className="w-full p-4 text-xl border-2 border-gray-400 rounded-3xl text-center focus:border-blue-600 outline-none mb-10"
            />
          )}

          <div className="flex gap-8">
            <button
              onClick={() => setShowError(true)}
              className="flex-1 py-2 text-lg border-2 border-red-500 text-red-600 rounded-xl hover:bg-red-50"
            >
              ERROR
            </button>
            <button
              onClick={handlePicked}
              disabled={!isSKUValid}
              className="flex-1 py-2 text-lg bg-green-600 text-white rounded-xl disabled:opacity-40 hover:bg-green-700"
            >
              PICKED
            </button>
          </div>
        </div>
      )}

      {allDone && (
        <div className="bg-green-50 border-4 border-green-400 rounded-3xl p-12 text-center mb-8">
          <div className="text-2xl font-bold text-green-700">
            All Locations Picked!
          </div>
          <div className="text-2xl text-green-600 mt-3">
            {progressTotal} / {progressTotal} locations completed
          </div>
        </div>
      )}

      {allDone && (
        <div className="text-center">
          {submitFailed && (
            <p className="text-red-600 text-lg mb-3">
              Submit failed. Please check your connection and try again.
            </p>
          )}
          <button
            onClick={handleFinalSubmit}
            disabled={submitLoading}
            className="mt-4 py-4 px-5 text-xl bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitLoading ? "Submitting..." : submitFailed ? "RETRY SUBMIT" : "SUBMIT ORDER"}
          </button>
        </div>
      )}

      <PalletMismatchModal
        isOpen={showMismatch}
        scanned={currentTag}
        expected={currentDetail?.TAG ?? ""}
        onRetry={handleMismatchRetry}
        onError={handleMismatchError}
      />

      <ErrorModal
        isOpen={showError}
        onClose={() => setShowError(false)}
        onSubmit={handleErrorSubmit}
      />
    </div>
  );
}