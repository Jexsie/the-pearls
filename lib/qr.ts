import "server-only";
import QRCode from "qrcode";

export function qrDataUrl(text: string) {
  return QRCode.toDataURL(text, { width: 320, margin: 2, errorCorrectionLevel: "M" });
}
