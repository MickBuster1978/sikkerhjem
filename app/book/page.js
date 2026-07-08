"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase";

const GRUNDPRIS = 299;
const KM_INKLUDERET = 5;
const PRIS_PR_KM = 10;

const VINDUER = [
  { label: "21–24", fra: "21:00", til: "00:00" },
  { label: "22–01", fra: "22:00", til: "01:00" },
  { label: "23–02", fra: "23:00", til: "02:00" },
  { label: "00–03", fra: "00:00", til: "03:00" },
];

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

export default function BookSide() {
  const supabase = createClient();

  const [bruger, setBruger] = useState(null);
  const [festAdresse, setFestAdresse] = useState("");
  const [hjemAdresse, setHjemAdresse] = useState("");
  const [dato, setDato] = useState("");
  const [vindue, setVindue] = useState(VINDUER[2]);
  const [km, setKm] = useState(15);
  const [passagerer, setPassagerer] = useState(2);
  const [nummerplade, setNummerplade] = useState("");
  const [maerkeModel, setMaerkeModel] = useState("");
  const [gear, setGear] = useState("manuel");
  const [besked, setBesked] = useState("");
  const [travl, setTravl] = useState(false);
  const [oprettet, setOprettet] = useState(false);

  const pris = GRUNDPRIS + Math.max(0, km - KM_INKLUDERET) * PRIS_PR_KM;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) window.location.href = "/login";
      else setBruger(data.user);
    });
  }, []);

  async function opretBooking() {
    setBesked("");
    if (!festAdresse || !hjemAdresse || !dato || !nummerplade) {
      return setBesked("Udfyld adresser, dato og nummerplade.");
    }
    setTravl(true);

    const { data: bil, error: bilFejl } = await supabase
      .from("vehicles")
      .insert({
        ejer_id: bruger.id,
        nummerplade: nummerplade.toUpperCase().replace(/\s/g, ""),
        maerke_model: maerkeModel,
        gear,
      })
      .select()
      .single();

    if (bilFejl) {
      setTravl(false);
      return setBesked("Kunne ikke gemme bilen: " + bilFejl.message);
    }

    const { error } = await supabase.from("bookings").insert({
      kunde_id: bruger.id,
      vehicle_id: bil.id,
      fest_adresse: festAdresse,
      hjem_adresse: hjemAdresse,
      dato,
      vindue_fra: vindue.fra,
      vindue_til: vindue.til,
      km,
      pris_kr: pris,
      passagerer,
    });

    setTravl(false);
    if (error) return setBesked("Kunne ikke oprette booking: " + error.message);
    setOprettet(true);
  }

  if (oprettet) {
    return (
      <div className="wrap" style={{ maxWidth: 520, paddingTop: 64, textAlign: "center" }}>
        <div className="beregner">
          <div style={{ fontSize: "2.5rem" }}>✅</div>
          <h2 style={{ margin: "12px 0" }}>Din tur er booket</h2>
          <p style={{ color: "var(--daempet)" }}>
            {dato} · kl. {vindue.label} · {pris} kr
            <br />
            Du får besked, når din chauffør er bekræftet.
          </p>
          <a href="/ture"><button className="knap">Se mine ture</button></a>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap" style={{ maxWidth: 560, paddingTop: 40, paddingBottom: 80 }}>
      <a href="/" className="logo" style={{ display: "block", textAlign: "center", marginBottom: 24 }}>
        Hjem<span>Kørt</span>
      </a>

      <div className="beregner">
        <h2>Book din tur hjem</h2>

        <label>Festens adresse</label>
        <input style={input} value={festAdresse} onChange={(e) => setFestAdresse(e.target.value)} placeholder="Fx Festvej 12, Vejle" />

        <label>Hjemadresse</label>
        <input style={input} value={hjemAdresse} onChange={(e) => setHjemAdresse(e.target.value)} placeholder="Fx Hjemgade 4, Kolding" />

        <label>Dato</label>
        <input style={input} type="date" value={dato} onChange={(e) => setDato(e.target.value)} />

        <label>Hvornår vil I cirka hjem?</label>
        <div className="vindue-valg">
          {VINDUER.map((v) => (
            <button key={v.label} className={v.label === vindue.label ? "aktiv" : ""} onClick={() => setVindue(v)}>
              kl. {v.label}
            </button>
          ))}
        </div>

        <label>Afstand hjem: {km} km</label>
        <input type="range" min="3" max="60" value={km} onChange={(e) => setKm(Number(e.target.value))} />

        <label>Passagerer</label>
        <div className="vindue-valg">
          {[1, 2, 3, 4].map((n) => (
            <button key={n} className={n === passagerer ? "aktiv" : ""} onClick={() => setPassagerer(n)}>
              {n}
            </button>
          ))}
        </div>

        <label>Nummerplade</label>
        <input style={input} value={nummerplade} onChange={(e) => setNummerplade(e.target.value)} placeholder="AB 12 345" />

        <label>Mærke og model</label>
        <input style={input} value={maerkeModel} onChange={(e) => setMaerkeModel(e.target.value)} placeholder="Fx VW Passat 2019" />

        <label>Gear</label>
        <div className="vindue-valg">
          <button className={gear === "manuel" ? "aktiv" : ""} onClick={() => setGear("manuel")}>Manuel</button>
          <button className={gear === "automat" ? "aktiv" : ""} onClick={() => setGear("automat")}>Automat</button>
        </div>

        <div className="pris-linje">
          <div>
            <small>Fast pris — intet taxameter</small>
            <small>Gratis afbestilling indtil 24 timer før</small>
          </div>
          <div className="belob">{pris} kr</div>
        </div>

        {besked && <p style={{ marginTop: 14, fontSize: "0.9rem", color: "var(--lygte)" }}>{besked}</p>}

        <button className="knap" onClick={opretBooking} disabled={travl}>
          {travl ? "Opretter..." : "Bekræft booking"}
        </button>
      </div>
    </div>
  );
}
