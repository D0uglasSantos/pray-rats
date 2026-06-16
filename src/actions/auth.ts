"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAuthCallbackUrl } from "@/lib/app-url";
import { mapActionError } from "@/lib/errors/map-action-error";
import { authRateLimitMessage, checkAuthRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/validation";
import { COOKIE_NAME } from "@/lib/active-group";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export type SignUpResult = { success: false; error: string };

export async function signUp(formData: FormData): Promise<SignUpResult> {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { success: false, error: "Preencha todos os campos." };
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return { success: false, error: passwordCheck.error! };
  }

  const allowed = await checkAuthRateLimit("signUp", email);
  if (!allowed) {
    return { success: false, error: authRateLimitMessage("signUp") };
  }

  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (createError) {
    return {
      success: false,
      error: mapActionError(createError.message, { context: "auth" }),
    };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      success: false,
      error: mapActionError(signInError.message, { context: "auth" }),
    };
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

  const allowed = await checkAuthRateLimit("signIn", email);
  if (!allowed) {
    return { success: false, error: authRateLimitMessage("signIn") };
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

  redirect("/home");
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

  const allowed = await checkAuthRateLimit("resetPassword", email);
  if (!allowed) {
    return { success: false, error: authRateLimitMessage("resetPassword") };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthCallbackUrl("/reset-password"),
  });

  if (error) {
    return {
      success: false,
      error: mapActionError(error.message, { context: "auth" }),
    };
  }

  return {
    success: true,
    data: undefined,
  };
}

export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return { success: false, error: passwordCheck.error! };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      success: false,
      error: mapActionError(error.message, { context: "auth" }),
    };
  }

  return { success: true };
}

export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function setActiveGroup(groupId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return { success: false, error: "Você não participa deste grupo." };
  }

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

export async function clearActiveGroup(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
