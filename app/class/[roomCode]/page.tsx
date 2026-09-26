"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { DEFAULT_ROOM_CODE, getRoom } from "@/lib/room-store";

type Student = {
  id: string;
  username: string;
  avatar: string;
  joinedAt: string;
};

type TeacherPrompt = {
  type: "prompt";
  id: string;
  question: string;
  remark: string;
  targetUserId: string | null;
  targetUsername: string | null;
  nextQuestionAt: number;
  createdAt: number;
};

type StudentAnswer = {
  type: "answer";
  id: string;
  promptId: string;
  userId: string;
  username: string;
  answer: string;
  createdAt: number;
};

type TeacherBanter = {
  type: "banter";
  id: string;
  targetUserId: string;
  targetUsername: string;
  message: string;
  createdAt: number;
};

type ClassroomEvent = TeacherPrompt | StudentAnswer | TeacherBanter;

const openingQuestion = "Şu ana kadar kaç soru çözdün?";
const teacherQuestions = [
  "Son 5 dakikada kaç soru çözdün?",
  "Son 5 dakikada hangi konudan soru çözdün?",
  "Takıldığın bir soru var mı, varsa hangi konuda?",
  "En son çözdüğün soruda doğru cevaba nasıl ulaştın?",
  "Bugün öğrendiğin en önemli şey ne?",
  "Dikkatin şu an 1 ile 10 arasında kaç?",
  "Hedefine ulaşmak için şimdi hangi küçük adımı atacaksın?",
  "Şu an kısa bir mola mı, devam mı daha iyi gelir?",
  "Şu anki çalışma hedefin hâlâ aynı mı?",
  "Bir soruda hata yaptıysan ondan ne kaptın?",
  "Masanda dikkatini dağıtan bir şey var mı?",
  "Oho, kalem senden hızlı gidiyor; ritmi biraz artırmaya ne dersin?",
  "Oho, bu tempoda kaplumbağa tur bindirecek! Biraz hızlanalım mı?",
];
const teacherBanter = [
  "Ulan {name}, kalemin senden daha çok çalıştı; bir soru daha, haydi!",
  "Lan {name}, o soruya naz mı yapıyoruz? Çöz de görelim.",
  "Bu tempoda kaplumbağa senden önce denemeyi bitirir {name}!",
  "Kahven senden hızlı çalışıyor {name}, toparlanıyoruz!",
  "Yeter ekrana bakıştığın {name}, kitaba dön be!",
  "Yahu {name}, bu soruya bakmaktan soru çözüldü sanacaksın.",
  "Lan {name}, kalem mesaiye kaldı; sen hâlâ ısınıyorsun!",
  "Ulan {name}, hedefini sen koydun, şimdi hedef sana bakıyor.",
  "Bir soru da sen çöz {name}, klavye tek başına XP kasmasın.",
  "Hadi be {name}, kalem bu kadar yalnız bırakılmaz.",
  "Kitabı dekor diye mi açtın {name}? Bir soru seç de başlayalım.",
  "Şaka maka {name}, kronometre senden hızlı ilerliyor!",
  "Ekranla göz göze gelme yarışını bırak {name}, sorular bekliyor.",
  "Lan {name}, iki satır çöz de hocanın sanal tansiyonu düşsün.",
  "Beyin loading mi {name}? Bir nefes al, sonra soruya dal!",
];

