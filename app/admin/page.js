"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

export default function AdminSide() {
  const supabase = createClient();
  const [erAdmin, setErAdmin] = useState(null);
  const [bookinger, setBookinger] = useState([]);
  const [chauffoerer, setChauffoerer] = useState([]);
  const [ansoegere, setAnsoegere] = useState([]);
  const [valg, setValg] = useState({}); // bookingId -> { chauffoerId, betaling }

  async function hent() {
    const { data: b } = await supabase
      .from("bookings")
      .select("*, gigs(status, betaling_kr)")
      .order("dato", { ascending: true });
    setBookinger(b || []);

    const { data: verif } = await supabase
      .from("driver_verifications")
      .select("chauffoer_id, godkendt, profiles:chauffoer_id(fulde_navn, telefon)");
    setChauffoerer((verif || []).filter((v) => v.godkendt));
    setAnsoegere((verif || []).filter((v) => !v.godkendt));
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return (window.location.href = "/login");
      const { data: p } = await supabase
        .from("profiles").select("role").eq("id", data.user.id).single();
      if (p?.role !== "admin") return setErAdmin(false);
      setErAdmin(true);
      hent();
    });
  }, []);

  async function tildelChauffoer(booking) {
    const v = valg[booking.id];
    if (!v?.chauffoerId) return alert("Vælg en chauffør først.");
    const betaling = Number(v.betaling) || Math.round(booking.pris_kr * 0.55);

    const { error } = await supabase.from("gigs").insert({
      booking_id: booking.id,
      chauffoer_id: v.chauffoerId,
      betaling_kr: betaling,
    });
    if (error) return alert("Fejl: " + error.message);

    await supabase.from("bookings").update({ status: "bekraeftet" }).eq("id", booking.id);
    hent();
  }

  async function godkendChauffoer(chauffoerId) {
    const { data } = await supabase.auth.getUser();
    await supabase
      .from("driver_verifications")
      .update({
        godkendt: true,
        koerekort_ok: true,
        straffeattest_ok: true,
        koeretest_manuel_ok: true,
        godkendt_af: data.user.id,
        godkendt_dato: new Date().toISOString(),
      })
      .eq("chauffoer_id", chauffoerId);
    hent();
  }

  if (erAdmin === null)
    return <div className="wrap" style={{ paddingTop: 64, textAlign: "center", color: "var(--daempet)" }}>Henter...</div>;

  if (erAdmin === false)
    return <div className="wrap" style={{ paddingTop: 64, textAlign: "center", color: "var(--daempet)" }}>Kun for admin.</div>;

  return (
    <div className="wrap" style={{ maxWidth: 760, paddingTop: 40, paddingBottom: 80 }}>
      <div className="logo" style={{ textAlign: "center", marginBottom: 32 }}>
        Hjem<span>Kørt</span> · Admin
      </div>

      <h2 style={{ marginBottom: 16 }}>Chauffør-ansøgninger</h2>
      {ansoegere.length === 0 && <p style={{ color: "var(--daempet)", marginBottom: 24 }}>Ingen nye ansøgninger.</p>}
      {ansoegere.map((a) => (
        <div key={a.chauffoer_id} className="beregner" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <strong>{a.profiles?.fulde_navn || "Uden navn"}</strong>
            <div style={{ color: "var(--daempet)", fontSize: "0.9rem" }}>{a.profiles?.telefon}</div>
          </div>
          <button className="knap" style={{ width: "auto", marginTop: 0 }} onClick={() => godkendChauffoer(a.chauffoer_id)}>
            Godkend
          </button>
        </div>
      ))}

      <h2 style={{ margin: "32px 0 16px" }}>Bookinger</h2>
      {bookinger.map((b) => (
        <div key={b.id} className="beregner" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <strong>{b.dato}</strong> · kl. {b.vindue_fra?.slice(0, 5)}–{b.vindue_til?.slice(0, 5)} · <em style={{ color: "var(--lygte)", fontStyle: "normal" }}>{b.status}</em>
              <div style={{ color: "var(--daempet)", fontSize: "0.9rem", marginTop: 4 }}>
                {b.fest_adresse} → {b.hjem_adresse} · {b.km} km
              </div>
            </div>
            <div className="belob" style={{ fontSize: "1.3rem" }}>{b.pris_kr} kr</div>
          </div>

          {b.status === "afventer" && (
            <div style={{ marginTop: 14 }}>
              <select
                style={{ width: "100%", background: "var(--nat)", border: "1px solid var(--asfalt-lys)", borderRadius: 10, color: "var(--tekst)", padding: "12px 14px", fontSize: "1rem" }}
                value={valg[b.id]?.chauffoerId || ""}
                onChange={(e) => setValg({ ...valg, [b.id]: { ...valg[b.id], chauffoerId: e.target.value } })}
              >
                <option value="">Vælg chauffør...</option>
                {chauffoerer.map((c) => (
                  <option key={c.chauffoer_id} value={c.chauffoer_id}>
                    {c.profiles?.fulde_navn || "Uden navn"}
                  </option>
                ))}
              </select>
              <input
                style={{ width: "100%", background: "var(--nat)", border: "1px solid var(--asfalt-lys)", borderRadius: 10, color: "var(--tekst)", padding: "12px 14px", fontSize: "1rem", marginTop: 8 }}
                type="number"
                placeholder={`Chauffør-betaling (forslag: ${Math.round(b.pris_kr * 0.55)} kr)`}
                value={valg[b.id]?.betaling || ""}
                onChange={(e) => setValg({ ...valg, [b.id]: { ...valg[b.id], betaling: e.target.value } })}
              />
              <button className="knap" onClick={() => tildelChauffoer(b)}>Tildel og bekræft</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
