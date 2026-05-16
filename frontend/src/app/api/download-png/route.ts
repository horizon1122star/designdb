import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { dataUrl } = await req.json();

  if (!dataUrl) {
    return NextResponse.json({ error: "Missing dataUrl" }, { status: 400 });
  }

  // Strip the data URI prefix: "data:image/png;base64,..."
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="designdb_erd.png"`,
      "Content-Length": buffer.byteLength.toString(),
    },
  });
}
