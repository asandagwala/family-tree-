import {
  useSignInWithEmailPassword,
  useSignUpWithEmailPassword,
  useStartPasswordRecovery,
  type CompletePasswordRecoveryResult,
  type CompletePasswordRecoveryState,
  type CompleteSignUpState,
} from "@convex-dev/auth/methods/email-password/react";
import { type OauthFlowError } from "@convex-dev/auth/methods/google/react";

/** Every way signing in can fail, in plain language. The switch is exhaustive, so a new error code is a type error. */

type SignInError = Extract<
  Awaited<ReturnType<ReturnType<typeof useSignInWithEmailPassword>["signIn"]>>,
  { status: "error" }
>["userError"];
type SignUpError = Extract<
  Awaited<ReturnType<ReturnType<typeof useSignUpWithEmailPassword>["signUp"]>>,
  { success: false }
>["userError"];
type RecoveryError = Extract<
  Awaited<ReturnType<ReturnType<typeof useStartPasswordRecovery>["startPasswordRecovery"]>>,
  { success: false }
>["userError"];
type VerifyError = Extract<CompleteSignUpState, { status: "error" }>["userError"];
type ResetLinkError = Extract<CompletePasswordRecoveryState, { status: "error" }>["userError"];
type ResetError = Extract<CompletePasswordRecoveryResult, { status: "error" }>["userError"];
type AuthError = SignInError | SignUpError | RecoveryError | VerifyError | ResetLinkError | ResetError | OauthFlowError;

const TRY_AGAIN = "Something went wrong. Please try again.";

/** A plain-language message for every way signing in can fail. */
export function authMessage(e: AuthError): string {
  switch (e.error) {
    case "USER_NOT_FOUND":
      return "There's no email account for that address yet. Tap “Create an account” below, or use Continue with Google if that's how you joined.";
    case "INVALID_CREDENTIALS":
      return "That password isn't right. Try again, or tap “Forgot password?”.";
    case "RATE_LIMITED":
      return `Too many tries. Wait ${Math.max(1, Math.ceil(e.retryAfterMs / 60000))} minute(s) and try again.`;
    case "INVALID_EMAIL":
      return "That doesn't look like an email address.";
    case "EMAIL_TAKEN":
      return "There's already an account with that email. Sign in instead.";
    case "EMAIL_NOT_FOUND":
      return "There's no account with that email address.";
    case "PASSWORD_TOO_SHORT":
      return "Use a longer password.";
    case "PASSWORD_TOO_LONG":
      return "That password is too long.";
    case "PASSWORD_HAS_SURROUNDING_WHITESPACE":
      return "Remove the spaces at the start or end of your password.";
    case "PASSWORD_TOO_COMMON":
      return "That password is too easy to guess. Choose another one.";
    case "MISSING_SECRET":
      return "Open the link in the same browser you used to sign up or ask for the reset.";
    case "INVALID_CHALLENGE":
    case "INCORRECT_CODE":
    case "EXPIRED":
    case "INVALID_FLOW":
      return "This link has expired or was already used. Please start again.";
    case "ACCESS_DENIED":
      return "Google sign-in was cancelled.";
    case "OTHER_ERROR":
      return TRY_AGAIN;
    default:
      e satisfies never;
      return TRY_AGAIN;
  }
}
