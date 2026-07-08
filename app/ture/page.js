"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

const STATUS_TEKST = {
  afventer: "⏳ Afventer bekræftelse",
  bekraeftet: "✅ Chauffør bekræftet",
  aktiv: "🛴 Aktiv i aften",
  afsluttet: "🏡 Afsluttet",
  annulleret: "❌ Annulleret",
};

export default function TureSide() {
  const supabase = createClient();
  const [ture, setTure] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return (window.location.href = "/login");
      const { data: bookinger } = await supabase
        .from("bookings")
        .select("*")
        .order("dato", { ascending: false });
      setTure(bookinger || []);
    });
  }, []);

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 40, paddingBottom: 80 }}>
      <a href="/" className="logo" style={{ display: "block", textAlign: "center", marginBottom: 24 }}>
        Hjem<span>Kørt</span>
      </a>

      <h2 style={{ marginBottom: 20 }}>Mine ture</h2>

      {ture === null && <p style={{ color: "var(--daempet)" }}>Henter...</p>}

      {ture?.length === 0 && (
        <div className="beregner" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--daempet)", marginBottom: 12 }}>
            Du har ingen ture endnu.
          </p>
          <a href="/book"><button className="knap">Book din første tur</button></a>
        </div>
      )}

      {ture?.map((t) => (
        <div key={t.id} className="beregner" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <strong>{t.dato}</strong> · kl. {t.vindue_fra.slice(0, 5)}–{t.vindue_til.slice(0, 5)}
              <div style={{ color: "var(--daempet)", fontSize: "0.9rem", marginTop: 4 }}>
                {t.fest_adresse} → {t.hjem_adresse}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="belob" style={{ fontSize: "1.3rem" }}>{t.pris_kr} kr</div>
              <small style={{ color: "var(--daempet)" }}>{STATUS_TEKST[t.status]}</small>
            </div>
          </div>

          {(t.status === "bekraeftet" || t.status === "aktiv") && (
            <a href={`/aften/${t.id}`}>
              <button className="knap">Åbn aftenskærm</button>
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
