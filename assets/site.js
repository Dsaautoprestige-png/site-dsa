/* DSA Autoprestige · script commun */
(function(){
  const WA = "33614612804";
  const SHEET = "1zFC5ymWnyzZL_nGXaYGfoQbH2r7Wg0vQFILsxUlIaz4";
  const $ = s => document.querySelector(s);
  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const fmt = n => { const x = parseInt(String(n).replace(/\D/g, ""), 10); return isNaN(x) ? "" : x.toLocaleString("fr-FR"); };
  const img = (id, w) => "https://lh3.googleusercontent.com/d/" + id + "=w" + (w || 900);
  window.DSA = { WA };

  /* menu mobile */
  const btn = $(".menu-btn"), nav = $("#nav");
  if (btn && nav) {
    btn.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { nav.classList.remove("open"); document.body.style.overflow = ""; btn.setAttribute("aria-expanded", false); }));
  }
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* liens WhatsApp */
  function waLink(text){ return "https://wa.me/" + WA + (text ? "?text=" + encodeURIComponent(text) : ""); }
  window.DSA.waLink = waLink;

  /* formulaires -> message WhatsApp */
  document.querySelectorAll("form.wa").forEach(f => {
    f.addEventListener("submit", e => {
      e.preventDefault();
      const v = n => (f.querySelector('[name="' + n + '"]') || {}).value ? f.querySelector('[name="' + n + '"]').value.trim() : "";
      const err = f.querySelector(".err");
      if (!v("nom") || !v("vehicule")) { err.hidden = false; err.textContent = "Indiquez au moins votre prénom et le véhicule."; return; }
      err.hidden = true;
      const t = `Bonjour DSA Autoprestige, je m'appelle ${v("nom")}. ${v("service") || "Demande"} : ${v("vehicule")}.${v("msg") ? " " + v("msg") : ""}`;
      window.open(waLink(t), "_blank", "noopener");
    });
  });

  /* ---------- stock en direct (Google Sheet « Stock site DSA ») ---------- */
  function parse(res){
    if (!res || !res.table) return [];
    const labels = res.table.cols.map(c => (c.label || "").trim());
    const ix = n => labels.indexOf(n);
    const val = c => (c && c.v != null) ? String(c.v) : "";
    const num = c => val(c).replace(/[^\d]/g, "");
    const out = [];
    (res.table.rows || []).forEach(r => {
      const c = r.c || []; const g = n => c[ix(n)];
      if (!val(g("id")) || val(g("en_ligne")).toUpperCase() === "NON") return;
      out.push({
        id: num(g("id")) || val(g("id")),
        statut: val(g("statut")) || "Disponible",
        titre: val(g("titre")), version: val(g("version")),
        annee: num(g("annee")), km: num(g("km")), prix: num(g("prix")),
        carbu: val(g("carburant")), boite: val(g("boite")),
        plus: val(g("point_fort")), desc: val(g("description")),
        photos: val(g("photos")).split(/\s+/).filter(Boolean),
        ajout: +num(g("ajout")) || 0
      });
    });
    const order = { "Disponible": 0, "Réservé": 1, "Vendu": 2 };
    return out.sort((a, b) => (order[a.statut] ?? 0) - (order[b.statut] ?? 0) || b.ajout - a.ajout);
  }
  let pending = null;
  function loadStock(){
    if (pending) return pending;
    pending = new Promise(resolve => {
      let done = false;
      window.__dsaStock = res => { done = true; resolve(parse(res)); };
      const s = document.createElement("script");
      s.src = "https://docs.google.com/spreadsheets/d/" + SHEET + "/gviz/tq?tqx=out:json;responseHandler:__dsaStock&sheet=Stock&headers=1&_=" + Date.now();
      s.onerror = () => { if (!done) resolve(null); };
      document.head.appendChild(s);
      setTimeout(() => { if (!done) resolve(null); }, 12000);
    });
    return pending;
  }
  window.DSA.loadStock = loadStock;

  function title(c){ return c.titre; }
  function card(c){
    const a = el("a", "car" + (c.statut === "Vendu" ? " sold" : ""));
    a.href = "/vehicule/?id=" + encodeURIComponent(c.id);
    const ph = el("div", "ph");
    if (c.photos[0]) { const im = document.createElement("img"); im.src = img(c.photos[0], 800); im.alt = c.titre + " " + c.version; im.loading = "lazy"; im.decoding = "async"; ph.appendChild(im); }
    else ph.appendChild(el("div", "none", "Photos à venir"));
    if (c.statut === "Réservé") ph.appendChild(el("span", "badge res", "Réservé"));
    else if (c.statut === "Vendu") ph.appendChild(el("span", "badge sold", "Vendu"));
    else ph.appendChild(el("span", "badge", "Disponible"));
    if (c.photos.length > 1) ph.appendChild(el("span", "count", "📷 " + c.photos.length));
    a.appendChild(ph);
    const bd = el("div", "bd");
    bd.appendChild(el("h3", null, title(c)));
    if (c.version) bd.appendChild(el("div", "ver", c.version));
    if (c.prix && c.statut !== "Vendu") bd.appendChild(el("div", "price", fmt(c.prix) + " €"));
    const sp = el("div", "specs");
    [c.annee, c.km ? fmt(c.km) + " km" : "", c.carbu, c.boite].filter(Boolean).forEach(s => sp.appendChild(el("span", null, s)));
    bd.appendChild(sp);
    const more = el("div", "more"); more.append(el("span", null, c.statut === "Vendu" ? "Voir la fiche" : "Voir la voiture"), el("span", null, "→"));
    bd.appendChild(more);
    a.appendChild(bd);
    return a;
  }
  function emptyMsg(grid, text){ grid.textContent = ""; const e = el("div", "empty"); e.innerHTML = text; grid.appendChild(e); }

  /* grille : data-limit (accueil) ou complète avec filtres */
  document.querySelectorAll("[data-stock]").forEach(async grid => {
    const limit = +grid.dataset.limit || 0;
    const list = await loadStock();
    if (!list) { emptyMsg(grid, 'Le stock n\'a pas pu se charger. <a href="' + waLink("Bonjour, quels véhicules avez-vous en ce moment ?") + '" target="_blank" rel="noopener">Demandez-le sur WhatsApp</a>.'); return; }
    let shown = limit ? list.filter(c => c.statut !== "Vendu").slice(0, limit) : list;
    if (limit && shown.length < limit) shown = list.slice(0, limit);
    const filters = document.querySelector("[data-filters]");
    function draw(items){
      grid.textContent = "";
      if (!items.length) { emptyMsg(grid, 'Notre prochain arrivage est en préparation.<br>Dites-nous ce que vous cherchez, <a href="/contact/">on s\'en occupe</a>.'); return; }
      items.forEach(c => grid.appendChild(card(c)));
    }
    if (!filters) { draw(shown); return; }
    const state = { f: "all", sort: "recent" };
    function apply(){
      let items = list.slice();
      if (state.f === "dispo") items = items.filter(c => c.statut !== "Vendu");
      else if (state.f !== "all") items = items.filter(c => (c.carbu + " " + c.boite).toLowerCase().includes(state.f));
      if (state.sort === "asc") items.sort((a, b) => (+a.prix || 9e9) - (+b.prix || 9e9));
      if (state.sort === "desc") items.sort((a, b) => (+b.prix || 0) - (+a.prix || 0));
      if (state.sort === "km") items.sort((a, b) => (+a.km || 9e9) - (+b.km || 9e9));
      draw(items);
      const cnt = document.querySelector("[data-count]"); if (cnt) cnt.textContent = items.filter(c => c.statut !== "Vendu").length + " véhicule(s) disponible(s)";
    }
    filters.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
      state.f = b.dataset.f; filters.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); apply();
    }));
    const so = filters.querySelector("select"); if (so) so.addEventListener("change", () => { state.sort = so.value; apply(); });
    apply();
  });

  /* ---------- fiche d'un véhicule ---------- */
  const det = document.querySelector("[data-detail]");
  if (det) (async () => {
    const id = new URLSearchParams(location.search).get("id");
    const list = await loadStock();
    const c = list && list.find(x => String(x.id) === String(id));
    if (!c) { det.innerHTML = '<div class="empty">Cette voiture n\'est plus en ligne. <a href="/vehicules/">Voir les autres véhicules</a></div>'; return; }
    document.title = c.titre + (c.version ? " " + c.version : "") + " · DSA Autoprestige";
    const md = document.querySelector('meta[name="description"]'); if (md) md.content = [c.titre, c.version, c.annee, c.km ? fmt(c.km) + " km" : "", c.prix ? fmt(c.prix) + " €" : ""].filter(Boolean).join(" · ") + " — DSA Autoprestige, Rueil-Malmaison (92).";
    det.textContent = "";
    // galerie
    const gal = el("div", "gallery");
    const main = el("div", "main"); const big = document.createElement("img"); big.alt = c.titre; main.appendChild(big);
    let i = 0; const ph = c.photos;
    const thumbs = el("div", "thumbs");
    function show(k){ if (!ph.length) return; i = (k + ph.length) % ph.length; big.src = img(ph[i], 1400); thumbs.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-current", j === i)); }
    if (ph.length > 1) {
      const p = el("button", "nav-ph prev", "‹"), n = el("button", "nav-ph next", "›");
      p.setAttribute("aria-label", "Photo précédente"); n.setAttribute("aria-label", "Photo suivante");
      p.onclick = () => show(i - 1); n.onclick = () => show(i + 1); main.append(p, n);
      let x0 = null; main.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
      main.addEventListener("touchend", e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(i + (dx < 0 ? 1 : -1)); x0 = null; });
    }
    if (c.statut === "Réservé") main.appendChild(el("span", "badge res", "Réservé"));
    if (c.statut === "Vendu") main.appendChild(el("span", "badge sold", "Vendu"));
    ph.forEach((pid, k) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Photo " + (k + 1)); const t = document.createElement("img"); t.src = img(pid, 200); t.alt = ""; t.loading = "lazy"; b.appendChild(t); b.onclick = () => show(k); thumbs.appendChild(b); });
    gal.append(main); if (ph.length > 1) gal.appendChild(thumbs);
    if (!ph.length) main.appendChild(el("div", "none", "Photos à venir"));
    show(0);
    // infos
    const info = el("div", "info");
    const h = el("h1", null, c.titre); h.style.fontSize = "clamp(2rem,7vw,3.2rem)"; info.appendChild(h);
    if (c.version) info.appendChild(el("div", "muted", c.version));
    if (c.prix && c.statut !== "Vendu") info.appendChild(el("div", "price", fmt(c.prix) + " €"));
    const tbl = el("div", "spec-table");
    [["Année", c.annee], ["Kilométrage", c.km ? fmt(c.km) + " km" : ""], ["Carburant", c.carbu], ["Boîte", c.boite]].forEach(([k, v]) => { if (!v) return; const d = el("div"); d.append(el("span", null, k), el("strong", null, v)); tbl.appendChild(d); });
    info.appendChild(tbl);
    if (c.plus) { const p = el("div", "chip red", "✓ " + c.plus); p.style.alignSelf = "flex-start"; info.appendChild(p); }
    const details = [c.titre, c.version, c.annee, c.km ? fmt(c.km) + " km" : "", c.prix ? fmt(c.prix) + " €" : ""].filter(Boolean).join(", ");
    const bt = el("div", "btns");
    if (c.statut !== "Vendu") {
      const a = el("a", "btn primary", "Je suis intéressé(e)"); a.href = waLink(`Bonjour DSA Autoprestige, je suis intéressé(e) par la ${details}. Est-elle toujours disponible ?`); a.target = "_blank"; a.rel = "noopener";
      const b = el("a", "btn", "Réserver un essai"); b.href = waLink(`Bonjour, je souhaite réserver un essai pour la ${details}. Quelles sont vos disponibilités ?`); b.target = "_blank"; b.rel = "noopener";
      bt.append(a, b);
    } else {
      const a = el("a", "btn primary", "Trouver une voiture similaire"); a.href = waLink(`Bonjour, je cherche une voiture similaire à la ${details}.`); a.target = "_blank"; a.rel = "noopener"; bt.append(a);
    }
    info.appendChild(bt);
    if (c.desc) info.appendChild(el("div", "desc", c.desc));
    const sh = el("button", "btn ghost", "Partager cette voiture"); sh.type = "button";
    sh.onclick = async () => { const url = location.href; try { if (navigator.share) await navigator.share({ title: document.title, url }); else { await navigator.clipboard.writeText(url); sh.textContent = "Lien copié ✓"; } } catch (e) {} };
    info.appendChild(sh);
    det.append(gal, info);
  })();
})();