export default function ClassroomPage() {
  const params = useParams<{ roomCode: string }>();
  const router = useRouter();
  const roomCode = String(params.roomCode ?? "").toUpperCase();
  const room = useMemo(() => getRoom(roomCode), [roomCode]);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [identityLoading, setIdentityLoading] = useState(true);
  const [identityError, setIdentityError] = useState("");
  const [onlineStudents, setOnlineStudents] = useState<Student[]>([]);
  const [events, setEvents] = useState<ClassroomEvent[]>([]);
  const [activePrompt, setActivePrompt] = useState<TeacherPrompt | null>(null);
  const [connection, setConnection] = useState<"connecting" | "connected" | "offline">(
    isSupabaseConfigured ? "connecting" : "offline",
  );
  const [answer, setAnswer] = useState("");
  const [secondsToNextQuestion, setSecondsToNextQuestion] = useState(0);
  const [roomEntryError, setRoomEntryError] = useState("");
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client || roomCode !== DEFAULT_ROOM_CODE) {
      router.replace("/login");
      return;
    }

    let active = true;
    void (async () => {
      const { data: { user }, error } = await client.auth.getUser();
      if (!active) return;
      if (error || !user) {
        setIdentityLoading(false);
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("username, avatar")
        .eq("id", user.id)
        .single();
      if (!active) return;
      if (profileError || !profile) {
        setIdentityError("Profil bulunamadı. Supabase şemasını uyguladığını kontrol et.");
        setIdentityLoading(false);
        return;
      }

      setCurrentUser({
        id: user.id,
        username: profile.username,
        avatar: profile.avatar ?? "🧑‍💻",
        joinedAt: new Date().toISOString(),
      });
      setIdentityLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [roomCode, router]);

  useEffect(() => {
    const client = supabase;
    if (!currentUser || roomCode !== DEFAULT_ROOM_CODE || !isSupabaseConfigured || !client) return;

    let active = true;
    let channel: RealtimeChannel | null = null;
    let heartbeat: number | undefined;
    let joinedRoom = false;

    void (async () => {
      const { error } = await client.rpc("join_study_room");
      if (error) {
        if (active) {
          setConnection("offline");
          setRoomEntryError(error.message.includes("CLASSROOM_FULL")
            ? "Sınıf dolu. Şu anda en fazla 10 öğrenci katılabilir."
            : "Sınıfa giriş yapılamadı. Supabase şemasını uyguladığını kontrol et.");
        }
        return;
      }

      joinedRoom = true;
      if (!active) {
        void client.rpc("leave_study_room");
        return;
      }

      const classroomChannel = client.channel(`classroom:${DEFAULT_ROOM_CODE}`, {
        config: {
          broadcast: { self: false, ack: true },
          presence: { key: currentUser.id },
          private: true,
        },
      });
      channel = classroomChannel;
      channelRef.current = classroomChannel;

      classroomChannel.on("presence", { event: "sync" }, () => {
        const presence = classroomChannel.presenceState<Student>();
        const students = Object.values(presence)
          .flat()
          .reduce<Student[]>((unique, student) => {
            if (!unique.some((item) => item.id === student.id)) unique.push(student);
            return unique;
          }, []);
        setOnlineStudents(students);
      });

      classroomChannel.on("broadcast", { event: "classroom-event" }, ({ payload }) => {
        const classroomEvent = payload as ClassroomEvent;
        if (classroomEvent.type === "prompt") setActivePrompt(classroomEvent);
        setEvents((previous) => {
          if (previous.some((event) => event.id === classroomEvent.id)) return previous;
          return [...previous, classroomEvent].slice(-40);
        });
      });

      classroomChannel.subscribe(async (status) => {
        if (!active) return;
        if (status === "SUBSCRIBED") {
          setConnection("connected");
          const trackResult = await classroomChannel.track(currentUser);
          if (trackResult !== "ok") {
            setConnection("offline");
            return;
          }
          if (heartbeat === undefined) {
            heartbeat = window.setInterval(async () => {
              const { error: heartbeatError } = await client.rpc("join_study_room");
              if (heartbeatError) setConnection("offline");
            }, 20_000);
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnection("offline");
        }
      });
    })();

    return () => {
      active = false;
      channelRef.current = null;
      if (heartbeat !== undefined) window.clearInterval(heartbeat);
      if (joinedRoom) void client.rpc("leave_study_room");
      if (channel) void client.removeChannel(channel);
    };
  }, [currentUser, roomCode]);

  const sortedOnlineStudents = useMemo(
    () => [...onlineStudents].sort((first, second) => first.id.localeCompare(second.id)),
    [onlineStudents],
  );
  const isTeacherCoordinator = sortedOnlineStudents[0]?.id === currentUser?.id;

  useEffect(() => {
    if (connection !== "connected" || !isTeacherCoordinator || !currentUser) return;

    const delay = activePrompt
      ? Math.max(0, activePrompt.nextQuestionAt - Date.now())
      : 0;

    const timeout = window.setTimeout(async () => {
      let nextPrompt: TeacherPrompt;

      if (!activePrompt) {
        nextPrompt = {
          type: "prompt",
          id: `opening-solved-${roomCode}`,
          question: openingQuestion,
          remark: "Isınma turu! Dürüstçe söyleyin, herkes görüyor.",
          targetUserId: null,
          targetUsername: null,
          nextQuestionAt: Date.now() + 30_000,
          createdAt: Date.now(),
        };
      } else if (activePrompt.id.startsWith("opening-solved-")) {
        nextPrompt = {
          type: "prompt",
          id: `opening-goal-${roomCode}`,
          question: "Bugünkü hedefin ne: kaç soru ya da ne kadar çalışma?",
          remark: "Güzel, şimdi hedefi koy; kaçamak yok!",
          targetUserId: null,
          targetUsername: null,
          nextQuestionAt: Date.now() + 5 * 60_000,
          createdAt: Date.now(),
        };
      } else {
        const candidates = sortedOnlineStudents;
        if (candidates.length === 0) return;
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        nextPrompt = {
          type: "prompt",
          id: `teacher-${Date.now()}`,
          question: teacherQuestions[Math.floor(Math.random() * teacherQuestions.length)],
          remark: "Söz sende! Cevabını yaz, sınıftakiler de görsün.",
          targetUserId: target.id,
          targetUsername: target.username,
          nextQuestionAt: Date.now() + 5 * 60_000,
          createdAt: Date.now(),
        };
      }

      const result = await channelRef.current?.send({
        type: "broadcast",
        event: "classroom-event",
        payload: nextPrompt,
      });
      if (result !== "ok") {
        setConnection("offline");
        return;
      }
      setActivePrompt(nextPrompt);
      setEvents((previous) => {
        if (previous.some((event) => event.id === nextPrompt.id)) return previous;
        return [...previous, nextPrompt].slice(-40);
      });
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [activePrompt, connection, currentUser, isTeacherCoordinator, roomCode, sortedOnlineStudents]);

  useEffect(() => {
    if (connection !== "connected" || !isTeacherCoordinator || !currentUser) return;

    const coordinatorId = currentUser.id;
    let active = true;
    let timeout: number;

    function scheduleBanter() {
      timeout = window.setTimeout(async () => {
        if (!active || sortedOnlineStudents.length === 0) return;

        const target = sortedOnlineStudents[Math.floor(Math.random() * sortedOnlineStudents.length)];
        const line = teacherBanter[Math.floor(Math.random() * teacherBanter.length)];
        const event: TeacherBanter = {
          type: "banter",
          id: `banter-${coordinatorId}-${Date.now()}`,
          targetUserId: target.id,
          targetUsername: target.username,
          message: line.replace("{name}", target.username),
          createdAt: Date.now(),
        };
        const result = await channelRef.current?.send({
          type: "broadcast",
          event: "classroom-event",
          payload: event,
        });

        if (result === "ok") {
          if (active) {
            setEvents((previous) => [...previous, event].slice(-40));
            scheduleBanter();
          }
        } else if (active) {
          setConnection("offline");
        }
      }, 20_000 + Math.random() * 25_000);
    }

    scheduleBanter();
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [connection, currentUser, isTeacherCoordinator, sortedOnlineStudents]);

  useEffect(() => {
    if (!activePrompt) return;
    const updateCountdown = () => {
      setSecondsToNextQuestion(Math.max(0, Math.ceil((activePrompt.nextQuestionAt - Date.now()) / 1000)));
    };
    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [activePrompt]);

  async function leaveRoom() {
    if (!room || !currentUser) return;
    const client = supabase;
    if (client) await client.rpc("leave_study_room");
    router.push("/dashboard");
  }

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanAnswer = answer.trim();
    if (!cleanAnswer || !activePrompt || !currentUser || connection !== "connected") return;
    if (activePrompt.targetUserId && activePrompt.targetUserId !== currentUser.id) return;

    const response: StudentAnswer = {
      type: "answer",
      id: `answer-${currentUser.id}-${Date.now()}`,
      promptId: activePrompt.id,
      userId: currentUser.id,
      username: currentUser.username,
      answer: cleanAnswer,
      createdAt: Date.now(),
    };
    const result = await channelRef.current?.send({
      type: "broadcast",
      event: "classroom-event",
      payload: response,
    });
    if (result !== "ok") {
      setConnection("offline");
      return;
    }
    setEvents((previous) => [...previous, response].slice(-40));
    setAnswer("");
  }

  if (identityLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">Oturum doğrulanıyor...</main>;
  }
  if (identityError || !room || !currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 text-slate-700">
        <div role="alert" className="max-w-lg rounded-xl border border-amber-300 bg-white p-6 shadow-sm">
          {identityError || "Sınıf bilgisi yüklenemedi."}
        </div>
      </main>
    );
  }

  const shownPrompt = activePrompt ?? {
    question: openingQuestion,
    targetUserId: null,
    targetUsername: null,
    remark: "Öğretmen sınıfa katılmaya hazırlanıyor.",
  };
  const mayAnswer = connection === "connected" && (!shownPrompt.targetUserId || shownPrompt.targetUserId === currentUser.id);
  const seats = Array.from({ length: 10 }, (_, index) => onlineStudents[index] ?? null);

  return (
    <main className="min-h-screen bg-[#e9edf3] p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Çalışma sınıfı</p>
            <h1 className="text-xl font-black">{room.roomCode}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">{onlineStudents.length}/{room.maxPlayers} online</span>
            <button type="button" onClick={leaveRoom} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400">
              Sınıftan çık
            </button>
          </div>
        </header>

        {roomEntryError && <div role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">{roomEntryError}</div>}
        {connection !== "connected" && (
          <div role="status" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Supabase Realtime bağlı değil. Yanıtları ve online listesini sınıfla paylaşmak için proje ayarlarını ve SQL şemasını yapılandır.
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.45fr_0.9fr]">
          <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#dce8f7,#eff4fb_30%,#f6f8fb_100%)] p-5 shadow-sm">
            <div className="absolute left-1/2 top-8 h-16 w-64 -translate-x-1/2 rounded-xl border border-slate-400 bg-[#e7e3d1] shadow-inner" />
            <div className="absolute inset-x-0 bottom-12 mx-auto h-40 w-[88%] rounded-t-[2rem] border border-slate-300 bg-[#d9e4bc] opacity-80" />

            <div className="relative z-10 flex min-h-[480px] flex-col items-center justify-center gap-7">
              <div className="w-full max-w-xl rounded-xl border border-slate-300 bg-white/95 p-5 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-3xl" aria-hidden="true">👨‍🏫</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold">Sınıf hocası</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {activePrompt ? `Sonraki soru ${Math.floor(secondsToNextQuestion / 60)}:${String(secondsToNextQuestion % 60).padStart(2, "0")}` : "Açılış sorusu"}
                      </p>
                    </div>
                    <p className="mt-2 text-lg font-black">{shownPrompt.question}</p>
                    {shownPrompt.targetUsername && <p className="mt-1 text-sm font-semibold text-indigo-700">Söz sende, {shownPrompt.targetUsername}!</p>}
                    <p className="mt-2 text-sm text-slate-600">{shownPrompt.remark}</p>
                  </div>
                </div>
                <form onSubmit={submitAnswer} className="mt-4 flex gap-2">
                  <input
                    aria-label="Öğretmenin sorusuna yanıt"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    disabled={!mayAnswer}
                    maxLength={500}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 disabled:bg-slate-100"
                    placeholder={mayAnswer ? "Yanıtını sınıfla paylaş..." : "Yanıt vermek için Realtime bağlantısı gerekli"}
                  />
                  <button type="submit" disabled={!mayAnswer || !answer.trim()} className="rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                    Yanıtla
                  </button>
                </form>
              </div>

              <div className="grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {seats.map((student, index) => (
                  <div key={student?.id ?? `seat-${index + 1}`} className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/90 p-3 shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Masa {index + 1}</div>
                    <div className="text-3xl" aria-hidden="true">{student?.avatar ?? "🪑"}</div>
                    <span className="max-w-full truncate text-sm font-semibold text-slate-700">
                      {student ? `${student.username}${student.id === currentUser.id ? " (sen)" : ""}` : "Boş"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="flex min-h-[480px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-lg font-bold">Öğretmen ve sınıf yanıtları</h2>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${connection === "connected" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
                {connection === "connected" ? "Canlı" : connection === "connecting" ? "Bağlanıyor" : "Bağlı değil"}
              </span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-3" aria-live="polite">
              {events.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz yanıt yok. İlk soru: “{openingQuestion}”</p>
              ) : events.map((classroomEvent) => (
                <article key={classroomEvent.id} className={`rounded-lg p-3 text-sm ${classroomEvent.type === "prompt" ? "border border-amber-200 bg-amber-50" : classroomEvent.type === "banter" ? "border border-rose-200 bg-rose-50" : "border border-slate-200 bg-white"}`}>
                  {classroomEvent.type === "prompt" ? (
                    <>
                      <p className="font-bold text-slate-900">👨‍🏫 {classroomEvent.targetUsername ? `${classroomEvent.targetUsername} için soru` : "Hoca soruyor"}</p>
                      <p className="mt-1 font-semibold">{classroomEvent.question}</p>
                    </>
                  ) : classroomEvent.type === "banter" ? (
                    <>
                      <p className="font-bold text-rose-800">👨‍🏫 Hoca → {classroomEvent.targetUsername}</p>
                      <p className="mt-1 break-words text-slate-700">{classroomEvent.message}</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-indigo-800">{classroomEvent.username}</p>
                      <p className="mt-1 break-words text-slate-700">{classroomEvent.answer}</p>
                    </>
                  )}
                </article>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
