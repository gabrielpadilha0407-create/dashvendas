"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "team_session";

export type ActionState = { error: string | null };

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const password = formData.get("password");

  if (typeof password !== "string" || password.length === 0 || password !== process.env.TEAM_PASSWORD) {
    return { error: "Senha incorreta." };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, process.env.AUTH_COOKIE_SECRET!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}
