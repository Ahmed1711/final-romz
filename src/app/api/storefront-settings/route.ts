import { NextResponse } from "next/server";
import { getStorefrontSettings } from "@/lib/storefrontSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getStorefrontSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Store settings request failed.",
      },
      { status: 502 }
    );
  }
}
