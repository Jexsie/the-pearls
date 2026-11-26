export type IconName =
  | "check" | "seal" | "phone" | "wallet" | "calendar" | "guests" | "arrow" | "close"
  | "lock" | "key" | "bed" | "info" | "shield" | "chevron-down" | "size" | "view";

/** Hairline icon from /public/icons, tinted with the current text colour. */
export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const url = `url(/icons/${name}.svg)`;
  return (
    <span
      className="icon"
      aria-hidden="true"
      style={{ width: size, height: size, maskImage: url, WebkitMaskImage: url }}
    />
  );
}
