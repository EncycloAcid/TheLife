/* TheLife — motion helpers: screen transitions, count-ups, floating stat
 * changes and confetti. Everything is skipped when the phone asks for
 * reduced motion. Uses the Web Animations API (el.animate). */
TL.motion = (function () {
  var SPRING = 'cubic-bezier(.32, .72, 0, 1)';
  var COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF2D55', '#AF52DE', '#FFCC00', '#5AC8FA'];
  function reduced() {
    try { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  function can(el) { return el && el.animate && !reduced(); }

  // iOS-style navigation: push slides in from the right, pop from the left,
  // and opening a life zooms in slightly.
  function screenIn(el, kind) {
    if (!can(el)) return;
    var from = kind === 'push' ? 'translateX(32%)' : kind === 'pop' ? 'translateX(-24%)' : 'scale(.96)';
    el.animate([{ transform: from, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: kind === 'zoom' ? 420 : 380, easing: SPRING });
  }
  // Children rise into place one after another.
  function stagger(parent, step, from) {
    if (!can(parent)) return;
    Array.prototype.forEach.call(parent.children, function (c, i) {
      c.animate([{ transform: 'translateY(' + (from || 16) + 'px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480, delay: i * (step || 45), easing: SPRING, fill: 'backwards' });
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
    el.animate([{ transform: 'scale(1)' }, { transform: 'scale(' + (scale || 1.18) + ')' }, { transform: 'scale(1)' }], { duration: 380, easing: SPRING });
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
  return { reduced: reduced, screenIn: screenIn, stagger: stagger, countTo: countTo, floatText: floatText, pop: pop, confetti: confetti };
})();
