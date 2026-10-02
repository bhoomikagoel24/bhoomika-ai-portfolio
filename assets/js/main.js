/* ==========================================================================
   Bhoomika Goel — portfolio interactions
   No dependencies. Everything degrades gracefully without JS.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (n, a, b) { return Math.min(b, Math.max(a, n)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* theme ---------------------------------------------------------------- */
  var themeBtn = $('#themeBtn');
  var themeMeta = $('meta[name="theme-color"]');
  function syncThemeUI() {
    var dark = doc.dataset.theme === 'dark';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#0A1020' : '#F3F5F9');
  }
  themeBtn.addEventListener('click', function () {
    var next = doc.dataset.theme === 'dark' ? 'light' : 'dark';
    doc.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeUI();
  });
  syncThemeUI();

  /* mobile menu ---------------------------------------------------------- */
  var sheet = $('#sheet');
  var menuBtn = $('#menuBtn');
  var menuUse = $('use', menuBtn);
  function setMenu(open) {
    sheet.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menuUse.setAttribute('href', open ? '#i-close' : '#i-menu');
    doc.style.overflow = open ? 'hidden' : '';
  }
  menuBtn.addEventListener('click', function () { setMenu(!sheet.classList.contains('is-open')); });
  $$('a', sheet).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.classList.contains('is-open')) setMenu(false); });
  window.matchMedia('(min-width: 1061px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });

  /* scroll: header state, progress bar, timeline ------------------------- */
  var nav = $('#nav');
  var progress = $('#progress');
  var tl = $('#tl');
  var tlItems = $$('.tl-item');
  var ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY || doc.scrollTop;
    nav.classList.toggle('is-scrolled', y > 8);
    var max = doc.scrollHeight - window.innerHeight;
    progress.style.setProperty('--sp', max > 0 ? clamp(y / max, 0, 1).toFixed(4) : 0);

    if (tl) {
      var r = tl.getBoundingClientRect();
      var mid = window.innerHeight * 0.62;
      tl.style.setProperty('--tp', clamp((mid - r.top) / r.height, 0, 1).toFixed(4));
      tlItems.forEach(function (it) { it.classList.toggle('is-on', it.getBoundingClientRect().top < mid); });
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* scrollspy ------------------------------------------------------------ */
  var links = $$('.nav-links a');
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      links.forEach(function (a) {
        if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  ['work', 'research', 'experience', 'achievements', 'stack', 'credentials', 'about', 'contact'].forEach(function (id) {
    var s = document.getElementById(id);
    if (s) spy.observe(s);
  });
  var hero = document.getElementById('top');
  if (hero) new IntersectionObserver(function (en) {
    if (en[0].isIntersecting) links.forEach(function (a) { a.removeAttribute('aria-current'); });
  }, { rootMargin: '-40% 0px -55% 0px' }).observe(hero);

  /* project rows (accordion) --------------------------------------------- */
  $$('.row, .feature').forEach(function (row) {
    var btn = $('.row-head, .feature-toggle', row);
    var inner = $('.row-panel, .feature-panel', row).firstElementChild;
    function set(open) {
      row.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      inner.inert = !open;
    }
    set(row.classList.contains('is-open'));
    btn.addEventListener('click', function () { set(!row.classList.contains('is-open')); });
  });

  /* jump from a paper to its related project ------------------------------ */
  $$('[data-open-row]').forEach(function (b) {
    b.addEventListener('click', function () {
      var head = document.getElementById('h-' + b.dataset.openRow);
      if (!head) return;
      var row = head.closest('.row');
      if (!row.classList.contains('is-open')) head.click();
      setTimeout(function () { head.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' }); }, 60);
    });
  });

  /* credential filters --------------------------------------------------- */
  var certs = $$('.cert');
  var chips = $$('.chip');
  function counts() {
    var c = { all: certs.length, ai: 0, cloud: 0, security: 0, other: 0 };
    certs.forEach(function (li) { c[li.dataset.cat]++; });
    Object.keys(c).forEach(function (k) { var el = document.getElementById('c-' + k); if (el) el.textContent = c[k]; });
  }
  counts();
  var LIMIT = 8, expanded = false, current = 'all';
  var moreBtn = document.getElementById('certsMore');
  var moreTxt = document.getElementById('certsMoreTxt');
  function applyCerts() {
    var match = certs.filter(function (li) { return current === 'all' || li.dataset.cat === current; });
    certs.forEach(function (li) { li.hidden = true; });
    match.forEach(function (li, i) { li.hidden = !expanded && i >= LIMIT; });
    var extra = match.length - LIMIT;
    moreBtn.parentNode.hidden = extra <= 0;
    moreBtn.setAttribute('aria-expanded', String(expanded));
    moreBtn.classList.toggle('is-open', expanded);
    moreTxt.textContent = expanded ? 'Show fewer' : 'Show all ' + match.length + ' credentials';
  }
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      current = chip.dataset.filter;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      applyCerts();
    });
  });
  moreBtn.addEventListener('click', function () {
    expanded = !expanded; applyCerts();
    if (!expanded) document.getElementById('credentials').scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  });
  applyCerts();

  /* viewer dialog: certificates, diagrams, résumé ------------------------ */
  var dlg = $('#viewer');
  var viewerBody = $('#viewerBody');
  var viewerTitle = $('#viewerTitle');
  var viewerOpen = $('#viewerOpen');
  var lastFocus = null;

  function infoCard(title) {
    var wrap = document.createElement('div');
    wrap.className = 'viewer-info';
    var h = document.createElement('h3'); h.textContent = title;
    var p = document.createElement('p'); p.textContent = 'This credential is verified online. You can check it on Credly or on my LinkedIn profile.';
    var acts = document.createElement('div'); acts.className = 'actions';
    [['Credly badges', 'http://credly.com/users/bhoomika-goel/badges'], ['LinkedIn', 'https://www.linkedin.com/in/bhoomikagoel111/']].forEach(function (l, i) {
      var a = document.createElement('a');
      a.className = 'btn btn-sm ' + (i ? 'btn-line' : 'btn-solid');
      a.href = l[1]; a.target = '_blank'; a.rel = 'noopener'; a.textContent = l[0];
      acts.appendChild(a);
    });
    wrap.append(h, p, acts);
    return wrap;
  }

  function openViewer(t) {
    var type = t.dataset.type, src = t.dataset.src, title = t.dataset.title || 'Document';
    viewerTitle.textContent = title;
    viewerBody.replaceChildren();
    if (type === 'img') {
      var img = new Image(); img.src = src; img.alt = title; viewerBody.appendChild(img);
    } else if (type === 'pdf') {
      var f = document.createElement('iframe'); f.src = src + '#view=FitH'; f.title = title; viewerBody.appendChild(f);
    } else {
      viewerBody.appendChild(infoCard(title));
    }
    if (src) { viewerOpen.hidden = false; viewerOpen.href = src; } else { viewerOpen.hidden = true; }
    lastFocus = t;
    if (sheet.classList.contains('is-open')) setMenu(false);
    dlg.showModal();
    doc.classList.add('modal-open');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-viewer]');
    if (!t) return;
    e.preventDefault();
    openViewer(t);
  });
  $('#viewerClose').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function () {
    doc.classList.remove('modal-open');
    viewerBody.replaceChildren();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  });

  /* copy email ----------------------------------------------------------- */
  var copyBtn = $('#copyMail');
  var copyLabel = $('#copyLabel');
  var copyUse = $('use', copyBtn);
  copyLabel.setAttribute('aria-live', 'polite');
  copyBtn.addEventListener('click', function () {
    var email = $('#mailLink').textContent.trim();
    function done() {
      copyLabel.textContent = 'Copied';
      copyUse.setAttribute('href', '#i-check');
      setTimeout(function () { copyLabel.textContent = 'Copy email'; copyUse.setAttribute('href', '#i-copy'); }, 1900);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(done, function () { window.location.href = 'mailto:' + email; });
    } else {
      var ta = document.createElement('textarea'); ta.value = email; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (err) { window.location.href = 'mailto:' + email; }
      ta.remove();
    }
  });

  /* ARIA pipeline -------------------------------------------------------- */
  (function pipeline() {
    var root = $('#pipe');
    if (!root) return;
    var row = $('#pipeRow');
    var svg = $('#pipeSvg');
    var token = $('#token');
    var logEl = $('#pipeLog');
    var logWho = $('#plAgent');
    var logMsg = $('#plMsg');
    var nodes = $$('.node', row);
    var mobile = window.matchMedia('(max-width: 1023px)');
    var NS = 'http://www.w3.org/2000/svg';

    var NAMES = ['planner', 'research', 'summarizer', 'synthesis', 'critic', 'formatter'];
    var INFO = {
      planner: 'Breaks the question into sub-queries and a search strategy, reusing plans it has seen before.',
      research: 'Retrieves candidate papers from arXiv and Semantic Scholar, with retries and circuit breakers.',
      summarizer: 'Pulls out the problem, method, findings, limitations and a confidence level from each paper.',
      synthesis: 'Reasons across papers to surface trends, agreements, contradictions and research gaps.',
      critic: 'Evaluates grounding and reasoning quality, flags hallucinations and sends refinement feedback.',
      formatter: 'Assembles the literature review, trends, gaps and future directions into a structured report.'
    };
    var RUN = {
      question: 'A research question comes in.',
      planner: 'Breaks the question into sub-queries and a search strategy.',
      research: 'Retrieves candidate papers from arXiv and Semantic Scholar.',
      summarizer: 'Pulls out the problem, method, findings and limitations.',
      synthesis: 'Reasons across papers to find trends and contradictions.',
      flag: 'Finds a claim its sources do not support and sends the draft back.',
      refine: 'Revises the synthesis using the critic’s feedback.',
      ok: 'The grounding check passes.',
      formatter: 'Assembles the cited, structured report.',
      report: 'Done: a structured, self-corrected research report.'
    };

    var geo = null;          // computed geometry
    var paused = false;
    var visible = true;
    var current = null;      // active run
    var lastLog = { who: 'Question', msg: RUN.question, verify: false };

    function setLog(who, msg, verify, remember) {
      logWho.textContent = who;
      logMsg.textContent = msg;
      logEl.classList.toggle('is-verify', !!verify);
      if (remember !== false) lastLog = { who: who, msg: msg, verify: !!verify };
    }

    function el(name, attrs) {
      var n = document.createElementNS(NS, name);
      Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      return n;
    }

    /* geometry ---------------------------------------------------------- */
    function layout() {
      svg.replaceChildren();
      geo = null;
      if (mobile.matches) return;
      var pr = row.getBoundingClientRect();
      if (!pr.width) return;
      svg.setAttribute('width', pr.width);
      svg.setAttribute('height', pr.height);
      svg.setAttribute('viewBox', '0 0 ' + pr.width + ' ' + pr.height);

      var A = nodes.map(function (n) {
        var b = n.getBoundingClientRect();
        return { l: b.left - pr.left, r: b.right - pr.left, b: b.bottom - pr.top, cx: (b.left + b.right) / 2 - pr.left, cy: (b.top + b.bottom) / 2 - pr.top };
      });
      var cy = A[0].cy;
      var STUB = 12, DOT = 6;
      var segs = [];
      function seg(x1, x2, arrow) {
        var d = 'M' + x1 + ' ' + cy + 'H' + x2;
        var len = Math.abs(x2 - x1);
        svg.appendChild(el('path', { d: d, 'class': 'seg-base' }));
        if (arrow) svg.appendChild(el('path', { d: 'M' + (x2 - 6) + ' ' + (cy - 4) + 'L' + x2 + ' ' + cy + 'L' + (x2 - 6) + ' ' + (cy + 4), 'class': 'seg-base' }));
        var on = el('path', { d: d, 'class': 'seg-on', 'stroke-dasharray': len, 'stroke-dashoffset': len });
        svg.appendChild(on);
        segs.push({ x1: x1, x2: x2, len: len, on: on });
      }
      seg(A[0].l - STUB, A[0].l, true);
      for (var i = 1; i < A.length; i++) seg(A[i - 1].r, A[i].l, true);
      seg(A[5].r, A[5].r + STUB, false);

      // end marker (report delivered)
      var ex = A[5].r + STUB + DOT;
      var end = el('g', { 'class': 'end' });
      end.appendChild(el('circle', { cx: ex, cy: cy, r: DOT + 2, 'class': 'end-ring' }));
      end.appendChild(el('path', { d: 'M' + (ex - 3.2) + ' ' + cy + 'l2.3 2.4 4.3-4.6', 'class': 'end-tick' }));
      svg.appendChild(end);

      // feedback loop: Critic -> Synthesis, dipping below the row
      var dy = 46, by = A[4].b + 4;
      var arcD = 'M' + A[4].cx + ' ' + by + 'C' + A[4].cx + ' ' + (by + dy) + ' ' + A[3].cx + ' ' + (by + dy) + ' ' + A[3].cx + ' ' + by;
      svg.appendChild(el('path', { d: arcD, 'class': 'arc-base' }));
      svg.appendChild(el('path', { d: 'M' + (A[3].cx - 4.5) + ' ' + (by + 7) + 'L' + A[3].cx + ' ' + by + 'L' + (A[3].cx + 4.5) + ' ' + (by + 7), 'class': 'arc-base', 'stroke-dasharray': 'none', opacity: '.8' }));
      var arcOn = el('path', { d: arcD, 'class': 'arc-on' });
      svg.appendChild(arcOn);
      var arcLen = arcOn.getTotalLength();
      arcOn.setAttribute('stroke-dasharray', arcLen);
      arcOn.setAttribute('stroke-dashoffset', arcLen);
      var lbl = el('text', { x: (A[3].cx + A[4].cx) / 2, y: by + dy * 0.75 + 20, 'text-anchor': 'middle', 'class': 'arc-label' });
      lbl.textContent = 'refine';
      svg.appendChild(lbl);

      geo = { cy: cy, segs: segs, arcOn: arcOn, arcLen: arcLen, end: end };
    }

    function resetVisuals() {
      nodes.forEach(function (n) { n.classList.remove('is-active', 'is-done', 'is-flag', 'is-ok'); });
      token.classList.remove('on', 'is-verify');
      if (geo) {
        geo.segs.forEach(function (s) { s.on.setAttribute('stroke-dashoffset', s.len); });
        geo.arcOn.setAttribute('stroke-dashoffset', geo.arcLen);
        geo.end.classList.remove('end-on');
      }
    }

    /* timing helpers (pausable, cancellable) ---------------------------- */
    var DEAD = { dead: true };
    function idle() { return paused || !visible || document.hidden; }
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

    function startRun() {
      var run = { dead: false };
      current = run;
      var visited = {};

      function wait(ms) {
        return new Promise(function (res, rej) {
          var t = 0, last = performance.now();
          (function tick(now) {
            if (run.dead) return rej(DEAD);
            var dt = now - last; last = now;
            if (!idle()) t += dt;
            if (t >= ms) res(); else requestAnimationFrame(tick);
          })(last);
        });
      }
      function anim(ms, fn) {
        return new Promise(function (res, rej) {
          var t = 0, last = performance.now();
          (function tick(now) {
            if (run.dead) return rej(DEAD);
            var dt = now - last; last = now;
            if (!idle()) t += dt;
            var p = clamp(t / ms, 0, 1);
            fn(ease(p));
            if (p < 1) requestAnimationFrame(tick); else res();
          })(last);
        });
      }

      function place(x, y) { token.style.transform = 'translate(' + x + 'px,' + y + 'px)'; }

      function hop(i, ms, verify) {
        if (mobile.matches || !geo) return wait(320);
        var s = geo.segs[i];
        token.classList.toggle('is-verify', !!verify);
        place(s.x1, geo.cy);
        token.classList.add('on');
        return anim(ms || 520, function (p) {
          place(s.x1 + (s.x2 - s.x1) * p, geo.cy);
          s.on.setAttribute('stroke-dashoffset', s.len * (1 - p));
        }).then(function () { token.classList.remove('on'); });
      }

      function arc(ms) {
        if (mobile.matches || !geo) return wait(700);
        token.classList.add('is-verify', 'on');
        var path = geo.arcOn;
        var p0 = path.getPointAtLength(0);
        place(p0.x, p0.y);
        return anim(ms || 900, function (p) {
          var pt = path.getPointAtLength(geo.arcLen * p);
          place(pt.x, pt.y);
          path.setAttribute('stroke-dashoffset', geo.arcLen * (1 - p));
        }).then(function () { token.classList.remove('on', 'is-verify'); });
      }

      function step(i, who, msg, o) {
        o = o || {};
        nodes.forEach(function (n, j) {
          if (j === i) n.classList.remove('is-active');
          n.classList.toggle('is-active', j === i);
          if (j !== i && visited[j]) n.classList.add('is-done');
        });
        visited[i] = true;
        var n = nodes[i];
        n.classList.remove('is-done');
        n.classList.toggle('is-flag', !!o.flag);
        if (o.ok) { n.classList.remove('is-flag'); n.classList.add('is-ok'); }
        setLog(who, msg, o.verify || o.flag);
        return wait(o.dwell || 1150);
      }

      function cycle() {
        resetVisuals();
        visited = {};
        setLog('Question', RUN.question, false);
        return wait(1100)
          .then(function () { return hop(0, 420); })
          .then(function () { return step(0, 'Planner', RUN.planner); })
          .then(function () { return hop(1); }).then(function () { return step(1, 'Research', RUN.research); })
          .then(function () { return hop(2); }).then(function () { return step(2, 'Summarizer', RUN.summarizer); })
          .then(function () { return hop(3); }).then(function () { return step(3, 'Synthesis', RUN.synthesis); })
          .then(function () { return hop(4); }).then(function () { return step(4, 'Critic', RUN.flag, { flag: true, dwell: 1500 }); })
          .then(function () { return arc(950); })
          .then(function () { return step(3, 'Synthesis', RUN.refine, { flag: true, verify: true, dwell: 1300 }); })
          .then(function () { nodes[3].classList.remove('is-flag'); return hop(4, 460); })
          .then(function () { return step(4, 'Critic', RUN.ok, { ok: true, dwell: 1200 }); })
          .then(function () { return hop(5); }).then(function () { return step(5, 'Formatter', RUN.formatter); })
          .then(function () { return hop(6, 380); })
          .then(function () {
            if (geo) geo.end.classList.add('end-on');
            nodes.forEach(function (n) { n.classList.remove('is-active'); n.classList.add('is-done'); });
            setLog('Report', RUN.report, false);
            return wait(3200);
          });
      }

      (function loop() {
        cycle().then(function () { if (!run.dead) return wait(400); })
          .then(function () { if (!run.dead) loop(); })
          .catch(function (e) { if (e !== DEAD) throw e; });
      })();
    }

    function stopRun() { if (current) current.dead = true; current = null; }

    function restart() {
      stopRun();
      layout();
      resetVisuals();
      if (reduceMotion.matches) {
        setLog('Try it', 'Hover or focus an agent to read what it does.', false);
        return;
      }
      startRun();
    }

    /* hover / focus: pause and explain ---------------------------------- */
    nodes.forEach(function (n, i) {
      function on() { paused = true; n.classList.add('is-hover'); setLog(n.querySelector('h3').textContent, INFO[NAMES[i]], NAMES[i] === 'critic', false); }
      function off() { paused = false; n.classList.remove('is-hover'); setLog(lastLog.who, lastLog.msg, lastLog.verify, false); }
      n.addEventListener('mouseenter', on);
      n.addEventListener('mouseleave', off);
      n.addEventListener('focus', on);
      n.addEventListener('blur', off);
    });

    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.2 }).observe(root);
    mobile.addEventListener('change', restart);
    reduceMotion.addEventListener('change', restart);

    var rt;
    var lastW = 0;
    if ('ResizeObserver' in window) {
      new ResizeObserver(function (en) {
        var w = Math.round(en[0].contentRect.width);
        if (w === lastW) return;
        lastW = w;
        clearTimeout(rt);
        rt = setTimeout(restart, 180);
      }).observe(row);
    }

    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(restart);
  })();
})();
