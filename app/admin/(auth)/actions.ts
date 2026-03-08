"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { adminSignInSchema, adminSignUpSchema } from "@/lib/validations/auth";
import { redirect } from "next/navigation";

export async function signInAdmin(formData: {
  email: string;
  password: string;
}) {
  const parsed = adminSignInSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid email or password" };
  }

  redirect("/admin/dashboard");
}

export async function signUpAdmin(formData: {
  name: string;
  email: string;
  password: string;
}) {
  const parsed = adminSignUpSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { role: "admin" },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await prisma.admin.upsert({
      where: { supabaseId: data.user.id },
      create: {
        supabaseId: data.user.id,
        name: parsed.data.name,
        email: parsed.data.email,
      },
      update: {},
    });
  }

  redirect("/admin/dashboard");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
