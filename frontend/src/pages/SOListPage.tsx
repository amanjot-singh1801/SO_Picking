import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function SOListPage() {
  const [sos, setSos] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.getPendingSOs().then(setSos);
  }, []);

  const filtered = sos.filter((so) =>
    so.SO.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-10 text-blue-700">
        Pending Sales Orders
      </h1>
      <input
        type="text"
        placeholder="Search SO number"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-6 text-2xl border rounded-xl mb-10"
      />
      <div className="space-y-4">
        {filtered.map((so) => (
          <div
            key={so.SO}
            onClick={() => navigate(`/so/${so.SO}`)}
            className="bg-white p-4 rounded-xl border-2 hover:border-blue-600 cursor-pointer flex justify-between items-center text-xl"
          >
            <div>
              <span className="font-mono">{so.SO}</span>{" "}
              <span className="text-gray-400 text-xl">• {so.Date}</span>
            </div>
            <span className="px-8 py-2 bg-yellow-100 text-yellow-700 rounded-xl text-xl font-medium">
              PENDING
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
