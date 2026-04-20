import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://pawofhelp.onrender.com";

export async function POST(req: NextRequest) {
  const body = await req.text();

  const backendRes = await fetch(`${BACKEND}/api/Auth/confirm-email`, {
    method: "POST",
    headers: {
      "Content-Type": req.headers.get("content-type") ?? "application/json",
    },
    body,
  });

  const contentType =
    backendRes.headers.get("content-type") ?? "application/json; charset=utf-8";
  const text = await backendRes.text();

  return new NextResponse(text, {
    status: backendRes.status,
    headers: { "Content-Type": contentType },
  });
}