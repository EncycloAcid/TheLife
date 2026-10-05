/* TheLife — mind.js
 * The people in my life think and act for themselves.
 *  - Memory: they remember what I did to them (p.mem), hold grudges or
 *    forgive depending on their personality.
 *  - Opinion: how they see me, from our relationship, those memories, their
 *    traits and my own life (jealous people resent my success, kind people
 *    care about my karma, greedy people like me rich).
 *  - Initiative: every year a few of them reach out: invitations, gifts,
 *    visits when I'm sick or locked up, gossip, jealousy, loan requests,
 *    favors, secrets, confrontations and business pitches.
 *  - Their own lives: promotions, layoffs, moves, weddings, babies, health scares.
 * Loans (p.owe) and investments (p.venture) pay off, or don't, years later.
 */
TL.mind = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function def(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
  function has(p, t) { return (p.traits || []).indexOf(t) >= 0; }
  function anc() { return !!(TL.ancient && TL.ancient.on()); }
  function they(p) { return p.gender === 'M' ? 'he' : 'she'; }
  function them(p) { return p.gender === 'M' ? 'him' : 'her'; }
  function their(p) { return p.gender === 'M' ? 'his' : 'her'; }
  function my(p) { var r = p.role; return ['mother', 'father', 'sibling', 'grandparent', 'grandchild', 'in-law', 'spouse', 'partner', 'fiance', 'child', 'stepmother', 'stepfather', 'ex', 'coworker', 'friend', 'best friend'].indexOf(r) >= 0 ? 'my ' + E.relWord(p) + ' ' + p.first : p.first; }
  function My(p) { var t = my(p); return t.charAt(0).toUpperCase() + t.slice(1); }

  var CLOSE = ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'grandparent', 'spouse', 'partner', 'fiance', 'friend', 'best friend', 'child', 'ex', 'coworker'];
  var LOVE = ['spouse', 'partner', 'fiance'];
  function circle() { return S().people.filter(function (p) { return p.alive && CLOSE.indexOf(p.role) >= 0 && p.age >= 14 && !(p.role === 'child' && p.age < 18); }); }

  // ------------------------------------------------------------ memory
  // What I did, in the words they'd use to remember it.
  var PAST = { 'Couples counseling': 'went to couples counseling with ~', 'Insult': 'insulted ~', 'Argue': 'argued with ~', 'Prank': 'pranked ~', 'Compliment': 'complimented ~', 'Give a gift': 'gave ~ a gift', 'Give money': 'gave ~ money', 'Hug': 'hugged ~', 'Spend time': 'spent time with ~', 'Have a conversation': 'had a heart-to-heart with ~', 'Ask for money': 'asked ~ for money', 'Go out partying': 'went out partying with ~', 'Date night': 'took ~ on a date night', 'Sue': 'sued ~', 'Propose': 'proposed to ~', 'Plan the wedding': 'planned our wedding', 'Befriend': 'befriended ~', 'Ask out': 'asked ~ out', 'Try to rekindle': 'tried to win ~ back', 'Read a bedtime story': 'read ~ bedtime stories', 'Help with homework': 'helped ~ with homework', 'Ask for a car': 'asked ~ for a car' };
  var ctx = null;
  function wrap(p, items) {
    items.forEach(function (it) {
      if (!it.onClick || it.mindWrapped) return;
      var f = it.onClick; it.mindWrapped = true;
      it.onClick = function () { ctx = { pid: p.id, label: it.label, t: Date.now() }; return f.apply(this, arguments); };
    });
    return items;
  }
  function phrase(label, d, p) {
    var t = PAST[label];
    if (!t) return d < 0 ? 'we had a falling-out' : 'I was good to ~';
    if (d < 0 && /complimented|hugged|spent time|heart-to-heart|partying|date night|gift|counseling/.test(t)) t += ', and it went badly';
    return t;
  }
  // [year, effect, what, forgiven, theirs]: "theirs" marks things they did to me.
  function note(p, d, what, theirs) {
    if (!p || !d) return;
    var y = S().year, m = p.mem = p.mem || [], last = m[m.length - 1];
    if (last && last[0] === y && last[2] === what) { last[1] += Math.round(d); return; }
    m.push([y, Math.round(d), what, 0, theirs ? 1 : 0]);
    if (m.length > 10) m.shift();
  }
  var rawRel = E.rel;
  E.rel = function (p, d) {
    rawRel(p, d);
    if (ctx && Date.now() - ctx.t > 120000) ctx = null;
    if (ctx && p && ctx.pid === p.id && Math.abs(d) >= 3) note(p, d, phrase(ctx.label, d, p));
  };
  // An event's outcome isn't something I chose from their menu.
  var rawResolve = TL.events.resolve;
  TL.events.resolve = function () { ctx = null; return rawResolve.apply(this, arguments); };
  function recent(p, yrs) { var y = S().year; return (p.mem || []).filter(function (m) { return y - m[0] <= (yrs || 6) && !m[3] && !m[4]; }); }
  function grudge(p) { return recent(p).reduce(function (t, m) { return t + Math.min(0, m[1]); }, 0); }
  function warmth(p) { return recent(p).reduce(function (t, m) { return t + Math.max(0, m[1]); }, 0); }
  function worst(p) { return recent(p).filter(function (m) { return m[1] < 0; }).sort(function (a, b) { return a[1] - b[1]; })[0]; }
  function best(p) { return recent(p).filter(function (m) { return m[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; })[0]; }
  function fill(t, p) { return t.replace(/~/g, them(p)); }

  // ------------------------------------------------------------ opinion
  // How they see me, and the biggest reason why.
  function opinion(p) {
    var s = S(), v = p.rel + grudge(p) * 0.4 + Math.min(15, warmth(p) * 0.2), why = null;
    var richer = s.money > Math.max(E.$(50000), (p.money || 0) * 5);
    if (has(p, 'Jealous') && (s.fame >= 30 || richer)) { v -= Math.min(20, 6 + s.fame / 5); why = 'jealous of my ' + (s.fame >= 30 ? 'fame' : 'money'); }
    if (has(p, 'Greedy') && richer) { v += 8; why = why || 'likes that I have money'; }
    if (has(p, 'Kind')) { v += ((s.karma || 50) - 50) / 4; if ((s.karma || 50) < 30) why = why || 'disappointed in the person I\'ve become'; }
    if (has(p, 'Ambitious') && (s.fame >= 40 || richer)) { v += 6; why = why || 'impressed by my success'; }
    if (has(p, 'Mean')) v -= 6;
    if (p.owe && !p.owe.paid) { v += has(p, 'Loyal') || has(p, 'Kind') ? 4 : -3; why = why || (has(p, 'Loyal') || has(p, 'Kind') ? 'grateful for the loan' : 'awkward about the money ' + they(p) + ' owes me'); }
    var w = worst(p), b = best(p);
    if (w && w[1] <= -8) why = 'still upset that I ' + fill(w[2], p) + ' (' + w[0] + ')';
    else if (!why && b && b[1] >= 6) why = 'remembers that I ' + fill(b[2], p) + ' (' + b[0] + ')';
    v = U.clamp(Math.round(v), 0, 100);
    var word = v >= 85 ? 'Adores me' : v >= 70 ? 'Thinks highly of me' : v >= 50 ? 'Likes me' : v >= 35 ? 'Lukewarm about me' : v >= 20 ? 'Fed up with me' : 'Can\'t stand me';
    return { v: v, word: word, why: why };
  }
  function mood(p) { var h = p.happy; return h >= 75 ? 'Happy' : h >= 50 ? 'Content' : h >= 30 ? 'Stressed' : 'Miserable'; }

  function card(p) {
    if (!p.alive || p.age < 6) return '';
    var o = opinion(p), mem = (p.mem || []).slice(-3).reverse();
    var html = '<div class="mind"><div class="hb-arch">💭 ' + mood(p) + ' · ' + o.word + '</div><p class="small">“' + U.esc(greeting(p)) + '”</p>';
    if (o.why) html += '<p class="small muted">' + U.esc(U.cap ? U.cap(o.why) : o.why) + '.</p>';
    if (p.owe && !p.owe.paid) html += '<p class="small muted">💵 Owes me ' + E.fmt(p.owe.amt) + ' since ' + p.owe.year + '.</p>';
    if (p.venture && !p.venture.done) html += '<p class="small muted">📈 I invested ' + E.fmt(p.venture.amt) + ' in ' + their(p) + ' ' + p.venture.what + ' (' + p.venture.year + ').</p>';
    if (mem.length) html += '<p class="small muted">Remembers: ' + mem.map(function (m) { return (m[1] >= 0 ? '👍 ' : '👎 ') + U.esc(m[4] ? U.cap(they(p)) + ' ' + m[2] : 'I ' + fill(m[2], p)) + ' (' + m[0] + ')'; }).join(' · ') + '</p>';
    return html + '</div>';
  }

  // ------------------------------------------------------------ their lives
  function lifeNews(p) {
    var s = S(), a = p.age, emp = p.job && !/Unemployed|Student|Retired|Toddler|Child/.test(p.job), opts = [];
    if (emp && a >= 22 && a < 65 && !(p.promoY && s.year - p.promoY < 4)) opts.push([has(p, 'Ambitious') ? 2.5 : 1, function () { p.promoY = s.year; p.money = Math.round(p.money * 1.2 + E.$(U.rand(3000, 15000))); p.happy = U.clamp(p.happy + 10, 0, 100); return ['📣 ' + My(p) + ' got promoted at work.', '']; }]);
    if (emp && a >= 20 && a < 64 && !anc() && !(p.promoY && s.year - p.promoY < 2)) opts.push([has(p, 'Lazy') ? 1 : 0.35, function () { p.job = 'Unemployed'; p.happy = U.clamp(p.happy - 15, 0, 100); return ['📣 ' + My(p) + ' lost ' + their(p) + ' job.', '']; }]);
    if (p.job === 'Unemployed' && a < 60) opts.push([2, function () { var nj = 'Clerk'; for (var t = 0; t < 12 && E.npcJob; t++) { var j = E.npcJob(Math.max(a, 23)); if (['Unemployed', 'Student', 'University Student', 'Retired', 'Toddler', 'Child'].indexOf(j) < 0) { nj = j; break; } } p.job = nj; p.happy = U.clamp(p.happy + 10, 0, 100); return ['📣 ' + My(p) + ' found a new job as ' + (/^[AEIOU]/.test(p.job) ? 'an ' : 'a ') + p.job.toLowerCase() + '.', '']; }]);
    if (['friend', 'best friend', 'sibling'].indexOf(p.role) >= 0 && !p.married && a >= 22 && a <= 50) opts.push([0.8, function () { p.married = true; p.happy = U.clamp(p.happy + 15, 0, 100); return ['💒 ' + My(p) + ' got married. ' + (p.rel >= 60 ? 'I was there to celebrate.' : 'I found out afterward.'), p.rel >= 60 ? 'good' : '']; }]);
    if (['friend', 'best friend', 'sibling'].indexOf(p.role) >= 0 && p.married && a >= 22 && a <= 42 && (p.kids || 0) < 3) opts.push([0.8, function () { p.kids = (p.kids || 0) + 1; return ['👶 ' + My(p) + ' had a baby' + (p.kids > 1 ? ', number ' + p.kids : '') + '.', 'good']; }]);
    if (['friend', 'best friend'].indexOf(p.role) >= 0 && a >= 20 && !p.away) opts.push([0.5, function () { p.away = s.year; E.rel(p, -6); return ['🧳 ' + My(p) + ' moved away. We promised to stay in touch.', '']; }]);
    if (a >= 50) opts.push([0.5 + (a - 50) / 30, function () { p.health = U.clamp(p.health - U.rand(10, 25), Math.min(1, p.health), 100); return ['🏥 ' + My(p) + ' had a health scare. ' + (p.rel >= 60 ? 'I was worried sick.' : ''), p.rel >= 60 ? 'bad' : '']; }]);
    if (emp && a >= 62) opts.push([1.5, function () { p.job = 'Retired'; p.happy = U.clamp(p.happy + 8, 0, 100); return ['🎉 ' + My(p) + ' retired.', '']; }]);
    return opts;
  }

  // Their news, kept so they can bring it up when we talk.
  var NEWS = [[/promoted/, 'promo'], [/lost \w+ job/, 'laidoff'], [/new job/, 'newjob'], [/got married/, 'married'], [/had a baby/, 'baby'], [/moved away/, 'moved'], [/health scare/, 'health'], [/retired/, 'retired']];
  function remember(p, text) { NEWS.forEach(function (n) { if (n[0].test(text)) { p.news = [S().year, n[1]]; } }); }

  // ------------------------------------------------------------ dialogue
  // Conversations: they answer in their own words, from their mood, their
  // news, what they remember about me and who they are.
  function ui() { return TL.ui; }
  function done(r) { return TL.actions.done(r); }
  function said(p, q) { return p.first + ': “' + q + '”'; }
  var MOOD_LINES = {
    Happy: ['Honestly? Things are really good right now.', 'Can\'t complain. Life\'s been kind to me lately.', 'I\'m in a great place. Thanks for asking!'],
    Content: ['Same old, same old. But good!', 'Busy, but I\'m doing fine.', 'Not bad at all. How about you?'],
    Stressed: ['I\'m hanging in there… barely.', 'Everything is a lot right now.', 'I haven\'t slept properly in weeks.'],
    Miserable: ['Not great, if I\'m being honest.', 'I don\'t really want to talk about it.', 'Some days I can barely get out of bed.']
  };
  var NEWS_LINES = { promo: 'I got promoted! I\'m finally getting paid what I\'m worth.', laidoff: 'I got laid off. I\'m trying not to panic.', newjob: 'I started a new job. Still learning everyone\'s names.', married: 'Married life is treating me well. Who knew?', baby: 'The baby doesn\'t sleep, so neither do I. But look at this picture!', moved: 'The new place is nice, but I miss everyone back home.', health: 'The doctors gave me a scare. I\'m okay, but it shook me.', retired: 'Retirement is wonderful. I nap whenever I want.' };
  var TRAIT_TAGS = { Funny: ' Anyway, did I tell you the one about the goat and the lawyer?', Ambitious: ' I\'ve got big plans for next year, though.', Greedy: ' Money\'s tight, but I\'ve got a few schemes going.', Romantic: ' I\'ve been thinking a lot about love lately.', Nerdy: ' I\'ve been reading about black holes, by the way. Fascinating.', Athletic: ' I\'m training for a race, too.', Artsy: ' I started painting again.', Cheerful: ' But hey, the sun\'s out!' };
  function howAreYou(p) {
    var y = S().year, md = mood(p), news = p.news && y - p.news[0] <= 2 ? NEWS_LINES[p.news[1]] : null, o = opinion(p), w = worst(p);
    var line = news || U.pick(MOOD_LINES[md]);
    if (w && w[1] <= -8 && !has(p, 'Kind')) line += ' And honestly, I\'m still hurt about the time you ' + theirWords(w[2], p) + '.';
    else if (o.v >= 80 && U.chance(0.5)) line += ' It\'s really good to talk to you.';
    var tags = (p.traits || []).filter(function (t) { return TRAIT_TAGS[t]; });
    if (tags.length && U.chance(0.5)) line += TRAIT_TAGS[U.pick(tags)];
    return { line: line, low: md === 'Stressed' || md === 'Miserable' || (p.news && /laidoff|health|moved/.test(p.news[1]) && y - p.news[0] <= 2), sore: !!(w && w[1] <= -8) };
  }
  // A memory in their words: "insulted ~" → "insulted me", "spilled her secret" → "spilled my secret".
  function theirWords(t, p) { return t.replace(/~/g, 'me').replace(new RegExp('\\b' + their(p) + '\\b', 'g'), 'my').replace(new RegExp('\\b' + they(p) + '\\b', 'g'), 'I'); }
  // Same pick all year for the same person, so their card doesn't change every time it redraws.
  function steady(p, arr) { var h = 0, k = String(p.id) + S().year; for (var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0; return arr[h % arr.length]; }
  function f0(p) { var k = 'talk' + p.id, y = S().yearActs || (S().yearActs = {}); y[k] = (y[k] || 0) + 1; return 1 / y[k]; }
  function talk(p, topics) {
    var opts = [], o = opinion(p), w = worst(p), others = S().people.filter(function (q) { return q.alive && q !== p && q.age >= 12 && /friend|sibling|coworker|ex|partner|spouse/.test(q.role); });
    opts.push({ label: 'Ask how ' + they(p) + '\'s really doing', fn: function () {
      var r = howAreYou(p), fct = f0(p);
      if (r.sore) { note(p, -1, 'reopened an old wound'); }
      if (!r.low && !r.sore) { E.rel(p, Math.round(U.rand(3, 6) * fct)); return done(said(p, r.line)); }
      ui().choose('💬 ' + p.first, said(p, r.line), [
        { label: r.sore ? 'Apologize for it' : 'Listen and comfort ' + them(p), fn: function () { if (r.sore) recent(p).forEach(function (m) { if (m[1] < 0) m[3] = 1; }); E.rel(p, Math.round((r.sore ? 10 : 8) * fct)); note(p, 6, r.sore ? 'apologized and meant it' : 'was there for ~ when ' + they(p) + ' was struggling'); p.happy = U.clamp(p.happy + 6, 0, 100); done(good(r.sore ? 'I apologized. ' + p.first + ' hugged me and said ' + they(p) + '\'d been waiting years to hear it.' : 'I mostly listened. ' + p.first + ' said ' + they(p) + ' felt lighter afterward.')); } },
        { label: 'Give ' + them(p) + ' advice', fn: function () { var ok = !has(p, 'Stubborn') && (me().smarts || 50) + U.rand(-30, 30) > 45; E.rel(p, Math.round((ok ? 6 : -3) * fct)); if (ok) p.happy = U.clamp(p.happy + 4, 0, 100); done(ok ? good('My advice actually helped. ' + p.first + ' said ' + they(p) + ' would try it.') : bad(p.first + ' didn\'t want solutions. ' + U.cap(they(p)) + ' wanted someone to listen.')); } },
        { label: 'Change the subject', fn: function () { E.rel(p, -2); done(p.first + ' noticed I changed the subject.'); } }
      ]);
    } });
    if (p.age >= 16 && me().age >= 12) opts.push({ label: 'Ask for ' + their(p) + ' advice', fn: function () {
      var wise = (p.smarts || 50) + (p.age >= 50 ? 15 : 0) + U.rand(-20, 20), fct = f0(p);
      E.rel(p, Math.round(4 * fct));
      if (wise >= 65) { E.stat('smarts', 2); E.stat('happy', 3); return done(good(said(p, U.pick(['Stop waiting for permission. Just start.', 'Save more than you think you need to.', 'People remember how you made them feel.', 'Sleep on big decisions. Every time.'])) + ' Good advice, actually.')); }
      if (wise < 35) return done(said(p, U.pick(['Just put it all on red.', 'Have you tried not worrying about it?', 'Text your ex. What\'s the worst that could happen?'])) + ' I won\'t be taking that advice.');
      return done(said(p, U.pick(['Do what makes you happy, I guess.', 'Honestly, I\'m figuring it out too.', 'Trust your gut.'])));
    } });
    if (others.length && p.age >= 12 && me().age >= 12) { var tgt = U.pick(others); opts.push({ label: 'Gossip about ' + tgt.first, fn: function () {
      var likes = has(p, 'Mean') || has(p, 'Jealous') || has(p, 'Outgoing'), prude = has(p, 'Kind') || has(p, 'Loyal'), fct = f0(p);
      if (prude && !likes) { E.rel(p, -4); E.karma(-1); return done(bad(said(p, 'I don\'t really like talking about people behind their backs.') + ' Awkward.')); }
      E.rel(p, Math.round((likes ? 7 : 3) * fct)); E.karma(-1);
      if (U.chance(0.2)) { E.rel(tgt, -10); note(tgt, -10, 'gossiped about ~'); return done(bad('We gossiped about ' + tgt.first + '… and it got back to ' + them(tgt) + '.')); }
      return done(said(p, U.pick(['No way. Tell me everything.', 'I KNEW something was going on there.', 'Okay, but you didn\'t hear it from me…'])) + ' We gossiped about ' + tgt.first + ' for an hour.');
    } }); }
    if (w && w[1] <= -6) opts.push({ label: 'Clear the air about the time I ' + fill(w[2], p).replace(/^I /, ''), fn: function () {
      var ok = !has(p, 'Stubborn') || U.chance(0.4);
      if (ok) { recent(p).forEach(function (m) { if (m[1] < 0) m[3] = 1; }); E.rel(p, 12); return done(good(said(p, 'Thank you for saying that. I forgive you.'))); }
      E.rel(p, 2); return done(said(p, 'I appreciate it. I\'m just not there yet.'));
    } });
    if (p.rel >= 60 && me().age >= 12) opts.push({ label: 'Tell ' + them(p) + ' what ' + they(p) + ' means to me', fn: function () {
      var fct = f0(p), shy = has(p, 'Shy') || has(p, 'Stubborn');
      E.rel(p, Math.round(9 * fct)); E.stat('happy', 3); note(p, 7, 'told ~ how much ' + they(p) + ' means to me');
      return done(good(said(p, shy ? 'Oh, stop. …I mean it, though. Same.' : U.pick(['You\'re going to make me cry. You mean a lot to me too.', 'Where is this coming from? I love you too, you weirdo.', 'I needed to hear that today.']))));
    } });
    // A couple of everyday topics from the old menu round it out.
    (topics || []).slice(0, 2).forEach(function (t) { opts.push(t); });
    ui().choose('💬 Talk to ' + p.first, (p.traits && p.traits.length ? p.first + ' is ' + p.traits.join(' and ').toLowerCase() + ', and seems ' + mood(p).toLowerCase() + '. ' : '') + 'What do we talk about?', opts.slice(0, 6));
  }
  // A line on their card: how they greet me.
  function greeting(p) {
    if (!p.alive || p.age < 4) return '';
    var o = opinion(p).v, md = mood(p);
    var l = steady(p, o >= 85 ? ['There you are! I was just thinking about you.', 'My favorite person!'] : o >= 65 ? ['Hey, you! Good to see you.', 'Oh nice, it\'s you.'] : o >= 45 ? ['Hey.', 'Oh, hi.'] : o >= 25 ? ['What do you want?', '…Hi.'] : ['Oh. It\'s you.', 'I\'m busy.']);
    if (md === 'Miserable' && o >= 45) l += ' Sorry, rough week.';
    return l;
  }

  // ------------------------------------------------------------ initiative
  // What someone might do this year, weighted by who they are and how they feel about me.
  function moves(p, evOk) {
    var s = S(), r = p.rel, o = opinion(p).v, out = [], adult = p.age >= 18, love = LOVE.indexOf(p.role) >= 0, fam = ['mother', 'father', 'grandparent', 'stepmother', 'stepfather'].indexOf(p.role) >= 0;
    if (s.prison) {
      if (has(p, 'Loyal') || r >= 70 || love) out.push([4, function () { E.stat('happy', 5); E.rel(p, 3); return ['🫂 ' + My(p) + ' came to visit me in prison.', 'good']; }]);
      return out;
    }
    if (o >= 50 && adult && me().age < 16) out.push([fam || p.role === 'sibling' ? 1.2 : 0, function () { E.stat('happy', 4); E.rel(p, 3); return ['🍦 ' + My(p) + ' took me ' + U.pick(['out for ice cream', 'to the park', 'to the movies', 'to the zoo', 'fishing']) + '. Best day ever.', 'good']; }]);
    if (o >= 50 && adult && me().age >= 16) out.push([has(p, 'Outgoing') || has(p, 'Funny') ? 2 : 0.6, function () { E.stat('happy', 3); E.rel(p, 3); return ['🍽️ ' + My(p) + ' invited me ' + U.pick(['over for dinner', 'out for the evening', 'to a get-together', 'to ' + their(p) + ' birthday party']) + '. ' + U.pick(['We had a great time.', 'It was just what I needed.', 'We stayed up way too late.']), 'good']; }]);
    if (o >= 60 && adult) out.push([has(p, 'Generous') || has(p, 'Kind') ? 1.5 : fam ? 0.8 : 0.3, function () { var g = E.$(U.rand(20, 400)); E.addMoney(g); E.stat('happy', 4); return ['🎁 ' + My(p) + ' surprised me with a gift' + (g >= E.$(100) ? ' and some cash (' + E.fmt(g) + ')' : '') + '.', 'good']; }]);
    if (me().health < 40 && (has(p, 'Kind') || has(p, 'Loyal') || fam || love) && o >= 40) out.push([4, function () { E.stat('health', 3); E.stat('happy', 5); E.rel(p, 2); return ['🍲 ' + My(p) + ' looked after me while I was unwell.', 'good']; }]);
    if (fam && (s.fame >= 30 || s.money >= E.$(1e6)) && o >= 50) out.push([1, function () { E.stat('happy', 4); return ['🥹 ' + My(p) + ' brags about me to anyone who will listen.', 'good']; }]);
    if (love && has(p, 'Romantic') && r >= 55) out.push([1.6, function () { E.stat('happy', 6); E.rel(p, 2); return ['💐 ' + My(p) + ' planned a surprise ' + U.pick(['weekend away', 'candlelit dinner', 'picnic', 'anniversary night']) + ' for us.', 'good']; }]);
    if (o < 45 && me().age >= 10) out.push([has(p, 'Mean') || has(p, 'Jealous') ? 0.9 : 0.15, function () { E.stat('happy', -3); E.rel(p, -2); return ['🗣️ I found out ' + my(p) + ' has been talking about me behind my back.', 'bad']; }]);
    if (has(p, 'Jealous') && (s.fame >= 30 || s.money > Math.max(E.$(50000), (p.money || 0) * 5))) out.push([1.6, function () { E.rel(p, -5); return ['😒 ' + My(p) + ' has gotten cold and distant. I think ' + they(p) + '\'s jealous of how well I\'m doing.', 'bad']; }]);
    // Bigger moments are choices (one a year).
    if (!evOk) return out;
    if (adult && r >= 30 && !p.owe && s.money >= E.$(2000) && me().age >= 18) out.push([(has(p, 'Greedy') ? 1.4 : 0.35) + (p.job === 'Unemployed' ? 2 : 0), ev('mind_borrow', p)]);
    if (adult && r >= 40 && me().age >= 16) out.push([0.7, ev('mind_favor', p)]);
    if (['friend', 'best friend', 'sibling'].indexOf(p.role) >= 0 && r >= 60 && me().age >= 14) out.push([0.6, ev('mind_confide', p)]);
    if (adult && me().age >= 14 && (o < 45 || grudge(p) <= -10)) out.push([has(p, 'Moody') || has(p, 'Stubborn') || has(p, 'Jealous') ? 1.4 : 0.3, ev('mind_confront', p)]);
    if (adult && has(p, 'Ambitious') && p.age >= 22 && p.age <= 60 && !p.venture && s.money >= E.$(15000) && me().age >= 18) out.push([1.2, ev('mind_pitch', p)]);
    if (love && has(p, 'Jealous') && (me().looks >= 65 || s.fame >= 30)) out.push([1.4, ev('mind_jealous', p)]);
    return out;
  }
  function ev(id, p) { var f = function () { S().pending.push({ id: id, data: { pid: p.id, year: S().year } }); return null; }; f.isEvent = true; return f; }
  function pickW(list) { var t = list.reduce(function (a, o) { return a + o[0]; }, 0), r = Math.random() * t; for (var i = 0; i < list.length; i++) { r -= list[i][0]; if (r <= 0) return list[i]; } return list[list.length - 1]; }

  // ------------------------------------------------------------ yearly
  function yearly() {
    var s = S();
    if (!s || s.dead) return;
    ctx = null;
    var ppl = circle(), y = s.year;
    // Debts come due.
    ppl.forEach(function (p) {
      var d = p.owe; if (!d || d.paid) return;
      var pr = U.clamp(0.25 + (has(p, 'Loyal') ? 0.2 : 0) + (has(p, 'Kind') ? 0.15 : 0) - (has(p, 'Greedy') ? 0.15 : 0) - (has(p, 'Lazy') ? 0.1 : 0) - (p.job === 'Unemployed' ? 0.15 : 0), 0.05, 0.8);
      if (y > d.year && U.chance(pr)) { d.paid = y; E.addMoney(d.amt); E.rel(p, 3); note(p, 5, 'paid me back', true); E.log('💵 ' + My(p) + ' paid back the ' + E.fmt(d.amt) + ' I lent ' + them(p) + '.', 'good'); }
      else if (y - d.year >= 5) { d.paid = -1; note(p, -6, 'never paid me back', true); E.stat('happy', -3); E.log('💸 ' + My(p) + ' never paid back the ' + E.fmt(d.amt) + '. I\'ve stopped expecting it.', 'bad'); }
    });
    // Investments in their ventures pay off, or don't.
    ppl.concat(s.people.filter(function (p) { return p.venture && !p.venture.done && ppl.indexOf(p) < 0; })).forEach(function (p) {
      var v = p.venture; if (!v || v.done || y < v.due) return;
      v.done = true;
      var win = U.chance(U.clamp(0.25 + (p.smarts || 50) / 250 + (has(p, 'Ambitious') ? 0.1 : 0) - (has(p, 'Lazy') ? 0.15 : 0), 0.1, 0.75));
      if (win) { var back = Math.round(v.amt * U.randf(1.5, 4.5)); v.back = back; E.addMoney(back); E.rel(p, 6); p.money += back; E.log('📈 ' + My(p) + '\'s ' + v.what + ' took off! My ' + E.fmt(v.amt) + ' stake paid me ' + E.fmt(back) + '.', 'good'); }
      else { v.back = 0; E.stat('happy', -4); E.log('📉 ' + My(p) + '\'s ' + v.what + ' went under. My ' + E.fmt(v.amt) + ' is gone.', 'bad'); }
    });
    // Grudges harden or fade.
    ppl.forEach(function (p) {
      var g = grudge(p); if (g > -12) return;
      if ((has(p, 'Kind') || has(p, 'Cheerful') || has(p, 'Loyal')) && U.chance(0.3)) {
        var w = worst(p); recent(p).forEach(function (m) { if (m[1] < 0) m[3] = 1; });
        E.rel(p, 6); E.log('🕊️ ' + My(p) + ' forgave me for the time I ' + fill(w[2], p) + '.', 'good');
      } else if (has(p, 'Stubborn') || has(p, 'Moody') || has(p, 'Jealous')) { E.rel(p, -2); if (U.chance(0.25)) E.log('❄️ ' + My(p) + ' still hasn\'t forgiven me for the time I ' + fill(worst(p)[2], p) + '.', ''); }
    });
    // A bit of news from their own lives.
    if (ppl.length && U.chance(0.45)) {
      var who = U.pick(ppl), news = lifeNews(who);
      if (news.length) { var n = pickW(news)[1](); E.log(n[0], n[1]); remember(who, n[0]); }
    }
    // Someone reaches out (or lashes out).
    var acts = 0, evDone = false;
    U.shuffle(ppl.slice()).forEach(function (p) {
      if (acts >= 2 || !p.alive || !U.chance(0.16 + (LOVE.indexOf(p.role) >= 0 ? 0.1 : 0))) return;
      var list = moves(p, !evDone && U.chance(0.5));
      if (!list.length) return;
      var f = pickW(list)[1], k0 = String(f).length + ':' + String(f).slice(30, 60);
      // Nobody does the same kind of thing every year (a move's source text identifies its kind).
      if (p.mv && p.mv[0] === k0 && S().year - p.mv[1] < 3) return;
      p.mv = [k0, S().year];
      if (f.isEvent) { evDone = true; f(); acts++; return; }
      var res = f(); if (res) { E.log(res[0], res[1]); acts++; }
    });
  }

  // ------------------------------------------------------------ events
  function pof(d) { var p = d && E.person(d.pid); return p && p.alive && d.year === S().year ? p : null; }
  def('mind_borrow', { build: function (d) {
    var p = pof(d); if (!p) return null;
    var amt = E.$(U.pick([300, 800, 1500, 3000, 5000, 10000])); if (amt > S().money * 0.5) amt = Math.max(E.$(100), Math.round(S().money * 0.2 / 100) * 100);
    var why = p.job === 'Unemployed' ? 'to cover rent after losing ' + their(p) + ' job' : U.pick(['to fix ' + their(p) + ' car', 'for a medical bill', 'to cover rent this month', 'to pay off a credit card', 'for a "can\'t-miss" opportunity']);
    if (anc()) why = U.pick(['to pay a debt', 'to buy seed for the spring', 'to repair ' + their(p) + ' roof']);
    return { icon: '💵', title: p.first + ' needs money', text: My(p) + ' asked to borrow ' + E.fmt(amt) + ' ' + why + '. ' + (has(p, 'Greedy') ? p.first + ' is not famous for paying people back.' : has(p, 'Loyal') ? p.first + ' has always kept ' + their(p) + ' word.' : ''), choices: [
      { label: 'Lend it', run: function () { if (S().money < amt) return 'I didn\'t actually have it to lend.'; E.addMoney(-amt); p.owe = { amt: amt, year: S().year }; E.rel(p, 8); note(p, 8, 'lent ~ money when ' + they(p) + ' needed it'); return good('I lent ' + p.first + ' ' + E.fmt(amt) + '. ' + U.cap(they(p)) + ' promised to pay me back.'); } },
      { label: 'Give it, no strings', run: function () { if (S().money < amt) return 'I didn\'t actually have it.'; E.addMoney(-amt); E.rel(p, 14); E.karma(2); note(p, 14, 'gave ~ money with no strings attached'); return good('I told ' + p.first + ' to keep it. ' + U.cap(they(p)) + ' teared up.'); } },
      { label: 'Say no', run: function () { var hit = has(p, 'Greedy') || has(p, 'Moody') ? -9 : -4; E.rel(p, hit); note(p, hit, 'refused to lend ~ money'); return hit < -5 ? bad('I said no. ' + p.first + ' did not take it well.') : 'I said no. ' + p.first + ' said ' + they(p) + ' understood.'; } }
    ] };
  } });
  def('mind_favor', { build: function (d) {
    var p = pof(d); if (!p) return null;
    var f = anc() ? U.pick(['help bring in ' + their(p) + ' harvest', 'help repair ' + their(p) + ' roof', 'look after ' + their(p) + ' animals for a week']) : U.pick(['help ' + them(p) + ' move apartments', 'drive ' + them(p) + ' to the airport at 5 a.m.', 'watch ' + their(p) + ' kids for the weekend', 'help ' + them(p) + ' paint ' + their(p) + ' living room', 'be ' + their(p) + ' wingman at a wedding', 'look over ' + their(p) + ' résumé']);
    return { icon: '🙏', title: 'A favor', text: My(p) + ' asked me to ' + f + (/\.$/.test(f) ? '' : '.'), choices: [
      { label: 'Help out', run: function () { E.stat('happy', -1); E.stat('health', -1); E.rel(p, 8); note(p, 8, 'helped ~ when ' + they(p) + ' asked'); return good('I helped ' + p.first + ' out. ' + U.pick(['' + U.cap(they(p)) + ' owes me one.', 'It felt good to be there for ' + them(p) + '.', 'Exhausting, but worth it.'])); } },
      { label: 'Make an excuse', run: function () { var caught = U.chance(0.35); E.rel(p, caught ? -8 : -3); note(p, caught ? -8 : -3, caught ? 'lied to get out of helping ~' : 'bailed when ' + they(p) + ' needed help'); return caught ? bad(p.first + ' found out my excuse was made up.') : 'I said I was busy. ' + p.first + ' found someone else.'; } }
    ] };
  } });
  def('mind_confide', { build: function (d) {
    var p = pof(d); if (!p) return null;
    var sec = U.pick(p.married ? [their(p) + ' marriage is falling apart', they(p) + '\'s drowning in debt', they(p) + '\'s been offered a job far away'] : [they(p) + '\'s been struggling with ' + their(p) + ' mental health', they(p) + '\'s secretly in love with someone we both know', they(p) + '\'s thinking of quitting ' + their(p) + ' job', they(p) + '\'s in serious debt']);
    return { icon: '🤫', title: 'A secret', text: My(p) + ' confided in me: ' + sec + '. ' + U.cap(they(p)) + ' made me promise not to tell anyone.', choices: [
      { label: 'Keep the secret and support ' + them(p), run: function () { E.rel(p, 9); E.karma(1); note(p, 9, 'kept ' + their(p) + ' secret'); return good('I listened, kept it to myself, and checked in on ' + p.first + ' all year.'); } },
      { label: 'Give some tough love', run: function () { var ok = !has(p, 'Stubborn') && !has(p, 'Moody'); E.rel(p, ok ? 5 : -4); note(p, ok ? 5 : -4, ok ? 'gave ~ honest advice' : 'lectured ~ when ' + they(p) + ' needed support'); return ok ? 'I gave ' + p.first + ' some honest advice. ' + U.cap(they(p)) + ' thanked me for not sugarcoating it.' : bad(p.first + ' wanted support, not a lecture.'); } },
      { label: 'Spill it to someone', run: function () { E.karma(-3); if (U.chance(0.6)) { E.rel(p, -25); note(p, -25, 'spilled ' + their(p) + ' secret'); return bad('Word got back to ' + p.first + '. ' + U.cap(they(p)) + ' may never trust me again.'); } E.stat('happy', 2); return 'I told someone. It felt good in the moment. ' + p.first + ' never found out… yet.'; } }
    ] };
  } });
  def('mind_confront', { build: function (d) {
    var p = pof(d); if (!p) return null;
    var w = worst(p), about = w ? 'the time I ' + fill(w[2], p) : U.pick(['me never being around', 'how I treat ' + them(p), 'something I said years ago', 'me always making everything about myself']);
    return { icon: '😤', title: 'Confrontation', text: My(p) + ' confronted me about ' + about + '. ' + (has(p, 'Stubborn') ? U.cap(they(p)) + ' isn\'t going to let this go easily.' : U.cap(they(p)) + ' seems more hurt than angry.'), choices: [
      { label: 'Apologize sincerely', run: function () { var ok = !has(p, 'Stubborn') || U.chance(0.5); recent(p).forEach(function (m) { if (ok && m[1] < 0) m[3] = 1; }); E.rel(p, ok ? 12 : 4); E.stat('happy', -1); return ok ? good('I apologized and meant it. We hugged it out.') : 'I apologized. ' + p.first + ' said ' + they(p) + '\'d need time.'; } },
      { label: 'Stand my ground', run: function () { var win = U.chance(has(p, 'Stubborn') ? 0.2 : 0.45); E.rel(p, win ? 2 : -8); note(p, win ? 0 : -8, 'refused to apologize to ~'); return win ? p.first + ' eventually admitted ' + they(p) + ' was overreacting.' : bad('Neither of us would back down. Things are frosty now.'); } },
      { label: 'Blow up at ' + them(p), run: function () { E.rel(p, -18); E.stat('happy', -4); note(p, -18, 'blew up at ~'); if (['friend', 'best friend'].indexOf(p.role) >= 0 && p.rel < 20) { p.role = 'former friend'; return bad('I lost my temper. ' + p.first + ' told me we\'re done as friends.'); } return bad('I lost my temper and said things I can\'t take back.'); } }
    ] };
  } });
  def('mind_pitch', { build: function (d) {
    var p = pof(d); if (!p) return null;
    var what = anc() ? U.pick(['trading venture', 'new workshop', 'tavern']) : U.pick(['startup', 'food truck', 'coffee shop', 'clothing brand', 'app', 'fitness studio', 'restaurant']);
    var amt = E.$(U.pick([5000, 10000, 25000, 50000])); if (amt > S().money * 0.4) amt = Math.max(E.$(1000), Math.round(S().money * 0.2 / 1000) * 1000);
    return { icon: '💼', title: 'Business pitch', text: My(p) + ' is starting ' + (/^[aeiou]/.test(what) ? 'an ' : 'a ') + what + ' and wants me to invest ' + E.fmt(amt) + '. ' + (p.smarts >= 70 ? U.cap(they(p)) + '\'s sharp, and the plan looks solid.' : p.smarts < 40 ? 'The plan is… mostly vibes.' : 'It could work.'), choices: [
      { label: 'Invest ' + E.fmt(amt), run: function () { if (S().money < amt) return 'I didn\'t have the cash.'; E.addMoney(-amt); p.venture = { amt: amt, year: S().year, due: S().year + U.rand(2, 4), what: what }; E.rel(p, 8); note(p, 8, 'believed in ' + their(p) + ' ' + what); return good('I\'m an investor in ' + p.first + '\'s ' + what + '. 📈'); } },
      { label: 'Wish ' + them(p) + ' luck', run: function () { E.rel(p, has(p, 'Moody') ? -4 : -1); return 'I passed on investing but wished ' + p.first + ' luck.'; } }
    ] };
  } });
  def('mind_jealous', { build: function (d) {
    var p = pof(d); if (!p) return null;
    return { icon: '👀', title: 'Jealousy', text: My(p) + ' has been acting jealous: ' + (anc() ? 'asking who I talk to at the market and why I come home late.' : 'going through my phone and asking who I\'ve been texting.'), choices: [
      { label: 'Reassure ' + them(p), run: function () { E.rel(p, 6); E.stat('happy', -1); return good('I told ' + p.first + ' there\'s nobody else. We talked it through.'); } },
      { label: 'Set a boundary', run: function () { var ok = U.chance(0.55); E.rel(p, ok ? 2 : -8); note(p, ok ? 2 : -8, 'called out ' + their(p) + ' jealousy'); return ok ? p.first + ' admitted ' + they(p) + ' was being insecure.' : bad(p.first + ' said I must have something to hide. We fought all night.'); } },
      { label: 'Get defensive', run: function () { E.rel(p, -12); E.stat('happy', -5); note(p, -12, 'snapped at ~'); return bad('I snapped. Now ' + p.first + ' is even more suspicious.'); } }
    ] };
  } });

  return { yearly: yearly, wrap: wrap, card: card, opinion: opinion, note: note, mood: mood, talk: talk };
})();
