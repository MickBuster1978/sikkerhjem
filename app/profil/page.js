"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

const input = {
  width: "100%",
  background: "var(--nat)",
  border: "1px solid var(--asfalt-lys)",
  borderRadius: "10px",
  color: "var(--tekst)",
  padding: "12px 14px",
  fontSize: "1rem",
  marginTop: "6px",
};

export default function ProfilSide() {
  const supabase = createClient();

  const [bruger, setBruger] = useState(null);
  const [navn, setNavn] = useState("");
  const [telefon, setTelefon] = useState("");
  const [rolle, setRolle] = useState("");
  const [biler, setBiler] = useState([]);
  const [besked, setBesked] = useState("");
  const [travl, setTravl] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return (window.location.href = "/login");
      setBruger(data.user);

      const { data: p } = await supabase
        .from("profiles")
        .select("fulde_navn, telefon, role")
        .eq("id", data.user.id)
        .single();
      setNavn(p?.fulde_navn || "");
      setTelefon(p?.telefon || "");
      setRolle(p?.role || "kunde");

      const { data: v } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });
      setBiler(v || []);
    });
  }, []);

  async function gem() {
    setBesked("");
    setTravl(true);
    const { error } = await supabase
      .from("profiles")
      .update({ fulde_navn: navn, telefon })
      .eq("id", bruger.id);
    setTravl(false);
    setBesked(error ? "Kunne ikke gemme: " + error.message : "✅ Gemt");
  }

  async function sletBil(id) {
    await supabase.from("vehicles").delete().eq("id", id);
    setBiler(biler.filter((b) => b.id !== id));
  }

  async function logUd() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!bruger) {
    return <div className="wrap" style={{ paddingTop: 64, textAlign: "center", color: "var(--daempet)" }}>Henter...</div>;
  }

  return (
    <div className="wrap" style={{ maxWidth: 520, paddingTop: 40, paddingBottom: 80 }}>
      <a href="/" className="logo" style={{ display: "block", textAlign: "center", marginBottom: 24 }}>
        Hjem<span>Kørt</span>
      </a>

      <div className="beregner">
        <h2>Min profil</h2>
        <p style={{ color: "var(--daempet)", fontSize: "0.9rem", marginTop: 4 }}>
          {bruger.email} · {rolle === "chauffoer" ? "Chauffør" : rolle === "admin" ? "Admin" : "Kunde"}
        </p>

        <label>Fulde navn</label>
        <input style={input} value={navn} onChange={(e) => setNavn(e.target.value)} />

        <label>Telefon</label>
        <input style={input} value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="Fx 22 33 44 55" />

        {besked && <p style={{ marginTop: 14, fontSize: "0.9rem", color: "var(--lygte)" }}>{besked}</p>}

        <button className="knap" onClick={gem} disabled={travl}>
          {travl ? "Gemmer..." : "Gem ændringer"}
        </button>
      </div>

      {biler.length > 0 && (
        <div className="beregner" style={{ marginTop: 20 }}>
          <h2>Mine biler</h2>
          {biler.map((b) => (
            <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px dashed var(--asfalt-lys)" }}>
              <div>
                <strong>{b.nummerplade}</strong>
                <div style={{ color: "var(--daempet)", fontSize: "0.9rem" }}>
                  {b.maerke_model || "Ukendt model"} · {b.gear}
                </div>
              </div>
              <button
                onClick={() => sletBil(b.id)}
                style={{ background: "none", border: "1px solid var(--asfalt-lys)", color: "var(--daempet)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: "0.85rem" }}
              >
                Slet
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <button
          onClick={logUd}
          style={{ background: "none", border: "1px solid var(--asfalt-lys)", color: "var(--daempet)", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontSize: "0.95rem" }}
        >
          Log ud
        </button>
      </div>
    </div>
  );
}
