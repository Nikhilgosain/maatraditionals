/* eslint-disable @typescript-eslint/no-explicit-any */

import "server-only";
import { NextRequest } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { renderInvoiceHtml } from "@/components/invoice/renderInvoiceHtml";
import { readFile } from "node:fs/promises";
import { existsSync } from "fs";
import path from "node:path";
import { STATUS_CODE } from "@/utils/constant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function usesServerlessChromium() {
  return (
    process.env.RENDER === "true" ||
    process.env.RENDER_SERVICE_ID !== undefined ||
    !!process.env.AWS_LAMBDA_FUNCTION_VERSION ||
    process.env.VERCEL === "1"
  );
}

async function getExecutablePath() {
  // 1. Use env var if provided
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // 2. Serverless → use @sparticuz/chromium
  if (usesServerlessChromium()) {
    return await chromium.executablePath();
  }

  // 3. Try common install locations
  const candidates = [
    "/usr/bin/google-chrome", // Linux
    "/usr/bin/chromium-browser", // Linux
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", // macOS
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", // Windows 64-bit
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe", // Windows 32-bit
  ];

  const found = candidates.find((p) => existsSync(p));
  if (found) return found;

  // 4. Fallback to Puppeteer's bundled Chromium
  return puppeteer.executablePath();
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Inline /public/logo.png if not provided
    if (!data.logoSrc || data.logoSrc.startsWith("/")) {
      try {
        const logoPath = path.join(
          process.cwd(),
          "public",
          data.logoSrc?.replace(/^\//, "") || "logo.png"
        );
        const buf = await readFile(logoPath);
        data.logoSrc = `data:image/png;base64,${buf.toString("base64")}`;
      } catch {
        /* ignore missing logo */
      }
    }

    const html = renderInvoiceHtml(data);

    const browser = await puppeteer.launch({
      executablePath: await getExecutablePath(),
      args: usesServerlessChromium()
        ? chromium.args
        : ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
      defaultViewport: { width: 1200, height: 800, deviceScaleFactor: 2 },
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "10mm", bottom: "12mm", left: "10mm" },
      preferCSSPageSize: true,
    });

    await browser.close();

    const blob = new Blob([Buffer.from(pdfBuffer)], {
      type: "application/pdf",
    });

    return new Response(blob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${
          data?.invoiceNo || "download"
        }.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message || "Failed to generate PDF" }),
      {
        status: STATUS_CODE.INTERNAL_SERVER_ERROR,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
