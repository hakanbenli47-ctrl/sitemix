import Link from "next/link";

export default function OnMuhasebeYetkisizPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-5 text-slate-950">
      <div className="max-w-md rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">
          Yetki Gerekli
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-[-0.05em]">
          Bu bölüme erişim iznin yok
        </h1>
        <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
          Bu hesabın yalnızca yönetici tarafından seçilen modüllere erişebilir.
          Gerekirse işletme yöneticinden yetki iste.
        </p>
        <Link
          href="/on-muhasebe/panel"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white"
        >
          Ana Panele Dön
        </Link>
      </div>
    </main>
  );
}
