import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://pawofhelp.onrender.com";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";

  const backendRes = await fetch(`${BACKEND}/api/Users/profile`, {
    method: "GET",
    headers: {
      Authorization: auth,
    },
  });

  const contentType =
    backendRes.headers.get("content-type") ?? "application/json; charset=utf-8";
  const text = await backendRes.text();

  return new NextResponse(text, {
    status: backendRes.status,
    headers: { "Content-Type": contentType },
  });
}