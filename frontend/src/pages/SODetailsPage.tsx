import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { db } from "../lib/db";
import { usePickingStore } from "../store/usePickingStore";
import Spinner from "../components/Spinner";

export default function SODetailsPage() {
  const { so } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [scanSKU, setScanSKU] = useState<string>("No");

  useEffect(() => {
    if (!so) return;

    api.getPendingSOs().then((sos: any[]) => {
      const match = sos.find((s: any) => s.SO === so);
      if (match) setScanSKU(match.SCAN_SKU || "No");
    });

    api.getSODetails(so)
      .then((data) => {
        setDetails(data);
        const g: any = {};
        data.forEach((d: any) => {
          const qty = Number(d.QUANTITY) || 0;
          g[d.LOCATION] = (g[d.LOCATION] || 0) + qty;
        });
        setGrouped(g);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false); 
      });
  }, [so]);

  const startPicking = async () => {
    const success = await api.startPicking(so!);
    if (success) {
      const detailsWithScanSKU = details.map((d) => ({
        ...d,
        SCAN_SKU: scanSKU,
      }));
      await db.soDetails.clear();
      await db.soDetails.bulkPut(detailsWithScanSKU);
      usePickingStore.getState().setCurrentSO(so!);
      navigate(`/picking/${so}`);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto ">
      <h1 className="text-2xl font-bold mb-4">SO : {so}</h1>
      <div className="bg-white rounded-3xl p-10 mb-8">
        {Object.entries(grouped).map(([loc, qty]) => (
          <div
            key={loc}
            className="flex justify-between py-3 border-b text-2xl"
          >
            <span>{loc}</span>
            <span className="font-mono">{qty} pcs</span>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button
          onClick={startPicking}
          className="py-3 px-5 bg-blue-600 text-white text-md font-semibold rounded-xl "
        >
          START PICKING
        </button>
      </div>
    </div>
  );
}
