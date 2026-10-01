/* TheLife — motion helpers: screen transitions, count-ups, floating stat
 * changes and confetti. Everything is skipped when the phone asks for
 * reduced motion. Uses the Web Animations API (el.animate). */
TL.motion = (function () {
  // Real spring curves, sampled from a damped harmonic oscillator into a
  // CSS linear() easing (Chrome 113+). Older WebViews keep the cubic-bezier
  // fallbacks defined in style.css.
  function springCurve(stiffness, damping) {
    var w0 = Math.sqrt(stiffness), zeta = damping / (2 * Math.sqrt(stiffness)), wd = w0 * Math.sqrt(Math.max(1e-6, 1 - zeta * zeta));
    function x(t) {
      if (zeta >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
      return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + (zeta * w0 / wd) * Math.sin(wd * t));
    }
    var T = 0.05; // settle time: last moment the curve is > 0.1% away from rest
    for (var t = 0; t < 3; t += 0.004) if (Math.abs(1 - x(t)) > 0.001) T = t;
    var pts = [];
    for (var i = 0; i <= 48; i++) pts.push(+x(T * i / 48).toFixed(4));
    pts[48] = 1;
    return { easing: 'linear(' + pts.join(', ') + ')', ms: Math.round(T * 1000) };
  }
  var SUPPORTS = false;
  try { SUPPORTS = !!(window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)')); } catch (e) { }
  // bouncy: playful pops; smooth: navigation and sheets (barely overshoots).
  var BOUNCY = springCurve(260, 17), SMOOTH = springCurve(210, 26);
  var SPRING = SUPPORTS ? SMOOTH.easing : 'cubic-bezier(.32, .72, 0, 1)';
  var BOUNCE = SUPPORTS ? BOUNCY.easing : 'cubic-bezier(.34, 1.56, .64, 1)';
  if (SUPPORTS) {
    var root = document.documentElement.style;
    root.setProperty('--spring', SMOOTH.easing); root.setProperty('--spring-ms', SMOOTH.ms + 'ms');
    root.setProperty('--bounce', BOUNCY.easing); root.setProperty('--bounce-ms', BOUNCY.ms + 'ms');
  }
  var COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF2D55', '#AF52DE', '#FFCC00', '#5AC8FA'];
  function reduced() {
    try { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  function can(el) { return el && el.animate && !reduced(); }

  // iOS-style navigation: push slides in from the right, pop from the left,
  // and opening a life zooms in slightly.
  // Both screens move together. Push: the new one slides in over the old,
  // which drifts left and dims. Pop: the reverse. Zoom: a soft scale + fade.
  function transition(oldEl, newEl, kind) {
    if (!can(newEl)) return;
    var dur = SUPPORTS ? SMOOTH.ms : 420, opts = { duration: dur, easing: SPRING };
    if (oldEl && oldEl !== newEl) {
      oldEl.classList.add('leaving');
      oldEl.style.zIndex = kind === 'pop' ? 2 : 0;
      var out = kind === 'push' ? [{ transform: 'none', filter: 'brightness(1)' }, { transform: 'translateX(-30%)', filter: 'brightness(.9)' }]
        : kind === 'pop' ? [{ transform: 'none' }, { transform: 'translateX(100%)' }]
        : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(1.03)' }];
      oldEl.animate(out, opts).onfinish = function () { oldEl.classList.remove('leaving'); oldEl.style.zIndex = ''; };
    }
    var inn = kind === 'push' ? [{ transform: 'translateX(100%)' }, { transform: 'none' }]
      : kind === 'pop' ? [{ transform: 'translateX(-30%)', filter: 'brightness(.9)' }, { transform: 'none', filter: 'brightness(1)' }]
      : [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }];
    newEl.animate(inn, opts);
  }
  // Children rise into place one after another.
  function stagger(parent, step, from) {
    if (!can(parent)) return;
    Array.prototype.forEach.call(parent.children, function (c, i) {
      c.animate([{ transform: 'translateY(' + (from || 16) + 'px) scale(.98)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: SUPPORTS ? BOUNCY.ms : 500, delay: i * (step || 45), easing: BOUNCE, fill: 'backwards' });
    });
  }
  // Animate a number shown in el from a to b; fmt turns a number into text.
  function countTo(el, a, b, fmt, ms) {
    el._count = (el._count || 0) + 1;
    var token = el._count;
    if (!can(el) || a === b || !isFinite(a) || !isFinite(b)) { el.textContent = fmt(b); return; }
    var t0 = null, dur = ms || 650;
    function frame(t) {
      if (token !== el._count) return;
      if (t0 == null) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(k < 1 ? a + (b - a) * e : b);
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  // A "+3" / "−2" bubble that floats up out of el.
  function floatText(el, text, up) {
    if (!can(el)) return;
    var b = document.createElement('span');
    b.className = 'floater ' + (up ? 'up' : 'down');
    b.textContent = text;
    el.appendChild(b);
    var anim = b.animate([
      { transform: 'translate(-50%, 6px) scale(.6)', opacity: 0 },
      { transform: 'translate(-50%, -10px) scale(1.08)', opacity: 1, offset: .25 },
      { transform: 'translate(-50%, -26px) scale(1)', opacity: 0 }
    ], { duration: 1300, easing: 'ease-out' });
    anim.onfinish = function () { b.remove(); };
  }
  function pop(el, scale) {
    if (!can(el)) return;
    // Jump up quickly, then let the spring settle it back.
    el.animate([{ transform: 'scale(' + (scale || 1.18) + ')' }, { transform: 'scale(1)' }], { duration: SUPPORTS ? BOUNCY.ms : 420, easing: BOUNCE });
  }
  // Confetti burst from the top of the screen.
  function confetti(n) {
    if (reduced() || !document.body.animate) return;
    var layer = document.createElement('div');
    layer.className = 'confetti';
    document.body.appendChild(layer);
    var W = window.innerWidth, H = window.innerHeight, left = 0;
    for (var i = 0; i < (n || 46); i++) {
      var p = document.createElement('i');
      var w = 6 + Math.random() * 6;
      p.style.cssText = 'left:' + (W / 2 + (Math.random() - .5) * 60) + 'px;width:' + w + 'px;height:' + (w * (Math.random() < .5 ? .45 : 1)) + 'px;background:' + COLORS[i % COLORS.length] + ';border-radius:' + (Math.random() < .3 ? '50%' : '2px');
      layer.appendChild(p);
      var dx = (Math.random() - .5) * W * 1.1, up = -(H * (.18 + Math.random() * .22)), down = H * (.75 + Math.random() * .3);
      var rot = (Math.random() - .5) * 1440, dur = 1500 + Math.random() * 1100;
      left++;
      p.animate([
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + dx * .55 + 'px,' + up + 'px) rotate(' + rot * .4 + 'deg)', opacity: 1, offset: .3 },
        { transform: 'translate(' + dx + 'px,' + down + 'px) rotate(' + rot + 'deg)', opacity: 0 }
      ], { duration: dur, easing: 'cubic-bezier(.2,.6,.4,1)', delay: Math.random() * 120 }).onfinish = function () { if (--left === 0) layer.remove(); };
    }
  }
  return { reduced: reduced, transition: transition, SPRING: SPRING, BOUNCE: BOUNCE, springMs: SUPPORTS ? SMOOTH.ms : 420, stagger: stagger, countTo: countTo, floatText: floatText, pop: pop, confetti: confetti };
})();
