"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "../../../lib/supabase";

const GIG_STATUS = {
  accepteret: { tekst: "Din chauffør er klar og venter på dit ping", ikon: "🕰️" },
  paa_vej: { tekst: "Din chauffør er på vej på løbehjul", ikon: "🛴" },
  fremme: { tekst: "Din chauffør holder udenfor!", ikon: "📍" },
  koerer: { tekst: "I er på vej hjem — god tur", ikon: "🚗" },
  afsluttet: { tekst: "I er hjemme. Godnat!", ikon: "🏡" },
};

export default function AftenSide() {
  const { id } = useParams();
  const supabase = createClient();

  const [booking, setBooking] = useState(null);
  const [gig, setGig] = useState(null);
  const [travl, setTravl] = useState(false);

  async function hent() {
    const { data: b } = await supabase
      .from("bookings").select("*").eq("id", id).single();
    setBooking(b || false);

    const { data: g } = await supabase
      .from("gigs").select("status, ping_tid").eq("booking_id", id).maybeSingle();
    setGig(g);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return (window.location.href = "/login");
      hent();
    });
    const interval = setInterval(hent, 10000);
    return () => clearInterval(interval);
  }, [id]);

  async function pingChauffoer() {
    setTravl(true);
    await supabase.from("bookings").update({ status: "aktiv" }).eq("id", id);
    setTravl(false);
    hent();
  }

  if (booking === null) {
    return <div className="wrap" style={{ paddingTop: 64, textAlign: "center", color: "var(--daempet)" }}>Henter...</div>;
  }

  if (booking === false) {
    return <div className="wrap" style={{ paddingTop: 64, textAlign: "center", color: "var(--daempet)" }}>Turen blev ikke fundet. <a href="/ture" style={{ color: "var(--lygte)" }}>Tilbage til mine ture</a></div>;
  }

  const pinget = booking.status === "aktiv" || booking.status === "afsluttet";
  const status = gig?.status && GIG_STATUS[gig.status];

  return (
    <div className="wrap" style={{ maxWidth: 480, paddingTop: 48, paddingBottom: 80, textAlign: "center" }}>
      <a href="/ture" className="logo" style={{ display: "block", marginBottom: 8 }}>
        Hjem<span>Kørt</span>
      </a>
      <p style={{ color: "var(--daempet)", marginBottom: 32 }}>
        {booking.dato} · kl. {booking.vindue_fra.slice(0, 5)}–{booking.vindue_til.slice(0, 5)}
      </p>

      {!pinget ? (
        <>
          <p style={{ color: "var(--daempet)", marginBottom: 24 }}>
            Nyd festen. Når I er klar til at komme hjem, så tryk på knappen —
            din chauffør hopper på løbehjulet med det samme.
          </p>
          <button
            className="knap"
            onClick={pingChauffoer}
            disabled={travl}
            style={{ fontSize: "1.4rem", padding: "28px 22px", borderRadius: 20 }}
          >
            {travl ? "Sender..." : "🛴 Kør mig hjem"}
          </button>
        </>
      ) : (
        <div className="beregner">
          <div style={{ fontSize: "3rem" }}>{status?.ikon || "✅"}</div>
          <h2 style={{ margin: "12px 0" }}>
            {status?.tekst || "Dit ping er sendt — din chauffør er på vej!"}
          </h2>
          <p style={{ color: "var(--daempet)", fontSize: "0.9rem" }}>
            Skærmen opdaterer automatisk. Bilen holder på {booking.fest_adresse}.
          </p>
        </div>
      )}
    </div>
  );
}
