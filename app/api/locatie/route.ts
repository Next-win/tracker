import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "locations.json");

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

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), "data");
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function getLocations(): Promise<LocationData[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveLocation(location: LocationData) {
  await ensureDataDir();
  const locations = await getLocations();
  locations.push(location);
  await fs.writeFile(DATA_FILE, JSON.stringify(locations, null, 2));
}

async function getIpLocation(ip: string) {
  try {
    // Gebruik ip-api.com (gratis, geen API key nodig)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon`);
    const data = await response.json();
    
    if (data.status === "success") {
      return {
        city: data.city,
        region: data.regionName,
        country: data.country,
        lat: data.lat,
        lon: data.lon,
      };
    }
  } catch (e) {
    console.error("IP lookup error:", e);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headersList = await headers();
    
    // Haal het IP-adres op
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    const locationData: LocationData = {
      trackingId: body.trackingId,
      type: body.type,
      timestamp: body.timestamp || new Date().toISOString(),
      userAgent,
      ip,
    };

    // Voeg GPS data toe indien beschikbaar
    if (body.type === "gps") {
      locationData.latitude = body.latitude;
      locationData.longitude = body.longitude;
      locationData.accuracy = body.accuracy;
    }

    // Voeg error toe bij gps_denied
    if (body.type === "gps_denied") {
      locationData.error = body.error;
    }

    // Haal IP-gebaseerde locatie op
    if (ip !== "unknown" && ip !== "127.0.0.1" && ip !== "::1") {
      const ipLocation = await getIpLocation(ip);
      if (ipLocation) {
        locationData.ipLocation = ipLocation;
      }
    }

    await saveLocation(locationData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving location:", error);
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const locations = await getLocations();
    return NextResponse.json(locations);
  } catch (error) {
    console.error("Error getting locations:", error);
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    );
  }
}
