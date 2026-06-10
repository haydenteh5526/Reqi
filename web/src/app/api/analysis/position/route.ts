import { NextRequest, NextResponse } from "next/server";

// For local dev, proxy to the server. In production, this would need
// a hosted engine service or we disable server-side analysis.
export async function POST(req: NextRequest) {
  const apiUrl = process.env.API_URL ?? "http://localhost:3001";
  const body = await req.json();

  try {
    const res = await fetch(`${apiUrl}/analysis/position`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Engine unavailable" }, { status: 503 });
  }
}
