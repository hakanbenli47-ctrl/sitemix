"use client";

import { useState } from "react";

type BusinessType = "kuafor" | "guzellik" | null;

export default function Demo() {
  const [businessType, setBusinessType] = useState<BusinessType>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const services = {
    kuafor: ["Saç Kesimi", "Sakal Tıraşı", "Saç + Sakal"],
    guzellik: ["Cilt Bakımı", "Lazer Epilasyon", "Kaş Tasarımı"],
  };

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const generateTimes = () => {
    const times = [];
    const now = new Date();

    for (let hour = 8; hour <= 19; hour++) {
      for (let minute of [0, 30]) {
        const time = new Date(selectedDate || "");
        time.setHours(hour);
        time.setMinutes(minute);

        if (
          selectedDate &&
          new Date(selectedDate).toDateString() === now.toDateString()
        ) {
          if (time <= now) continue;
        }

        times.push(
          `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`
        );
      }
    }

    return times;
  };

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) {
      setError("Lütfen ad soyad ve telefon giriniz.");
      return;
    }
    setError("");
    setStep(5);
  };

  const theme =
    businessType === "kuafor"
      ? {
          bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
          accent: "bg-amber-500 hover:bg-amber-600",
          text: "text-amber-400",
        }
      : {
    bg: "bg-gradient-to-br from-[#1e0f1a] via-[#2a1323] to-[#1e0f1a]",
    accent: "bg-pink-500 hover:bg-pink-600",
    text: "text-pink-400",
  };


 if (!businessType) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center px-6">

      <div className="text-center max-w-5xl w-full">

        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
          Sitemix Demo
        </h1>

        <p className="text-gray-400 mb-16">
          İşletme türünüzü seçerek demo deneyimini başlatın.
        </p>

        <div className="grid md:grid-cols-2 gap-10">

          <button
            onClick={() => setBusinessType("kuafor")}
            className="relative group bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl transition hover:scale-105 hover:border-purple-500"
          >
            <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition rounded-3xl blur-xl"></div>

            <h2 className="text-3xl font-semibold mb-4 text-white">
              Kuaför
            </h2>

            <p className="text-gray-400">
              Stiliniz için profesyonel dokunuş.
            </p>
          </button>

          <button
            onClick={() => setBusinessType("guzellik")}
            className="relative group bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl transition hover:scale-105 hover:border-pink-500"
          >
            <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition rounded-3xl blur-xl"></div>

            <h2 className="text-3xl font-semibold mb-4 text-white">
              Güzellik Salonu
            </h2>

            <p className="text-gray-400">
              Güzelliğinize değer katıyoruz.
            </p>
          </button>

        </div>
      </div>
    </div>
  );
}


  return (
    <div className={`min-h-screen ${theme.bg} text-white`}>

      <header className="flex justify-between items-center px-10 py-6 backdrop-blur-md bg-white/5 border-b border-white/10">
        <h1 className="text-2xl font-semibold tracking-wide">
          {businessType === "kuafor" ? "Modern Kuaför" : "Elite Güzellik"}
        </h1>
        <button
          onClick={() => setShowBooking(true)}
          className={`${theme.accent} px-6 py-3 rounded-full text-black font-semibold transition`}
        >
          Randevu Al
        </button>
      </header>

      <section className="px-10 py-20 text-center">
        <h2 className={`text-5xl font-bold mb-6 ${theme.text}`}>
          {businessType === "kuafor"
            ? "Stiliniz Bizim İşimiz"
            : "Işıltınızı Ortaya Çıkarın"}
        </h2>
        <p className="max-w-2xl mx-auto text-gray-300">
          Profesyonel hizmet anlayışı ve modern altyapı ile randevunuzu kolayca oluşturun.
        </p>
      </section>

      <section className="px-10 pb-20">
        <h3 className="text-2xl font-semibold mb-10 text-center">
          Hizmetlerimiz
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          {services[businessType].map((item) => (
            <div
              key={item}
              className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:scale-105 transition"
            >
              <h4 className="text-lg font-semibold mb-2">{item}</h4>
              <p className="text-gray-400 text-sm">
                Kaliteli ve profesyonel hizmet.
              </p>
            </div>
          ))}
        </div>
      </section>

      {showBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-[#111] rounded-3xl p-8 w-full max-w-lg text-white border border-white/10">


            {step === 1 && (
              <>
                <h3 className="text-xl font-semibold mb-6">Tarih Seçin</h3>
                <div className="grid grid-cols-3 gap-3">
                  {generateDates().map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => {
                        setSelectedDate(date.toISOString());
                        setStep(2);
                      }}
                      className="bg-white/10 py-3 rounded-xl hover:bg-white/20 transition"

                    >
                      {date.toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && selectedDate && (
              <>
                <h3 className="text-xl font-semibold mb-6">Saat Seçin</h3>
                <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                  {generateTimes().map((time) => (
                    <button
                      key={time}
                      onClick={() => {
                        setSelectedTime(time);
                        setStep(3);
                      }}
                     className={`
  py-2 rounded-xl transition-all duration-200
  ${selectedTime === time 
    ? "bg-pink-500 text-white scale-105 shadow-lg" 
    : "bg-white/10 text-white hover:bg-white/20"}
`}

                    >
                      {time}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="text-xl font-semibold mb-6">
                  Bilgilerinizi Girin
                </h3>

                <input
                  type="text"
                  placeholder="Ad Soyad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mb-4 p-3 border rounded-xl"
                />

                <input
                  type="tel"
                  placeholder="Telefon"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mb-4 p-3 border rounded-xl"
                />

                {error && (
                  <p className="text-red-500 mb-3 text-sm">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  className={`${theme.accent} w-full py-3 rounded-xl text-black font-semibold`}
                >
                  Randevu Oluştur
                </button>
              </>
            )}

            {step === 5 && (
  <div className="text-center">
    <h3 className="text-green-600 font-semibold text-lg mb-6">
      Randevunuz Oluşturuldu
    </h3>

    <button
      onClick={() => {
        setShowBooking(false);
        setStep(1);
        setSelectedDate(null);
        setSelectedTime(null);
        setName("");
        setPhone("");
      }}
      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-full transition"
    >
      Kapat
    </button>
  </div>
)}

          </div>
        </div>
      )}
    </div>
  );
}
