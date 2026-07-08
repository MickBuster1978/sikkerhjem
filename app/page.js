"use client";

import { useState } from "react";

const GRUNDPRIS = 299; // inkl. de første 5 km
const KM_INKLUDERET = 5;
const PRIS_PR_KM = 10;

const VINDUER = ["21–24", "22–01", "23–02", "00–03"];

export default function Forside() {
  const [km, setKm] = useState(15);
  const [vindue, setVindue] = useState("23–02");

  const pris =
    GRUNDPRIS + Math.max(0, km - KM_INKLUDERET) * PRIS_PR_KM;

  return (
    <>
      <div className="wrap">
        <header className="topbar">
          <div className="logo">
            Hjem<span>Kørt</span>
          </div>
          <nav>
            <a href="#saadan">Sådan virker det</a>
            <a href="#tryghed">Tryghed</a>
            <a href="#beregner">Beregn pris</a>
            <a href="/login" style={{ color: "var(--lygte)" }}>Log ind</a>
          </nav>
        </header>

        <section className="hero">
          <div>
            <h1>
              Du kører til festen.
              <br />
              Vi kører dig hjem — <em>i din egen bil.</em>
            </h1>
            <p className="lead">
              En verificeret chauffør kommer på el-løbehjul, folder det ned i
              bagagerummet og kører dig, dine gæster og bilen sikkert hjem.
              Når du vil — du bestemmer på aftenen.
            </p>
          </div>

          <div className="beregner" id="beregner">
            <h2>Hvad koster din tur hjem?</h2>

            <label htmlFor="km">Afstand hjem</label>
            <input
              id="km"
              type="range"
              min="3"
              max="60"
              value={km}
              onChange={(e) => setKm(Number(e.target.value))}
            />
            <div className="km-visning">
              <strong>{km} km</strong>
              <small style={{ color: "var(--daempet)" }}>
                fx Vejle → Kolding ≈ 30 km
              </small>
            </div>

            <label>Hvornår vil du cirka hjem?</label>
            <div className="vindue-valg">
              {VINDUER.map((v) => (
                <button
                  key={v}
                  className={v === vindue ? "aktiv" : ""}
                  onClick={() => setVindue(v)}
                >
                  kl. {v}
                </button>
              ))}
            </div>

            <div className="pris-linje">
              <div>
                <small>Fast pris — intet taxameter</small>
                <small>Tidsvindue kl. {vindue}. Du pinger, når du er klar.</small>
              </div>
              <div className="belob">{pris} kr</div>
            </div>

            <a href="/book">
              <button className="knap">Book din chauffør</button>
            </a>
          </div>
        </section>
      </div>

      <div className="vejstribe" aria-hidden="true" />

      <div className="wrap">
        <section className="sektion" id="saadan">
          <h2>Sådan virker det</h2>
          <div className="trin-grid">
            <div className="trin">
              <div className="ikon">📅</div>
              <h3>Book før festen</h3>
              <p>
                Vælg dato, adresser og et tidsvindue — ikke et klokkeslæt. Fast
                pris med det samme.
              </p>
            </div>
            <div className="trin">
              <div className="ikon">🥂</div>
              <h3>Nyd aftenen</h3>
              <p>
                Ingen ædru-vagt, ingen diskussion om hvem der kører. I skåler
                begge to.
              </p>
            </div>
            <div className="trin">
              <div className="ikon">🛴</div>
              <h3>Tryk "Kør mig hjem"</h3>
              <p>
                Din chauffør kommer på el-løbehjul og folder det ned i
                bagagerummet.
              </p>
            </div>
            <div className="trin">
              <div className="ikon">🏡</div>
              <h3>Hjemme — med bilen</h3>
              <p>
                Bilen i indkørslen, nøglerne i hånden. Ingen afhentning dagen
                efter.
              </p>
            </div>
          </div>
        </section>

        <section className="sektion" id="tryghed">
          <h2>Din bil er i trygge hænder</h2>
          <div className="tryghed">
            <div className="punkt">
              <h3>Verificerede chauffører</h3>
              <p>
                Kørekortstjek, ren straffeattest og praktisk køretest — også i
                manuelt gear. Du ser foto og profil, før aftenen starter.
              </p>
            </div>
            <div className="punkt">
              <h3>Forsikret fra dør til dør</h3>
              <p>
                Hver tur er dækket af vores erhvervsforsikring — fra nøglerne
                skifter hånd, til bilen står i din indkørsel.
              </p>
            </div>
            <div className="punkt">
              <h3>Foto-dokumentation</h3>
              <p>
                Chaufføren fotograferer bilen ved afhentning og aflevering. Alt
                gemt i din booking.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer>
        <div className="wrap">
          HjemKørt · Trekantområdet · Kør sikkert hjem — i din egen bil
        </div>
      </footer>
    </>
  );
}
