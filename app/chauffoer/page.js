"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

const KRAV_FOTOS = 4;

export default function ChauffoerSide() {
  const supabase = createClient();
  const [bruger, setBruger] = useState(null);
  const [godkendt, setGodkendt] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [uploader, setUploader] = useState("");

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

  async function uploadFoto(gig, fase, fil) {
    if (!fil) return;
    setUploader(gig.id + fase);

    const eksisterende = gig[fase] || [];
    const sti = `${gig.id}/${fase}_${eksisterende.length + 1}_${Date.now()}.jpg`;

    const { error } = await supabase.storage.from("bilfotos").upload(sti, fil);
    if (error) {
      setUploader("");
      return alert("Upload fejlede: " + error.message);
    }

    await supabase
      .from("gigs")
      .update({ [fase]: [...eksisterende, sti] })
      .eq("id", gig.id);

    setUploader("");
    hent(bruger.id);
  }

  function FotoSektion({ gig, fase, titel }) {
    const fotos = gig[fase] || [];
    const faerdig = fotos.length >= KRAV_FOTOS;
    return (
      <div style={{ marginTop: 14, padding: "14px", background: "var(--nat)", borderRadius: 10, border: "1px solid var(--asfalt-lys)" }}>
        <strong style={{ fontSize: "0.95rem" }}>
          📷 {titel} ({fotos.length}/{KRAV_FOTOS})
        </strong>
        <p style={{ fontSize: "0.85rem", color: "var(--daempet)", margin: "4px 0 10px" }}>
          Front, bagende og begge sider — det beskytter både dig og kunden.
        </p>
        {!faerdig && (
          <label
            style={{
              display: "inline-block",
              background: "var(--lygte)",
              color: "#241703",
              borderRadius: 10,
              padding: "10px 16px",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {uploader === gig.id + fase ? "Uploader..." : `Tag foto ${fotos.length + 1}`}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => uploadFoto(gig, fase, e.target.files?.[0])}
            />
          </label>
        )}
        {faerdig && <span style={{ color: "var(--groen)", fontSize: "0.9rem" }}>✅ Alle fotos taget</span>}
      </div>
    );
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
          <p style={{ color: "var(--daempet)", marginBottom: 16 }}>
            Upload dit kørekort og din straffeattest — så gennemgår vi dem og
            aftaler en køretest med dig.
          </p>
          <a href="/chauffoer/dokumenter">
            <button className="knap">📄 Upload dokumenter</button>
          </a>
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
        const foerOk = (g.foto_foer || []).length >= KRAV_FOTOS;
        const efterOk = (g.foto_efter || []).length >= KRAV_FOTOS;

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
              <>
                <p style={{ marginTop: 14, fontWeight: 600, color: "var(--lygte)" }}>
                  🔔 KUNDEN HAR PINGET — afsted på løbehjulet!
                </p>
                <button className="knap" onClick={() => opdaterGig(g.id, "paa_vej")}>
                  🛴 Jeg er på vej
                </button>
              </>
            )}

            {g.status === "paa_vej" && (
              <button className="knap" onClick={() => opdaterGig(g.id, "fremme")}>
                📍 Jeg er fremme
              </button>
            )}

            {g.status === "fremme" && (
              <>
                <FotoSektion gig={g} fase="foto_foer" titel="Fotos af bilen FØR kørsel" />
                <button className="knap" disabled={!foerOk} onClick={() => opdaterGig(g.id, "koerer")} style={{ opacity: foerOk ? 1 : 0.5 }}>
                  🚗 Vi kører nu
                </button>
              </>
            )}

            {g.status === "koerer" && (
              <>
                <FotoSektion gig={g} fase="foto_efter" titel="Fotos af bilen EFTER kørsel" />
                <button className="knap" disabled={!efterOk} onClick={() => opdaterGig(g.id, "afsluttet")} style={{ opacity: efterOk ? 1 : 0.5 }}>
                  🏡 Tur afsluttet
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
