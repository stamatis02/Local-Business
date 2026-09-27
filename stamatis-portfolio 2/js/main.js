/* ============================================================================
   STAMATIS PSAROS — PORTFOLIO
   main.js

   0.  Config            ← edit email, timezone, feature switches
   1.  Helpers
   2.  Features that work without animation (clock, menu, form, services)
   3.  Smooth scroll (Lenis) + anchor links
   4.  Hero: split letters, fit to width, weight-follows-cursor, scroll squeeze
   5.  Loader + intro timeline
   6.  Work: horizontal pinned scroll (desktop) / stacked reveals (mobile)
   7.  Reveals: split headings, fade-ups, scrubbed paragraph, xysta bands
   8.  Marquee: velocity-reactive
   9.  Process: active step, rolling counter, line-drawn illustrations
   10. Navigation: hide on scroll, progress bar
   11. Cursor, magnetic buttons, card tilt
   12. Boot

   Libraries (loaded in index.html): GSAP 3 + ScrollTrigger, Lenis.
   If they fail to load, or the visitor prefers reduced motion, the site
   stays fully usable with no animation.
   ========================================================================== */
(() => {
  'use strict';

  /* ==========================================================================
     0. CONFIG
     ========================================================================== */
  const CONFIG = {
    email: 'stamatispsoras@gmail.com', // used by the form fallback
    timeZone: 'Europe/Athens',         // for the live clock
    showLoader: true,
    smoothScroll: true,
    customCursor: true,
  };


  /* ==========================================================================
     1. HELPERS
     ========================================================================== */
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const animate = hasGSAP && !reduceMotion;

  let lenis = null;     // smooth-scroll instance (null when off)
  let menuOpen = false;

  /** Split an element's text into masked words: <span.w><span.w__in>word</span></span> */
  function splitWords(el, cls = 'w') {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    return words.map((word, i) => {
      const outer = document.createElement('span');
      const inner = document.createElement('span');
      outer.className = cls;
      inner.className = cls + '__in';
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      return inner;
    });
  }

  /** Split an element's text into single-letter spans (.char) */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    return Array.from(text).map((ch) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      el.appendChild(span);
      return span;
    });
  }

  /** Smooth-scroll to a target (element, selector or number) */
  function scrollToTarget(target) {
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.6 });
    } else if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' });
    } else if (target) {
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }


  /* ==========================================================================
     2. FEATURES THAT WORK WITHOUT ANIMATION
     ========================================================================== */

  /* Live local time (hero + footer) */
  function initClock() {
    const els = $$('.js-clock');
    if (!els.length) return;
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: CONFIG.timeZone, hour: '2-digit', minute: '2-digit' });
    const update = () => { const t = fmt.format(new Date()); els.forEach((el) => { el.textContent = t; }); };
    update();
    setInterval(update, 10000);
  }

  function initYear() {
    $$('.js-year').forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  /* Mobile menu */
  const menu = $('#menu');
  const toggle = $('.nav__toggle');

  function openMenu() {
    if (!menu) return;
    menuOpen = true;
    menu.classList.add('is-open');
    menu.removeAttribute('inert');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    $('.nav__toggle-label', toggle).textContent = 'Close';
    $('.nav').classList.remove('is-hidden');
    if (lenis) lenis.stop(); else root.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    menu.setAttribute('inert', '');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    $('.nav__toggle-label', toggle).textContent = 'Menu';
    if (lenis) lenis.start(); else root.style.overflow = '';
  }

  function initMenu() {
    if (!menu || !toggle) return;
    toggle.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
    $$('a', menu).forEach((a) => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { closeMenu(); toggle.focus(); } });
  }

  /* Clicking a service row pre-selects that service in the contact form */
  function initServiceLinks() {
    $$('[data-service]').forEach((link) => {
      link.addEventListener('click', () => {
        const input = $(`.js-contact-form input[name="services"][value="${link.dataset.service}"]`);
        if (input) input.checked = true;
      });
    });
  }

  /* Contact form: Netlify Forms via fetch, with an email-app fallback */
  function initForm() {
    const form = $('.js-contact-form');
    if (!form) return;
    const status = $('.form__status', form);
    const button = $('[type="submit"]', form);

    const setStatus = (msg, state = '') => {
      status.textContent = msg;
      status.className = 'form__status' + (state ? ' ' + state : '');
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      const data = new FormData(form);
      if (data.get('bot-field')) return; // spam trap

      button.disabled = true;
      setStatus('Sending…');

      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(data).toString(),
        });
        if (!res.ok) throw new Error('Form endpoint returned ' + res.status);
        form.reset();
        setStatus("Message sent. I'll reply within one working day.", 'is-success');
      } catch (err) {
        // Host has no form handling → open the visitor's email app, pre-filled
        const services = data.getAll('services').join(', ') || 'Not specified';
        const subject = `Project enquiry from ${data.get('name')}`;
        const body = [
          `Name: ${data.get('name')}`,
          `Email: ${data.get('email')}`,
          `Needs: ${services}`,
          `Budget: ${data.get('budget') || 'Not specified'}`,
          '',
          data.get('message'),
        ].join('\n');
        window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setStatus(`Your email app should open with the message ready to send. If it doesn't, write to ${CONFIG.email}.`, 'is-error');
      } finally {
        button.disabled = false;
      }
    });
  }


  /* ==========================================================================
     3. SMOOTH SCROLL + ANCHORS
     ========================================================================== */
  function initSmoothScroll() {
    if (!CONFIG.smoothScroll || typeof window.Lenis === 'undefined') return;

    lenis = new window.Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    // Keep ScrollTrigger in sync with Lenis, and drive Lenis from GSAP's ticker
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function initAnchors() {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const hash = a.getAttribute('href');
        if (hash === '#' || hash.length < 2) return;
        const target = hash === '#top' ? 0 : $(hash);
        if (target === null) return;
        e.preventDefault();
        closeMenu();
        scrollToTarget(target);
      });
    });
  }


  /* ==========================================================================
     4. HERO
     ========================================================================== */
  const heroTitle = $('.hero__title');
  const heroState = { baseWdth: 125, shift: 0 }; // font width axis: base + scroll offset

  function applyHeroWidth() {
    if (heroTitle) heroTitle.style.setProperty('--wdth', (heroState.baseWdth + heroState.shift).toFixed(2));
  }

  /** Scale the name so its longest line fills the container edge to edge */
  function fitHero() {
    if (!heroTitle) return;
    const words = $$('.hero__word', heroTitle);
    heroState.baseWdth = window.innerWidth < 700 ? 82 : 125; // condensed letters on phones = taller type

    heroTitle.style.setProperty('--wdth', heroState.baseWdth);
    heroTitle.style.fontStretch = heroState.baseWdth + '%';
    heroTitle.style.fontSize = '100px';

    const widest = Math.max(...words.map((w) => w.getBoundingClientRect().width));
    const available = heroTitle.clientWidth;
    if (widest > 0) heroTitle.style.fontSize = Math.floor((100 * available) / widest * 0.995) + 'px';

    applyHeroWidth();
  }

  function prepareHero() {
    if (!heroTitle) return [];
    return $$('.hero__word', heroTitle).flatMap(splitChars);
  }

  /** Letters thin out near the cursor (variable-font weight axis) */
  function initHeroProximity(chars) {
    if (!finePointer || !chars.length) return;
    const hero = $('.hero');
    const current = chars.map(() => 900);
    let mx = -9999, my = -9999, raf = null;

    const tick = () => {
      raf = null;
      const radius = Math.max(220, window.innerWidth * 0.18);
      const rects = chars.map((c) => c.getBoundingClientRect()); // read first…
      let moving = false;
      chars.forEach((c, i) => {                                    // …then write
        const r = rects[i];
        const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
        let f = Math.max(0, 1 - d / radius);
        f = f * f * (3 - 2 * f); // smoothstep
        const target = 900 - 720 * f;
        current[i] += (target - current[i]) * 0.14;
        if (Math.abs(target - current[i]) > 0.5) moving = true;
        c.style.setProperty('--wght', current[i].toFixed(1));
      });
      if (moving) raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    hero.addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; kick(); });
    hero.addEventListener('pointerleave', () => { mx = my = -9999; kick(); });
  }

  /** On scroll away: the name condenses (width axis), drifts apart and sinks */
  function initHeroScroll() {
    if (!heroTitle) return;
    const minWdth = 64;
    // fromTo everywhere so values stay correct when ScrollTrigger re-measures
    gsap.timeline({
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    })
      .fromTo(heroState, { shift: 0 }, {
        shift: () => minWdth - heroState.baseWdth,
        ease: 'none',
        onUpdate: applyHeroWidth,
      }, 0)
      .fromTo(heroTitle, { yPercent: 0 }, { yPercent: 30, ease: 'none' }, 0)
      .fromTo('.hero__line:first-child', { xPercent: 0 }, { xPercent: -5, ease: 'none' }, 0)
      .fromTo('.hero__line--right', { xPercent: 0 }, { xPercent: 5, ease: 'none' }, 0)
      .fromTo(['.hero__meta', '.hero__foot'], { opacity: 1, y: 0 }, { opacity: 0, y: -60, ease: 'none', duration: 0.55 }, 0); // fades out before the name sinks into it
  }


  /* ==========================================================================
     5. LOADER + INTRO
     ========================================================================== */
  function runIntro(chars) {
    const loader = $('.loader');
    const tl = gsap.timeline();

    // Start states (the loader hides them, so there's no flash)
    gsap.set(chars, { yPercent: 118, rotateX: -80, opacity: 0, transformPerspective: 900, transformOrigin: '50% 100%' });
    gsap.set(['.hero__meta > *', '.hero__foot > *'], { y: 40, opacity: 0 });
    const nav = $('.nav');
    nav.style.transition = 'none'; // CSS transition would fight the tween
    gsap.set(nav, { yPercent: -100 });

    if (loader && CONFIG.showLoader) {
      if (!location.hash) window.scrollTo(0, 0);
      if (lenis) lenis.stop();

      const counter = $('.js-count', loader);
      const count = { v: 0 };

      tl.fromTo('.loader__name', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0)
        .to(count, {
          v: 100, duration: 1.7, ease: 'power3.inOut',
          onUpdate: () => { counter.textContent = Math.round(count.v); },
        }, 0)
        .fromTo('.loader__band', { scaleX: 0 }, { scaleX: 1, duration: 1.7, ease: 'power3.inOut' }, 0)
        .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, '+=0.15')
        .add(() => { loader.remove(); if (lenis) lenis.start(); });
    } else if (loader) {
      loader.remove();
    }

    const at = loader && CONFIG.showLoader ? '-=0.6' : 0;
    tl.to(chars, { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.5, stagger: 0.045, ease: 'expo.out' }, at)
      .to(nav, {
        yPercent: 0, duration: 1.1, ease: 'expo.out', clearProps: 'transform',
        onComplete: () => { nav.style.transition = ''; },
      }, '<0.35')
      .to('.hero__meta > *', { y: 0, opacity: 1, duration: 1.1, stagger: 0.08, ease: 'expo.out' }, '<0.1')
      .to('.hero__foot > *', { y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: 'expo.out' }, '<0.1');
  }


  /* ==========================================================================
     6. WORK
     ========================================================================== */
  function initWork() {
    const section = $('.work');
    if (!section) return;
    const track = $('.work__track', section);
    const pin = $('.work__pin', section);
    const projects = $$('.project', section);
    const mm = gsap.matchMedia();

    // Desktop: vertical scroll drives a horizontal track
    mm.add('(min-width: 900px)', () => {
      section.classList.add('work--horizontal');
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const slide = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => '+=' + distance(),
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      projects.forEach((p) => {
        const media = $('.project__media', p);
        const inner = $('.project__inner', p);
        const info = $('.project__info', p);

        // Wipe the visual in from the right as the card enters
        gsap.fromTo(media, { clipPath: 'inset(0% 0% 0% 100%)' }, {
          clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
          scrollTrigger: { trigger: p, containerAnimation: slide, start: 'left 100%', end: 'left 50%', scrub: true },
        });
        // Parallax inside the card
        gsap.fromTo(inner, { xPercent: -5 }, {
          xPercent: 5, ease: 'none',
          scrollTrigger: { trigger: p, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true },
        });
        // Text follows
        gsap.from(info.children, {
          y: 30, opacity: 0, duration: 1, stagger: 0.06, ease: 'expo.out',
          scrollTrigger: { trigger: p, containerAnimation: slide, start: 'left 72%', toggleActions: 'play none none reverse' },
        });
      });

      const end = $('.work__end', section);
      if (end) {
        gsap.from(end.children, {
          y: 40, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out',
          scrollTrigger: { trigger: end, containerAnimation: slide, start: 'left 80%', toggleActions: 'play none none reverse' },
        });
      }

      // The first card rises in as the section arrives
      if (projects[0]) {
        gsap.from(projects[0], { y: 120, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: section, start: 'top 65%', once: true } });
      }

      return () => section.classList.remove('work--horizontal');
    });

    // Mobile & tablet: stacked cards that unmask upwards
    mm.add('(max-width: 899px)', () => {
      projects.forEach((p) => {
        const media = $('.project__media', p);
        const inner = $('.project__inner', p);
        const info = $('.project__info', p);
        const st = { trigger: p, start: 'top 85%', once: true };
        gsap.fromTo(media, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out', scrollTrigger: st });
        gsap.fromTo(inner, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { ...st } });
        gsap.from(info.children, { y: 24, opacity: 0, duration: 1, stagger: 0.06, delay: 0.2, ease: 'expo.out', scrollTrigger: { ...st } });
      });
      const end = $('.work__end', section);
      if (end) gsap.from(end.children, { y: 30, opacity: 0, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: end, start: 'top 85%', once: true } });
    });
  }


  /* ==========================================================================
     7. REVEALS
     ========================================================================== */
  function initReveals() {
    // Headings: words slide up from behind a mask
    $$('[data-split]').forEach((el) => {
      const words = splitWords(el);
      gsap.from(words, {
        yPercent: 120, rotate: 3, duration: 1.3, stagger: 0.07, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    // Single elements: fade + rise
    $$('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        y: 50, opacity: 0, duration: 1.3, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    // Groups: children stagger in
    $$('[data-reveal-group]').forEach((group) => {
      gsap.from(group.children, {
        y: 40, opacity: 0, duration: 1.2, stagger: 0.09, ease: 'expo.out',
        scrollTrigger: { trigger: group, start: 'top 85%', once: true },
      });
    });

    // Paragraph that "reads itself": words darken with scroll position
    $$('[data-scrub-text]').forEach((el) => {
      const words = splitWords(el, 'sw');
      gsap.fromTo(words, { opacity: 0.13 }, {
        opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: 0.6 },
      });
    });

    // Xysta bands draw in, then slide sideways with scroll
    $$('.xysta[data-shift]').forEach((el) => {
      gsap.from(el, { scaleX: 0, transformOrigin: '0% 50%', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 95%', once: true } });
      gsap.fromTo(el, { '--shift': 0 }, {
        '--shift': parseFloat(el.dataset.shift) || 200, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }


  /* ==========================================================================
     8. MARQUEE — speeds up with scroll velocity, follows scroll direction
     ========================================================================== */
  function initMarquee() {
    const marquee = $('.marquee');
    const track = $('.marquee__track');
    const group = $('.marquee__group');
    if (!marquee || !track || !group) return;

    let x = 0, dir = 1, boost = 0, width = group.offsetWidth, visible = false;
    window.addEventListener('resize', () => { width = group.offsetWidth; });

    ScrollTrigger.create({
      trigger: marquee, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => { visible = self.isActive; },
      onUpdate: (self) => {
        dir = self.direction;
        boost = Math.min(Math.abs(self.getVelocity()) / 8, 900);
      },
    });

    gsap.ticker.add((time, delta) => {
      if (!visible) return;
      boost *= 0.93;
      x -= dir * (70 + boost) * (delta / 1000); // px per second
      if (x <= -width) x += width;
      if (x > 0) x -= width;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  }


  /* ==========================================================================
     9. PROCESS
     ========================================================================== */
  function initProcess() {
    const section = $('.process');
    if (!section) return;
    const steps = $$('.step', section);
    const navItems = $$('.process__nav li', section);
    const nums = $('.process__nums', section);
    const bar = $('.process__bar span', section);
    const rail = $('.process__rail span', section);
    let current = -1;

    section.classList.add('process--live');

    const setActive = (i) => {
      if (i === current) return;
      current = i;
      steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
      navItems.forEach((n, k) => n.classList.toggle('is-active', k === i));
      if (nums) gsap.to(nums, { yPercent: (-100 * i) / steps.length, duration: 1, ease: 'expo.out' });
    };

    steps.forEach((step, i) => {
      // Which step is in focus
      ScrollTrigger.create({
        trigger: step, start: 'top 55%', end: 'bottom 55%',
        onToggle: (self) => { if (self.isActive) setActive(i); },
      });

      // Line drawings draw themselves
      const paths = $$('.step__art path', step);
      gsap.set(paths, { strokeDashoffset: 1 });
      gsap.to(paths, {
        strokeDashoffset: 0, duration: 1.6, stagger: 0.12, ease: 'power2.inOut',
        scrollTrigger: { trigger: step, start: 'top 75%', once: true },
      });

      // Copy rises in
      gsap.from($$('.step__num, .step__title, .step__text, .step__list, .step__time', step), {
        y: 34, opacity: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out',
        scrollTrigger: { trigger: step, start: 'top 78%', once: true },
      });
    });

    setActive(0);

    const progress = { trigger: $('.process__steps', section), start: 'top 55%', end: 'bottom 55%', scrub: true };
    if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: progress });
    if (rail) gsap.fromTo(rail, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { ...progress, start: 'top 70%', end: 'bottom 70%' } });
  }


  /* ==========================================================================
     10. NAVIGATION — background after scroll, hides going down, progress bar
     ========================================================================== */
  function initNav() {
    const nav = $('.nav');
    const bar = $('.nav__progress');
    if (!nav) return;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        nav.classList.toggle('is-scrolled', y > 40);
        if (!menuOpen) nav.classList.toggle('is-hidden', self.direction === 1 && y > window.innerHeight * 0.8);
        if (bar) bar.style.transform = `scaleX(${self.progress})`;
      },
    });
  }


  /* ==========================================================================
     11. CURSOR, MAGNETIC BUTTONS, CARD TILT
     ========================================================================== */
  function initCursor() {
    if (!finePointer || !CONFIG.customCursor) return;
    const cursor = $('.cursor');
    if (!cursor) return;
    const dot = $('.cursor__dot', cursor);
    const ring = $('.cursor__ring', cursor);
    const label = $('.cursor__label', cursor);

    root.classList.add('has-cursor');
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });

    window.addEventListener('pointermove', (e) => {
      dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY);
      cursor.classList.remove('is-hidden');
    }, { passive: true });

    document.addEventListener('pointerover', (e) => {
      const view = e.target.closest('[data-cursor]');
      const text = e.target.closest('input[type="text"], input[type="email"], textarea');
      const link = e.target.closest('a, button, label, [data-magnetic]');
      if (view) label.textContent = view.dataset.cursor;
      cursor.classList.toggle('is-view', !!view);
      cursor.classList.toggle('is-text', !!text);
      cursor.classList.toggle('is-link', !view && !text && !!link);
    });

    root.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
    window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  }

  /* Elements with data-magnetic lean towards the pointer. Optional value = strength. */
  function initMagnetic() {
    if (!finePointer) return;
    $$('[data-magnetic]').forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.35;
      const inner = $('.btn__inner', el);
      const ease = { duration: 0.9, ease: 'elastic.out(1, 0.45)' };
      const x = gsap.quickTo(el, 'x', ease);
      const y = gsap.quickTo(el, 'y', ease);
      const ix = inner && gsap.quickTo(inner, 'x', ease);
      const iy = inner && gsap.quickTo(inner, 'y', ease);

      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        x(dx * strength); y(dy * strength);
        if (inner) { ix(dx * strength * 0.4); iy(dy * strength * 0.4); }
      });
      el.addEventListener('pointerleave', () => {
        x(0); y(0);
        if (inner) { ix(0); iy(0); }
      });
    });
  }

  /* Project visuals tilt in 3D towards the pointer */
  function initCardTilt() {
    if (!finePointer) return;
    $$('.project').forEach((p) => {
      const media = $('.project__media', p);
      gsap.set(media, { transformPerspective: 1400 });
      const rx = gsap.quickTo(media, 'rotationX', { duration: 0.9, ease: 'power3.out' });
      const ry = gsap.quickTo(media, 'rotationY', { duration: 0.9, ease: 'power3.out' });
      p.addEventListener('pointermove', (e) => {
        const r = media.getBoundingClientRect();
        rx(-((e.clientY - r.top) / r.height - 0.5) * 6);
        ry(((e.clientX - r.left) / r.width - 0.5) * 8);
      });
      p.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }


  /* ==========================================================================
     12. BOOT
     ========================================================================== */
  const loader = $('.loader');
  if (loader) loader.classList.add('is-controlled'); // JS is running: cancel the CSS failsafe

  initClock();
  initYear();
  initMenu();
  initServiceLinks();
  initForm();

  // No animation: libraries missing or visitor prefers reduced motion
  if (!animate) {
    root.classList.add('no-anim');
    if (loader) loader.remove();
    fitHero();
    window.addEventListener('resize', fitHero);
    if (document.fonts) document.fonts.ready.then(fitHero);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  initSmoothScroll();
  initAnchors();

  const chars = prepareHero();
  fitHero();
  ScrollTrigger.addEventListener('refreshInit', fitHero); // refit before every layout recalculation

  initWork();        // create the pinned section first so later triggers account for it
  initHeroScroll();
  initReveals();
  initMarquee();
  initProcess();
  initNav();
  initCursor();
  initMagnetic();
  initCardTilt();
  initHeroProximity(chars);
  runIntro(chars);

  // Refit + recalculate once the web font has loaded
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
