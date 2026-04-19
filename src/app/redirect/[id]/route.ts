import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return new Response("Route Handler is working!", { status: 200 });
}