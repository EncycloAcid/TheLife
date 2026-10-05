/* TheLife — v2.19: pro wrestling, expanded. Start on the indies or in a
 * territory, pick a gimmick and a ring name, and work your way up a real
 * promotion of your era (territories, the NWA, the WWWF/WWF/WWE, WCW, ECW,
 * TNA, Ring of Honor, New Japan, AEW). Card position comes from your push,
 * which follows the crowd (popularity), momentum and how management sees you.
 * Feud with real stars of the time, get rated in stars like the Wrestling
 * Observer, win real belts and keep a title history, enter the Royal Rumble
 * or cash in Money in the Bank, decide what to do when the finish is called
 * at the year's biggest show, turn face or heel, get repackaged, form a tag
 * team, ride out contract years and free agency (the Monday Night War
 * bidding, AEW's arrival), wear your body down, and retire into the Hall of
 * Fame. State: S().wr. The job is the special career 'wrestler'
 * (js/specials.js), whose menu and yearly update come here. */
TL.wrestling = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function yr() { return S().year; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function count(k) { var y = S().yearActs || (S().yearActs = {}); return y[k] || 0; }
  function bump(k) { var y = S().yearActs || (S().yearActs = {}); y[k] = (y[k] || 0) + 1; }
  function last(k) { var y = S().lastActs || {}; return y[k] || 0; }
  function F() { return me().gender === 'F'; }
  function x() { return S().wr; }
  function cl(v, a, b) { return U.clamp(v, a == null ? 0 : a, b == null ? 100 : b); }
  function an(w) { return (/^[AEIOU]/.test(w) ? 'an ' : 'a ') + w; }

  // ------------------------------------------------------------ promotions
  // tier: 1 small, 2 national cult, 3 major. women: has a women's division.
  var P = {
    indie: { tier: 1, from: 1900, women: true, pay: 20000 },
    territory: { tier: 1, from: 1900, to: 1988, women: true, pay: 40000 },
    nwa: { tier: 2, from: 1948, to: 1993, women: true, pay: 120000 },
    wwf: { tier: 3, from: 1963, women: true, pay: 450000 },
    wcw: { tier: 3, from: 1988, to: 2001, women: true, pay: 300000 },
    ecw: { tier: 2, from: 1993, to: 2001, women: false, pay: 60000 },
    njpw: { tier: 2, from: 1972, women: false, pay: 150000 },
    tna: { tier: 2, from: 2002, women: true, pay: 100000 },
    roh: { tier: 2, from: 2002, women: true, pay: 60000 },
    aew: { tier: 3, from: 2019, women: true, pay: 360000 }
  };
  function pname(id) {
    var y = yr();
    return { indie: 'the independent circuit', territory: 'a regional territory', nwa: 'the NWA', wwf: y < 1979 ? 'the WWWF' : y < 2002 ? 'the WWF' : 'WWE', wcw: 'WCW', ecw: 'ECW', njpw: 'New Japan Pro-Wrestling', tna: y >= 2017 && y < 2024 ? 'Impact Wrestling' : 'TNA', roh: 'Ring of Honor', aew: 'AEW' }[id];
  }
  function short(id) { return pname(id).replace(/^the /, ''); }
  function open(id) { var p = P[id]; return yr() >= p.from && (!p.to || yr() <= p.to) && (!F() || p.women || (id === 'njpw' && yr() >= 2022)); }
  function boss(id) {
    var y = yr();
    return { wwf: y < 1982 ? 'Vincent J. McMahon' : y < 2022 ? 'Vince McMahon' : 'Triple H', wcw: y >= 1993 && y <= 1999 ? 'Eric Bischoff' : 'WCW management', nwa: 'Jim Crockett', ecw: 'Paul Heyman', aew: 'Tony Khan', tna: y < 2017 ? 'Dixie Carter' : 'the TNA office', roh: y >= 2022 ? 'Tony Khan' : 'the ROH bookers', njpw: y <= 2005 ? 'Antonio Inoki' : 'the NJPW office', territory: 'the local promoter', indie: 'indie promoters' }[id];
  }
  // [world, midcard, second midcard, tag]
  function belts(id) {
    var y = yr(), w = F();
    var B = {
      wwf: [w ? (y >= 2016 ? 'WWE Women\'s Championship' : (y < 2002 ? 'WWF' : 'WWE') + ' Women\'s Championship') : y < 1979 ? 'WWWF Championship' : y < 2002 ? 'WWF Championship' : 'WWE Championship', w ? (y >= 2023 ? 'Women\'s Intercontinental Championship' : null) : y >= 1979 ? 'Intercontinental Championship' : null, w ? null : y >= 2003 ? 'United States Championship' : null, y < 2002 ? 'WWF Tag Team Championship' : 'WWE Tag Team Championship'],
      wcw: [w ? 'WCW Women\'s Championship' : 'WCW World Heavyweight Championship', w ? null : 'WCW United States Championship', w ? null : 'WCW Television Championship', 'WCW World Tag Team Championship'],
      nwa: [w ? 'NWA World Women\'s Championship' : 'NWA World Heavyweight Championship', w ? null : 'NWA Television Championship', null, 'NWA World Tag Team Championship'],
      ecw: ['ECW World Heavyweight Championship', 'ECW Television Championship', null, 'ECW Tag Team Championship'],
      njpw: [w ? 'IWGP Women\'s Championship' : 'IWGP Heavyweight Championship', w ? null : y >= 2011 ? 'IWGP Intercontinental Championship' : 'IWGP Junior Heavyweight Championship', null, 'IWGP Tag Team Championship'],
      tna: [w ? 'Knockouts World Championship' : 'TNA World Championship', w ? null : 'X Division Championship', null, 'TNA World Tag Team Championship'],
      roh: [w ? 'ROH Women\'s World Championship' : 'ROH World Championship', w ? null : 'ROH Pure Championship', null, 'ROH World Tag Team Championship'],
      aew: [w ? 'AEW Women\'s World Championship' : 'AEW World Championship', w ? (y >= 2023 ? 'TBS Championship' : null) : y >= 2020 ? 'TNT Championship' : null, w ? null : y >= 2023 ? 'AEW International Championship' : null, 'AEW World Tag Team Championship'],
      territory: [w ? 'Southern Women\'s Championship' : 'Southern Heavyweight Championship', w ? null : 'regional television title', null, 'regional tag team titles'],
      indie: [w ? 'indie women\'s title' : 'indie heavyweight title', null, null, 'indie tag titles']
    };
    return B[id];
  }
  // The era's big shows; the first is the year's biggest.
  function shows(id) {
    var y = yr(), L = {
      wwf: [[y >= 1985 ? 'WrestleMania' : 'a Madison Square Garden supercard'], y >= 1988 ? 'SummerSlam' : null, y >= 1987 ? 'Survivor Series' : null, y >= 1988 ? 'the Royal Rumble' : null],
      wcw: [['Starrcade'], 'Halloween Havoc', 'Bash at the Beach', 'SuperBrawl'],
      nwa: [[y >= 1983 ? 'Starrcade' : 'the Great American Bash'], y >= 1985 ? 'the Great American Bash' : null],
      ecw: [[y >= 1995 ? 'November to Remember' : 'Hostile City Showdown'], y >= 1997 ? 'Barely Legal' : null],
      njpw: [['Wrestle Kingdom'], 'Dominion', 'the G1 Climax final'],
      tna: [['Bound for Glory'], 'Slammiversary', 'Lockdown'],
      roh: [['Final Battle'], 'Supercard of Honor'],
      aew: [['All In'], 'Double or Nothing', 'Full Gear', 'Revolution'],
      territory: [['the big summer card'], 'the Thanksgiving card'],
      indie: [['the biggest indie show of the year'], 'a sold-out convention show']
    }[id];
    return L.filter(Boolean).map(function (q) { return Array.isArray(q) ? q[0] : q; });
  }
  // Real stars by promotion and era: [name, from, to, F].
  var R = {
    wwf: [['Bruno Sammartino', 1963, 1981], ['Bob Backlund', 1977, 1984], ['Hulk Hogan', 1983, 1993], ['Randy Savage', 1985, 1994], ['Ricky Steamboat', 1985, 1991], ['Roddy Piper', 1984, 1996], ['Andre the Giant', 1973, 1991], ['Ultimate Warrior', 1987, 1996], ['Bret Hart', 1984, 1997], ['Shawn Michaels', 1988, 2010], ['The Undertaker', 1990, 2020], ['Razor Ramon', 1992, 1996], ['Steve Austin', 1996, 2003], ['The Rock', 1996, 2004], ['Triple H', 1995, 2021], ['Mankind', 1996, 2000], ['Kurt Angle', 1999, 2006], ['Chris Jericho', 1999, 2018], ['Brock Lesnar', 2002, 2004], ['Brock Lesnar', 2012, 2023], ['John Cena', 2002, 2024], ['Batista', 2002, 2010], ['Randy Orton', 2002, 2026], ['Edge', 1998, 2011], ['Rey Mysterio', 2002, 2026], ['CM Punk', 2006, 2014], ['CM Punk', 2023, 2026], ['Daniel Bryan', 2010, 2021], ['Roman Reigns', 2012, 2026], ['Seth Rollins', 2012, 2026], ['AJ Styles', 2016, 2026], ['Kevin Owens', 2015, 2026], ['Drew McIntyre', 2017, 2026], ['Cody Rhodes', 2022, 2026], ['Gunther', 2022, 2026], ['LA Knight', 2022, 2026],
      ['The Fabulous Moolah', 1963, 1987, 1], ['Wendi Richter', 1983, 1985, 1], ['Sensational Sherri', 1987, 1989, 1], ['Alundra Blayze', 1993, 1995, 1], ['Trish Stratus', 2000, 2006, 1], ['Lita', 2000, 2006, 1], ['Victoria', 2002, 2009, 1], ['Mickie James', 2005, 2010, 1], ['Beth Phoenix', 2006, 2012, 1], ['Natalya', 2008, 2026, 1], ['AJ Lee', 2011, 2015, 1], ['Charlotte Flair', 2014, 2026, 1], ['Becky Lynch', 2015, 2026, 1], ['Sasha Banks', 2015, 2022, 1], ['Bayley', 2015, 2026, 1], ['Asuka', 2017, 2026, 1], ['Rhea Ripley', 2019, 2026, 1], ['Bianca Belair', 2020, 2026, 1], ['IYO SKY', 2022, 2026, 1]],
    wcw: [['Ric Flair', 1988, 2001], ['Sting', 1988, 2001], ['Lex Luger', 1988, 2001], ['Vader', 1990, 1996], ['Hulk Hogan', 1994, 2000], ['Randy Savage', 1994, 2000], ['Kevin Nash', 1996, 2001], ['Scott Hall', 1996, 2000], ['Diamond Dallas Page', 1994, 2001], ['Goldberg', 1997, 2001], ['Booker T', 1993, 2001], ['Rey Mysterio', 1996, 2001], ['Eddie Guerrero', 1995, 2000], ['Chris Jericho', 1996, 1999], ['Bret Hart', 1997, 2000], ['Madusa', 1991, 1998, 1], ['Akira Hokuto', 1995, 1997, 1]],
    nwa: [['Lou Thesz', 1948, 1966], ['Gene Kiniski', 1960, 1970], ['Harley Race', 1970, 1984], ['Dusty Rhodes', 1974, 1989], ['Ric Flair', 1975, 1991], ['Ricky Steamboat', 1977, 1985], ['Magnum T.A.', 1983, 1986], ['Arn Anderson', 1985, 1991], ['Barry Windham', 1984, 1991], ['Sting', 1987, 1988], ['Mildred Burke', 1948, 1956, 1], ['The Fabulous Moolah', 1956, 1987, 1]],
    ecw: [['Sabu', 1993, 2001], ['Terry Funk', 1993, 1997], ['Raven', 1995, 1998], ['Tommy Dreamer', 1993, 2001], ['Taz', 1993, 2000], ['Rob Van Dam', 1996, 2001], ['The Sandman', 1992, 2001], ['Shane Douglas', 1993, 1999]],
    njpw: [['Antonio Inoki', 1972, 1998], ['Tatsumi Fujinami', 1972, 2006], ['Keiji Mutoh', 1984, 2002], ['Shinya Hashimoto', 1984, 2000], ['Hiroshi Tanahashi', 1999, 2026], ['Shinsuke Nakamura', 2002, 2016], ['Kazuchika Okada', 2007, 2024], ['Tetsuya Naito', 2006, 2026], ['Kenny Omega', 2014, 2019], ['Jay White', 2018, 2023], ['Mayu Iwatani', 2022, 2026, 1], ['Giulia', 2022, 2024, 1]],
    tna: [['AJ Styles', 2002, 2013], ['Samoa Joe', 2005, 2015], ['Kurt Angle', 2006, 2016], ['Jeff Hardy', 2004, 2017], ['Christopher Daniels', 2002, 2014], ['Bobby Roode', 2004, 2016], ['Josh Alexander', 2017, 2026], ['Gail Kim', 2005, 2018, 1], ['Awesome Kong', 2007, 2010, 1], ['Jordynne Grace', 2018, 2026, 1]],
    roh: [['Bryan Danielson', 2002, 2009], ['Samoa Joe', 2002, 2005], ['CM Punk', 2002, 2005], ['Nigel McGuinness', 2005, 2009], ['Kevin Steen', 2007, 2013], ['Jay Lethal', 2006, 2026], ['Adam Cole', 2009, 2017], ['Sumie Sakai', 2017, 2022, 1], ['Athena', 2022, 2026, 1]],
    aew: [['Chris Jericho', 2019, 2026], ['Kenny Omega', 2019, 2026], ['Jon Moxley', 2019, 2026], ['Cody Rhodes', 2019, 2022], ['Hangman Adam Page', 2019, 2026], ['MJF', 2019, 2026], ['Darby Allin', 2019, 2026], ['Orange Cassidy', 2019, 2026], ['Will Ospreay', 2024, 2026], ['Swerve Strickland', 2022, 2026], ['Britt Baker', 2019, 2026, 1], ['Hikaru Shida', 2019, 2026, 1], ['Thunder Rosa', 2020, 2026, 1], ['Jade Cargill', 2020, 2023, 1], ['Toni Storm', 2022, 2026, 1], ['Mariah May', 2024, 2026, 1]],
    territory: [['Jerry Lawler', 1970, 1990], ['Kerry Von Erich', 1978, 1990], ['Junkyard Dog', 1979, 1990], ['Ted DiBiase', 1980, 1987], ['Bruiser Brody', 1974, 1988], ['Mildred Burke', 1935, 1956, 1], ['The Fabulous Moolah', 1950, 1987, 1]],
    indie: []
  };
  function stars(id) { var y = yr(), w = F() ? 1 : 0; return (R[id] || []).filter(function (q) { return y >= q[1] && y <= q[2] && (q[3] || 0) === w; }).map(function (q) { return q[0]; }); }
  function filler() { var n = E.randomName(me().gender); return n.first + ' ' + n.last; }

  // ------------------------------------------------------------ gimmicks
  // align: starting side; mic/ring: what the act leans on; cap: how high it can go.
  var G = {
    underdog: { name: 'Underdog babyface', align: 'face', mic: 0.4, ring: 0.6, cap: 100, ring1: function (n) { return n.first + ' ' + n.last; } },
    rich: { name: 'Arrogant rich heel', align: 'heel', mic: 0.7, ring: 0.3, cap: 95, ring1: function (n) { return n.first + ' ‘The Fortune’ ' + n.last; } },
    monster: { name: 'Unstoppable monster', align: 'heel', mic: 0.2, ring: 0.8, cap: 95, ring1: function () { return U.pick(['The Colossus', 'Behemoth', 'Grimm', 'Tundra', 'The Juggernaut', 'Onyx']); } },
    flyer: { name: 'Daredevil high-flyer', align: 'face', mic: 0.3, ring: 0.7, cap: 92, ring1: function (n) { return U.pick(['Flash ', 'Skye ', 'Phoenix ']) + n.last; } },
    tech: { name: 'Technical wizard', align: 'face', mic: 0.3, ring: 0.7, cap: 95, ring1: function (n) { return n.first + ' ' + n.last; } },
    hardcore: { name: 'Hardcore brawler', align: 'heel', mic: 0.45, ring: 0.55, cap: 90, ring1: function (n) { return n.first + ' ‘Mad Dog’ ' + n.last; } },
    comedy: { name: 'Comedy act', align: 'face', mic: 0.7, ring: 0.3, cap: 80, ring1: function (n) { return U.pick(['Disco ', 'Dancin\' ', 'Funky ']) + n.first; } },
    antihero: { name: 'Rebel anti-hero', align: 'face', mic: 0.6, ring: 0.4, cap: 100, ring1: function (n) { return n.first + ' ' + U.pick(['Cross', 'Vance', 'Steele', 'Kane']).replace('Kane', 'Ryder'); } },
    mystic: { name: 'Supernatural mystic', align: 'heel', mic: 0.5, ring: 0.5, cap: 95, ring1: function () { return U.pick(['The Oracle', 'Hex', 'The Revenant', 'Wraith']); } }
  };
  var SPOTS = [[0, 'Enhancement Talent'], [15, 'Lower Card'], [35, 'Midcard'], [55, 'Upper Midcard'], [72, 'Main Eventer'], [90, 'Franchise Star']];
  function spot(push) { var r = SPOTS[0]; SPOTS.forEach(function (q) { if (push >= q[0]) r = q; }); return r[1]; }
  function title() { var w = x(); if (!w) return 'Pro Wrestler'; return w.belts && w.belts.length ? U.cap(beltShort(w.belts[0])) + ' Champion' : spot(w.push); }
  function beltShort(b) { return b.replace(/ Championship$/, '').replace(/ title$/, '').replace(/ titles$/, ''); }
  // Overall ability: ring work and mic skills weighted by the act, plus charisma.
  function rating(w) { var g = G[w.gim] || G.underdog; return w.ring * g.ring + w.mic * g.mic + (me().looks - 50) * 0.1 + (me().athl - 50) * 0.08 - Math.max(0, me().age - 38) * 1.5 - Math.max(0, w.wear - 60) * 0.2; }

  // ------------------------------------------------------------ start
  function startMenu() {
    if (me().athl < 45) return done(nope('I need to be in much better shape first (45+ athleticism).'));
    if (me().age < 18) return done(nope('Wrestling schools take students from 18.'));
    if (S().job && S().job.special !== 'wrestler') return done(nope('I\'d have to quit my current job first.'));
    if (S().prison) return done(nope('Not from in here.'));
    var n = { first: me().first, last: me().last };
    ui().menu('Choose a gimmick', function () {
      return [{ info: true, html: '<p class="muted">Your gimmick is your character: it decides whether you start as a good guy (face) or a bad guy (heel), and whether your mic skills or your ring work matter more.</p>' }].concat(Object.keys(G).map(function (k) {
        var g = G[k];
        return { icon: g.align === 'face' ? '😇' : '😈', label: g.name, sub: U.cap(g.align) + ' · ' + (g.mic > 0.5 ? 'talker' : g.ring > 0.6 ? 'worker' : 'balanced') + (g.cap < 90 ? ' · limited ceiling' : ''), onClick: function () { pickName(k, n); } };
      }));
    });
  }
  function pickName(k, n) {
    var opts = [G[k].ring1(n), G[k].ring1({ first: n.first, last: filler().split(' ')[1] }), n.first + ' ' + n.last].filter(function (v, i, a) { return a.indexOf(v) === i; });
    ui().choose('Ring name', 'What will they call me?', opts.map(function (o) { return { label: o, fn: function () { debut(k, o); } }; }));
  }
  function debut(k, ring) {
    var s = S(), old = s.sp && s.sp.wrestler;
    s.wr = { name: ring, gim: k, align: G[k].align, ring: 15 + U.rand(0, 10), mic: 10 + U.rand(0, 10) + Math.round((me().smarts - 50) / 10), pop: 5, push: 5, mom: 0, stand: 50, wear: 0, promo: yr() < 1988 && U.chance(0.6) ? 'territory' : 'indie',
      contract: null, w: 0, l: 0, best: null, matches: [], reigns: [], belts: [], feud: null, tag: null, since: yr(), gimSince: yr(), honors: [], earnTotal: 0, hist: [] };
    var w = s.wr;
    w.ring = Math.max(w.ring, 12); w.mic = cl(w.mic, 5, 40);
    if (old) { w.push = cl(old.rep * 0.8); w.pop = cl(old.rep * 0.8); w.ring = cl(old.skill); }
    s.job = { career: 'sp_wrestler', special: 'wrestler', fame: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, salary: 0, company: pname(w.promo) };
    s.sp = s.sp || {}; s.sp.wrestler = s.sp.wrestler || { rep: 5, skill: 15, since: yr(), peak: 5, honors: [], earnTotal: 0 }; s.sp.wrestler.retired = false;
    E.log('🤼 I debuted on ' + pname(w.promo) + ' as “' + ring + '”, ' + an(G[k].name.toLowerCase()) + '.', 'good');
    ui().closeAll(); done(good('🤼 “' + ring + '” has arrived.'));
  }

  // ------------------------------------------------------------ matches
  function stars5(q) { q = Math.max(0.25, Math.min(5.5, Math.round(q * 4) / 4)); return q; }
  function starTxt(q) { var f = Math.floor(q), r = q - f; return '★'.repeat(f) + (r >= 0.75 ? '¾' : r >= 0.5 ? '½' : r >= 0.25 ? '¼' : '') + ' (' + q.toFixed(2).replace(/0$/, '').replace(/\.0$/, '') + ')'; }
  function matchQuality(w, oppSkill, heat) { return stars5(0.5 + (w.ring * 0.6 + oppSkill * 0.4) / 25 + (heat || 0) / 40 + U.randf(-0.8, 0.8)); }
  function record(w, opp, q, won, show, belt) {
    if (won) w.w++; else w.l++;
    var m = { y: yr(), opp: opp, q: q, won: won, show: show || 'TV', belt: belt || null };
    w.matches.push(m); if (w.matches.length > 60) w.matches.shift();
    if (!w.best || q > w.best.q) w.best = m;
    return m;
  }
  function oppAtSpot(w) {
    var st = stars(w.promo);
    if (w.push >= 55 && st.length && U.chance(0.75)) return U.pick(st);
    return filler();
  }

  // ------------------------------------------------------------ actions
  function train(kind) {
    var w = x();
    if (count('wrtrain') >= 2) return done(nope('My body needs rest. Twice a year is enough at the training center.'));
    bump('wrtrain');
    if (kind === 'ring') { var g = Math.max(1, Math.round((100 - w.ring) / 15 * U.randf(0.6, 1.2))); w.ring = cl(w.ring + g); w.wear = cl(w.wear + 1); return done(good('I drilled in the ring all week (+' + g + ' in-ring).')); }
    var g2 = Math.max(1, Math.round((100 - w.mic) / 15 * U.randf(0.6, 1.2))); w.mic = cl(w.mic + g2);
    done(good('I worked on my promos with a coach (+' + g2 + ' mic skills).'));
  }
  function promo() {
    var w = x();
    if (count('wrpromo')) return done(nope('I already had my big promo this year.'));
    bump('wrpromo');
    var p = U.clamp(0.3 + (w.mic - 40) / 80 + (me().looks - 50) / 300 + (w.feud ? 0.08 : 0), 0.08, 0.92);
    if (U.chance(p)) {
      var g = U.rand(4, 9); w.mom = cl(w.mom + g, -50, 50); w.pop = cl(w.pop + g / 2); if (w.feud) w.feud.heat = cl(w.feud.heat + 10);
      E.fame(1);
      return done(good('🎤 ' + U.pick(['The crowd hung on every word.', 'The promo went viral.', 'Fans were quoting my promo all week.', 'The arena chanted my catchphrase.']) + (w.feud ? ' My feud with ' + w.feud.opp + ' heated up.' : '')));
    }
    w.mom = cl(w.mom - 4, -50, 50);
    done(bad('🎤 ' + U.pick(['I flubbed my lines.', 'The crowd was dead silent.', 'Management called my promo "a disaster."', 'I got cut off by a "boring" chant.'])));
  }
  function feud() {
    var w = x();
    if (w.feud) return done(nope('I\'m already feuding with ' + w.feud.opp + '.'));
    var st = stars(w.promo), pool = [];
    if (w.push >= 50) st.forEach(function (n) { pool.push(n); });
    for (var i = 0; i < 3; i++) pool.push(filler());
    pool = pool.sort(function () { return Math.random() - 0.5; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 4);
    ui().choose('Start a feud', 'Who do I go after?', pool.map(function (n) {
      return { label: n + (st.indexOf(n) >= 0 ? ' ⭐' : ''), fn: function () {
        var big = st.indexOf(n) >= 0;
        if (big && w.push < 60 && !U.chance(0.35 + w.stand / 200)) { w.stand = cl(w.stand - 3); return done(bad('Management said ' + n + ' doesn\'t work with someone at my level.')); }
        w.feud = { opp: n, heat: big ? 30 : 15, y: yr(), star: big };
        done(good('😤 I started a feud with ' + n + '.' + (big ? ' This is a huge opportunity.' : '')));
      } };
    }));
  }
  function politic() {
    var w = x();
    if (count('wrpol')) return done(nope('I already spent enough time backstage this year.'));
    bump('wrpol');
    var b = boss(w.promo), p = U.clamp(0.45 + (me().smarts - 50) / 150 + (w.pop - 50) / 200, 0.15, 0.85);
    if (U.chance(p)) { w.stand = cl(w.stand + U.rand(5, 10)); return done(good('🗣️ I pitched ideas to ' + b + '. They liked what they heard.')); }
    w.stand = cl(w.stand - 4); done(bad('🗣️ ' + U.cap(b) + ' thinks I\'m getting a big head.'));
  }
  function askShot(kind) {
    var w = x(), B = belts(w.promo), belt = kind === 'world' ? B[0] : B[1] || B[2];
    if (!belt) return done(nope('There\'s no such title here right now.'));
    if (w.belts.indexOf(belt) >= 0) return done(nope('I already hold it.'));
    if (count('wrshot')) return done(nope('I already asked this year.'));
    if (kind === 'world' && w.lastShot && yr() - w.lastShot < 2) return done(nope('I just had my shot. I need to rebuild before I get another one.'));
    bump('wrshot');
    var need = kind === 'world' ? 70 : 40;
    if (w.push + (w.stand - 50) / 10 + U.rand(-10, 6) >= need) { w.shot = { belt: belt, y: yr() }; return done(good('🏆 ' + U.cap(boss(w.promo)) + ' agreed: I get a shot at the ' + belt + ' at ' + shows(w.promo)[0] + '.')); }
    w.stand = cl(w.stand - 2); done(bad('"You\'re not ready," ' + boss(w.promo) + ' said.'));
  }
  function turn() {
    var w = x();
    if (w.turnY && yr() - w.turnY < 2) return done(nope('I just turned. The crowd needs time to buy it.'));
    w.turnY = yr(); var to = w.align === 'face' ? 'heel' : 'face';
    // A turn works best when the old act has gone stale.
    var p = U.clamp(0.4 + (w.mom < 5 ? 0.2 : -0.1) + (w.mic - 50) / 150 + (w.feud ? 0.1 : 0), 0.15, 0.85);
    w.align = to; w.turns = (w.turns || 0) + 1;
    if (U.chance(p)) { w.mom = cl(w.mom + U.rand(12, 22), -50, 50); w.pop = cl(w.pop + 5); E.fame(2); return done(good(to === 'heel' ? '😈 I turned heel and the crowd turned on me. Perfect. My heat has never been higher.' : '😇 I turned face and the crowd exploded. They\'re finally behind me.')); }
    w.mom = cl(w.mom - 8, -50, 50); done(bad(to === 'heel' ? '😈 I turned heel, but the crowd kept cheering me anyway.' : '😇 I turned face, but nobody bought it.'));
  }
  function repackage() {
    var w = x();
    ui().menu('Repackage me', function () {
      return [{ info: true, html: '<p class="muted">A new gimmick resets your momentum. It can save a stale career or kill a good one.</p>' }].concat(Object.keys(G).filter(function (k) { return k !== w.gim; }).map(function (k) {
        return { icon: G[k].align === 'face' ? '😇' : '😈', label: G[k].name, onClick: function () {
          var stale = yr() - w.gimSince >= 4 && w.mom < 10;
          w.gim = k; w.gimSince = yr(); w.align = G[k].align; var nn = G[k].ring1({ first: me().first, last: me().last }); w.ring_name_prev = w.name; w.name = nn;
          if (U.chance(stale ? 0.6 : 0.35)) { w.mom = cl(15, -50, 50); w.pop = cl(w.pop + 4); ui().back(); return done(good('🔄 I was repackaged as “' + nn + '”. The new character clicked.')); }
          w.mom = -10; w.pop = cl(w.pop - 8); ui().back(); done(bad('🔄 I was repackaged as “' + nn + '”. Fans think it\'s ridiculous.'));
        } };
      }));
    });
  }
  function tagTeam() {
    var w = x();
    if (w.tag) { var t = w.tag; w.tag = null; return done('I split from ' + t.partner + '.' + (U.chance(0.5) ? ' A singles push could follow.' : '')); }
    var partner = filler(), names = ['The ' + U.pick(['Midnight', 'Thunder', 'Iron', 'Steel', 'Wild', 'Golden']) + ' ' + U.pick(['Express', 'Connection', 'Foundation', 'Brigade', 'Syndicate']), 'The ' + me().last + '-' + partner.split(' ')[1] + ' Connection'];
    w.tag = { partner: partner, name: names[0], y: yr() };
    done(good('🤝 I formed a tag team with ' + partner + ': ' + w.tag.name + '.'));
  }
  function rest() {
    var w = x();
    if (count('wrrest')) return done(nope('I\'m already resting this year.'));
    if (count('wrpromo') || count('wrshot')) return done(nope('I\'ve already committed to dates this year.'));
    bump('wrrest'); done(good('🩹 I\'m taking time off to heal my body.'));
  }

  // ------------------------------------------------------------ the year
  function year() {
    var s = S(), w = x(), j = s.job, m = me(), news = [];
    if (!w) return 0;
    var B = belts(w.promo), sh = shows(w.promo), P0 = P[w.promo], resting = last('wrrest');
    // Weekly TV and house shows: wins follow the push.
    var n = resting ? U.rand(5, 15) : w.promo === 'indie' ? U.rand(25, 60) : U.rand(60, 140), wins = 0;
    for (var i = 0; i < n; i++) if (U.chance(U.clamp(0.3 + (w.push - 40) / 100 + (w.belts.length ? 0.15 : 0), 0.08, 0.92))) wins++;
    w.w += wins; w.l += n - wins;
    // Body wear: flyers and hardcore guys pay more.
    var wearUp = resting ? -15 : (n / 20) * ({ flyer: 1.6, hardcore: 1.7, monster: 1.1 }[w.gim] || 1) * (m.age > 35 ? 1.3 : 1);
    w.wear = cl(w.wear + wearUp - (m.health - 60) / 20);
    if (!resting && U.chance(0.04 + w.wear / 300)) {
      var inj = U.pick(['a torn ACL', 'a broken neck', 'a herniated disc', 'a torn pectoral', 'a concussion', 'a separated shoulder']);
      E.stat('health', -U.rand(10, 25)); w.mom = cl(w.mom - 15, -50, 50); w.push = cl(w.push - 6); w.wear = cl(w.wear + 10);
      E.log('🚑 I suffered ' + inj + ' in the ring and missed months.', 'bad');
      if (w.belts.length) { E.log('🏆 I had to vacate the ' + w.belts[0] + '.', 'bad'); endReign(w, w.belts[0], 'vacated'); }
    }
    // The feud pays off at a big show.
    var biggest = sh[0];
    if (!resting && w.feud) {
      var f = w.feud, oppSkill = f.star ? U.rand(70, 92) : U.rand(40, 70);
      var winP = U.clamp(0.5 + (w.push - (f.star ? 70 : 45)) / 60 + (w.stand - 50) / 200, 0.1, 0.9);
      var won = U.chance(winP), q = matchQuality(w, oppSkill, f.heat + w.mom / 2);
      var at = U.pick(sh.slice(1).concat([biggest]));
      record(w, f.opp, q, won, at);
      news.push('At ' + at + ', I ' + (won ? 'beat ' : 'lost to ') + f.opp + ' ' + starTxt(q) + '.');
      w.mom = cl(w.mom + (won ? 8 : -3) + (q - 3) * 3, -50, 50); w.pop = cl(w.pop + (q - 2.5) * 2 + (f.star ? 3 : 1));
      if (q >= 4.5) news.push('Fans are calling it the match of the year.');
      if (yr() - f.y >= 1 || U.chance(0.5)) w.feud = null;
    }
    // Royal Rumble (1988+) and Money in the Bank (2010+) can earn a title shot.
    if (!resting && w.promo === 'wwf' && yr() >= 1988 && w.push >= 35 && !w.shot && !w.belts.length) {
      var rr = U.chance(U.clamp((w.push - 55) / 250 + w.mom / 400, 0.005, 0.12)); // thirty in, one winner
      if (rr) { w.shot = { belt: B[0], y: yr(), via: 'the Royal Rumble' }; news.push('I won the Royal Rumble! I\'m headed to WrestleMania for the ' + B[0] + '.'); w.honors.push('Royal Rumble winner ' + yr()); w.mom = cl(w.mom + 12, -50, 50); E.fame(4); }
      else if (yr() >= 2010 && w.push >= 55 && U.chance(U.clamp(0.05 + w.mom / 500, 0.01, 0.12))) { w.mitb = true; news.push('I won the Money in the Bank briefcase! I can cash in any time.'); w.honors.push('Money in the Bank ' + yr()); }
    }
    // Title matches at the year's biggest show.
    var shotBelt = w.shot ? w.shot.belt : null;
    if (!resting && shotBelt) {
      var champ = oppAtSpot({ push: 80, promo: w.promo }), isWorld = shotBelt === B[0];
      s.pending.push({ id: 'wr_bigmatch', data: { belt: shotBelt, champ: champ, show: biggest, world: isWorld } });
      if (isWorld) w.lastShot = yr();
      delete w.shot;
    } else if (!resting && !w.belts.length) {
      // Midcard titles come up with a strong push even without asking.
      var mid = B[1] || B[2];
      if (mid && w.push >= 50 && U.chance(0.08 + w.mom / 250)) { winBelt(w, mid, filler(), sh[1] || biggest, matchQuality(w, 60, 20)); news.push('I won the ' + mid + '!'); }
      else if (B[3] && w.tag && w.push >= 25 && U.chance(0.18)) { winBelt(w, B[3], 'the champions', sh[1] || biggest, matchQuality(w, 55, 15)); news.push(w.tag.name + ' won the ' + B[3] + '!'); }
    }
    // Defending: reigns end sooner when the push fades.
    w.belts.slice().forEach(function (b) {
      var cur = w.reigns.filter(function (q) { return q.belt === b && !q.to; })[0];
      if (!cur) return;
      cur.def += resting ? 0 : U.rand(2, 6);
      if (!resting && U.chance(U.clamp(0.22 + (60 - w.push) / 150 - w.stand / 400 + (yr() - cur.from) * 0.08, 0.05, 0.8))) { var by = oppAtSpot(w); endReign(w, b, by); news.push('I dropped the ' + b + ' to ' + by + ' after ' + U.plural(cur.def, 'defense') + '.'); w.mom = cl(w.mom - 6, -50, 50); }
    });
    // Money in the Bank cash-in.
    if (!resting && w.mitb && !w.belts.length && U.chance(0.6)) { w.mitb = false; var ch = oppAtSpot({ push: 80, promo: w.promo }); winBelt(w, B[0], ch, 'a surprise cash-in', matchQuality(w, 75, 30)); news.push('I cashed in Money in the Bank on ' + ch + ' and won the ' + B[0] + '!'); E.fame(6); }
    // Push follows the crowd, momentum and management; fame fades if I'm idle.
    var g = G[w.gim] || G.underdog;
    w.pop = cl(w.pop + w.mom / 8 + (rating(w) * 0.85 - w.pop) / 10 - (resting ? 4 : 0));
    w.pop = Math.min(w.pop, g.cap);
    // Only so many spots at the top: the higher the push, the harder it is to climb.
    w.push = cl(w.push + ((w.pop - w.push) / 5 + w.mom / 10 + (w.stand - 50) / 15) * (w.push > 70 ? 0.5 : 1) + (w.belts.length ? 1 : 0) - (resting ? 3 : 0) + U.rand(-3, 3));
    w.push = Math.min(w.push, P0.tier === 1 ? 70 : 100);
    w.mom = Math.round(w.mom * 0.5 - (yr() - w.gimSince >= 5 ? 3 : 0)); // momentum fades; old gimmicks go stale
    w.stand = cl(w.stand + (50 - w.stand) / 8);
    if (m.age >= 38) { w.ring = cl(w.ring - U.rand(1, 3)); }
    if (!resting) { w.ring = cl(w.ring + (w.ring < 50 ? 1 : 0.5)); w.mic = cl(w.mic + 0.5); }
    // Pay: contract, merch for the people's favorites, big-show bonuses.
    var pay = w.contract ? w.contract.pay : E.$(Math.round(P0.pay * (0.15 + w.push / 100) * (P0.tier === 1 ? 0.5 : 1)));
    var merch = E.$(Math.round(Math.pow(w.pop / 10, 2.4) * (w.align === 'face' ? 1200 : 600) * (P0.tier === 3 ? 1 : 0.25)));
    var bonus = w.push >= 72 ? E.$(Math.round(P0.pay * 0.5)) : 0;
    var earn = Math.round((pay + merch + bonus) * (resting ? 0.5 : 1));
    if (w.contract) { w.contract.years--; if (w.contract.years <= 0) { w.contract = null; s.pending.push({ id: 'wr_contract', data: {} }); } }
    else if (w.promo === 'indie' || w.promo === 'territory') { if (w.push >= 30 && U.chance(0.5)) s.pending.push({ id: 'wr_contract', data: {} }); }
    // Honors: PWI 500 (1991+), Match of the Year, Wrestler of the Year.
    var rank = w.push >= 20 ? Math.max(1, Math.round(500 - w.push * 5.2 - w.pop * 0.5 + U.rand(-20, 20))) : null;
    if (yr() >= 1991 && rank && rank <= 500) { w.pwi = Math.min(w.pwi || 999, rank); if (rank <= 10) news.push('I was ranked #' + rank + ' in the PWI 500.'); }
    if (w.best && w.best.y === yr() && w.best.q >= 4.75 && yr() >= 1980 && U.chance(0.5)) { w.honors.push('Match of the Year ' + yr()); news.push('My match with ' + w.best.opp + ' was named Match of the Year.'); }
    if (w.push >= 85 && U.chance(0.2)) { w.honors.push('Wrestler of the Year ' + yr()); news.push('I was named Wrestler of the Year.'); E.fame(4); }
    if (Math.random() < 0.6 && !resting) s.pending.push({ id: 'wr_story', data: {} });
    news.forEach(function (t) { E.log('🤼 ' + t, /lost|dropped|vacate/.test(t) ? '' : 'good'); });
    E.fame(w.push >= 72 ? 2 : w.push >= 50 ? 1 : 0);
    w.hist.push({ y: yr(), age: m.age, spot: title(), promo: short(w.promo), push: Math.round(w.push), pop: Math.round(w.pop), earn: earn, rec: wins + '-' + (n - wins), note: resting ? 'rested' : w.belts.length ? 'champion' : '' });
    if (w.hist.length > 60) w.hist.shift();
    // Keep the shared special-career record in step (menus, summary, logic checks).
    var sp = s.sp && s.sp.wrestler; if (sp) { sp.rep = cl(w.push); sp.skill = cl(w.ring); sp.peak = Math.max(sp.peak || 0, w.push); sp.earnTotal = (sp.earnTotal || 0) + earn; }
    w.earnTotal += earn; j.salary = earn; j.company = pname(w.promo);
    return earn;
  }
  function winBelt(w, belt, from, show, q) {
    if (w.belts.indexOf(belt) >= 0) { record(w, from, q, true, show, belt); var cr = w.reigns.filter(function (r) { return r.belt === belt && !r.to; })[0]; if (cr) cr.def++; return; } // already mine: a defense
    w.belts.push(belt); w.reigns.push({ belt: belt, promo: short(w.promo), from: yr(), to: null, def: 0, beat: from });
    record(w, from, q, true, show, belt);
    w.mom = cl(w.mom + 12, -50, 50); w.pop = cl(w.pop + 6); E.stat('happy', 15); E.fame(belt === belts(w.promo)[0] ? 8 : 3);
    var n = w.reigns.filter(function (r) { return r.belt === belt; }).length;
    if (n > 1) w.honors.push(n + '-time ' + beltShort(belt) + ' Champion');
  }
  function endReign(w, belt, by) {
    var r = w.reigns.filter(function (q) { return q.belt === belt && !q.to; })[0];
    if (r) { r.to = yr(); r.lostTo = by; }
    w.belts = w.belts.filter(function (b) { return b !== belt; });
  }

  // ------------------------------------------------------------ events
  function def(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
  // Wrestling events only make sense for an active wrestler (not after retiring or quitting).
  function active() { var w = x(), j = S().job; return !!(w && !w.retired && j && j.special === 'wrestler'); }
  // The year's biggest match: the finish is called; do I follow it?
  def('wr_bigmatch', { build: function (d) {
    var w = x(); if (!active() || !d || !d.belt || w.belts.indexOf(d.belt) >= 0) return null;
    var p = U.clamp((d.world ? 0.18 : 0.3) + (w.push - 72) / 90 + (w.stand - 50) / 200 + w.mom / 200, 0.06, 0.7), script = U.chance(p);
    var q0 = matchQuality(w, d.world ? U.rand(75, 95) : 65, 40);
    var finish = function (won, how) {
      if (won) { winBelt(w, d.belt, d.champ, d.show, q0); return good('🏆 At ' + d.show + ', I beat ' + d.champ + ' for the ' + d.belt + '! ' + starTxt(q0) + (how ? ' ' + how : '')); }
      record(w, d.champ, q0, false, d.show); w.mom = cl(w.mom - 4, -50, 50);
      return 'At ' + d.show + ', ' + d.champ + ' retained the ' + d.belt + '. ' + starTxt(q0) + (how ? ' ' + how : '');
    };
    return {
      icon: '🏆', title: d.show, text: 'Tonight I challenge ' + d.champ + ' for the ' + d.belt + '. The agent just told me the finish: ' + (script ? 'I win.' : 'I lose.'),
      choices: [
        { label: script ? 'Win it like we planned' : 'Lose like a pro', run: function () { if (!script) { w.stand = cl(w.stand + 6); } return finish(script, script ? '' : 'Management noticed how well I put the champion over.'); } },
        { label: script ? 'Ask to change it so I lose' : 'Ask to change the finish', run: function () {
          if (script) { w.stand = cl(w.stand + 3); return finish(false, 'I asked to put the champion over. A long game.'); }
          if (U.chance(0.25 + w.stand / 200 + w.pop / 300)) { w.stand = cl(w.stand - 4); return finish(true, 'They changed the finish for me.'); }
          w.stand = cl(w.stand - 8); return finish(false, 'They refused, and they won\'t forget that I asked.');
        } },
        { label: 'Go off script', run: function () {
          if (U.chance(0.3)) { w.stand = cl(w.stand - 30); w.pop = cl(w.pop + 6); E.karma(-3); var r = finish(true, 'I went into business for myself. The crowd loved it. Management is livid.'); if (U.chance(0.4)) { w.contract = null; s2(); } return r; }
          w.stand = cl(w.stand - 25); E.stat('health', -8); return bad('I went off script, ' + d.champ + ' shut it down, and it was a mess. Management is furious.');
        } }
      ]
    };
  } });
  function s2() { S().pending.push({ id: 'wr_contract', data: { fired: true } }); }
  // Contract time: offers from whoever wants me this year.
  def('wr_contract', { build: function (d) {
    var w = x(); if (!active()) return null;
    var cur = w.promo, offers = [];
    Object.keys(P).forEach(function (id) {
      if (!open(id) || id === 'indie') return;
      var p = P[id], need = p.tier === 3 ? 40 : p.tier === 2 ? 25 : 10;
      if (w.push < need && !(d && d.fired)) return;
      if (d && d.fired && id === cur) return;
      var bid = 1 + (yr() >= 1996 && yr() <= 2001 && (id === 'wcw' || id === 'wwf') ? 0.5 : 0) + (yr() >= 2019 && yr() <= 2022 && id === 'aew' ? 0.15 : 0);
      if (id === cur && !(d && d.fired)) bid += w.stand / 200;
      var pay = Math.round(E.$(p.pay * (0.2 + w.push / 80) * bid) / 1000) * 1000;
      offers.push({ id: id, pay: pay, years: U.rand(2, 5) });
    });
    offers = offers.sort(function (a, b) { return b.pay - a.pay; }).slice(0, 4);
    var ch = offers.map(function (o) {
      return { label: (o.id === cur ? 'Re-sign with ' : 'Sign with ') + pname(o.id).replace(/^the /, '') + ' · ' + E.fmt(o.pay) + '/yr × ' + o.years, run: function () {
        if (o.id !== cur) { w.belts.slice().forEach(function (b) { endReign(w, b, 'vacated (left the company)'); }); w.feud = null; w.shot = null; w.mitb = false; w.push = cl(w.push * (P[o.id].tier > P[cur].tier ? 0.75 : 1)); w.stand = 55; }
        w.promo = o.id; w.contract = { pay: o.pay, years: o.years, y: yr() }; S().job.company = pname(o.id);
        return good('✍️ I signed a ' + o.years + '-year deal with ' + pname(o.id) + ' for ' + E.fmt(o.pay) + ' a year.' + (o.id !== cur ? ' ' + U.cap(boss(o.id)) + ' has big plans for me.' : ''));
      } };
    });
    ch.push({ label: 'Work the independents', run: function () { if (cur !== 'indie') { w.belts.slice().forEach(function (b) { endReign(w, b, 'vacated (left the company)'); }); } w.promo = 'indie'; w.contract = null; S().job.company = pname('indie'); return 'I\'m a free agent, working indie dates on my own terms.'; } });
    return { icon: '✍️', title: d && d.fired ? 'Released' : 'Contract', text: (d && d.fired ? 'I\'ve been released after what happened. ' : 'My contract situation is up. ') + (offers.length ? 'Here\'s who wants me' + (yr() >= 1996 && yr() <= 2001 ? ' (the Monday Night War has bidding out of control)' : yr() >= 2019 && offers.some(function (o) { return o.id === 'aew'; }) ? ' (AEW is spending big)' : '') + ':' : 'No big promotion is calling yet.'), choices: ch };
  } });
  // Stories from backstage and the road.
  var STORY = [
    { t: 'A top star refuses to put me over in our match.', c: [['Go to management', { stand: -3, p: 0.5, ok: { push: 4, say: 'Management sided with me.' }, no: { push: -3, say: 'Management sided with the star.' } }], ['Accept it', { stand: 4, say: 'I took the loss like a pro.' }], ['Stiff him in the match', { karma: -3, p: 0.4, ok: { mom: 6, stand: -10, say: 'He got the message. So did the locker room.' }, no: { stand: -15, push: -5, say: 'I got heat backstage for it.' } }]] },
    { t: 'My catchphrase is catching on with the crowd.', c: [['Lean into it', { mom: 8, pop: 4, say: 'Arenas chant it every night.' }], ['Keep it subtle', { mom: 3, say: 'It grows slowly.' }]] },
    { t: 'A rival promotion is secretly courting me.', c: [['Use it as leverage', { p: 0.5, ok: { stand: 2, pay: 1, say: 'My promotion gave me a raise to stay.' }, no: { stand: -8, say: 'Management saw it as disloyal.' } }], ['Stay loyal', { stand: 5, say: 'Loyalty noted.' }]] },
    { t: 'The writers want me in an embarrassing comedy segment.', c: [['Do it with full commitment', { p: 0.5, ok: { mom: 6, pop: 3, say: 'It was so committed it became a cult classic.' }, no: { mom: -6, say: 'It was humiliating.' } }], ['Refuse', { stand: -6, say: 'The writers gave me nothing for weeks.' }]] },
    { t: 'I botched a move and hurt my opponent.', c: [['Apologize and help them recover', { karma: 2, stand: 2, say: 'They forgave me.' }], ['Blame them', { karma: -2, stand: -6, say: 'The locker room turned on me.' }]] },
    { t: 'A celebrity wants to be part of my storyline.', c: [['Bring them in', { p: 0.6, ok: { pop: 6, mom: 5, say: 'Mainstream media covered it everywhere.' }, no: { mom: -4, say: 'Hardcore fans hated it.' } }], ['Keep wrestling pure', { say: 'Purists respected it.' }]] },
    { t: 'The locker room wants me to join their backstage clique.', c: [['Join them', { stand: 6, karma: -1, say: 'With friends in high places, my push is safer.' }], ['Stay independent', { say: 'I keep my head down and work.' }]] },
    { t: 'A fan sneaks into the ring during my match.', c: [['Handle it myself', { p: 0.6, ok: { pop: 4, say: 'I dealt with it and the crowd loved me for it.' }, no: { health: -6, say: 'It got ugly and I got hurt.' } }], ['Wait for security', { say: 'Security dragged them out.' }]] },
    { t: 'My body is begging me to slow down.', c: [['Cut back on house shows', { wear: -10, push: -2, say: 'Fewer dates, less pain.' }], ['Keep the schedule', { wear: 6, push: 1, say: 'I\'ll rest when I retire.' }]] },
    { t: 'A video game company wants me on the cover.', c: [['Do it', { pop: 5, pay: 1, say: 'I\'m on the cover. My merch sales jumped.' }], ['Pass', { say: 'Maybe next year.' }]] },
    { t: 'I\'m asked to lead a faction of up-and-comers.', c: [['Lead them', { mom: 7, stand: 3, say: 'The faction is the hottest act on the show.' }], ['Stay solo', { say: 'I\'m better alone.' }]] },
    { t: 'An old rival from the indies wants a dream match.', c: [['Give them the match', { p: 0.6, ok: { mom: 6, pop: 3, say: 'Fans called it a dream match. It delivered.' }, no: { mom: -3, say: 'It didn\'t live up to the hype.' } }], ['Decline', { say: 'Not now.' }]] }
  ];
  def('wr_story', { build: function (d) {
    var w = x(); if (!active()) return null;
    var ev = STORY[d && d.k != null ? d.k : U.rand(0, STORY.length - 1)];
    function apply(e) {
      if (e.p != null) return apply(U.chance(e.p) ? e.ok : e.no);
      ['push', 'pop', 'stand', 'wear'].forEach(function (k) { if (e[k]) w[k] = cl(w[k] + e[k]); });
      if (e.mom) w.mom = cl(w.mom + e.mom, -50, 50);
      if (e.karma) E.karma(e.karma); if (e.health) E.stat('health', e.health);
      if (e.pay && w.contract) w.contract.pay = Math.round(w.contract.pay * 1.2);
      var t = e.say || 'OK.';
      return (e.push > 0 || e.pop > 0 || e.mom > 0) ? good(t) : (e.push < 0 || e.mom < 0 || e.health < 0 || e.stand < -5) ? bad(t) : t;
    }
    return { icon: '🤼', title: 'Pro wrestling', text: ev.t, choices: ev.c.map(function (c) { return { label: c[0], run: function () { return apply(c[1]); } }; }) };
  } });

  // ------------------------------------------------------------ retire and legacy
  function retire(how) {
    var w = x(), s = S();
    if (how === 'match' && !count('wrretire')) {
      bump('wrretire');
      var q = matchQuality(w, 75, 50), opp = oppAtSpot({ push: 80, promo: w.promo });
      record(w, opp, q, U.chance(0.5), shows(w.promo)[0] + ' (retirement match)');
      E.log('👋 I wrestled my retirement match against ' + opp + ' at ' + shows(w.promo)[0] + ' ' + starTxt(q) + '. There wasn\'t a dry eye in the building.', 'good');
    }
    w.belts.slice().forEach(function (b) { endReign(w, b, 'vacated (retired)'); });
    w.retired = yr();
    var worlds = w.reigns.filter(function (r) { return /World|WWF Championship|WWE Championship|WWWF|IWGP Heavyweight|AEW World|Women's (World )?Championship/.test(r.belt) && !/Tag/.test(r.belt); }).length;
    var peak = Math.max.apply(null, w.hist.map(function (q) { return q.push; }).concat([0]));
    if (!w.hof && (worlds >= 3 || (worlds >= 1 && peak >= 90 && yr() - w.since >= 12) || w.honors.length >= 7)) {
      w.hof = yr(); var hof = yr() >= 1993 ? (w.promo === 'wcw' || w.promo === 'nwa' ? 'the NWA Hall of Heroes' : w.promo === 'aew' ? 'the Pro Wrestling Hall of Fame' : 'the WWE Hall of Fame') : 'the Wrestling Observer Hall of Fame';
      w.honors.push('Inducted into ' + hof + ' ' + yr());
      E.log('🏛️ I was inducted into ' + hof + '.', 'good'); E.fame(5);
    }
    var sp = s.sp && s.sp.wrestler; if (sp) { sp.retired = yr(); }
    E.quitJob(true);
    ui().closeAll(); done('I hung up my boots after ' + U.plural(yr() - w.since, 'year') + ' in the ring.');
  }

  // ------------------------------------------------------------ screens
  function card(w) {
    var B = belts(w.promo), g = G[w.gim] || G.underdog;
    var bar = function (l, v) { return '<div class="minibar wide"><span>' + l + ' ' + Math.round(v) + '</span><span class="track"><span class="fill ' + (v >= 75 ? 'hi' : v >= 45 ? 'mid' : 'lo') + '" style="width:' + Math.max(2, v) + '%"></span></span></div>'; };
    return '<div class="kv"><b>“' + U.esc(w.name) + '”</b> · ' + (w.align === 'face' ? '😇 Face' : '😈 Heel') + ' · ' + U.esc(g.name) + '<br>' + U.esc(title()) + ' · ' + U.esc(pname(w.promo)) + (w.contract ? ' · ' + E.fmt(w.contract.pay) + '/yr, ' + U.plural(w.contract.years, 'year') + ' left' : ' · no contract') + '<br>Boss: ' + U.esc(boss(w.promo)) + ' · record ' + w.w + '-' + w.l + '</div>' +
      bar('In-ring', w.ring) + bar('Mic skills', w.mic) + bar('Popularity', w.pop) + bar('Push', w.push) + bar('Backstage standing', w.stand) + bar('Body wear', w.wear) +
      '<p class="small">' + (w.mom >= 10 ? '🔥 Hot right now (momentum +' + w.mom + ')' : w.mom <= -10 ? '🧊 Cold right now (momentum ' + w.mom + ')' : '〰️ Momentum ' + (w.mom >= 0 ? '+' : '') + w.mom) +
      (w.belts.length ? '<br>🏆 ' + U.esc(w.belts.join(' · ')) : '') + (w.feud ? '<br>😤 Feuding with ' + U.esc(w.feud.opp) + ' (heat ' + Math.round(w.feud.heat) + ')' : '') + (w.shot ? '<br>🎟️ Title shot at ' + U.esc(shows(w.promo)[0]) : '') + (w.mitb ? '<br>💼 Holding Money in the Bank' : '') + (w.tag ? '<br>🤝 ' + U.esc(w.tag.name) + ' with ' + U.esc(w.tag.partner) : '') +
      (w.best ? '<br>⭐ Best match: ' + starTxt(w.best.q) + ' vs ' + U.esc(w.best.opp) + ' (' + w.best.y + ')' : '') + (w.pwi ? '<br>📊 Best PWI 500 rank: #' + w.pwi : '') + '</p>';
  }
  function menu() {
    ui().menu('🤼 Pro wrestling', function () {
      var w = x(), j = S().job, on = w && !w.retired && j && j.special === 'wrestler', items = [];
      if (!on) {
        items.push({ info: true, html: '<p class="muted">Train at a wrestling school, pick a gimmick and a ring name, and debut on the indies' + (yr() < 1988 ? ' or in a regional territory' : '') + '. Work your way to ' + (open('aew') ? 'WWE or AEW' : open('wcw') ? 'the WWF or WCW' : open('wwf') ? 'the big leagues' : 'the top') + '.</p>' });
        if (w && w.retired) items.push({ info: true, html: card(w) });
        items.push({ icon: '🤼', label: w && w.retired ? 'Come out of retirement' : 'Go to wrestling school', sub: 'Age 18+ · athletic (45+)', onClick: function () { if (w && w.retired) { if (S().job) return done(nope('I\'d have to quit my current job first.')); w.retired = null; S().job = { career: 'sp_wrestler', special: 'wrestler', fame: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, salary: 0, company: pname(w.promo) }; if (S().sp && S().sp.wrestler) S().sp.wrestler.retired = false; w.mom = 20; ui().closeAll(); return done(good('🤼 The crowd lost its mind: “' + w.name + '” is back!')); } startMenu(); } });
        if (w && w.reigns.length) items.push({ icon: '🏆', label: 'Title history', onClick: titles });
        return items;
      }
      var B = belts(w.promo);
      items.push({ info: true, html: card(w) });
      items.push({ section: 'Get better' });
      items.push({ icon: '💪', label: 'Train in the ring', sub: 'In-ring ' + Math.round(w.ring), disabled: count('wrtrain') >= 2, onClick: function () { train('ring'); } });
      items.push({ icon: '🎙️', label: 'Promo class', sub: 'Mic skills ' + Math.round(w.mic), disabled: count('wrtrain') >= 2, onClick: function () { train('mic'); } });
      items.push({ section: 'On the show' });
      items.push({ icon: '🎤', label: 'Cut a big promo', sub: w.feud ? 'Heat up my feud with ' + w.feud.opp : 'Grab the crowd', disabled: count('wrpromo') > 0 || count('wrrest') > 0, onClick: promo });
      items.push({ icon: '😤', label: w.feud ? 'Feuding with ' + w.feud.opp : 'Start a feud', sub: w.feud ? 'Pays off at a big show' : 'Pick an opponent', disabled: !!w.feud, onClick: feud });
      if (B[0] && w.belts.indexOf(B[0]) < 0) items.push({ icon: '🏆', label: 'Ask for a shot at the ' + beltShort(B[0]) + ' title', sub: 'Needs a main-event push', disabled: count('wrshot') > 0 || !!w.shot, onClick: function () { askShot('world'); } });
      if ((B[1] || B[2]) && w.belts.indexOf(B[1] || B[2]) < 0) items.push({ icon: '🥈', label: 'Ask for a shot at the ' + beltShort(B[1] || B[2]) + ' title', sub: 'Needs a midcard push', disabled: count('wrshot') > 0 || !!w.shot, onClick: function () { askShot('mid'); } });
      items.push({ icon: w.align === 'face' ? '😈' : '😇', label: 'Turn ' + (w.align === 'face' ? 'heel' : 'face'), sub: 'Works best when the act has gone cold', onClick: turn });
      items.push({ icon: '🤝', label: w.tag ? 'Split up ' + w.tag.name : 'Form a tag team', sub: w.tag ? 'Go back to singles' : 'Tag titles are easier to win', onClick: tagTeam });
      items.push({ section: 'Backstage' });
      items.push({ icon: '🗣️', label: 'Politic with ' + boss(w.promo), sub: 'Standing ' + Math.round(w.stand), disabled: count('wrpol') > 0, onClick: politic });
      items.push({ icon: '🔄', label: 'Ask to be repackaged', sub: 'New gimmick, new name', onClick: repackage });
      items.push({ icon: '🩹', label: 'Take time off to heal', sub: 'Body wear ' + Math.round(w.wear) + ' · half pay', disabled: count('wrrest') > 0, onClick: rest });
      items.push({ section: 'Career' });
      items.push({ icon: '🏆', label: 'Title history', sub: U.plural(w.reigns.length, 'reign'), onClick: titles });
      items.push({ icon: '📼', label: 'Match history', sub: 'Record ' + w.w + '-' + w.l, onClick: matchList });
      items.push({ icon: '📜', label: 'Year by year', onClick: years });
      items.push({ icon: '👋', label: 'Retire with a farewell match', danger: true, onClick: function () { ui().confirm('Retire?', 'Wrestle one last match and hang up the boots?', function () { retire('match'); }); } });
      return items;
    });
  }
  function titles() {
    ui().menu('Title history', function () {
      var w = x(), items = [];
      if (!w.reigns.length) return [{ info: true, html: '<p class="muted">No championships yet.</p>' }];
      w.reigns.slice().reverse().forEach(function (r) { items.push({ icon: '🏆', label: r.belt, sub: r.promo + ' · ' + r.from + '–' + (r.to || 'now') + ' · ' + U.plural(r.def, 'defense') + (r.beat ? ' · won from ' + r.beat : '') + (r.lostTo ? (/^vacated/.test(r.lostTo) ? ' · ' + r.lostTo : ' · lost to ' + r.lostTo) : '') }); });
      if (w.honors.length) { items.push({ section: 'Honors' }); w.honors.slice().reverse().forEach(function (h) { items.push({ icon: '🏅', label: h }); }); }
      return items;
    });
  }
  function matchList() {
    ui().menu('Match history', function () {
      var w = x();
      return [{ info: true, html: '<p class="muted">Big matches, newest first. Ratings in stars, Wrestling Observer style.</p>' }].concat(w.matches.slice().reverse().map(function (q) { return { icon: q.won ? '✅' : '❌', label: (q.won ? 'def. ' : 'lost to ') + q.opp, sub: q.y + ' · ' + q.show + (q.belt ? ' · ' + q.belt : ''), right: starTxt(q.q).replace(/ \(.*/, '') }; }));
    });
  }
  function years() {
    ui().menu('Year by year', function () {
      var w = x();
      return w.hist.slice().reverse().map(function (q) { return { icon: '🤼', label: q.y + ' · ' + q.spot, sub: q.promo + ' · age ' + q.age + ' · ' + q.rec + ' · push ' + q.push + (q.note ? ' · ' + q.note : ''), right: E.fmt(q.earn) }; });
    });
  }
  function summary() { var w = x(); return !w ? 'Gimmicks, real promotions, title belts, WrestleMania · 18+' : w.retired ? 'Retired · ' + U.plural(w.reigns.length, 'title reign') : title() + ' · ' + short(w.promo); }
  return { menu: menu, titles: titles, matchList: matchList, year: year, title: title, summary: summary, belts: belts, shows: shows, open: open, P: P };
})();
