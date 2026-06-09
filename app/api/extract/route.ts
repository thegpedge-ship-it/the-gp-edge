import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { writeFile } from "fs/promises";
import { join } from "path";
import os from "os";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to temp folder
    const tempDir = os.tmpdir();
    const fileName = (file as any).name || "uploaded_file";
    const tempPath = join(tempDir, `gpedgesync_${Date.now()}_${fileName}`);
    await writeFile(tempPath, buffer);

    // Run python script
    const pythonScript = `C:\\Users\\udava\\.gemini\\antigravity-ide\\brain\\67a59f73-cbe9-46d2-9c7c-f8c792646780\\scratch\\extract_single.py`;
    
    return new Promise<NextResponse>((resolve) => {
      exec(`python "${pythonScript}" "${tempPath}"`, (error, stdout, stderr) => {
        // clean up temp file
        try {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        } catch (e) {
          console.error("Temp file cleanup error:", e);
        }

        if (error) {
          resolve(NextResponse.json({ error: `Execution error: ${error.message}` }, { status: 500 }));
          return;
        }

        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(NextResponse.json(parsed));
        } catch (e) {
          // If python output has extra logs, grab the last JSON line
          try {
            const lines = stdout.trim().split("\n");
            const lastLine = lines[lines.length - 1];
            const parsed = JSON.parse(lastLine);
            resolve(NextResponse.json(parsed));
          } catch (err) {
            resolve(NextResponse.json({ error: "Failed to parse script output", raw: stdout }, { status: 500 }));
          }
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
