/* TheLife — v1.13: the life recap shown on the death screen: a life grade,
 * the big moments of the life (pulled from the life log), life in numbers,
 * highlights from special careers, and who survives you. */
TL.recap = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  var LEAD = /^(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[☀-➿]|️|‍|[\uD83C][\uDDE6-\uDDFF])+\s*/;

  // [pattern, icon, weight, max per life]. Higher weight wins when an age is crowded.
  var MOMENTS = [
    [/^\S*\s*I was born/i, '👶', 10, 1],
    [/I graduated from (?!elementary)|I finished (?!middle)|earned my|degree in|passed the GED/i, '🎓', 8, 4],
    [/I married |I got married|we got married|we eloped/i, '💍', 9, 3],
    [/divorce/i, '💔', 6, 3],
    [/a baby (boy|girl) named|I adopted .*(son|daughter|boy|girl|child|twins)/i, '👶', 8, 6],
    [/selected me|Draft|drafted|signed with .* (NBA|WNBA|NFL|MLS|MLB)|professional .* player|I'm in the (NBA|WNBA)/i, '🏟️', 9, 2],
    [/scholarship/i, '🎓', 6, 1],
    [/state championship|national championship|won the .*(title|championship)|NBA championship|ring number/i, '🏆', 7, 3],
    [/Play Button|hit .* (subscribers|followers) on/i, '🎬', 7, 3],
    [/went VIRAL/i, '🔥', 5, 1],
    [/booked it|new face of a blockbuster/i, '🎬', 6, 3],
    [/billion-dollar hit|rave reviews/i, '🍿', 7, 3],
    [/won the (Super Bowl|World Series|Stanley Cup|Grey Cup|Walter Cup|Japan Series|Korean Series|.* title)|won (Wimbledon|the (Australian|French|US) Open)|Honors: .*(MVP|Ballon|Cy Young|Hart)|called up|World No. 1|traded to/i, '🏆', 8, 4],
    [/Hot 100|Billboard 200|Certified (Gold|Platinum|Diamond)|I signed with .*Records/i, '🎵', 7, 4],
    [/won the (Academy|Grammy|Pulitzer|Nobel|Emmy)|Oscar|MVP|Hall of Fame|All-American|All-State/i, '🏆', 8, 4],
    [/won the election|elected|sworn in|crowned|became (King|Queen)/i, '👑', 9, 3],
    [/promoted|I'm now an? |my career took off/i, '💼', 4, 3],
    [/I got the job|I was hired|landed a|I started working|I enlisted|sworn into/i, '💼', 5, 2],
    [/Medal|Purple Heart|commissioned/i, '🎖️', 7, 3],
    [/bought .*(house|home|condo|apartment|mansion|villa|townhouse|estate)/i, '🏠', 6, 2],
    [/won .*(lottery|jackpot)|JACKPOT/i, '🎰', 8, 1],
    [/sold my (channel|company|business)|IPO/i, '💰', 7, 1],
    [/I was sentenced|I was convicted/i, '⛓️', 7, 3],
    [/released from prison|I escaped/i, '🔓', 5, 2],
    [/moved to .* (to start|for)|emigrated|I moved to/i, '✈️', 6, 2],
    [/(mother|father|mom|dad|husband|wife|son|daughter) .*(died|passed away)/i, '🕊️', 6, 3],
    [/from space|spacewalk|Moon landing|lunar|Space Station/i, '🚀', 8, 1],
    [/published|bestseller/i, '📚', 5, 2],
    [/Achievement unlocked/i, '🏅', 2, 3],
    [/diagnosed with (cancer|leukemia|lymphoma|HIV|dementia|Alzheimer)/i, '🩺', 5, 2],
    [/retired/i, '🌅', 5, 1]
  ];
  var STAGES = [[0, 12, 'Childhood'], [13, 19, 'Teen years'], [20, 34, 'Young adult'], [35, 59, 'Midlife'], [60, 200, 'Golden years']];

  function moments() {
    var s = S(), used = {}, picked = [];
    (s.log || []).forEach(function (y) {
      var here = [];
      y.entries.forEach(function (e) {
        var t = String(e.t || '');
        if (e.c === 'money' || /^(Expenses|Income|Salary)/.test(t.replace(LEAD, ''))) return;
        for (var i = 0; i < MOMENTS.length; i++) {
          var mo = MOMENTS[i];
          if (!mo[0].test(t)) continue;
          if ((used[i] || 0) >= mo[3]) break;
          var lead = t.match(LEAD);
          here.push({ age: y.age, year: y.year, icon: lead ? lead[0].trim() : mo[1], text: t.replace(LEAD, ''), w: mo[2] + (e.c === 'good' ? 1 : 0), k: i });
          break;
        }
      });
      // At most two moments a year, the most important ones.
      here.sort(function (a, b) { return b.w - a.w; }).slice(0, 2).forEach(function (m) { used[m.k] = (used[m.k] || 0) + 1; picked.push(m); });
    });
    // Keep the life readable: the 18 biggest moments, in order.
    if (picked.length > 18) {
      var keep = picked.slice().sort(function (a, b) { return b.w - a.w; }).slice(0, 18);
      picked = picked.filter(function (m) { return keep.indexOf(m) >= 0; });
    }
    return picked;
  }
  function stages() {
    var ms = moments();
    return STAGES.map(function (st) {
      return { name: st[2], from: st[0], to: st[1], items: ms.filter(function (m) { return m.age >= st[0] && m.age <= st[1]; }) };
    }).filter(function (g) { return g.items.length; });
  }

  // A rough "how did it go" score out of 100, and a grade.
  function grade() {
    var s = S(), m = s.me, h = s.hist || [];
    var happy = h.length ? h.reduce(function (a, x) { return a + x[2]; }, 0) / h.length : m.happy;
    var nw = Math.max(0, E.netWorth()) / E.k();
    var fam = (E.people('spouse').length ? 8 : 0) + Math.min(12, E.people('child', true).length * 4) + Math.min(5, E.people('grandchild').length);
    var score = happy * 0.35 + Math.min(18, Math.log10(1 + nw) * 3) + fam + Math.min(10, s.ach.length) + (s.karma - 50) / 8 + s.fame / 12 + Math.min(10, m.age / 9) - Math.min(15, s.record.length * 4);
    score = U.clamp(Math.round(score), 0, 100);
    var g = score >= 85 ? ['A+', 'A legendary life'] : score >= 75 ? ['A', 'A life well lived'] : score >= 65 ? ['B', 'A good life'] : score >= 52 ? ['C', 'An ordinary life'] : score >= 40 ? ['D', 'A rough road'] : ['F', 'A hard life'];
    return { score: score, letter: g[0], title: g[1], happy: Math.round(happy) };
  }
  function peak() {
    var best = null;
    (S().hist || []).forEach(function (x) { if (!best || x[1] > best[1]) best = x; });
    return best;
  }
  function numbers() {
    var s = S(), m = s.me, deg = E.highestDegree(), pk = peak(), born = s.year - m.age;
    var kids = E.people('child', true), gk = E.people('grandchild');
    var careers = s.jobHistory.map(function (j) { return j.title; }).concat(s.job ? [E.jobTitle(s.job)] : []);
    var rows = [
      ['Born', born + (s.city ? ' · ' + s.city : '') + (s.birthCountry ? ', ' + s.birthCountry : '')],
      ['Lived', U.plural(m.age, 'year')],
      ['Net worth', E.fmt(E.netWorth())],
      ['Peak wealth', pk ? E.fmt(pk[1]) + ' at ' + pk[0] : '—'],
      ['Happiness', grade().happy + '% on average'],
      ['Education', E.degreeName(deg)],
      ['Career', careers.length ? careers[careers.length - 1] : TL.creator && TL.creator.title() ? TL.creator.title() : 'Never worked'],
      ['Jobs held', careers.length],
      ['Partner', E.people('spouse')[0] ? E.people('spouse')[0].first + ' ' + E.people('spouse')[0].last : s.counts.exes ? 'Single (' + U.plural(s.counts.exes, 'ex') + ')' : 'Never married'],
      ['Children', kids.length + (gk.length ? ' · ' + U.plural(gk.length, 'grandchild').replace('grandchilds', 'grandchildren') : '')],
      ['Countries', s.birthCountry && s.birthCountry !== s.country ? s.birthCountry + ' → ' + s.country : s.country],
      ['Trips', U.plural(s.counts.vacations || 0, 'vacation')],
      ['Fame', s.fame + '%' + (s.followers ? ' · ' + U.money(s.followers, '').replace(/^\$/, '') + ' followers' : '')],
      ['Record', s.record.length ? U.plural(s.record.length, 'conviction') : 'Clean'],
      ['Achievements', s.ach.length + ' this life'],
      ['Bucket list', s.bucket && s.bucket.length ? s.bucket.filter(function (b) { return b.done; }).length + ' of ' + s.bucket.length : '—']
    ];
    return rows;
  }
  // One line each for the big special careers this life had.
  function highlights() {
    var s = S(), out = [];
    if (s.hoops && s.hoops.seasons && s.hoops.seasons.length && TL.hoops) out.push(['🏀', 'Basketball', TL.hoops.summary() || 'Played basketball']);
    var sr = TL.sports && TL.sports.aboutRow(); if (sr) out.push([sr[0].split(' ')[0], 'School sports', sr[1]]);
    var ar = TL.acting && TL.acting.aboutRow(); if (ar) out.push(['🎬', 'Acting', ar[1]]);
    var mu = TL.music && TL.music.aboutRow(); if (mu) out.push(['🎵', 'Music', mu[1]]);
    var pr = TL.pro && TL.pro.aboutRow(); if (pr) out.push([pr[0].split(' ')[0], 'Pro sports', pr[1]]);
    var mr = TL.military && TL.military.aboutRow && TL.military.aboutRow(); if (mr) out.push(['🎖️', 'Military', mr[1]]);
    if (TL.creator) TL.creator.aboutRows().forEach(function (r) { out.push([r[0].split(' ')[0], r[0].replace(/^\S+\s/, ''), r[1]]); });
    if (s.awards && s.awards.length) out.push(['🏆', 'Awards', s.awards.map(function (a) { return a.award; }).slice(0, 3).join(', ') + (s.awards.length > 3 ? ' +' + (s.awards.length - 3) : '')]);
    if (s.books && s.books.length) out.push(['📚', 'Books', U.plural(s.books.length, 'book') + ', including "' + s.books[0].title + '"']);
    if (s.royal) out.push(['👑', 'Royalty', TL.features.royalTitle() || 'Royal']);
    var hr = TL.history && TL.history.aboutRow(); if (hr) out.unshift(hr);
    if (TL.ancient && TL.ancient.on()) out = TL.ancient.recapRow().concat(out);
    if (s.mob) out.push(['🕴️', 'Organized crime', 'Rose to rank ' + (s.mob.rank || 0)]);
    return out;
  }
  function survivors() {
    var order = ['spouse', 'partner', 'fiance', 'child', 'grandchild', 'mother', 'father', 'sibling', 'best friend'];
    var out = [];
    order.forEach(function (r) {
      E.people(r).forEach(function (p) { if (out.length < 12) out.push({ name: p.first, role: TL.actions.roleLabel ? TL.actions.roleLabel(p) : r, age: p.age, icon: TL.actions.personIcon ? TL.actions.personIcon(p) : '🙂' }); });
    });
    return out;
  }
  function html() {
    var g = grade(), st = stages(), hl = highlights(), sv = survivors(), s = S(), m = s.me;
    var h = '';
    h += '<div class="rc-grade"><div class="rc-letter g-' + g.letter.charAt(0) + '">' + g.letter + '</div><div><b>' + g.title + '</b><br><span class="muted">Life score ' + g.score + ' / 100</span></div></div>';
    h += '<h3 class="rc-h">Life in numbers</h3><div class="dstats">' + numbers().map(function (r) { return '<div class="dstat"><small>' + r[0] + '</small><b>' + U.esc(String(r[1])) + '</b></div>'; }).join('') + '</div>';
    if (hl.length) h += '<h3 class="rc-h">Highlights</h3><div class="rc-list">' + hl.map(function (x) { return '<div class="rc-row"><span class="rc-ico">' + x[0] + '</span><div><b>' + U.esc(x[1]) + '</b><br><span class="muted">' + U.esc(x[2]) + '</span></div></div>'; }).join('') + '</div>';
    if (st.length) {
      h += '<h3 class="rc-h">The big moments</h3><div class="rc-time">';
      st.forEach(function (g2) {
        h += '<div class="rc-stage"><div class="rc-stage-h">' + g2.name + '</div>';
        g2.items.forEach(function (it) { h += '<div class="rc-ev"><span class="rc-age">' + it.age + '</span><span class="rc-dot">' + it.icon + '</span><span class="rc-txt">' + U.esc(it.text) + '</span></div>'; });
        h += '</div>';
      });
      h += '</div>';
    }
    h += '<h3 class="rc-h">Survived by</h3>' + (sv.length ? '<div class="rc-chips">' + sv.map(function (p) { return '<span class="rc-chip">' + p.icon + ' ' + U.esc(p.name) + ' <small>' + U.esc(p.role) + '</small></span>'; }).join('') + '</div>' : '<p class="muted">' + m.first + ' left no surviving family.</p>');
    return h;
  }
  return { html: html, grade: grade, moments: moments, stages: stages, numbers: numbers, highlights: highlights, survivors: survivors };
})();
