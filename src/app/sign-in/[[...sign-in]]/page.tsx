import { SignIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

/** Dark-theme Clerk sign-in. Keyless deploys bounce home untouched. */
export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) redirect("/");
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#7c5cff",
            colorBackground: "#171022",
            colorForeground: "#f4f0ff",
            colorMutedForeground: "#a89fc4",
            colorInput: "#241b38",
            colorInputForeground: "#f4f0ff",
            borderRadius: "1rem",
          },
        }}
      />
    </div>
  );
}
