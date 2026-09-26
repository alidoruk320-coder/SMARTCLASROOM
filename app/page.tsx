import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#dfeaff,_#f5f7fb_40%,_#edf2f8)] px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-center justify-between rounded-full border border-slate-200 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-sm">
          <div className="text-xl font-black tracking-tight">STUDYVERSE</div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">Özellikler</a>
            <a href="#how-it-works" className="hover:text-slate-900">Nasıl Çalışır</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-400">
              Giriş Yap
            </Link>
            <Link href="/register" className="rounded-full bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-700">
              Kayıt Ol
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-10 pb-16 pt-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-700">
              Tek sınıf. 10 kişi. 1 odak.
            </p>
            <h1 className="max-w-xl text-5xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl">
              Sınıf yok, tek odada çalışırız. Dersi bitiren değil, odaklanan kazanır.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              StudyVerse, tek ve paylaşılan bir sanal sınıf deneyimi sunar. Aynı odada, aynı süre, aynı hedef. Herkes aynı sınıfta çalışır.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/register" className="rounded-2xl bg-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500">
                Sınıfa Başla
              </Link>
              <Link href="/login" className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-base font-semibold text-slate-700 transition hover:border-slate-400">
                Giriş Yap
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_22px_70px_rgba(15,23,42,0.12)]">
            <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#dfeaf8,#edf3fb_28%,#f5f7fb_100%)] p-6">
              <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-3 py-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Sınıf</p>
                  <p className="text-lg font-black text-slate-900">STUDY</p>
                </div>
                <div className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">00:00:00</div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[{ name: "Sen", emoji: "🧑‍💻" }, { name: "Boş masa", emoji: "🪑" }, { name: "Boş masa", emoji: "🪑" }].map((member) => (
                  <div key={member.name} className="rounded-2xl border border-slate-200 bg-white/70 p-3 text-center shadow-sm">
                    <div className="text-4xl">{member.emoji}</div>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{member.name}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-slate-900 p-4 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Canlı sohbet</p>
                <p className="mt-2 text-sm text-slate-400">Henüz mesaj yok.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="grid gap-6 pb-16 md:grid-cols-3">
          {[
            ["2D Sınıf", "Aynı sınıfta oturur, aynı anda çalışır ve aynı süreyi takip edersin."],
            ["Tek oda sistemi", "Sistem tek, paylaşılan ve güvenli bir sınıf sunar."],
            ["Temiz başlangıç", "Yeni kullanıcılar 0 soru, 0 XP ve 0 çalışma süresi ile başlar."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="mb-3 text-lg font-black text-slate-900">{title}</p>
              <p className="text-slate-600">{description}</p>
            </div>
          ))}
        </section>

        <section id="how-it-works" className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">Nasıl Çalışır</p>
          <div className="mt-6 grid gap-6 md:grid-cols-4">
            {[
              ["1", "Kayıt ol"],
              ["2", "Tek sınıfa katıl"],
              ["3", "Ortak timer ve sohbet başlasın"],
              ["4", "Dürüst istatistiklerle ilerle"],
            ].map(([step, label]) => (
              <div key={step} className="rounded-2xl bg-slate-100 p-5">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{step}</div>
                <p className="text-lg font-semibold text-slate-800">{label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
