import { Laptop, Smartphone, Tablet } from "lucide-react";
import type { DeviceFormFactor } from "../../domain";

type DeviceGlyphProps = {
  className?: string;
  formFactor: DeviceFormFactor;
};

const glyphByFormFactor = {
  Mobile: Smartphone,
  Tablet,
  Desktop: Laptop
} satisfies Record<DeviceFormFactor, typeof Smartphone>;

export function DeviceGlyph({ className = "size-5", formFactor }: DeviceGlyphProps) {
  const Glyph = glyphByFormFactor[formFactor];

  return <Glyph aria-hidden="true" className={className} strokeWidth={1.8} />;
}
