"use server";

import { redirect } from "next/navigation";

import {
  clearAuthCookies,
  consumePkceVerifier,
  setAuthCookies,
  setPkceVerifier,
} from "@/lib/auth-cookies";
import { getInsforgeServerClient } from "@/lib/insforge";

type AuthResult = { success: true; role?: 'admin' | 'customer' } | { success: false; error: string };

const ADMIN_EMAILS = ['admin@keotera.com', 'staff@keotera.com', 'aedc@keotera.com']
function getRole(email: string): 'admin' | 'customer' {
  return ADMIN_EMAILS.includes(email.toLowerCase()) || email.toLowerCase().endsWith('@keotera.com')
    ? 'admin'
    : 'customer'
}

export async function getAuthConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;

  if (!baseUrl) {
    return { oAuthProviders: [] as string[], requireEmailVerification: false, passwordMinLength: 8 };
  }

  const response = await fetch(`${baseUrl}/api/auth/public-config`, { cache: "no-store" });

  if (!response.ok) {
    return { oAuthProviders: [] as string[], requireEmailVerification: false, passwordMinLength: 8 };
  }

  return response.json() as Promise<{
    requireEmailVerification: boolean;
    passwordMinLength: number;
    verifyEmailMethod: string;
    resetPasswordMethod: string;
    oAuthProviders: string[];
  }>;
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
    const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

    if (!baseUrl || !anonKey) {
      return { success: false, error: "Server configuration error." };
    }

    const res = await fetch(
      `${baseUrl}/api/auth/sessions?client_type=mobile`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ email, password }),
        cache: 'no-store',
      },
    );

    const body = await res.json();

    if (!res.ok) {
      if (res.status === 401 || res.status === 400) {
        return { success: false, error: "Invalid email or password." };
      }
      if (res.status === 403) {
        return { success: false, error: "Email not verified. Please verify your email first." };
      }
      return { success: false, error: body?.message ?? "Sign in failed." };
    }

    const { accessToken, refreshToken } = body as { accessToken?: string; refreshToken?: string };

    if (!accessToken) {
      return { success: false, error: "Sign in failed — no token received." };
    }

    await setAuthCookies(accessToken, refreshToken ?? '');
    return { success: true, role: getRole(email) };
  } catch (err) {
    console.error('signIn error:', err);
    return { success: false, error: "Sign in failed. Please check your connection and try again." };
  }
}

export async function signUp(
  email: string,
  password: string,
  name: string,
): Promise<{ success: true; requireVerification: boolean } | { success: false; error: string }> {
  const insforge = getInsforgeServerClient();
  const { data, error } = await insforge.auth.signUp({ email, password, name });

  if (error) {
    return { success: false, error: error.message ?? "Sign up failed." };
  }

  if (data?.requireEmailVerification) {
    return { success: true, requireVerification: true };
  }

  if (data?.accessToken && data?.refreshToken) {
    await setAuthCookies(data.accessToken, data.refreshToken);
    return { success: true, requireVerification: false };
  }

  return { success: false, error: "Sign up failed." };
}

export async function verifyEmail(email: string, otp: string): Promise<AuthResult> {
  const insforge = getInsforgeServerClient();
  const { data, error } = await insforge.auth.verifyEmail({ email, otp });

  if (error) {
    return { success: false, error: error.message ?? "Verification failed." };
  }

  if (data?.accessToken && data?.refreshToken) {
    await setAuthCookies(data.accessToken, data.refreshToken);
  }

  return { success: true };
}

export async function resendVerification(email: string): Promise<AuthResult> {
  const insforge = getInsforgeServerClient();

  try {
    await insforge.auth.resendVerificationEmail({ email });
    return { success: true };
  } catch {
    return { success: false, error: "Failed to resend verification code." };
  }
}

export async function sendResetEmail(email: string): Promise<AuthResult> {
  const insforge = getInsforgeServerClient();

  try {
    await insforge.auth.sendResetPasswordEmail({ email });
    return { success: true };
  } catch {
    return { success: false, error: "Failed to send reset email." };
  }
}

export async function exchangeResetCode(
  email: string,
  code: string,
): Promise<{ success: true; token: string } | { success: false; error: string }> {
  const insforge = getInsforgeServerClient();
  const { data, error } = await insforge.auth.exchangeResetPasswordToken({ email, code });

  if (error || !data?.token) {
    return { success: false, error: error?.message ?? "Invalid or expired code." };
  }

  return { success: true, token: data.token };
}

export async function resetPassword(newPassword: string, otp: string): Promise<AuthResult> {
  const insforge = getInsforgeServerClient();
  const { error } = await insforge.auth.resetPassword({ newPassword, otp });

  if (error) {
    return { success: false, error: error.message ?? "Password reset failed." };
  }

  return { success: true };
}

export async function getOAuthUrl(provider: string): Promise<{ url: string } | { error: string }> {
  const insforge = getInsforgeServerClient();
  const origin =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (!origin) {
    return { error: "Missing NEXT_PUBLIC_APP_URL." };
  }

  type OAuthProvider = Parameters<typeof insforge.auth.signInWithOAuth>[0]["provider"];

  const { data, error } = await insforge.auth.signInWithOAuth({
    provider: provider as OAuthProvider,
    redirectTo: `${origin}/auth/callback`,
    skipBrowserRedirect: true,
  });

  if (error || !data?.url) {
    return { error: error?.message ?? "OAuth failed." };
  }

  if (data.codeVerifier) {
    await setPkceVerifier(data.codeVerifier);
  }

  return { url: data.url };
}

export async function exchangeAuthCode(code: string): Promise<AuthResult> {
  const insforge = getInsforgeServerClient();
  const codeVerifier = await consumePkceVerifier();
  const { data, error } = await insforge.auth.exchangeOAuthCode(code, codeVerifier ?? undefined);

  if (error || !data?.accessToken) {
    return { success: false, error: error?.message ?? "Code exchange failed." };
  }

  if (!data.refreshToken) {
    return { success: false, error: "Unable to complete sign-in. Missing refresh token." };
  }

  await setAuthCookies(data.accessToken, data.refreshToken);

  return { success: true };
}

export async function signOut() {
  const insforge = getInsforgeServerClient();

  try {
    await insforge.auth.signOut();
  } catch {
    // Sign out locally even if the server call fails.
  }

  await clearAuthCookies();
  redirect("/auth/sign-in");
}
