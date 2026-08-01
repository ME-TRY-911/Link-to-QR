import QRCode from 'qrcode';
import { QrConfig } from '../types';

/**
 * Helper to draw rounded rectangle with cross-browser safety fallback
 */
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radii: number | number[]
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radii);
    ctx.fill();
    return;
  }

  // Fallback for older environments
  const r = typeof radii === 'number' ? radii : radii[0] || 0;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

function pathBadgeShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: 'circle' | 'rounded' | 'square' | 'none'
) {
  ctx.beginPath();
  if (shape === 'circle') {
    const cx = x + size / 2;
    const cy = y + size / 2;
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
  } else if (shape === 'rounded') {
    const r = size * 0.22;
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, size, size, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + size - r, y);
      ctx.quadraticCurveTo(x + size, y, x + size, y + r);
      ctx.lineTo(x + size, y + size - r);
      ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
      ctx.lineTo(x + r, y + size);
      ctx.quadraticCurveTo(x, y + size, x, y + size - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  } else if (shape === 'square') {
    ctx.rect(x, y, size, size);
  }
}

/**
 * Check if module coordinate belongs to one of the 3 corner finder patterns (7x7)
 */
function isFinderPattern(row: number, col: number, size: number): boolean {
  // Top-Left
  if (row < 7 && col < 7) return true;
  // Top-Right
  if (row < 7 && col >= size - 7) return true;
  // Bottom-Left
  if (row >= size - 7 && col < 7) return true;
  return false;
}

export function convertGoogleDriveUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const driveRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/;
  const match = trimmed.match(driveRegex);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return trimmed;
}

/**
 * Main QR Canvas Renderer supporting all dot styles, eye shapes, gradient fill, and frame banners
 */
