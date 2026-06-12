import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";

export const dynamic = "force-dynamic";

const SPEC_FILE = process.env.OPENUI_SPEC_FILE || ".openui/spec.oui";

export async function GET() {
  try {
    if (!existsSync(SPEC_FILE)) {
      return NextResponse.json({ spec: "", lastModified: 0 });
    }

    const [content, stats] = await Promise.all([
      readFile(SPEC_FILE, "utf-8"),
      stat(SPEC_FILE),
    ]);

    return NextResponse.json({
      spec: content,
      lastModified: stats.mtimeMs,
    });
  } catch {
    return NextResponse.json({ spec: "", lastModified: 0 });
  }
}
