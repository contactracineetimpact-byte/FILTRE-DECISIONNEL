import { useState, useEffect } from "react";
import { Check, X, Clock, Sparkles, Trash2, Download, Copy, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORIES = {
  depense: {
    label: "Dépense",
    emoji: "💸",
    gainLabel: "Économisé",
    gainPlaceholder: "ex: 8",
    accent: "#B9872E",
    tint: "#F3E6C8",
    questions: [
      "Ça me fait gagner de l'argent ?",
      "Ça me fait gagner du temps ?",
      "Je risque de regretter de NE PAS le faire ?",
      "Pas d'alternative plus raisonnable disponible ?",
      "Aligné avec mon objectif actuel ?",
    ],
  },
  social: {
    label: "Social",
    emoji: "🧑‍🤝‍🧑",
    gainLabel: "Préservé",
    gainPlaceholder: "ex: 2h de sommeil",
    accent: "#B5623A",
    tint: "#F2DFCF",
    questions: [
      "Ça me recharge plutôt que ça me vide (avant et après) ?",
      "Ça nourrit une relation que je veux cultiver ?",
      "Le coût financier reste raisonnable par rapport à mon budget actuel ?",
      "Je risque de regretter de NE PAS y aller ?",
      "Ce n'est pas pour fuir un truc (tâche, problème) ?",
    ],
  },
  autre: {
    label: "Autre",
    emoji: "🎯",
    gainLabel: "Préservé",
    gainPlaceholder: "ex: tranquillité",
    accent: "#2F6647",
    tint: "#DCE9DF",
    questions: [
      "Aligné avec mes valeurs ou objectifs actuels ?",
      "C'est réversible si ça se passe mal ?",
      "Mon futur moi, dans 1 an, serait content de ce choix ?",
      "Le coût (argent, temps ou relationnel) est raisonnable par rapport au bénéfice ?",
      "Je suis lucide là, pas fatigué ou stressé ?",
    ],
  },
};

const RACINES = [
  { key: "sain", label: "Choix sain, pas un blocage" },
  { key: "peux_pas", label: "Je ne peux pas" },
  { key: "sais_pas", label: "Je ne sais pas" },
  { key: "ose_pas", label: "Je n'ose pas" },
  { key: "veux_pas", label: "Je ne veux pas vraiment" },
];

const NEEDS_FOLLOWUP = ["Validé", "Délai 24-72h imposé", "Reporté (sur place)"];

const NON_COLOR = "#6B5D45";
const CREAM = "#FFFBF2";
const TEXT_DARK = "#2B2418";
const TEXT_MUTED = "#8A7C5C";
const BORDER = "#E3D6AD";
const PAGE_BG = "#F6EFDD";

const GAIN_TYPES = ["€", "Temps", "Énergie", "Autre"];

function todayLabel() {
  const d = new Date();
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
}

function zoneFromScore(score) {
  if (score <= 1) return "refus";
  if (score <= 3) return "moyen";
  return "favorable";
}

const ZONE_STYLE = {
  refus: { color: "#B23A31", label: "REFUS SYSTÉMATIQUE" },
  moyen: { color: "#C97C1F", label: "ZONE À ÉTUDIER" },
  favorable: { color: "#2F7A50", label: "FAVORABLE" },
};

export default function FiltreDecisionnel() {
  const [loaded, setLoaded] = useState(false);
  const [entries, setEntries] = useState([]);
  const [category, setCategory] = useState(null);
  const [situation, setSituation] = useState("");
  const [emotion, setEmotion] = useState("");
  const [answers, setAnswers] = useState([null, null, null, null, null]);
  const [timing, setTiming] = useState("avant");
  const [reversible, setReversible] = useState(null);
  const [exitAnswer, setExitAnswer] = useState(null);
  const [noGain, setNoGain] = useState(false);
  const [gainAmount, setGainAmount] = useState("");
  const [gainType, setGainType] = useState("€");
  const [racine, setRacine] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(null); // { id, suivi }

  const cat = category ? CATEGORIES[category] : null;
  const accent = cat ? cat.accent : "#B9872E";
  const questions = cat ? cat.questions : [];
  const answeredCount = answers.filter((a) => a !== null).length;
  const allAnswered = category && answeredCount === questions.length;
  const score = answers.filter((a) => a === true).length;
  const zone = allAnswered ? zoneFromScore(score) : null;
  const zStyle = zone ? ZONE_STYLE[zone] : null;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("filtre-entries");
      if (raw) setEntries(JSON.parse(raw));
    } catch (e) {
      // pas d'historique existant encore
    }
    setLoaded(true);
  }, []);

  function persist(next) {
    setEntries(next);
    try {
      localStorage.setItem("filtre-entries", JSON.stringify(next));
    } catch (e) {
      console.error("Erreur de sauvegarde", e);
    }
  }

  function resetForm() {
    setCategory(null);
    setSituation("");
    setEmotion("");
    setAnswers([null, null, null, null, null]);
    setTiming("avant");
    setReversible(null);
    setExitAnswer(null);
    setNoGain(false);
    setGainAmount("");
    setGainType("€");
    setRacine(null);
  }

  function setAnswer(i, value) {
    const next = [...answers];
    next[i] = value;
    setAnswers(next);
    setReversible(null);
    setExitAnswer(null);
  }

  async function saveEntry(decisionLabel) {
    const now = new Date();
    const gain = noGain ? "Aucun gain net" : gainAmount ? `${gainAmount} ${gainType}` : "";
    const racineLabel = racine ? RACINES.find((r) => r.key === racine)?.label : "";
    const entry = {
      id: now.getTime(),
      date: now.toLocaleDateString("fr-FR"),
      heure: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      categorie: cat ? cat.label : "",
      situation: situation.trim() || "(non précisé)",
      emotion: emotion.trim(),
      score,
      zone,
      decision: decisionLabel,
      gain,
      racine: racineLabel,
      suivi: NEEDS_FOLLOWUP.includes(decisionLabel) ? null : "n/a",
      timing,
    };
    await persist([entry, ...entries]);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1400);
    resetForm();
  }

  async function deleteEntry(id) {
    await persist(entries.filter((e) => e.id !== id));
  }

  async function markSuivi(id, value) {
    await persist(entries.map((e) => (e.id === id ? { ...e, suivi: value } : e)));
  }

  function requestConfirm(entry, suiviValue) {
    if (entry.racine) {
      markSuivi(entry.id, suiviValue);
    } else {
      setPendingConfirm({ id: entry.id, suivi: suiviValue });
    }
  }

  async function confirmWithRacine(racineKey) {
    if (!pendingConfirm) return;
    const racineLabel = RACINES.find((r) => r.key === racineKey)?.label || "";
    await persist(
      entries.map((e) => (e.id === pendingConfirm.id ? { ...e, suivi: pendingConfirm.suivi, racine: racineLabel } : e))
    );
    setPendingConfirm(null);
  }

  function exportCSV() {
    const header = "Date,Heure,Categorie,Situation,Emotion,Score,Zone,Decision,Gain,Racine,Suivi,Timing";
    const rows = entries.map((e) =>
      [e.date, e.heure, e.categorie, e.situation, e.emotion, e.score, e.zone, e.decision, e.gain, e.racine, e.suivi, e.timing]
        .map((v) => `"${String(v || "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `filtre-decisionnel-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function copyCSV() {
    const header = "Date | Heure | Categorie | Situation | Emotion | Score | Zone | Decision | Gain | Racine | Suivi | Timing";
    const rows = entries.map((e) =>
      [e.date, e.heure, e.categorie, e.situation, e.emotion, e.score, e.zone, e.decision, e.gain, e.racine, e.suivi, e.timing].join(" | ")
    );
    const text = [header, ...rows].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      alert("Copié — colle-le dans le chat.");
    } catch (e) {
      alert("Copie automatique impossible, utilise le téléchargement.");
    }
  }

  const needsBranch = zone === "moyen";
  let canSave = false;
  let saveAction = null;
  let saveLabel = "";

  if (zone === "refus") {
    canSave = true;
    saveAction = () => saveEntry("Refusé");
    saveLabel = "Enregistrer le refus";
  } else if (zone === "favorable") {
    canSave = true;
    saveAction = () => saveEntry("Validé");
    saveLabel = "Enregistrer la validation";
  } else if (needsBranch && reversible === true) {
    canSave = true;
    saveAction = () => saveEntry("Délai 24-72h imposé");
    saveLabel = "Enregistrer le délai";
  } else if (needsBranch && reversible === false && exitAnswer) {
    canSave = true;
    saveAction = () => saveEntry(exitAnswer === "attend" ? "Reporté (sur place)" : "Craqué (sur place)");
    saveLabel = "Enregistrer la décision";
  }

  const showGainBlock =
    canSave && (zone === "refus" || (needsBranch && (exitAnswer === "attend" || reversible === true)));
  const showRacineTag = showGainBlock;

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: PAGE_BG }}>
        <p className="font-sans text-sm" style={{ color: TEXT_MUTED }}>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans pb-10" style={{ background: PAGE_BG, color: TEXT_DARK }}>
      <style>{`
        .font-display { font-family: 'Cormorant Garamond', serif; }
        .font-sans { font-family: 'Barlow', sans-serif; }
      `}</style>

      <div
        className="px-5 pt-6 pb-4 sticky top-0 z-10"
        style={{ background: PAGE_BG, borderBottom: `2px solid ${accent}55` }}
      >
        <div className="flex items-baseline justify-between">
          <h1 className="font-display italic text-4xl font-bold" style={{ color: accent }}>
            Le Filtre
          </h1>
          <span className="text-xs font-sans" style={{ color: TEXT_MUTED }}>{todayLabel()}</span>
        </div>
        <p className="text-sm mt-1 font-sans" style={{ color: TEXT_MUTED }}>Avant d'agir, 10 secondes.</p>
      </div>

      <div className="px-5 pt-5 space-y-4 max-w-md mx-auto">
        {(() => {
          const pending = entries.filter(
            (e) => NEEDS_FOLLOWUP.includes(e.decision) && (e.suivi === null || e.suivi === undefined)
          );
          if (pending.length === 0) return null;
          return (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "#F3E6C8", border: "2px solid #B9872E" }}>
              <p className="text-sm font-bold font-sans flex items-center gap-2" style={{ color: "#8A5E1E" }}>
                <Clock size={16} /> {pending.length} décision{pending.length > 1 ? "s" : ""} en attente de confirmation
              </p>
              <div className="space-y-2">
                {pending.map((e) => {
                  const asking = pendingConfirm && pendingConfirm.id === e.id;
                  return (
                    <div key={e.id} className="rounded-xl px-3.5 py-3" style={{ background: CREAM, border: "1px solid #E3D6AD" }}>
                      <p className="text-xs mb-0.5" style={{ color: TEXT_MUTED }}>{e.date} · {e.decision}</p>
                      <p className="text-sm font-medium mb-2" style={{ color: TEXT_DARK }}>{e.situation}</p>

                      {!asking && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => requestConfirm(e, "fait")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold font-sans"
                            style={{ background: "#2F7A50", color: "#FFFBF2" }}
                          >
                            <Check size={13} strokeWidth={3} /> Fait
                          </button>
                          <button
                            onClick={() => requestConfirm(e, "pas_fait")}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold font-sans"
                            style={{ background: NON_COLOR, color: "#FFFBF2" }}
                          >
                            <X size={13} strokeWidth={3} /> Pas fait
                          </button>
                        </div>
                      )}

                      {asking && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-xs font-bold font-sans" style={{ color: TEXT_MUTED }}>
                            {pendingConfirm.suivi === "fait"
                              ? "Il y a eu de la friction avant de le faire ?"
                              : "Qu'est-ce qui a bloqué ?"}
                          </p>
                          {RACINES.map((r) => (
                            <button
                              key={r.key}
                              onClick={() => confirmWithRacine(r.key)}
                              className="w-full text-left px-3 py-2 rounded-lg text-xs font-sans font-medium"
                              style={{ border: `1.5px solid ${BORDER}`, color: TEXT_DARK }}
                            >
                              {r.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <input
          type="text"
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder="C'est quoi ? (ex: verre avec collègue)"
          className="w-full rounded-xl px-4 py-3.5 text-base outline-none transition-colors font-sans"
          style={{ background: CREAM, border: `2px solid ${BORDER}`, color: TEXT_DARK }}
        />

        <div>
          <p className="text-xs uppercase tracking-wide font-sans font-bold mb-2" style={{ color: TEXT_MUTED }}>
            C'est quel type de décision ?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(CATEGORIES).map(([key, c]) => {
              const selected = category === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setCategory(key);
                    setAnswers([null, null, null, null, null]);
                    setReversible(null);
                    setExitAnswer(null);
                    setNoGain(false);
                    setRacine(null);
                  }}
                  className="flex flex-col items-center gap-1.5 py-4 rounded-xl transition-all duration-200"
                  style={{
                    background: selected ? c.tint : CREAM,
                    border: `2px solid ${selected ? c.accent : BORDER}`,
                    boxShadow: selected ? `0 3px 10px ${c.accent}44` : "0 1px 3px rgba(0,0,0,0.04)",
                    transform: selected ? "scale(1.04)" : "scale(1)",
                  }}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-xs font-bold font-sans" style={{ color: selected ? c.accent : TEXT_MUTED }}>
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {category && (
          <>
            <div className="flex flex-wrap gap-2">
              {["Envie", "Stress", "Ennui", "Fatigue", "Impulsion"].map((tag) => {
                const selected = emotion === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => setEmotion(selected ? "" : tag)}
                    className="text-xs px-3.5 py-2 rounded-full font-bold font-sans transition-all duration-150"
                    style={{
                      background: selected ? accent : "transparent",
                      border: `2px solid ${selected ? accent : BORDER}`,
                      color: selected ? "#FFFBF2" : TEXT_MUTED,
                      transform: selected ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-sans" style={{ color: TEXT_MUTED }}>Rempli :</span>
              <button
                onClick={() => setTiming("avant")}
                className="text-xs px-3 py-1.5 rounded-full font-bold font-sans"
                style={
                  timing === "avant"
                    ? { background: accent, color: "#FFFBF2" }
                    : { border: `1.5px solid ${BORDER}`, color: TEXT_MUTED }
                }
              >
                Avant l'action
              </button>
              <button
                onClick={() => setTiming("apres")}
                className="text-xs px-3 py-1.5 rounded-full font-bold font-sans"
                style={
                  timing === "apres"
                    ? { background: NON_COLOR, color: "#FFFBF2" }
                    : { border: `1.5px solid ${BORDER}`, color: TEXT_MUTED }
                }
              >
                Après coup
              </button>
            </div>

            {!allAnswered && (
              <div
                className="rounded-xl px-4 py-2.5 flex items-center justify-between"
                style={{ background: CREAM, border: `2px solid ${accent}55` }}
              >
                <span className="text-xs font-sans" style={{ color: TEXT_MUTED }}>Réponds aux 5 questions pour voir le résultat</span>
                <span className="text-xs font-bold font-sans" style={{ color: accent }}>{answeredCount}/5</span>
              </div>
            )}

            <div className="space-y-2.5">
              {questions.map((q, i) => (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3.5 transition-all duration-150"
                  style={{ background: CREAM, border: `2px solid ${answers[i] !== null ? accent : BORDER}` }}
                >
                  <p className="text-sm leading-snug mb-2.5 font-sans font-medium" style={{ color: TEXT_DARK }}>{q}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAnswer(i, true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold font-sans transition-all duration-150"
                      style={
                        answers[i] === true
                          ? { background: accent, border: `2px solid ${accent}`, color: "#FFFBF2", boxShadow: `0 2px 8px ${accent}55`, transform: "scale(1.02)" }
                          : { border: `2px solid ${BORDER}`, color: TEXT_MUTED }
                      }
                    >
                      <Check size={15} strokeWidth={3} /> Oui
                    </button>
                    <button
                      onClick={() => setAnswer(i, false)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold font-sans transition-all duration-150"
                      style={
                        answers[i] === false
                          ? { background: NON_COLOR, border: `2px solid ${NON_COLOR}`, color: "#FFFBF2", boxShadow: `0 2px 8px ${NON_COLOR}55`, transform: "scale(1.02)" }
                          : { border: `2px solid ${BORDER}`, color: TEXT_MUTED }
                      }
                    >
                      <X size={15} strokeWidth={3} /> Non
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {allAnswered && (
              <>
                <div className="rounded-2xl p-4" style={{ background: CREAM, border: `2px solid ${zStyle.color}66` }}>
                  <div className="flex gap-1.5 mb-3">
                    {questions.map((_, i) => (
                      <div
                        key={i}
                        className="h-3 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i < score ? zStyle.color : BORDER }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-display italic text-3xl font-bold" style={{ color: zStyle.color }}>
                      {zStyle.label}
                    </span>
                    <span className="text-sm font-bold font-sans" style={{ color: TEXT_MUTED }}>{score}/5</span>
                  </div>
                </div>

                {needsBranch && (
                  <div className="rounded-2xl p-4 space-y-3" style={{ background: CREAM, border: "2px solid #C97C1F66" }}>
                    <p className="text-xs uppercase tracking-wide font-sans font-bold" style={{ color: "#C97C1F" }}>
                      Contexte de la situation
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setReversible(true); setExitAnswer(null); }}
                        className="flex-1 text-sm py-3 rounded-lg font-bold font-sans transition-all duration-150"
                        style={
                          reversible === true
                            ? { background: "#C97C1F", border: "2px solid #C97C1F", color: "#FFFBF2", transform: "scale(1.02)" }
                            : { border: `2px solid ${BORDER}`, color: TEXT_MUTED }
                        }
                      >
                        Réversible / annulable
                      </button>
                      <button
                        onClick={() => setReversible(false)}
                        className="flex-1 text-sm py-3 rounded-lg font-bold font-sans transition-all duration-150"
                        style={
                          reversible === false
                            ? { background: "#C97C1F", border: "2px solid #C97C1F", color: "#FFFBF2", transform: "scale(1.02)" }
                            : { border: `2px solid ${BORDER}`, color: TEXT_MUTED }
                        }
                      >
                        Sur place, maintenant
                      </button>
                    </div>

                    {reversible === true && (
                      <div className="flex items-center gap-2 text-sm rounded-lg px-3 py-3 font-sans" style={{ background: PAGE_BG, color: TEXT_DARK }}>
                        <Clock size={16} style={{ color: "#C97C1F" }} className="shrink-0" />
                        Attends 24 à 72h avant de trancher.
                      </div>
                    )}

                    {reversible === false && (
                      <div className="space-y-2">
                        <p className="text-sm leading-snug font-sans" style={{ color: TEXT_DARK }}>
                          Si je dis non maintenant, est-ce que je perds vraiment l'opportunité — ou je peux revenir avec la tête froide ?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setExitAnswer("attend")}
                            className="flex-1 text-sm py-3 rounded-lg font-bold font-sans transition-all duration-150"
                            style={
                              exitAnswer === "attend"
                                ? { background: "#2F7A50", border: "2px solid #2F7A50", color: "#FFFBF2", transform: "scale(1.02)" }
                                : { border: `2px solid ${BORDER}`, color: TEXT_MUTED }
                            }
                          >
                            Je peux revenir
                          </button>
                          <button
                            onClick={() => setExitAnswer("craque")}
                            className="flex-1 text-sm py-3 rounded-lg font-bold font-sans transition-all duration-150"
                            style={
                              exitAnswer === "craque"
                                ? { background: "#B23A31", border: "2px solid #B23A31", color: "#FFFBF2", transform: "scale(1.02)" }
                                : { border: `2px solid ${BORDER}`, color: TEXT_MUTED }
                            }
                          >
                            Je craque quand même
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {showRacineTag && (
                  <div className="rounded-2xl p-4 space-y-2" style={{ background: CREAM, border: `2px solid ${BORDER}` }}>
                    <p className="text-xs uppercase tracking-wide font-sans font-bold" style={{ color: TEXT_MUTED }}>
                      Honnêtement, c'était quoi la vraie raison ?
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {RACINES.map((r) => {
                        const selected = racine === r.key;
                        return (
                          <button
                            key={r.key}
                            onClick={() => setRacine(selected ? null : r.key)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-sans font-medium transition-all duration-150"
                            style={
                              selected
                                ? { background: r.key === "sain" ? "#2F7A50" : accent, border: `2px solid ${r.key === "sain" ? "#2F7A50" : accent}`, color: "#FFFBF2" }
                                : { border: `2px solid ${BORDER}`, color: TEXT_DARK }
                            }
                          >
                            {r.label}
                            {selected && <Check size={15} strokeWidth={3} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {showGainBlock && (
                  <div className="rounded-2xl p-4 space-y-2 font-sans" style={{ background: CREAM, border: `2px solid ${BORDER}` }}>
                    <p className="text-xs uppercase tracking-wide font-bold" style={{ color: TEXT_MUTED }}>
                      {cat.gainLabel} : ça t'a évité quoi ?
                    </p>
                    <button
                      onClick={() => setNoGain(!noGain)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg font-medium transition-colors"
                      style={{
                        background: noGain ? NON_COLOR : "transparent",
                        border: `1px solid ${noGain ? NON_COLOR : BORDER}`,
                        color: noGain ? "#FFFBF2" : TEXT_MUTED,
                      }}
                    >
                      {noGain ? "✓ Aucun gain net — juste évité l'inconfort" : "Pas de gain net, juste évité l'inconfort ?"}
                    </button>
                    {!noGain && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={gainAmount}
                          onChange={(e) => setGainAmount(e.target.value)}
                          placeholder={cat.gainPlaceholder}
                          className="w-28 rounded-lg px-3 py-2 text-sm outline-none"
                          style={{ background: PAGE_BG, border: `1px solid ${BORDER}`, color: TEXT_DARK }}
                        />
                        <div className="flex gap-1 flex-1">
                          {GAIN_TYPES.map((t) => (
                            <button
                              key={t}
                              onClick={() => setGainType(t)}
                              className="flex-1 text-xs py-2 rounded-lg font-medium transition-colors"
                              style={
                                gainType === t
                                  ? { background: accent, border: `1px solid ${accent}`, color: "#FFFBF2" }
                                  : { border: `1px solid ${BORDER}`, color: TEXT_MUTED }
                              }
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {canSave && (
                  <button
                    onClick={saveAction}
                    className="w-full font-display italic font-bold text-2xl py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    style={{ background: accent, color: "#FFFBF2", boxShadow: `0 4px 16px ${accent}66` }}
                  >
                    <Sparkles size={20} />
                    {saveLabel}
                  </button>
                )}

                {savedFlash && (
                  <div className="text-center text-sm font-semibold font-sans" style={{ color: "#2F7A50" }}>Enregistré ✓</div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className="px-5 pt-8 max-w-md mx-auto">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between text-sm font-semibold font-sans py-2"
          style={{ color: TEXT_MUTED }}
        >
          <span>Historique ({entries.length})</span>
          {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showHistory && (
          <div className="space-y-2 mt-2">
            {entries.length === 0 && (
              <p className="text-sm py-4 text-center font-sans" style={{ color: TEXT_MUTED }}>Rien encore. Ton premier passage sera là.</p>
            )}
            {entries.map((e) => (
              <div key={e.id} className="rounded-xl px-4 py-3 flex items-start justify-between gap-3 font-sans" style={{ background: CREAM, border: `1px solid ${BORDER}` }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs mb-1 flex-wrap" style={{ color: TEXT_MUTED }}>
                    <span>{e.date} · {e.heure}</span>
                    <span className="px-1.5 py-0.5 rounded font-semibold" style={{ background: ZONE_STYLE[e.zone].color, color: "#FFFBF2" }}>
                      {e.score}/5
                    </span>
                    {e.categorie && <span>{e.categorie}</span>}
                    {e.racine && <span style={{ color: e.racine.includes("sain") ? "#2F7A50" : "#C97C1F" }}>· {e.racine}</span>}
                    {e.suivi === "fait" && <span style={{ color: "#2F7A50" }}>✓ fait</span>}
                    {e.suivi === "pas_fait" && <span style={{ color: "#B23A31" }}>✗ pas fait</span>}
                    {(e.suivi === null || e.suivi === undefined) && NEEDS_FOLLOWUP.includes(e.decision) && (
                      <span style={{ color: "#B9872E" }}>⏳ à confirmer</span>
                    )}
                    {e.timing === "apres" && <span style={{ color: TEXT_MUTED }}>· rempli après coup</span>}
                  </div>
                  <p className="text-sm truncate" style={{ color: TEXT_DARK }}>{e.situation}</p>
                  <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
                    {e.decision}{e.gain ? ` · ${e.gain}` : ""}{e.emotion ? ` · ${e.emotion}` : ""}
                  </p>
                </div>
                <button onClick={() => deleteEntry(e.id)} className="shrink-0 p-1" style={{ color: TEXT_MUTED }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {entries.length > 0 && (
              <div className="flex gap-2 pt-2 font-sans">
                <button
                  onClick={exportCSV}
                  className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
                >
                  <Download size={15} /> Télécharger CSV
                </button>
                <button
                  onClick={copyCSV}
                  className="flex-1 flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg"
                  style={{ border: `1px solid ${BORDER}`, color: TEXT_DARK }}
                >
                  <Copy size={15} /> Copier
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
