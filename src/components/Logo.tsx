import Link from "next/link";

export function Logo({ size = "md", href = "/" }: { size?: "sm" | "md" | "lg"; href?: string }) {
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";
  const mark = size === "lg" ? 34 : size === "sm" ? 22 : 26;
  return (
    <Link href={href} className="flex items-center gap-2 group">
      <svg width={mark} height={mark} viewBox="0 0 32 32" className="transition-transform group-hover:rotate-12">
        {/* speech-bubble seed: a word being planted */}
        <path
          d="M16 2 C8.3 2 2 7.8 2 15 c0 4.5 2.5 8.4 6.3 10.8 L7 30 l6.2 -2.4 c0.9 0.2 1.8 0.3 2.8 0.3 C23.7 27.9 30 22.1 30 15 30 7.8 23.7 2 16 2 Z"
          fill="#FF8A1E"
        />
        <path d="M16 8 q-1 -5 -6 -6 q1.5 5 5 6" fill="#B8F03C" transform="translate(2 -1)" />
        <circle cx="11" cy="15.5" r="2.1" fill="#1A1A20" />
        <circle cx="16.5" cy="15.5" r="2.1" fill="#1A1A20" />
        <circle cx="22" cy="15.5" r="2.1" fill="#1A1A20" />
      </svg>
      <span className={`headline ${text} tracking-tight`}>
        LANGE<span className="text-orange">.</span>
      </span>
    </Link>
  );
}
