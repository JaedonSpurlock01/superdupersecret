import { NextResponse } from "next/server";
import { getCurrentWeather } from "@/lib/weather";

export async function GET() {
  const weather = await getCurrentWeather();

  return NextResponse.json(
    { weather },
    {
      headers: {
        "Cache-Control": weather
          ? "public, s-maxage=900, stale-while-revalidate=1800"
          : "no-store",
      },
    },
  );
}
