import { AuthSliderContainer } from "@/components/auth/AuthSliderContainer";

const ERROR_MESSAGES: Record<string, string> = {
  no_account: "No Cottage account found for that Google account. Ask your admin to invite you, or sign up to start a new Cottage.",
  auth_failed: "Google sign-in failed. Please try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "Something went wrong signing in. Please try again.") : null;

  return <AuthSliderContainer initialMode="login" loginError={errorMessage} />;
}
