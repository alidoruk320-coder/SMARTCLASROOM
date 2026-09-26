"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DEFAULT_ROOM_CODE } from "@/lib/room-store";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  username: string;
  avatar: string;
  level: number;
  totalStudySeconds: number;
  recordStudySeconds: number;
  totalQuestions: number;
  xp: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [joining, setJoining] = useState(false);
  const [status, setStatus] = useState(supabase ? "" : "Dashboard için Supabase ayarlarını yap.");

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let active = true;
    void (async () => {
      const { data: { user }, error: authError } = await client.auth.getUser();
      if (!active) return;
      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await client
        .from("profiles")
        .select("id, username, avatar, level, total_study_seconds, record_study_seconds, total_questions, xp")
        .eq("id", user.id)
        .single();
      if (!active) return;
      if (error || !data) {
        setStatus("Profil yüklenemedi. Supabase şemasını uyguladığını kontrol et.");
        setLoading(false);
        return;
      }

      setProfile({
        id: data.id,
        username: data.username,
        avatar: data.avatar ?? "🧑‍💻",
        level: Number(data.level ?? 1),
        totalStudySeconds: Number(data.total_study_seconds ?? 0),
        recordStudySeconds: Number(data.record_study_seconds ?? 0),
        totalQuestions: Number(data.total_questions ?? 0),
        xp: Number(data.xp ?? 0),
      });
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleEnterRoom() {
    if (!profile) return;
    setJoining(true);
    setStatus("");
    router.push(`/class/${DEFAULT_ROOM_CODE}`);
  }

  async function handleSignOut() {
    const client = supabase;
    if (!client) {
      router.replace("/login");
      return;
    }
    const { error } = await client.auth.signOut();
    if (error) {
      setStatus(error.message);
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">Profil yükleniyor...</main>;
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-900">
        <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold">StudyVerse</h1>
          <p role="status" className="mt-3 text-sm text-slate-700">{status || "Oturum bulunamadı."}</p>
          <button type="button" onClick={() => router.replace("/login")} className="mt-5 rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white">Giriş sayfasına dön</button>
        </section>
      </main>
    );
  }

  const stats = [
    { label: "Toplam çalışma", value: formatDuration(profile.totalStudySeconds) },
    { label: "Rekor", value: formatDuration(profile.recordStudySeconds) },
    { label: "Toplam soru", value: String(profile.totalQuestions) },
    { label: "XP", value: String(profile.xp) },
  ];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">StudyVerse</p>
            <h1 className="mt-2 text-3xl font-black">Ana Sayfa</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-100 px-4 py-3">
              <span className="text-2xl" aria-hidden="true">{profile.avatar}</span>
              <div>
                <p className="font-semibold">{profile.username}</p>
                <p className="text-xs text-slate-500">Seviye {profile.level}</p>
              </div>
            </div>
            <button type="button" onClick={handleSignOut} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-400">
              Çıkış
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Tek sınıf</p>
              <h2 className="mt-2 text-3xl font-black text-slate-800">Aynı odada, aynı hedef, aynı odak.</h2>
            </div>
            <button
              type="button"
              onClick={handleEnterRoom}
              disabled={joining}
              className="w-full rounded-xl bg-slate-900 px-5 py-4 text-lg font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {joining ? "Sınıfa giriliyor..." : `Sınıfa Gir (${DEFAULT_ROOM_CODE})`}
            </button>
            <div className="mt-6 rounded-xl bg-slate-100 p-4">
              <p className="text-sm text-slate-700">Tek sınıf, en fazla <strong>10 online öğrenci</strong>. Yer bilgisi gerçek oturum ve Realtime Presence üzerinden belirlenir.</p>
            </div>
            {status && <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{status}</p>}
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Hesabım</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                {stats.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Rekorlar</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>En uzun çalışma: {formatDuration(profile.recordStudySeconds)}</li>
                <li>Toplam çalışma: {formatDuration(profile.totalStudySeconds)}</li>
                <li>Toplam soru: {profile.totalQuestions}</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
