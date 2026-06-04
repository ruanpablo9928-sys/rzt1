/* ruanzitwo — Editor de Vídeo · vanilla JS, sem dependências. */
(() => {
  'use strict';
  const doc = document;
  const $ = (s, c = doc) => c.querySelector(s);
  const $$ = (s, c = doc) => Array.from(c.querySelectorAll(s));

  const safePlay = (v) => {
    if (!v || typeof v.play !== 'function') return;
    try { const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch (_) {}
  };

  /* 1. Vídeo HERO — autoplay mudo confiável */
  const hero = $('.hero__video');
  if (hero) {
    hero.muted = true; hero.setAttribute('muted', '');
    hero.playsInline = true; hero.setAttribute('playsinline', '');
    safePlay(hero);
    hero.addEventListener('loadeddata', () => safePlay(hero), { once: true });
    hero.addEventListener('canplay', () => safePlay(hero), { once: true });
    doc.addEventListener('visibilitychange', () => { if (!doc.hidden && hero.paused) safePlay(hero); });
    const resume = () => { if (hero.paused) safePlay(hero);
      ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.removeEventListener(e, resume)); };
    ['pointerdown', 'keydown', 'touchstart'].forEach((e) => window.addEventListener(e, resume, { passive: true }));
  }

  /* 2. Troca de vídeo PC <-> Celular ao cruzar 760px */
  const swap = $$('.js-video');
  if (swap.length && window.matchMedia) {
    const mq = window.matchMedia('(max-width: 760px)');
    const apply = () => {
      const mobile = mq.matches;
      swap.forEach((v) => {
        const want = mobile ? v.dataset.mobile : v.dataset.desktop;
        if (!want) return;
        const cur = decodeURIComponent((v.currentSrc || '').split('/').pop());
        if (cur === want) return;
        v.querySelectorAll('source').forEach((s) => s.remove());
        const s = doc.createElement('source');
        s.src = encodeURI(want); s.type = 'video/mp4';
        v.appendChild(s); v.load(); safePlay(v);
      });
    };
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);
  }

  /* 2b. Reels — tocam ao passar o mouse (desktop) ou ao entrar na tela (celular) */
  const canHover = window.matchMedia ? window.matchMedia('(hover: hover)').matches : true;
  const hoverVideos = $$('.js-hover');
  hoverVideos.forEach((v) => {
    v.muted = true; v.setAttribute('muted', '');
    v.playsInline = true; v.setAttribute('playsinline', '');
    v.loop = true; v.setAttribute('loop', '');
    const paint = () => { try { if (v.paused && v.currentTime === 0) v.currentTime = 0.05; } catch (_) {} };
    v.addEventListener('loadeddata', paint, { once: true });
    if (v.readyState >= 2) paint();
  });
  if (canHover) {
    hoverVideos.forEach((v) => {
      const host = v.closest('.reel') || v;
      host.addEventListener('mouseenter', () => safePlay(v));
      host.addEventListener('mouseleave', () => { try { v.pause(); v.currentTime = 0; } catch (_) {} });
    });
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) safePlay(e.target); else { try { e.target.pause(); } catch (_) {} }
    }), { threshold: 0.5 });
    hoverVideos.forEach((v) => io.observe(v));
  } else {
    hoverVideos.forEach((v) => safePlay(v));
  }

  /* 3. Nav mobile */
  const nav = $('.nav');
  const toggle = $('.nav__toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    $$('.nav__menu a').forEach((a) => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  /* 4. Acordeão de serviços */
  $$('.acc').forEach((acc) => {
    const head = $('.acc__head', acc);
    head.addEventListener('click', () => {
      const isOpen = acc.classList.contains('is-open');
      $$('.acc').forEach((a) => { a.classList.remove('is-open'); $('.acc__head', a).setAttribute('aria-expanded', 'false'); });
      if (!isOpen) { acc.classList.add('is-open'); head.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* 5. Link ativo do menu conforme a seção visível */
  const links = $$('.nav__menu a');
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
  }
})();
