"use client";

import { useState } from "react";
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

export default function LoginSide() {
  const supabase = createClient();

  const [tilstand, setTilstand] = useState("login"); // 'login' | 'opret'
  const [rolle, setRolle] = useState("kunde"); // 'kunde' | 'chauffoer'
  const [navn, setNavn] = useState("");
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [kode, setKode] = useState("");
  const [besked, setBesked] = useState("");
  const [travl, setTravl] = useState(false);

  async function handleSubmit() {
    setBesked("");
    setTravl(true);

    if (tilstand === "opret") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: kode,
        options: {
          data: { role: rolle, fulde_navn: navn, telefon },
        },
      });
      setTravl(false);
      if (error) return setBesked("Kunne ikke oprette konto: " + error.message);
      if (!data.session)
        return setBesked("Konto oprettet — tjek din mail for at bekræfte.");
      window.location.href = rolle === "chauffoer" ? "/chauffoer" : "/";
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: kode,
      });
      setTravl(false);
      if (error) return setBesked("Forkert email eller adgangskode.");

      const { data: profil } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      window.location.href =
        profil?.role === "chauffoer" ? "/chauffoer" : "/";
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 480, paddingTop: 48, paddingBottom: 80 }}>
      <a href="/" className="logo" style={{ display: "block", textAlign: "center", marginBottom: 28 }}>
        Hjem<span>Kørt</span>
      </a>

      <div className="beregner">
        {/* Log ind / Opret konto */}
        <div className="vindue-valg" style={{ marginBottom: 20 }}>
          <button
            className={tilstand === "login" ? "aktiv" : ""}
            onClick={() => { setTilstand("login"); setBesked(""); }}
          >
            Log ind
          </button>
          <button
            className={tilstand === "opret" ? "aktiv" : ""}
            onClick={() => { setTilstand("opret"); setBesked(""); }}
          >
            Opret konto
          </button>
        </div>

        {tilstand === "opret" && (
          <>
            <label>Jeg vil oprette mig som</label>
            <div className="vindue-valg">
              <button
                className={rolle === "kunde" ? "aktiv" : ""}
                onClick={() => setRolle("kunde")}
              >
                🥂 Kunde
              </button>
              <button
                className={rolle === "chauffoer" ? "aktiv" : ""}
                onClick={() => setRolle("chauffoer")}
              >
                🛴 Chauffør
              </button>
            </div>

            <label>Fulde navn</label>
            <input style={input} value={navn} onChange={(e) => setNavn(e.target.value)} placeholder="Fx Henrik Jensen" />

            <label>Telefon</label>
            <input style={input} value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="Fx 22 33 44 55" />
          </>
        )}

        <label>Email</label>
        <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dig@mail.dk" />

        <label>Adgangskode</label>
        <input style={input} type="password" value={kode} onChange={(e) => setKode(e.target.value)} placeholder="Mindst 6 tegn" />

        {besked && (
          <p style={{ marginTop: 14, fontSize: "0.9rem", color: "var(--lygte)" }}>{besked}</p>
        )}

        <button className="knap" onClick={handleSubmit} disabled={travl}>
          {travl
            ? "Vent..."
            : tilstand === "opret"
            ? rolle === "chauffoer"
              ? "Ansøg som chauffør"
              : "Opret konto"
            : "Log ind"}
        </button>

        {tilstand === "opret" && rolle === "chauffoer" && (
          <p style={{ marginTop: 14, fontSize: "0.85rem", color: "var(--daempet)" }}>
            Som chauffør skal du godkendes, før du kan modtage ture: kørekortstjek,
            straffeattest og køretest. Vi kontakter dig på telefon.
          </p>
        )}
      </div>
    </div>
  );
}
