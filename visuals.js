// Visuels de fond (essai) : chaque valeur de carte reçoit une teinte et un motif qui donnent une piste visuelle.
// Un descripteur = { tint, dark, layers: [[image, taille, répétition, position], …] } (le premier calque est au-dessus).
// visualFor(catId, item, repere) renvoie le descripteur d'une carte, ou null s'il n'y en a pas.

const visualFor = (() => {
  const DK = "22,21,19";
  const LT = "239,232,214";
  const CREAM = "#efe8d6";
  const a = (alpha, rgb = DK) => `rgba(${rgb},${alpha})`;

  // ---------- Briques ----------

  const svg = (w, h, body, fit = "none") =>
    `url("data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' preserveAspectRatio='${fit}'>` +
        `<style>*{vector-effect:non-scaling-stroke}</style>${body}</svg>`
    )}")`;

  const flat = (image, pos = "0 0") => [image, "auto", "no-repeat", pos]; // dégradés CSS plein cadre
  const tile = (image, size, pos = "0 0") => [image, size, "repeat", pos]; // motif répété
  const shape = (image, size = "100% 100%", pos = "center") => [image, size, "no-repeat", pos]; // forme plein cadre

  const vbars = (gap, w, alpha, rgb = DK, pos) =>
    flat(`repeating-linear-gradient(90deg, ${a(alpha, rgb)} 0 ${w}px, transparent ${w}px ${gap}px)`, pos);
  const hbars = (gap, h, alpha, rgb = DK) =>
    flat(`repeating-linear-gradient(180deg, ${a(alpha, rgb)} 0 ${h}px, transparent ${h}px ${gap}px)`);
  const diag = (gap, w, alpha, rgb = DK) =>
    flat(`repeating-linear-gradient(45deg, ${a(alpha, rgb)} 0 ${w}px, transparent ${w}px ${gap}px)`);
  const grid = (gap, w, alpha, rgb = DK) => [
    vbars(gap, w, alpha, rgb),
    hbars(gap, w, alpha, rgb),
  ];
  const dots = (gap, r, alpha, rgb = DK) =>
    tile(svg(gap, gap, `<circle cx='${gap / 2}' cy='${gap / 2}' r='${r}' fill='${a(alpha, rgb)}'/>`, "xMidYMid meet"), `${gap}px ${gap}px`);
  const noise = (opacity, light = false) =>
    tile(
      svg(
        140,
        140,
        `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/>` +
          `<feColorMatrix values='0 0 0 0 ${light ? 0.94 : 0.09}  0 0 0 0 ${light ? 0.91 : 0.08}  0 0 0 0 ${light ? 0.84 : 0.07}  0 0 0 1.2 -0.15'/></filter>` +
          `<rect width='140' height='140' filter='url(#n)' opacity='${opacity}'/>`
      ),
      "140px 140px"
    );

  // générateur pseudo-aléatoire reproductible (même valeur → même motif)
  const hash = (str) => {
    let h = 2166136261;
    for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
  };
  const rng = (seed) => {
    let s = seed >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // Un calque est un tableau dont le premier élément est une chaîne ; sinon on aplatit.
  const norm = (x) => (Array.isArray(x) && typeof x[0] === "string" ? [x] : x.flatMap(norm));
  const D = (tint, layers, dark = false) => ({ tint, dark, layers: layers.flatMap(norm) });

  // Grille de pas (batterie, clave…) : rows = { x: coup, o: coup léger, ".": silence }
  const steps = (rows, steps) => {
    const r = 4;
    const gapX = 100 / steps;
    const gapY = 100 / (rows.length + 1);
    let body = "";
    rows.forEach((row, i) => {
      [...row].forEach((c, j) => {
        const cx = gapX * (j + 0.5);
        const cy = gapY * (i + 1);
        if (c === "x") body += `<circle cx='${cx}' cy='${cy}' r='${r}' fill='${a(0.5)}'/>`;
        else if (c === "o") body += `<circle cx='${cx}' cy='${cy}' r='${r * 0.6}' fill='${a(0.3)}'/>`;
        else body += `<circle cx='${cx}' cy='${cy}' r='1' fill='${a(0.18)}'/>`;
      });
    });
    return shape(svg(100, 100, body, "xMidYMid meet"), "88% 88%", "center");
  };

  // ---------- Atmosphère ----------

  const atm = {
    "Éthérée": D("#e3edf5", [flat("radial-gradient(circle at 25% 20%, rgba(255,255,255,.95), transparent 55%), linear-gradient(160deg, #d9e8f4, #f1f6fa)")]),
    "Tendue": D("#4a1614", [diag(18, 1, 0.1, LT), flat("linear-gradient(180deg, #2e0c0c, #7c2a20)")], true),
    "Onirique": D("#eadff5", [flat("radial-gradient(circle at 75% 25%, #e9d6f7, transparent 55%), radial-gradient(circle at 20% 80%, #cfe4f6, transparent 55%), #f1eaf8")]),
    "Mystérieuse": D("#23264a", [flat("radial-gradient(circle at 70% 30%, #4a4f8a, transparent 60%), #1f2244")], true),
    "Mélancolique": D("#aebccb", [flat("linear-gradient(180deg, #bcc8d4, #8f9fb2)")]),
    "Épique": D("#e9a948", [flat("linear-gradient(160deg, #f5cc74, #d9772a)")]),
    "Lugubre": D("#161616", [noise(0.35, true), flat("linear-gradient(180deg, #1c1c1c, #0f0f0f)")], true),
    "Joyeuse": D("#f6df6c", [dots(14, 2.2, 0.22), flat("linear-gradient(160deg, #f8e57d, #f3d24e)")]),
    "Fantastique": D("#d6b6ef", [dots(30, 1.3, 0.55, LT), flat("linear-gradient(135deg, #d3b8f2, #f7c9de)")]),
    "Urbaine": D("#b9b8b3", [grid(22, 1, 0.12), noise(0.3), flat("linear-gradient(180deg, #c3c2bd, #a9a8a3)")]),
    "Tribal / Organique": D("#c4874b", [
      tile(svg(24, 12, `<path d='M0 10 L6 2 L12 10 L18 2 L24 10' fill='none' stroke='${a(0.32)}' stroke-width='1.5'/>`, "xMidYMid meet"), "24px 12px"),
      flat("linear-gradient(180deg, #cf9657, #b87a40)"),
    ]),
  };

  // ---------- Texture ----------

  const wave = (rowH, paths) =>
    tile(svg(80, rowH, paths.map((d) => `<path d='${d}' fill='none' stroke='${a(0.4)}' stroke-width='1.4'/>`).join(""), "xMidYMid meet"), `80px ${rowH}px`);

  const tex = {
    "Drone": D("#e4dccb", [hbars(70, 34, 0.14)]),
    "Granulaire": D("#e8e1d0", [dots(6, 0.9, 0.45)]),
    "Hétérophonique": D("#e9e2d2", [wave(60, ["M0 20 Q20 8 40 20 T80 20", "M0 26 Q20 14 40 26 T80 26", "M0 32 Q20 22 40 32 T80 32"])]),
    "Polyphonique": D("#e9e2d2", [wave(66, ["M0 14 Q20 4 40 14 T80 14", "M0 28 Q20 40 40 28 T80 28", "M0 44 Q20 32 40 44 T80 44", "M0 58 Q20 50 40 58 T80 58"])]),
    "Monophonique": D(CREAM, [flat(`linear-gradient(180deg, transparent calc(50% - .75px), ${a(0.55)} calc(50% - .75px) calc(50% + .75px), transparent calc(50% + .75px))`)]),
    "Homophonique": D("#ebe4d2", [tile(svg(44, 26, [0, 1, 2].map((i) => `<rect x='3' y='${3 + i * 8}' width='38' height='4' fill='${a(0.2)}'/>`).join(""), "xMidYMid meet"), "44px 26px")]),
    "Rugueuse": D("#d9d0bc", [noise(0.75)]),
    "Lisse": D(CREAM, [flat("linear-gradient(180deg, #f6f0df, #e6dec9)")]),
    "Fragmentée": (() => {
      const r = rng(hash("Fragmentée"));
      let body = "";
      for (let i = 0; i < 26; i++) body += `<rect x='${(r() * 90).toFixed(1)}' y='${(r() * 90).toFixed(1)}' width='${(4 + r() * 14).toFixed(1)}' height='${(2 + r() * 7).toFixed(1)}' fill='${a(0.14 + r() * 0.24)}'/>`;
      return D("#e8e1d0", [shape(svg(100, 100, body))]);
    })(),
    "En nappes": D("#e5ddd0", [flat("radial-gradient(ellipse at 50% 20%, rgba(160,140,110,.35), transparent 60%), radial-gradient(ellipse at 40% 85%, rgba(120,150,170,.35), transparent 60%), linear-gradient(180deg, #ebe4d4, #e0d8c8)")]),
    "Percussive": D("#ece5d3", [dots(16, 3.2, 0.35)]),
  };

  // ---------- Couleur ----------

  const col = {
    "Chaleureuse": D("#e8b57c", [flat("linear-gradient(160deg, #f0c58f, #dc9a5c)")]),
    "Froide": D("#bdd1e2", [flat("linear-gradient(160deg, #cfdeeb, #a9c0d6)")]),
    "Saturée": D("#c9402b", [noise(0.4, true), flat("linear-gradient(160deg, #d8472f, #b53724)")], true),
    "Sombre": D("#2a2a2f", [flat("linear-gradient(180deg, #34343a, #1d1d21)")], true),
    "Claire": D("#f7f3e4", [flat("linear-gradient(180deg, #fbf8ec, #f1ecd9)")]),
    "Transparente": D("#f1f5f5", [hbars(8, 1, 0.07), flat("linear-gradient(180deg, #f6f9f9, #ebf1f1)")]),
    "Mate": D("#bcb7ad", [noise(0.25), flat("linear-gradient(180deg, #c3beb4, #b3aea4)")]),
    "Brillante": D("#f6df7a", [flat("radial-gradient(circle at 70% 25%, rgba(255,255,255,.9), transparent 45%), linear-gradient(160deg, #f9e78f, #f1d160)")]),
    "Boisée": D("#a67a52", [flat("repeating-linear-gradient(96deg, rgba(60,35,15,.16) 0 2px, transparent 2px 9px), linear-gradient(180deg, #b0835a, #9a6f48)")]),
    "Métallique": D("#9aa1a8", [flat("linear-gradient(135deg, #8f979e, #dfe3e6 45%, #9aa1a8 60%, #d5d9dc)")]),
  };

  // ---------- Rythme ----------

  const barsShape = (seed, count, minH, maxH, alpha, gapChance = 0) => {
    const r = rng(hash(seed));
    let body = "";
    const w = 100 / count;
    for (let i = 0; i < count; i++) {
      if (r() < gapChance) continue;
      const h = minH + r() * (maxH - minH);
      body += `<rect x='${(i * w + w * 0.2).toFixed(2)}' y='${(100 - h).toFixed(1)}' width='${(w * 0.6).toFixed(2)}' height='${h.toFixed(1)}' fill='${a(alpha)}'/>`;
    }
    return shape(svg(100, 100, body));
  };

  const rhy = {
    "Droit / régulier": D(CREAM, [vbars(16, 3, 0.28)]),
    "Syncopé": D(CREAM, [vbars(32, 3, 0.3), vbars(32, 3, 0.12, DK, "11px 0")]),
    "Shuffle": D(CREAM, [tile(svg(36, 40, `<rect x='0' y='0' width='11' height='40' fill='${a(0.26)}'/><rect x='22' y='0' width='5' height='40' fill='${a(0.26)}'/>`, "none"), "36px 40px")]),
    "Motorik": D(CREAM, [vbars(8, 2, 0.3)]),
    "Brisé / Breakbeat": D(CREAM, [barsShape("break", 14, 20, 100, 0.26, 0.2)]),
    "Half-time": D(CREAM, [vbars(60, 8, 0.22)]),
    "Polyrythmique": D(CREAM, [vbars(20, 2, 0.3), vbars(30, 2, 0.2)]),
    "Tribal": D(CREAM, [tile(svg(36, 36, [6, 12, 17].map((r) => `<circle cx='18' cy='18' r='${r}' fill='none' stroke='${a(0.26)}' stroke-width='1.4'/>`).join(""), "xMidYMid meet"), "36px 36px")]),
    "Glitché": D(CREAM, [barsShape("glitch", 22, 6, 40, 0.3, 0.35)]),
    "Libre": D(CREAM, [flat("linear-gradient(90deg, #f3ecda, #e3dbc6)")]),
    "Lent / lourd": D(CREAM, [vbars(90, 26, 0.22)]),
    "Minimaliste": D(CREAM, [vbars(120, 1.5, 0.4)]),
  };

  // ---------- Structure ----------

  const poly = (d, fill, stroke) => `<path d='${d}' fill='${fill || "none"}' stroke='${stroke || "none"}' stroke-width='1.6' stroke-linejoin='round' stroke-linecap='round'/>`;
  const rect = (x, y, w, h, alpha) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' fill='${a(alpha)}'/>`;

  const str = {
    "Boucle évolutive": D(CREAM, [shape(svg(100, 100, [8, 15, 22, 29, 36, 43].map((r, i) => `<circle cx='${50 + i * 0.8}' cy='${50 - i * 0.6}' r='${r}' fill='none' stroke='${a(0.12 + i * 0.04)}' stroke-width='1.4'/>`).join(""), "xMidYMid meet"), "100% 100%")]),
    "Montée / chute": D(CREAM, [shape(svg(100, 100, poly("M0 92 L68 14 L68 92 L100 92 Z", a(0.16))))]),
    "Arche": D(CREAM, [shape(svg(100, 100, poly("M0 92 Q50 -22 100 92", null, a(0.4))))]),
    "Couplet / refrain": D(CREAM, [shape(svg(100, 100, [0, 1, 2, 3, 4, 5].map((i) => rect(i * 16.66, 68, 16.66, 32, i % 2 ? 0.3 : 0.12)).join("")))]),
    "Crescendo unique": D(CREAM, [shape(svg(100, 100, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => rect(i * 10 + 1.5, 100 - (8 + i * 8.5), 7, 8 + i * 8.5, 0.12 + i * 0.03)).join("")))]),
    "Dissolution": D(CREAM, [flat(`linear-gradient(90deg, transparent 0, ${CREAM} 95%)`), dots(10, 2.4, 0.38)]),
    "Collage": (() => {
      const r = rng(hash("Collage"));
      let body = "";
      for (let i = 0; i < 7; i++) body += rect((r() * 70).toFixed(1), (r() * 70).toFixed(1), (14 + r() * 28).toFixed(1), (10 + r() * 26).toFixed(1), 0.1 + r() * 0.2);
      return D(CREAM, [shape(svg(100, 100, body))]);
    })(),
    "Rondo": D(CREAM, [shape(svg(100, 100, [0.34, 0.12, 0.34, 0.2, 0.34].map((al, i) => rect(i * 20, 70, 20, 30, al)).join("")))]),
    "Un seul état": D("#e7dfcb", [flat("linear-gradient(#e7dfcb, #e7dfcb)")]),
    "Récit": D(CREAM, [shape(svg(100, 100, poly("M0 82 C28 82 40 66 55 22 C66 -6 80 62 100 86", null, a(0.4))))]),
    "Miniatures": D(CREAM, [tile(svg(20, 20, `<rect x='3' y='3' width='13' height='13' fill='none' stroke='${a(0.28)}' stroke-width='1.2'/>`, "none"), "20px 20px")]),
    "Dialogue": D(CREAM, [tile(svg(44, 22, rect(0, 2, 26, 6, 0.3) + rect(16, 13, 26, 6, 0.14), "none"), "44px 22px")]),
  };

  // ---------- Durée ----------

  const bar = (pct) => [`linear-gradient(90deg, ${a(0.5)} 0 ${pct}%, transparent ${pct}%)`, "100% 10px", "no-repeat", "0 100%"];
  const dur = {
    "Miniature": D(CREAM, [bar(8)]),
    "Court": D(CREAM, [bar(20)]),
    "Format chanson": D(CREAM, [bar(38)]),
    "Long": D(CREAM, [bar(60)]),
    "Étendu": D(CREAM, [bar(82)]),
    "Sans fin": D(CREAM, [[`linear-gradient(90deg, ${a(0.5)} 0, ${a(0.5)} 70%, transparent)`, "100% 10px", "no-repeat", "0 100%"]]),
  };

  // ---------- Espace ----------

  const circle = (cx, cy, r, alpha, stroke) =>
    `<circle cx='${cx}' cy='${cy}' r='${r}' fill='${stroke ? "none" : a(alpha)}' ${stroke ? `stroke='${a(alpha)}' stroke-width='1.4'` : ""}/>`;
  const fit = (body) => shape(svg(100, 100, body, "xMidYMid meet"), "100% 100%");
  const bandY = (y, h, alpha) => rect(0, y, 100, h, alpha);

  const dotsRow = (xs, y, r, alpha) => xs.map((x) => circle(x, y, r, alpha)).join("");
  const rr = rng(hash("espace"));

  const esp = {
    // Position dans l'espace
    "Dans la tête": D(CREAM, [fit(circle(50, 50, 5, 0.55) + circle(50, 50, 24, 0.22, true) + circle(50, 50, 38, 0.12, true))]),
    "Tout près de l'oreille": D(CREAM, [fit(circle(104, 50, 58, 0.14) + circle(104, 50, 38, 0.2) + circle(104, 50, 18, 0.3))]),
    "À bout de bras": D(CREAM, [fit(circle(50, 55, 22, 0.24) + circle(50, 55, 34, 0.1))]),
    "Très loin": D(CREAM, [fit(rect(0, 56, 100, 0.8, 0.25) + circle(84, 48, 2.6, 0.4))]),
    "Tout autour": D(CREAM, [fit([14, 26, 38, 50].map((r, i) => circle(50, 50, r, 0.12 + i * 0.04, true)).join("") + circle(50, 50, 4, 0.5) + dotsRow([8, 92], 50, 2.4, 0.4) + dotsRow([50], 8, 2.4, 0.4) + dotsRow([50], 92, 2.4, 0.4))]),
    "Large": D(CREAM, [fit(`<ellipse cx='50' cy='50' rx='48' ry='9' fill='${a(0.2)}'/><ellipse cx='50' cy='50' rx='30' ry='5' fill='${a(0.2)}'/>`)]),
    "Étroit": D(CREAM, [fit(rect(47, 0, 6, 100, 0.22))]),
    "Au-dessus de soi": D(CREAM, [fit(circle(50, 6, 24, 0.2) + circle(50, 6, 12, 0.28))]),
    "Qui s'approche": D(CREAM, [fit([[10, 52, 2.5, 0.2], [26, 52, 5, 0.24], [44, 52, 9, 0.28], [68, 52, 15, 0.32]].map((c) => circle(...c)).join(""))]),
    "Qui s'éloigne": D(CREAM, [fit([[32, 52, 15, 0.32], [56, 52, 9, 0.28], [74, 52, 5, 0.24], [90, 52, 2.5, 0.2]].map((c) => circle(...c)).join(""))]),
    "Derrière une vitre": D(CREAM, [fit(`<rect x='14' y='14' width='72' height='72' fill='rgba(255,255,255,.35)' stroke='${a(0.35)}' stroke-width='1.4'/>` + circle(50, 52, 16, 0.12) + circle(50, 52, 8, 0.12))]),
    "Plans étagés": D(CREAM, [fit(circle(24, 70, 18, 0.3) + circle(58, 56, 11, 0.2) + circle(82, 46, 5, 0.12))]),
    // Silence
    "Beaucoup de vide": D(CREAM, [fit(dotsRow([14, 52, 90], 48, 2.4, 0.4))]),
    "Goutte à goutte": D(CREAM, [fit(dotsRow([8, 30, 38, 66, 90], 30, 2.2, 0.38) + dotsRow([18, 54, 78], 70, 2.2, 0.38))]),
    "Respirations": D(CREAM, [fit([0, 1, 2, 3].map((i) => rect(6 + i * 24, 44, 14, 12, 0.28)).join(""))]),
    "Trous": D(CREAM, [fit([0, 1, 2, 3, 4, 5, 6, 7].filter((i) => ![2, 3, 6].includes(i)).map((i) => rect(2 + i * 12, 40, 9, 20, 0.28)).join(""))]),
    "Silence au milieu": D(CREAM, [fit([0, 1, 2].map((i) => rect(4 + i * 14, 40, 10, 20, 0.28)).join("") + [0, 1, 2].map((i) => rect(58 + i * 14, 40, 10, 20, 0.28)).join(""))]),
    "Plein": D(CREAM, [dots(8, 2.4, 0.32)]),
    // Fréquences
    "Tout dans le grave": D(CREAM, [fit(bandY(66, 34, 0.26))]),
    "Tout dans l'aigu": D(CREAM, [fit(bandY(0, 34, 0.2))]),
    "Rien au milieu": D(CREAM, [fit(bandY(0, 24, 0.2) + bandY(76, 24, 0.26))]),
    "Chacun sa bande": D(CREAM, [fit(bandY(4, 20, 0.12) + bandY(40, 20, 0.2) + bandY(76, 20, 0.3))]),
    "Tout au même endroit": D(CREAM, [fit(bandY(34, 32, 0.12) + bandY(38, 26, 0.12) + bandY(42, 20, 0.14) + bandY(46, 12, 0.16))]),
    "Du grave à l'aigu": D(CREAM, [flat("linear-gradient(0deg, rgba(22,21,19,.3), rgba(22,21,19,.02))")]),
    // Dynamique
    "Du murmure à l'éclat": D(CREAM, [fit([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => rect(i * 10 + 1.5, 100 - (6 + i * 9), 7, 6 + i * 9, 0.14 + i * 0.03)).join(""))]),
    "Très doux": D(CREAM, [fit([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => rect(i * 10 + 1.5, 90, 7, 10, 0.2)).join(""))]),
    "Très fort": D(CREAM, [fit([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => rect(i * 10 + 1.5, 8, 7, 92, 0.3)).join(""))]),
    "Par paliers": D(CREAM, [fit([0, 1, 2, 3, 4].map((i) => rect(i * 20, 100 - (20 + i * 16), 20, 20 + i * 16, 0.14 + i * 0.04)).join(""))]),
    "Écrasé": D(CREAM, [fit([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => rect(i * 10 + 1.5, 54, 7, 46, 0.28)).join(""))]),
    "Par vagues": D(CREAM, [fit([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => { const h = 14 + 34 * (0.5 + 0.5 * Math.sin(i * 0.72)); return rect(i * 8.33 + 1, 100 - h, 6, h, 0.26); }).join(""))]),
  };

  // ---------- Mouvement ----------

  const line = (d, alpha = 0.4) => poly(d, null, a(alpha));
  const mou = {
    "Par petits pas": D(CREAM, [fit(line("M6 84 L6 74 L18 74 L18 64 L30 64 L30 54 L42 54 L42 44 L54 44 L54 34 L66 34 L66 24 L78 24 L78 14 L92 14"))]),
    "Par grands sauts": D(CREAM, [fit(line("M6 84 L30 18 L48 78 L70 12 L94 70"))]),
    "Côte à côte": D(CREAM, [fit(line("M10 82 L90 22") + line("M10 62 L90 2") + line("M10 98 L90 38", 0.25))]),
    "Dans le même sens": D(CREAM, [fit(line("M10 82 L90 18") + line("M10 62 L90 40"))]),
    "À contre-sens": D(CREAM, [fit(line("M10 84 L90 16") + line("M10 16 L90 84"))]),
    "Une bouge, l'autre reste": D(CREAM, [fit(line("M6 62 L94 62") + line("M6 36 Q22 10 38 36 T70 36 T98 36"))]),
    "Tout immobile": D(CREAM, [fit(line("M6 42 L94 42") + line("M6 58 L94 58", 0.28))]),
    "Qui retombe chez soi": D(CREAM, [fit(line("M6 14 Q40 14 66 70 Q74 84 88 84") + circle(90, 84, 4, 0.5))]),
    "Poussée en avant": D(CREAM, [fit(line("M14 28 L36 50 L14 72") + line("M40 28 L62 50 L40 72") + line("M66 28 L88 50 L66 72"))]),
  };

  // ---------- Percussions ----------

  const per = {
    "Aucune": D("#ece5d3", [flat("linear-gradient(#ece5d3, #ece5d3)")]),
    "Batterie rock": D(CREAM, [steps(["xxxxxxxx", "..x...x.", "x...x..."], 8)]),
    "Batterie jazz": D(CREAM, [steps(["x..x.xx..x.x", "...x.....x..", "o..o..o..o.."], 12)]),
    "Électroniques": D(CREAM, [steps(["..x...x...x...x.", "....x.......x...", "x...x...x...x..."], 16)]),
    "Boisées": D(CREAM, [steps(["x.x..x.x..x."], 12)]),
    "Métalliques": D(CREAM, [fit(circle(22, 40, 10, 0.18) + circle(58, 58, 16, 0.14) + circle(80, 28, 6, 0.22) + circle(40, 78, 5, 0.2))]),
    "Mélodiques": D(CREAM, [fit([0, 1, 2, 3, 4, 5].map((i) => circle(10 + i * 16, 74 - i * 9, 4, 0.34)).join(""))]),
    "Corporelles": D(CREAM, [steps(["x.x.x.x.", "..o..o.."], 8)]),
    "Djembé et Afrique de l'Ouest": D(CREAM, [steps(["x..x.xx.x.xx", "x..x..x..x.."], 12)]),
    "Tablas et Inde": D(CREAM, [steps(["x...x...o...x..."], 16)]),
    "Darbouka et Moyen-Orient": D(CREAM, [steps(["x..x....", ".x.x..x."], 8)]),
    "Taiko et tambours japonais": D(CREAM, [fit(circle(14, 50, 12, 0.32) + circle(40, 50, 10, 0.28) + circle(60, 50, 8, 0.26) + circle(74, 50, 6, 0.24) + circle(84, 50, 4.5, 0.22) + circle(92, 50, 3, 0.2))]),
    "Cajón et palmas": D(CREAM, [steps(["..x..x.x.x.x"], 12)]),
    "Timbales / Latin": D(CREAM, [steps(["x..x..x...x.x..."], 16)]),
    "Samba (batucada)": D(CREAM, [steps(["x.xxx.xxx.xxx.xx", "....x.......x..."], 16)]),
    "Shakers et grelots": D(CREAM, [steps(["xxxxxxxxxxxxxxxx"], 16)]),
    "Orchestrales": D(CREAM, [fit([[10, 6, 0.18], [28, 9, 0.22], [50, 13, 0.26], [76, 19, 0.32]].map(([x, r, al]) => circle(x, 52, r, al)).join(""))]),
    "Texturées / objets": (() => {
      const r = rng(hash("objets"));
      let body = "";
      for (let i = 0; i < 14; i++) body += i % 2 ? circle((6 + r() * 88).toFixed(1), (6 + r() * 88).toFixed(1), (2 + r() * 5).toFixed(1), 0.28) : rect((6 + r() * 84).toFixed(1), (6 + r() * 84).toFixed(1), (3 + r() * 7).toFixed(1), (3 + r() * 7).toFixed(1), 0.24);
      return D(CREAM, [fit(body)]);
    })(),
    "Glitch": D(CREAM, [barsShape("glitchp", 26, 4, 22, 0.32, 0.4)]),
    "Breakbeat": D(CREAM, [steps(["x.....x.x.....x.", "....x.......x..."], 16)]),
  };

  // ---------- Genre et valeurs sans motif défini : teinte et motif tirés du nom ----------

  const fallback = (name) => {
    const h = hash(name);
    const hue = h % 360;
    const tint = `hsl(${hue}, 28%, 84%)`;
    const kind = (h >>> 9) % 6;
    const layers = [
      diag(10 + (h % 7), 1, 0.12),
      dots(10 + (h % 9), 1.8, 0.2),
      wave(46, [`M0 23 Q20 ${8 + (h % 8)} 40 23 T80 23`]),
      tile(svg(32, 32, `<circle cx='16' cy='16' r='${5 + (h % 7)}' fill='none' stroke='${a(0.2)}' stroke-width='1.4'/>`, "xMidYMid meet"), "32px 32px"),
      vbars(10 + (h % 9), 2, 0.14),
      grid(12 + (h % 8), 1, 0.1),
    ][kind];
    return D(tint, [layers]);
  };

  const MAPS = { atm, tex, col, rhy, str, dur, esp, mou, per };
  const cache = new Map();

  // Repères : bandes verticales dont l'espacement suit le tempo.
  const repereVisual = (bpm) => {
    if (!bpm) return D(CREAM, [flat("linear-gradient(90deg, #f1ead8, #e1d9c5)")]);
    const gap = Math.max(6, Math.min(46, Math.round(1500 / bpm)));
    return D(CREAM, [vbars(gap, 2, 0.26)]);
  };

  return (catId, item, repere) => {
    if (catId === "rep") return repereVisual(repere && repere.bpm);
    if (!item) return null;
    const key = `${catId}|${item.name}`;
    if (!cache.has(key)) {
      const map = MAPS[catId];
      cache.set(key, (map && map[item.name]) || fallback(item.name));
    }
    return cache.get(key);
  };
})();
