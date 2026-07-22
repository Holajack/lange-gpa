import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";

/** Dark-theme Clerk sign-up. Keyless deploys bounce home untouched. */
export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) redirect("/");
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <main className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="inline-flex"><Logo size="lg" /></div>
          <h1 className="headline mt-5 text-3xl">Start growing into a language</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Create your Nurilang account, then choose the language you want to grow — and tell us which one you already speak.
          </p>
        </div>
        <SignUp
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
            elements: {
              rootBox: "w-full",
              cardBox: "w-full",
              card: "w-full",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
            },
          }}
        />
      </main>
    </div>
  );
}
