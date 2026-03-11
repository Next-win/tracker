import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabase } from "@/lib/supabase";

interface IpLocationResponse {
  status: string;
  city?: string;
  regionName?: string;
  country?: string;
  lat?: number;
  lon?: number;
}

async function getIpLocation(ip: string) {
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon`
    );
    const data: IpLocationResponse = await response.json();

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

    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Basis data
    const locationData: Record<string, unknown> = {
      tracking_id: body.trackingId,
      type: body.type,
      user_agent: userAgent,
      ip: ip,
    };

    // GPS data toevoegen indien beschikbaar (ook voor live tracking)
    if (body.type === "gps" || body.type === "gps_live") {
      locationData.latitude = body.latitude;
      locationData.longitude = body.longitude;
      locationData.accuracy = body.accuracy;
    }

    // Error toevoegen bij gps_denied
    if (body.type === "gps_denied") {
      locationData.error = body.error;
    }

    // IP-gebaseerde locatie ophalen
    if (ip !== "unknown" && ip !== "127.0.0.1" && ip !== "::1") {
      const ipLocation = await getIpLocation(ip);
      if (ipLocation) {
        locationData.ip_city = ipLocation.city;
        locationData.ip_region = ipLocation.region;
        locationData.ip_country = ipLocation.country;
        locationData.ip_lat = ipLocation.lat;
        locationData.ip_lon = ipLocation.lon;
      }
    }

    // Opslaan in Supabase
    const { error } = await supabase.from("locations").insert([locationData]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving location:", error);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase select error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data naar het oude formaat voor compatibiliteit met dashboard
    const transformedData = (data || []).map((row) => ({
      trackingId: row.tracking_id,
      type: row.type,
      latitude: row.latitude,
      longitude: row.longitude,
      accuracy: row.accuracy,
      ip: row.ip,
      ipLocation: row.ip_city
        ? {
            city: row.ip_city,
            region: row.ip_region,
            country: row.ip_country,
            lat: row.ip_lat,
            lon: row.ip_lon,
          }
        : null,
      error: row.error,
      timestamp: row.created_at,
      userAgent: row.user_agent,
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("Error getting locations:", error);
    return NextResponse.json({ error: "Er ging iets mis" }, { status: 500 });
  }
}
