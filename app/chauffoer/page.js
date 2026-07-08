"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

const NAESTE_TRIN = {
  accepteret: { naeste: "paa_vej", knap: "🛴 Jeg er på vej" },
  paa_vej: { naeste: "fremme", knap: "📍 Jeg er fremme" },
  fremme: { naeste: "koerer", knap: "🚗 Vi kører nu" },
  koerer: { naeste: "afsluttet", knap: "🏡 Tur afsluttet" },
};

export default function ChauffoerSide() {
  const supabase = createClient();
  const [bruger, setBruger] = useState(null);
  const [godkendt, setGodkendt] = useState(null);
  const [gigs, setGigs] = useState([]);

  async function hent(uid) {
    const { data: verif } = await supabase
      .from("driver_verifications")
      .select("godkendt")
      .eq("chauffoer_id", uid)
      .maybeSingle();
    setGodkendt(verif?.godkendt ?? false);

    const { data } = await supabase
      .from("gigs")
      .select("*, bookings(dato, vindue_fra, vindue_til, fest_adresse, hjem_adresse, km, passagerer, status)")
      .in("status", ["tilbudt", "accepteret", "paa_vej", "fremme", "koerer"])
      .order("created_at", { ascending: false });
    setGigs(data || []);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return (window.location.href = "/login");
      setBruger(data.user);
      hent(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!bruger) return;
    const interval = setInterval(() => hent(bruger.id), 10000);
    return () => clearInterval(interval);
  }, [bruger]);

  async function opdaterGig(gigId, status) {
    await supabase.from("gigs").update({ status }).eq("id", gigId);
    hent(bruger.id);
  }

  if (godkendt === null) {
    return <div className="wrap" style={{ paddingTop: 64, textAlign: "center", color: "var(--daempet)" }}>Henter...</div>;
  }

  if (godkendt === false) {
    return (
      <div className="wrap" style={{ maxWidth: 520, paddingTop: 64, textAlign: "center" }}>
        <div className="beregner">
          <div style={{ fontSize: "2.5rem" }}>⏳</div>
          <h2 style={{ margin: "12px 0" }}>Din ansøgning behandles</h2>
          <p style={{ color: "var(--daempet)" }}>
            Vi gennemgår kørekort, straffeattest og aftaler en køretest.
            Du hører fra os på telefon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 40, paddingBottom: 80 }}>
      <div className="logo" style={{ textAlign: "center", marginBottom: 24 }}>
        Hjem<span>Kørt</span> · Chauffør
      </div>

      {gigs.length === 0 && (
        <div className="beregner" style={{ textAlign: "center" }}>
          <p style={{ color: "var(--daempet)" }}>
            Ingen ture lige nu. Du får tilbudt ture her, når admin tildeler dem.
          </p>
        </div>
      )}

      {gigs.map((g) => {
        const b = g.bookings;
        const pinget = b?.status === "aktiv";
        const trin = NAESTE_TRIN[g.status];

        return (
          <div key={g.id} className="beregner" style={{ marginBottom: 16, borderColor: pinget ? "var(--lygte)" : undefined }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <strong>{b?.dato}</strong> · kl. {b?.vindue_fra?.slice(0, 5)}–{b?.vindue_til?.slice(0, 5)}
                <div style={{ color: "var(--daempet)", fontSize: "0.9rem", marginTop: 4 }}>
                  {b?.fest_adresse} → {b?.hjem_adresse}
                  <br />
                  {b?.km} km · {b?.passagerer} passagerer
                </div>
              </div>
              <div className="belob" style={{ fontSize: "1.3rem" }}>{g.betaling_kr} kr</div>
            </div>

            {g.status === "tilbudt" && (
              <div style={{ display: "flex", gap: 10 }}>
                <button className="knap" onClick={() => opdaterGig(g.id, "accepteret")}>
                  Acceptér turen
                </button>
                <button
                  className="knap"
                  style={{ background: "var(--asfalt-lys)", color: "var(--tekst)" }}
                  onClick={() => opdaterGig(g.id, "afvist")}
                >
                  Afvis
                </button>
              </div>
            )}

            {g.status === "accepteret" && !pinget && (
              <p style={{ marginTop: 14, fontSize: "0.9rem", color: "var(--daempet)" }}>
                ⏳ Venter på kundens ping — hold dig klar i tidsvinduet.
              </p>
            )}

            {g.status === "accepteret" && pinget && (
              <p style={{ marginTop: 14, fontWeight: 600, color: "var(--lygte)" }}>
                🔔 KUNDEN HAR PINGET — afsted på løbehjulet!
              </p>
            )}

            {trin && (g.status !== "accepteret" || pinget) && (
              <button className="knap" onClick={() => opdaterGig(g.id, trin.naeste)}>
                {trin.knap}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
