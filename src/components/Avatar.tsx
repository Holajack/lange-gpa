export function Avatar({
  name,
  color = "#7c5cff",
  size = 44,
  ring = false,
  src,
}: {
  name: string;
  color?: string;
  size?: number;
  ring?: boolean;
  /** optional profile photo — falls back to initials when absent */
  src?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${ring ? "ring-2 ring-white/20" : ""}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full font-display font-bold select-none ${ring ? "ring-2 ring-white/20" : ""}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${color}, ${color}55)`,
        color: "#0e0e12",
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
