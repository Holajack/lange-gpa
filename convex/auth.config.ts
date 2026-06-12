/**
 * Convex ⇄ Clerk trust: Convex validates JWTs minted by the Clerk
 * "convex" JWT template. The issuer domain comes from the deployment
 * environment (npx convex env set CLERK_JWT_ISSUER_DOMAIN ...), so
 * dev and prod can point at different Clerk instances if needed.
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