export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  payload: string,
  config: QrConfig,
  targetSize: number = 600
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Generate QR matrix using QRCode.create (enforce 'H' when logo is present for scannability)
  const ecl = config.logo ? 'H' : (config.errorCorrectionLevel || 'M');
  const qr = QRCode.create(payload || 'https://linktoqr.com', {
    errorCorrectionLevel: ecl,
  });

  const matrixSize = qr.modules.size;
  const margin = 2; // module margin
  const totalModules = matrixSize + margin * 2;

  // Canvas size setup
  let canvasWidth = targetSize;
  let canvasHeight = targetSize;

  // Frame layout padding
  let qrTopOffset = 0;
  let qrBottomOffset = 0;
  let qrSideOffset = 0;

  const hasFrame = config.frameStyle && config.frameStyle !== 'none';
  const frameText = config.frameText || 'SCAN ME';

  if (hasFrame) {
    if (config.frameStyle === 'banner') {
      qrBottomOffset = targetSize * 0.16; // extra height for bottom banner
      canvasHeight += qrBottomOffset;
    } else if (config.frameStyle === 'badge') {
      qrTopOffset = targetSize * 0.14; // extra height for top header badge
      canvasHeight += qrTopOffset;
    } else if (config.frameStyle === 'card') {
      qrTopOffset = targetSize * 0.12;
      qrBottomOffset = targetSize * 0.16;
      qrSideOffset = targetSize * 0.08;
      canvasWidth += qrSideOffset * 2;
      canvasHeight += qrTopOffset + qrBottomOffset;
    }
  }

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Background
  const bgColor = config.transparentBg ? '#00000000' : config.bgColor || '#ffffff';
  
  if (config.frameStyle === 'card') {
    // Outer frame card container
    if (!config.transparentBg) {
      ctx.fillStyle = bgColor;
      drawRoundRect(ctx, 0, 0, canvasWidth, canvasHeight, 32);
    }
  } else if (!config.transparentBg) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // QR Module dimensions
  const availableQrWidth = canvasWidth - qrSideOffset * 2;
  const availableQrHeight = canvasHeight - qrTopOffset - qrBottomOffset;
  const qrDimension = Math.min(availableQrWidth, availableQrHeight);

  const cellSize = qrDimension / totalModules;
  const startX = qrSideOffset + (availableQrWidth - qrDimension) / 2 + margin * cellSize;
  const startY = qrTopOffset + (availableQrHeight - qrDimension) / 2 + margin * cellSize;

  // Prepare Foreground Fill (Solid or Gradient)
  let fgStyle: string | CanvasGradient = config.fgColor || '#000000';
  if (config.gradientFg && config.fgColorEnd) {
    const grad = ctx.createLinearGradient(startX, startY, startX + qrDimension, startY + qrDimension);
    grad.addColorStop(0, config.fgColor);
    grad.addColorStop(1, config.fgColorEnd);
    fgStyle = grad;
  }

  // -------------------------------------------------------------
  // 1. Draw Body Modules (excluding Finder Patterns)
  // -------------------------------------------------------------
  ctx.fillStyle = fgStyle;

  for (let row = 0; row < matrixSize; row++) {
    for (let col = 0; col < matrixSize; col++) {
      if (isFinderPattern(row, col, matrixSize)) continue;

      const isDark = qr.modules.get(row, col);
      if (!isDark) continue;

      const cellX = startX + col * cellSize;
      const cellY = startY + row * cellSize;

      const style = config.dotStyle || 'square';

      if (style === 'dots') {
        ctx.beginPath();
        ctx.arc(cellX + cellSize / 2, cellY + cellSize / 2, cellSize * 0.42, 0, Math.PI * 2);
        ctx.fill();
      } else if (style === 'rounded') {
        drawRoundRect(ctx, cellX + 0.5, cellY + 0.5, cellSize - 1, cellSize - 1, cellSize * 0.35);
      } else if (style === 'classy') {
        drawRoundRect(ctx, cellX + 0.5, cellY + 0.5, cellSize - 1, cellSize - 1, [
          cellSize * 0.4,
          0,
          cellSize * 0.4,
          0,
        ]);
      } else {
        // 'square' default
        ctx.fillRect(cellX, cellY, cellSize, cellSize);
      }
    }
  }

  // -------------------------------------------------------------
  // 2. Draw Finder Patterns (Eyes) - TopLeft, TopRight, BottomLeft
  // -------------------------------------------------------------
  const eyePositions = [
    { row: 0, col: 0 },
    { row: 0, col: matrixSize - 7 },
    { row: matrixSize - 7, col: 0 },
  ];

  const eyeStyle = config.eyeStyle || 'square';

  eyePositions.forEach(({ row, col }) => {
    const eyeX = startX + col * cellSize;
    const eyeY = startY + row * cellSize;
    const eyeSize = 7 * cellSize;

    const outerR = eyeStyle === 'circle' ? eyeSize / 2 : eyeStyle === 'rounded' ? cellSize * 1.8 : cellSize * 0.5;
    const innerBgR = eyeStyle === 'circle' ? (5 * cellSize) / 2 : eyeStyle === 'rounded' ? cellSize * 1.2 : cellSize * 0.3;
    const centerR = eyeStyle === 'circle' ? (3 * cellSize) / 2 : eyeStyle === 'rounded' ? cellSize * 0.8 : cellSize * 0.2;

    // Outer Eye Box (7x7)
    ctx.fillStyle = fgStyle;
    if (eyeStyle === 'circle') {
      ctx.beginPath();
      ctx.arc(eyeX + eyeSize / 2, eyeY + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (eyeStyle === 'leaf') {
      drawRoundRect(ctx, eyeX, eyeY, eyeSize, eyeSize, [eyeSize * 0.4, 0, eyeSize * 0.4, 0]);
    } else if (eyeStyle === 'rounded') {
      drawRoundRect(ctx, eyeX, eyeY, eyeSize, eyeSize, outerR);
    } else {
      ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
    }

    // Inner Cutout Box (5x5)
    ctx.fillStyle = bgColor;
    const cutoutX = eyeX + cellSize;
    const cutoutY = eyeY + cellSize;
    const cutoutSize = 5 * cellSize;

    if (eyeStyle === 'circle') {
      ctx.beginPath();
      ctx.arc(eyeX + eyeSize / 2, eyeY + eyeSize / 2, (5 * cellSize) / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (eyeStyle === 'leaf') {
      drawRoundRect(ctx, cutoutX, cutoutY, cutoutSize, cutoutSize, [cutoutSize * 0.35, 0, cutoutSize * 0.35, 0]);
    } else if (eyeStyle === 'rounded') {
      drawRoundRect(ctx, cutoutX, cutoutY, cutoutSize, cutoutSize, innerBgR);
    } else {
      ctx.fillRect(cutoutX, cutoutY, cutoutSize, cutoutSize);
    }

    // Center Eye Dot (3x3)
    ctx.fillStyle = fgStyle;
    const centerX = eyeX + 2 * cellSize;
    const centerY = eyeY + 2 * cellSize;
    const centerDotSize = 3 * cellSize;

    if (eyeStyle === 'circle') {
      ctx.beginPath();
      ctx.arc(eyeX + eyeSize / 2, eyeY + eyeSize / 2, (3 * cellSize) / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (eyeStyle === 'leaf') {
      drawRoundRect(ctx, centerX, centerY, centerDotSize, centerDotSize, [centerDotSize * 0.3, 0, centerDotSize * 0.3, 0]);
    } else if (eyeStyle === 'rounded') {
      drawRoundRect(ctx, centerX, centerY, centerDotSize, centerDotSize, centerR);
    } else {
      ctx.fillRect(centerX, centerY, centerDotSize, centerDotSize);
    }
  });

  // -------------------------------------------------------------
  // 3. Draw Center Logo Overlay if present
  // -------------------------------------------------------------
  if (config.logo) {
    await new Promise<void>((resolve) => {
      const convertedUrl = convertGoogleDriveUrl(config.logo!);
      const logoImg = new Image();
      let triedWithoutCors = false;

      logoImg.crossOrigin = 'anonymous';

      logoImg.onload = () => {
        const sizePercent = Math.min(Math.max(config.logoSizePercent || 22, 10), 35);
        const badgeSize = qrDimension * (sizePercent / 100);
        const badgeX = startX + (qrDimension - badgeSize) / 2;
        const badgeY = startY + (qrDimension - badgeSize) / 2;
        const shape = config.logoShape || 'rounded';

        ctx.save();

        if (shape !== 'none') {
          // Draw badge background
          ctx.fillStyle = bgColor === '#00000000' ? '#ffffff' : bgColor;
          pathBadgeShape(ctx, badgeX, badgeY, badgeSize, shape);
          ctx.fill();

          // Draw badge border
          ctx.lineWidth = Math.max(2, qrDimension * 0.005);
          ctx.strokeStyle = typeof fgStyle === 'string' ? fgStyle : config.fgColor;
          ctx.stroke();
        }

        // Determine image dimensions with aspect ratio preservation (reduced inner padding for clearer display)
        const innerPadding = shape === 'none' ? 0 : badgeSize * 0.08;
        const maxImgDim = badgeSize - innerPadding * 2;
        let imgW = maxImgDim;
        let imgH = maxImgDim;

        if (logoImg.width > 0 && logoImg.height > 0) {
          const aspect = logoImg.width / logoImg.height;
          if (aspect > 1) {
            imgH = maxImgDim / aspect;
          } else {
            imgW = maxImgDim * aspect;
          }
        }

        const imgX = badgeX + (badgeSize - imgW) / 2;
        const imgY = badgeY + (badgeSize - imgH) / 2;

        // Clip image inside badge bounds
        if (shape !== 'none') {
          ctx.save();
          pathBadgeShape(ctx, badgeX + 1, badgeY + 1, badgeSize - 2, shape);
          ctx.clip();
        }

        ctx.drawImage(logoImg, imgX, imgY, imgW, imgH);

        if (shape !== 'none') {
          ctx.restore();
        }

        ctx.restore();
        resolve();
      };

      logoImg.onerror = () => {
        if (!triedWithoutCors) {
          triedWithoutCors = true;
          // Retry without crossOrigin attribute so non-CORS images can still be drawn on canvas
          logoImg.removeAttribute('crossOrigin');
          logoImg.src = convertedUrl;
        } else {
          resolve(); // proceed gracefully if logo fails
        }
      };

      if (convertedUrl) {
        logoImg.src = convertedUrl;
      } else {
        resolve();
      }
    });
  }

  // -------------------------------------------------------------
  // 4. Draw Frames & CTA Text Banner
  // -------------------------------------------------------------
  if (hasFrame) {
    ctx.fillStyle = typeof fgStyle === 'string' ? fgStyle : config.fgColor;

    if (config.frameStyle === 'banner') {
      // Bottom pill banner
      const bannerHeight = qrBottomOffset * 0.7;
      const bannerY = canvasHeight - qrBottomOffset + (qrBottomOffset - bannerHeight) / 2;
      const bannerWidth = canvasWidth * 0.75;
      const bannerX = (canvasWidth - bannerWidth) / 2;

      drawRoundRect(ctx, bannerX, bannerY, bannerWidth, bannerHeight, bannerHeight / 2);

      // Banner Text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(bannerHeight * 0.45)}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(frameText.toUpperCase(), canvasWidth / 2, bannerY + bannerHeight / 2);
    } else if (config.frameStyle === 'badge') {
      // Top header badge
      const badgeHeight = qrTopOffset * 0.65;
      const badgeY = (qrTopOffset - badgeHeight) / 2;
      const badgeWidth = canvasWidth * 0.65;
      const badgeX = (canvasWidth - badgeWidth) / 2;

      drawRoundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 12);

      // Badge Text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(badgeHeight * 0.48)}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(frameText.toUpperCase(), canvasWidth / 2, badgeY + badgeHeight / 2);
    } else if (config.frameStyle === 'card') {
      // Card Frame Label
      const bannerY = canvasHeight - qrBottomOffset + 8;
      ctx.fillStyle = typeof fgStyle === 'string' ? fgStyle : config.fgColor;
      ctx.font = `800 ${Math.round(qrBottomOffset * 0.32)}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(frameText.toUpperCase(), canvasWidth / 2, bannerY);
    }
  }

  // Enforce 100% responsive display on DOM canvas
  canvas.style.width = '100%';
  canvas.style.height = '100%';
}
