"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { supabase } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const parsed = registerSchema.safeParse({ username, email, password });

    if (!parsed.success) {
      setError("Kullanıcı adı 3-20 karakter, e-posta geçerli ve şifre en az 8 karakter olmalı.");
      setLoading(false);
      return;
    }

    const client = supabase;
    if (!client) {
      setError("Kayıt için Supabase ayarları gerekli. .env.local dosyasını yapılandır.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { username, avatar: "🧑‍💻" },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setSuccess("Kayıt tamamlandı. E-posta doğrulaması gerekiyorsa gelen kutunu kontrol et, sonra giriş yap.");
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#e4f5ff,_#f5f7fb_45%,_#eef3f9)] px-4 py-12 text-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/85 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">StudyVerse</p>
          <h1 className="mt-3 text-3xl font-black">Hesap Oluştur</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Kullanıcı adı</span>
            <input
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={20}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-indigo-500 focus:bg-white"
              placeholder="Kullanıcı adın"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">E-posta</span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-indigo-500 focus:bg-white"
              placeholder="ornek@mail.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Şifre</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-indigo-500 focus:bg-white"
              placeholder="********"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}
          {success ? (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Hesabın oluşturuluyor..." : "Kayıt Ol"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Zaten hesabın var mı? <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">Giriş Yap</Link>
        </div>
      </div>
    </main>
  );
}
