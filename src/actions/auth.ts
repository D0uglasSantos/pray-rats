"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_NAME } from "@/lib/active-group";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export type SignUpResult =
  | { success: true; needsEmailConfirmation: true }
  | { success: false; error: string };

export async function signUp(formData: FormData): Promise<SignUpResult> {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { success: false, error: "Preencha todos os campos." };
  }

  if (password.length < 6) {
    return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.session) {
    return { success: true, needsEmailConfirmation: true };
  }

  redirect("/onboarding");
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Preencha e-mail e senha." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return {
        success: false,
        error:
          "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada (e spam).",
      };
    }
    return { success: false, error: "E-mail ou senha incorretos." };
  }

  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false, error: "Informe seu e-mail." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/profile`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: undefined,
  };
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  if (!password || password.length < 6) {
    return { success: false, error: "A senha deve ter pelo menos 6 caracteres." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function setActiveGroup(groupId: string): Promise<ActionResult> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, groupId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  return { success: true };
}
