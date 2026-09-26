"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { supabase } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validations";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      setError("Lütfen geçerli bir e-posta ve en az 8 karakter şifre girin.");
      setLoading(false);
      return;
    }

    const client = supabase;
    if (!client) {
      setError("Giriş için Supabase ayarları gerekli. .env.local dosyasını yapılandır.");
      setLoading(false);
      return;
    }

    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#d7e8ff,_#f5f7fb_45%,_#eef3f9)] px-4 py-12 text-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/85 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">StudyVerse</p>
          <h1 className="mt-3 text-3xl font-black">Giriş Yap</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Hesabın yok mu? <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">Kayıt Ol</Link>
        </div>
      </div>
    </main>
  );
}
