import { AuthSliderContainer } from "@/components/auth/AuthSliderContainer";

const ERROR_MESSAGES: Record<string, string> = {
  create_failed: "Could not create your Cottage from that Google account. Please try again.",
  auth_failed: "Google sign-in failed. Please try again.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; detail?: string }>;
}) {
  const { error, detail } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "Something went wrong signing up. Please try again.") : null;

  return (
    <AuthSliderContainer
      initialMode="signup"
      signupError={errorMessage}
      signupDetail={detail ?? null}
    />
  );
}
