"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase";

const DOKUMENTER = [
  { key: "koerekort_for", titel: "Kørekort — forside", accept: "image/*" },
  { key: "koerekort_bag", titel: "Kørekort — bagside", accept: "image/*" },
  { key: "straffeattest", titel: "Straffeattest (foto eller PDF)", accept: "image/*,application/pdf" },
];

export default function DokumenterSide() {
  const supabase = createClient();
  const [bruger, setBruger] = useState(null);
  const [uploadet, setUploadet] = useState({});
  const [travl, setTravl] = useState("");
  const [besked, setBesked] = useState("");

  async function hentStatus(uid) {
    const { data } = await supabase.storage.from("dokumenter").list(uid);
    const status = {};
    (data || []).forEach((f) => {
      const key = f.name.split(".")[0];
      status[key] = true;
    });
    setUploadet(status);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return (window.location.href = "/login");
      setBruger(data.user);
      hentStatus(data.user.id);
    });
  }, []);

  async function upload(dok, fil) {
    if (!fil) return;
    setBesked("");
    setTravl(dok.key);

    const endelse = fil.name.split(".").pop().toLowerCase();
    const sti = `${bruger.id}/${dok.key}.${endelse}`;

    const { error } = await supabase.storage
      .from("dokumenter")
      .upload(sti, fil, { upsert: true });

    setTravl("");
    if (error) return setBesked("Upload fejlede: " + error.message);
    setBesked(`✅ ${dok.titel} uploadet`);
    hentStatus(bruger.id);
  }

  const alleUploadet = DOKUMENTER.every((d) => uploadet[d.key]);

  return (
    <div className="wrap" style={{ maxWidth: 520, paddingTop: 40, paddingBottom: 80 }}>
      <a href="/chauffoer" className="logo" style={{ display: "block", textAlign: "center", marginBottom: 24 }}>
        Hjem<span>Kørt</span> · Dokumenter
      </a>

      <div className="beregner">
        <h2>Dine verifikationsdokumenter</h2>
        <p style={{ color: "var(--daempet)", fontSize: "0.9rem", margin: "8px 0 16px" }}>
          Vi skal bruge dit kørekort og en straffeattest, før du kan godkendes.
          Dokumenterne opbevares sikkert og kan kun ses af dig og HjemKørt.
        </p>

        {DOKUMENTER.map((dok) => (
          <div
            key={dok.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "14px 0",
              borderBottom: "1px dashed var(--asfalt-lys)",
            }}
          >
            <div>
              <strong style={{ fontSize: "0.95rem" }}>{dok.titel}</strong>
              <div style={{ fontSize: "0.85rem", color: uploadet[dok.key] ? "var(--groen)" : "var(--daempet)" }}>
                {uploadet[dok.key] ? "✅ Uploadet" : "Mangler"}
              </div>
            </div>
            <label
              style={{
                background: uploadet[dok.key] ? "var(--asfalt-lys)" : "var(--lygte)",
                color: uploadet[dok.key] ? "var(--tekst)" : "#241703",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {travl === dok.key ? "Uploader..." : uploadet[dok.key] ? "Erstat" : "📷 Upload"}
              <input
                type="file"
                accept={dok.accept}
                capture="environment"
                style={{ display: "none" }}
                onChange={(e) => upload(dok, e.target.files?.[0])}
              />
            </label>
          </div>
        ))}

        {besked && <p style={{ marginTop: 14, fontSize: "0.9rem", color: "var(--lygte)" }}>{besked}</p>}

        {alleUploadet && (
          <p style={{ marginTop: 16, fontSize: "0.9rem", color: "var(--groen)" }}>
            Alle dokumenter er uploadet — vi gennemgår dem og kontakter dig om køretesten.
          </p>
        )}
      </div>
    </div>
  );
}
