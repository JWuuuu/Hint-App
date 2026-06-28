declare module "qrcode" {
  type QRCodeCanvasOptions = {
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    width?: number;
  };

  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: QRCodeCanvasOptions,
  ): Promise<void>;
}
