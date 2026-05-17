import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, rawPrompt, nodes, edges, userId } = body;

    if (!title || !nodes || !edges) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // In a real app, userId comes from the authentication session.
    // For now, we will use a dummy user or require it in the payload.
    // Let's upsert a dummy user just for testing purposes if userId is missing.
    const actualUserId = userId || "demo-user-id";

    // Ensure dummy user exists for now so FK constraint doesn't fail
    await db.user.upsert({
      where: { id: actualUserId },
      update: {},
      create: {
        id: actualUserId,
        email: "demo@designdb.app",
      },
    });

    const project = await db.project.create({
      data: {
        userId: actualUserId,
        title,
        rawPrompt: rawPrompt || "",
        nodesJson: nodes,
        edgesJson: edges,
      },
    });

    return NextResponse.json({ success: true, project }, { status: 200 });
  } catch (error: any) {
    console.error("Save project error:", error);
    return NextResponse.json({ error: error?.message || "Failed to save project" }, { status: 500 });
  }
}
