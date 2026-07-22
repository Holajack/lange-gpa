/**
 * Public build-time feature gates. Sensitive features also have matching
 * server-side gates; these constants only decide what the browser mounts.
 */
export const COMMUNITY_EXCHANGE_ON =
  process.env.NEXT_PUBLIC_ENABLE_COMMUNITY_EXCHANGE === "true";

export const NURTURER_STUDIO_ON =
  process.env.NEXT_PUBLIC_ENABLE_NURTURER_STUDIO === "true";
