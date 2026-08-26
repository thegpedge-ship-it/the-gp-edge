/* Client-side helper to create a 0.15 opacity logo PNG Data URL for jsPDF watermarks. */

export interface WatermarkInfo {
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
}

let cachedWatermarkInfo: WatermarkInfo | null = null;

export async function getWatermarkLogoInfo(
  logoUrl = "/assets/logo.png",
  opacity = 0.15
): Promise<WatermarkInfo | null> {
  if (typeof window === "undefined") return null;
  if (cachedWatermarkInfo) return cachedWatermarkInfo;

  try {
    const info = await new Promise<WatermarkInfo | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = logoUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = opacity;
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: img.width,
          height: img.height,
          aspectRatio: img.width / (img.height || 1),
        });
      };
      img.onerror = () => {
        if (logoUrl !== "/assets/logo.jpeg") {
          getWatermarkLogoInfo("/assets/logo.jpeg", opacity).then((res) => resolve(res));
        } else {
          resolve(null);
        }
      };
    });

    if (info) {
      cachedWatermarkInfo = info;
    }
    return info;
  } catch (err) {
    console.error("[getWatermarkLogoInfo] Error loading watermark image:", err);
    return null;
  }
}

let cachedWhiteLogoDataUrl: string | null = null;

export async function getWhiteLogoDataUrl(logoUrl = "/assets/logo.png"): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (cachedWhiteLogoDataUrl) return cachedWhiteLogoDataUrl;

  try {
    const dataUrl = await new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = logoUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("");
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const alpha = 255 - brightness;
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
          data[i + 3] = alpha > 30 ? Math.min(255, Math.round(alpha * 1.2)) : 0;
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => {
        if (logoUrl !== "/assets/logo.jpeg") {
          getWhiteLogoDataUrl("/assets/logo.jpeg").then((res) => resolve(res || ""));
        } else {
          resolve("");
        }
      };
    });

    if (dataUrl) {
      cachedWhiteLogoDataUrl = dataUrl;
    }
    return dataUrl;
  } catch (err) {
    console.error("[getWhiteLogoDataUrl] Error loading white logo image:", err);
    return null;
  }
}

let cachedOriginalLogoInfo: WatermarkInfo | null = null;

export async function getLogoInfo(logoUrl = "/assets/logo.png"): Promise<WatermarkInfo | null> {
  if (typeof window === "undefined") return null;
  if (cachedOriginalLogoInfo) return cachedOriginalLogoInfo;

  try {
    const info = await new Promise<WatermarkInfo | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = logoUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: img.width,
          height: img.height,
          aspectRatio: img.width / (img.height || 1),
        });
      };
      img.onerror = () => {
        if (logoUrl !== "/assets/logo.jpeg") {
          getLogoInfo("/assets/logo.jpeg").then((res) => resolve(res));
        } else {
          resolve(null);
        }
      };
    });

    if (info) {
      cachedOriginalLogoInfo = info;
    }
    return info;
  } catch (err) {
    console.error("[getLogoInfo] Error loading logo image:", err);
    return null;
  }
}
