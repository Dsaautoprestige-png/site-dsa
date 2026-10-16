/* DSA Autoprestige · script commun */
(function(){
  const WA = "33614612804";
  const SHEET = "1zFC5ymWnyzZL_nGXaYGfoQbH2r7Wg0vQFILsxUlIaz4";
  const $ = s => document.querySelector(s);
  const el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e; };
  const fmt = n => { const x = parseInt(String(n).replace(/\D/g, ""), 10); return isNaN(x) ? "" : x.toLocaleString("fr-FR"); };
  const img = (id, w) => "https://lh3.googleusercontent.com/d/" + id + "=w" + (w || 900);
  const waLink = t => "https://wa.me/" + WA + (t ? "?text=" + encodeURIComponent(t) : "");

  /* en-tête : bordure au défilement */
  const top = $(".top");
  if (top) { const f = () => top.classList.toggle("scrolled", scrollY > 8); addEventListener("scroll", f, { passive: true }); f(); }

  /* menu mobile */
  const btn = $(".menu-btn"), nav = $("#nav");
  if (btn && nav) {
    const set = open => { nav.classList.toggle("open", open); btn.setAttribute("aria-expanded", open); document.body.style.overflow = open ? "hidden" : ""; };
    btn.addEventListener("click", () => set(!nav.classList.contains("open")));
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => set(false)));
    addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
  }
  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();

  /* formulaires -> message WhatsApp */
  document.querySelectorAll("form.wa").forEach(f => {
    f.addEventListener("submit", e => {
      e.preventDefault();
      const v = n => { const x = f.querySelector('[name="' + n + '"]'); return x ? x.value.trim() : ""; };
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
        id: num(g("id")) || val(g("id")), statut: val(g("statut")) || "Disponible",
        titre: val(g("titre")), version: val(g("version")),
        annee: num(g("annee")), km: num(g("km")), prix: num(g("prix")),
        carbu: val(g("carburant")), boite: val(g("boite")),
        plus: val(g("point_fort")), desc: val(g("description")),
        photos: val(g("photos")).split(/\s+/).filter(Boolean), ajout: +num(g("ajout")) || 0
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

  /* photo jamais coupée : image entière + même photo floutée derrière */
  function shot(id, w, alt, lazy){
    const d = el("div", "shot");
    if (!id) { d.appendChild(el("div", "empty", "Photos à venir")); return d; }
    const u = img(id, w);
    d.style.setProperty("--bg", `url("${img(id, 120)}")`);
    const im = document.createElement("img"); im.src = u; im.alt = alt || ""; im.decoding = "async"; if (lazy) im.loading = "lazy";
    d.appendChild(im);
    return d;
  }
  const statusTag = s => s === "Réservé" ? el("span", "tag res", "Réservé") : s === "Vendu" ? el("span", "tag sold", "Vendu") : el("span", "tag", "Disponible");

  function card(c, eager){
    const a = el("a", "car" + (c.statut === "Vendu" ? " sold" : ""));
    a.href = "/vehicule/?id=" + encodeURIComponent(c.id);
    a.setAttribute("aria-label", [c.titre, c.version, c.prix && c.statut !== "Vendu" ? fmt(c.prix) + " euros" : ""].filter(Boolean).join(", "));
    const s = shot(c.photos[0], 900, c.titre + " " + c.version, !eager);
    s.appendChild(statusTag(c.statut));
    if (c.photos.length > 1) s.appendChild(el("span", "n", c.photos.length + " photos"));
    a.appendChild(s);
    const bd = el("div", "bd");
    bd.appendChild(el("h3", null, c.titre));
    if (c.version) bd.appendChild(el("div", "ver", c.version));
    const row = el("div", "row");
    const facts = el("div", "facts");
    [[c.annee, c.km ? fmt(c.km) + " km" : ""], [c.carbu, c.boite]].forEach(l => { const t = l.filter(Boolean).join(" · "); if (t) facts.appendChild(el("span", null, t)); });
    row.appendChild(facts);
    if (c.prix && c.statut !== "Vendu") row.appendChild(el("div", "price", fmt(c.prix) + " €"));
    bd.appendChild(row);
    a.appendChild(bd);
    return a;
  }
  function emptyMsg(grid, html){ grid.textContent = ""; const e = el("div", "empty"); e.innerHTML = html; grid.appendChild(e); }

  /* nombre de voitures disponibles (accueil) */
  document.querySelectorAll("[data-livecount]").forEach(async n => {
    const list = await loadStock(); if (!list) return;
    const k = list.filter(c => c.statut !== "Vendu").length;
    if (k) { n.innerHTML = `<b>0</b> voiture${k > 1 ? "s" : ""} disponible${k > 1 ? "s" : ""} en ce moment`; n.hidden = false; const b = n.querySelector("b"); let v = 0; const step = () => { v++; b.textContent = v; if (v < k) setTimeout(step, Math.max(40, 500 / k)); }; setTimeout(step, 900); }
  });

  /* grilles de voitures */
  document.querySelectorAll("[data-stock]").forEach(async grid => {
    const limit = +grid.dataset.limit || 0;
    const list = await loadStock();
    if (!list) { emptyMsg(grid, 'Le stock n\'a pas pu se charger. <a href="' + waLink("Bonjour, quels véhicules avez-vous en ce moment ?") + '" target="_blank" rel="noopener">Demandez-le sur WhatsApp</a>.'); return; }
    const draw = items => {
      grid.textContent = "";
      if (!items.length) { emptyMsg(grid, 'Notre prochain arrivage est en préparation.<br>Dites-nous ce que vous cherchez, <a href="/contact/">on s\'en occupe</a>.'); return; }
      items.forEach((c, k) => grid.appendChild(card(c, k < 3)));
    };
    const filters = document.querySelector("[data-filters]");
    if (limit || !filters) {
      let shown = list.filter(c => c.statut !== "Vendu");
      if (shown.length < (limit || 99)) shown = shown.concat(list.filter(c => c.statut === "Vendu"));
      draw(limit ? shown.slice(0, limit) : shown); return;
    }
    const state = { f: "all", sort: "recent" };
    const apply = () => {
      let items = list.slice();
      if (state.f === "dispo") items = items.filter(c => c.statut !== "Vendu");
      else if (state.f !== "all") items = items.filter(c => (c.carbu + " " + c.boite).toLowerCase().includes(state.f));
      if (state.sort === "asc") items.sort((a, b) => (+a.prix || 9e9) - (+b.prix || 9e9));
      if (state.sort === "desc") items.sort((a, b) => (+b.prix || 0) - (+a.prix || 0));
      if (state.sort === "km") items.sort((a, b) => (+a.km || 9e9) - (+b.km || 9e9));
      draw(items);
      const cnt = document.querySelector("[data-count]");
      if (cnt) { const k = items.filter(c => c.statut !== "Vendu").length; cnt.textContent = k + (k > 1 ? " voitures disponibles" : " voiture disponible"); }
    };
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
    const details = [c.titre, c.version, c.annee, c.km ? fmt(c.km) + " km" : "", c.prix ? fmt(c.prix) + " €" : ""].filter(Boolean).join(", ");
    document.title = c.titre + (c.version ? " " + c.version : "") + " · DSA Autoprestige";
    const md = document.querySelector('meta[name="description"]'); if (md) md.content = details + ". DSA Autoprestige, Rueil-Malmaison (92).";
    det.textContent = "";
    const ph = c.photos; let i = 0;

    // galerie
    const gal = el("div", "gallery");
    const main = el("div", "shot"); const big = document.createElement("img"); big.alt = c.titre; main.appendChild(big);
    const pos = el("span", "pos");
    const thumbs = el("div", "thumbs");
    const show = k => {
      if (!ph.length) return; i = (k + ph.length) % ph.length;
      big.classList.remove("sw"); void big.offsetWidth; big.classList.add("sw"); big.src = img(ph[i], 1600); main.style.setProperty("--bg", `url("${img(ph[i], 120)}")`);
      pos.textContent = (i + 1) + " / " + ph.length;
      thumbs.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-current", j === i));
      const t = thumbs.children[i]; if (t && t.scrollIntoView) t.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    };
    if (ph.length > 1) {
      const p = el("button", "navp prev", "‹"), n = el("button", "navp next", "›");
      p.type = n.type = "button"; p.setAttribute("aria-label", "Photo précédente"); n.setAttribute("aria-label", "Photo suivante");
      p.onclick = e => { e.stopPropagation(); show(i - 1); }; n.onclick = e => { e.stopPropagation(); show(i + 1); };
      main.append(p, n, pos);
      swipe(main, d => show(i + d));
    }
    if (c.statut !== "Disponible") main.appendChild(el("span", "tag", c.statut));
    ph.forEach((pid, k) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Photo " + (k + 1)); const t = document.createElement("img"); t.src = img(pid, 240); t.alt = ""; t.loading = "lazy"; b.appendChild(t); b.onclick = () => show(k); thumbs.appendChild(b); });
    gal.append(main); if (ph.length > 1) gal.appendChild(thumbs);
    if (!ph.length) main.appendChild(el("div", "empty", "Photos à venir"));
    main.addEventListener("click", () => ph.length && openLB());
    show(0);

    // plein écran
    const lb = el("div", "lightbox"); lb.hidden = true; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-label", "Photos en plein écran");
    const lbi = document.createElement("img"); lbi.alt = c.titre;
    const x = el("button", "x", "×"); x.type = "button"; x.setAttribute("aria-label", "Fermer");
    const lp = el("button", "lp", "‹"), ln = el("button", "ln", "›"); lp.type = ln.type = "button"; lp.setAttribute("aria-label", "Photo précédente"); ln.setAttribute("aria-label", "Photo suivante");
    const lc = el("div", "lc");
    lb.append(lbi, x, lc); if (ph.length > 1) lb.append(lp, ln);
    document.body.appendChild(lb);
    const lbShow = () => { lbi.src = img(ph[i], 2000); lc.textContent = (i + 1) + " / " + ph.length; };
    function openLB(){ lbShow(); lb.hidden = false; document.body.style.overflow = "hidden"; x.focus(); }
    const closeLB = () => { lb.hidden = true; document.body.style.overflow = ""; show(i); };
    x.onclick = closeLB; lb.addEventListener("click", e => { if (e.target === lb) closeLB(); });
    lp.onclick = () => { i = (i - 1 + ph.length) % ph.length; lbShow(); }; ln.onclick = () => { i = (i + 1) % ph.length; lbShow(); };
    swipe(lb, d => { i = (i + d + ph.length) % ph.length; lbShow(); });
    addEventListener("keydown", e => { if (lb.hidden) return; if (e.key === "Escape") closeLB(); if (e.key === "ArrowLeft") lp.onclick(); if (e.key === "ArrowRight") ln.onclick(); });

    // infos
    const info = el("div", "info");
    const head = el("div"); head.appendChild(el("h1", null, c.titre)); if (c.version) { const v = el("p", "muted", c.version); v.style.marginTop = "8px"; head.appendChild(v); }
    info.appendChild(head);
    if (c.prix && c.statut !== "Vendu") info.appendChild(el("div", "price", fmt(c.prix) + " €"));
    const sp = el("div", "spec");
    [["Année", c.annee], ["Kilométrage", c.km ? fmt(c.km) + " km" : ""], ["Carburant", c.carbu], ["Boîte", c.boite]].forEach(([k, v]) => { if (!v) return; const d = el("div"); d.append(el("span", null, k), el("strong", null, v)); sp.appendChild(d); });
    info.appendChild(sp);
    if (c.plus) info.appendChild(el("span", "plus", c.plus));
    const bt = el("div", "btns");
    const mk = (cls, txt, msg) => { const a = el("a", "btn " + cls, txt); a.href = waLink(msg); a.target = "_blank"; a.rel = "noopener"; return a; };
    if (c.statut !== "Vendu") bt.append(mk("primary", "Je suis intéressé(e)", `Bonjour DSA Autoprestige, je suis intéressé(e) par la ${details}. Est-elle toujours disponible ?`), mk("", "Réserver un essai", `Bonjour, je souhaite réserver un essai pour la ${details}. Quelles sont vos disponibilités ?`));
    else bt.append(mk("primary", "Trouver une voiture similaire", `Bonjour, je cherche une voiture similaire à la ${details}.`));
    info.appendChild(bt);
    if (c.desc) info.appendChild(el("div", "desc", c.desc));
    const sh = el("button", "btn ghost", "Partager cette voiture"); sh.type = "button";
    sh.onclick = async () => { try { if (navigator.share) await navigator.share({ title: document.title, url: location.href }); else { await navigator.clipboard.writeText(location.href); sh.textContent = "Lien copié"; } } catch (e) {} };
    info.appendChild(sh);
    det.append(gal, info);
  })();

  function swipe(node, cb){
    let x0 = null, y0 = null;
    node.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    node.addEventListener("touchend", e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) cb(dx < 0 ? 1 : -1); x0 = null; });
  }
})();

/* ---------- mouvement ---------- */
(function(){
  const d = document.documentElement;
  const calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const SEL = ".head,.car,.step,.svc article,.why>div,.promises>div,.zero,.channel,form.wa,.faq details,.final .wrap>*,.spec>div,.info>*,.gallery,.hours,.cars>.empty";
  let io = null;
  if (!calm && "IntersectionObserver" in window) {
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  }
  function scan(root){
    (root || document).querySelectorAll(SEL).forEach(n => {
      if (n.classList.contains("rv")) return;
      n.classList.add("rv");
      if (n.matches(".channel,.svc article")) n.classList.add("from-l");
      const sib = n.parentElement ? [...n.parentElement.children].filter(x => x.matches(SEL)) : [];
      const k = Math.max(0, sib.indexOf(n));
      n.style.setProperty("--d", Math.min(k, 5) * 0.08 + "s");
      if (io) io.observe(n); else n.classList.add("in");
    });
  }
  scan();
  new MutationObserver(ms => { if (ms.some(m => m.addedNodes.length)) scan(); }).observe(document.querySelector("main") || document.body, { childList: true, subtree: true });
  requestAnimationFrame(() => document.querySelectorAll(".page-head").forEach(p => p.classList.add("ready")));

  /* barre de progression, parallaxe du héros, bandeaux qui penchent avec la vitesse */
  const bar = document.querySelector(".progress");
  const pic = document.querySelector(".hero-photo picture");
  const skews = document.querySelectorAll(".ticker>div,.mega>div");
  let lastY = scrollY, skew = 0, ticking = false;
  function frame(){
    ticking = false;
    const y = scrollY, h = d.scrollHeight - innerHeight;
    if (bar) bar.style.setProperty("--p", h > 0 ? Math.min(1, y / h) : 0);
    if (calm) return;
    if (pic && y < innerHeight * 1.2) pic.style.setProperty("--py", (y * 0.25).toFixed(1) + "px");
    const v = Math.max(-14, Math.min(14, (y - lastY) * 0.35)); lastY = y;
    skew += (v - skew) * 0.3;
    skews.forEach(s => s.style.setProperty("--skew", (-skew).toFixed(2) + "deg"));
    if (Math.abs(skew) > 0.05) { ticking = true; requestAnimationFrame(frame); }
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();

  /* cartes qui s'inclinent sous la souris (ordinateur) */
  if (!calm && matchMedia("(hover:hover) and (pointer:fine)").matches) {
    document.addEventListener("pointermove", e => {
      const c = e.target.closest && e.target.closest(".car.in"); if (!c) return;
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.classList.add("tilt"); c.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-4px)`;
    });
    document.addEventListener("pointerout", e => { const c = e.target.closest && e.target.closest(".car"); if (c && !c.contains(e.relatedTarget)) { c.classList.remove("tilt"); c.style.transform = ""; } });
  }
})();
