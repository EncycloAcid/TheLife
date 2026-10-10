/* TheLife — politics: parties, political skills (rhetoric, fundraising,
 * policy, grassroots), a campaign war chest, debates, a legislative record,
 * a signature power for each office, crises and endorsements, and life after
 * office (memoirs, paid speeches, a president's place in history). The
 * office itself is the politician job from js/engine.js (job.politics); this
 * file keeps its extra state in S().pol. */
TL.politics = (function () {
  var U = TL.util, D = TL.data, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function def(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
  function count(key) { var y = S().yearActs || (S().yearActs = {}); return y[key] || 0; }
  function bump(key) { var y = S().yearActs || (S().yearActs = {}); y[key] = (y[key] || 0) + 1; }
  function job() { var j = S().job; return j && j.politics ? j : null; }

  // ------------------------------------------------------------ parties
  function parties() {
    var c = S().country;
    if (c === 'United States') return [['Democratic Party', 'Democrat', -1, '🔵'], ['Republican Party', 'Republican', 1, '🔴'], ['Independent', 'Independent', 0, '⚪']];
    if (c === 'United Kingdom') return [['Labour Party', 'Labour', -1, '🔴'], ['Conservative Party', 'Conservative', 1, '🔵'], ['Liberal Democrats', 'Lib Dem', 0, '🟠']];
    if (c === 'Canada') return [['Liberal Party', 'Liberal', -1, '🔴'], ['Conservative Party', 'Conservative', 1, '🔵'], ['New Democratic Party', 'NDP', -1, '🟠']];
    return [['Progressive Party', 'Progressive', -1, '🟢'], ['Conservative Party', 'Conservative', 1, '🔵'], ['Centre Party', 'Centrist', 0, '🟡']];
  }
  // Bills by lean: -1 progressive, 1 conservative, 0 either.
  var BILLS = [
    ['a minimum wage increase', -1], ['free school lunches', -1], ['a clean energy plan', -1], ['an affordable housing program', -1], ['paid family leave', -1],
    ['a tax cut', 1], ['a balanced budget amendment', 1], ['more police funding', 1], ['cutting red tape for small businesses', 1], ['school choice vouchers', 1],
    ['road and bridge repairs', 0], ['a veterans healthcare bill', 0], ['broadband for rural towns', 0], ['a new public park', 0], ['an anti-corruption law', 0]
  ];
  // One signature power per office.
  var POWERS = [
    ['🏘️', 'Fight for my district', 'Win a project for my neighborhood'],
    ['🏙️', 'Launch a city project', 'Parks, potholes, a new transit line'],
    ['✒️', 'Sign or veto a bill', 'The legislature sent me something big'],
    ['🗣️', 'Filibuster', 'Hold the floor for hours against a bad bill'],
    ['📜', 'Sign an executive order', 'Act without waiting for Congress']
  ];

  // ------------------------------------------------------------ state
  var SK = [['rhet', 'Rhetoric', '🎙️'], ['fund', 'Fundraising', '💰'], ['pol', 'Policy', '📜'], ['grass', 'Grassroots', '🤝']];
  function st() {
    var s = S();
    if (!s.pol) {
      var p = U.pick(parties()), m = me();
      s.pol = { party: p[0], short: p[1], lean: p[2], icon: p[3], sk: { rhet: U.clamp(Math.round(15 + m.looks / 6 + U.rand(0, 10)), 5, 60), fund: U.rand(10, 30), pol: U.clamp(Math.round(10 + m.smarts / 5 + U.rand(0, 8)), 5, 60), grass: U.rand(15, 35) }, chest: 0, laws: [], offices: [], picked: false };
    }
    return s.pol;
  }
  function sv(k) { return Math.round(st().sk[k]); }
  function learn(k, n) { var o = st().sk; o[k] = U.clamp(Math.round((o[k] + n * Math.max(0.25, (100 - o[k]) / 60)) * 10) / 10, 0, 100); }
  function chest() { return S().pol ? S().pol.chest || 0 : 0; }
  function spend(n) { var x = st(); x.chest = Math.max(0, (x.chest || 0) - n); }
  // Extra election odds from my skills and this race's debate.
  function bonus(level, incumbent) {
    if (!S().pol) return 0;
    var b = (sv('rhet') - 30) / 500 + (sv('grass') - 30) / 600 + (S().flags.debate || 0);
    return U.clamp(b, -0.1, 0.12);
  }

  // ------------------------------------------------------------ the year
  function yearly(j) {
    var x = st(), s = S();
    // Approval drifts back toward the middle; grassroots work slows the slide.
    j.perf = U.clamp(Math.round(j.perf + (55 - j.perf) / 7 + (sv('grass') - 35) / 30), 0, 100);
    learn('pol', 0.6); learn('rhet', 0.4);
    if (x.offices.indexOf(j.level) < 0) x.offices.push(j.level);
    x.inOffice = j.level;
    // Donors keep money flowing to an incumbent.
    x.chest = (x.chest || 0) + E.$(Math.round(2000 * (j.level + 1) * (1 + sv('fund') / 50)));
    if (s.prison) return;
    if (U.chance(0.28)) s.pending.push({ id: 'pol_crisis', data: { level: j.level } });
    else if (U.chance(0.15)) s.pending.push({ id: 'pol_endorse', data: {} });
  }
  // Leaving office: presidents get a place in history.
  function check() {
    var s = S(), x = s.pol, j = job();
    if (!x || x.inOffice == null || j) return;
    var was = x.inOffice; x.inOffice = null; x.left = s.year;
    if (was === 4 && !x.rank) {
      var score = (x.lastApproval || 50) + x.laws.filter(function (l) { return l.office === 4; }).length * 4 + (s.karma - 50) / 2;
      x.rank = U.clamp(Math.round(47 - score / 2.4 + U.rand(-4, 4)), 1, 47);
      E.log('📚 Historians now rank me #' + x.rank + ' among ' + (s.country === 'United States' ? 'American presidents' : 'our country\'s leaders') + '.', x.rank <= 15 ? 'good' : '');
      if (x.rank <= 10) E.achieve('great_president');
      E.log('🏛️ My presidential library opened in my hometown.', 'good'); E.fame(5);
    }
  }

  // ------------------------------------------------------------ menu
  function card(j) {
    var x = st();
    return '<div class="hb-arch">' + x.icon + ' ' + U.esc(x.party) + ' · ' + U.esc(E.jobTitle(j)) + ' · term ' + j.terms + ', ' + U.plural(Math.max(0, j.term), 'year') + ' left</div>' +
      '<div class="minibar wide"><span>Approval ' + j.perf + '%</span><span class="track"><span class="fill ' + (j.perf >= 55 ? 'hi' : j.perf >= 35 ? 'mid' : 'lo') + '" style="width:' + j.perf + '%"></span></span></div>' +
      SK.map(function (k) { var v = sv(k[0]); return '<div class="minibar wide"><span>' + k[1] + ' ' + v + '</span><span class="track"><span class="fill ' + (v >= 66 ? 'hi' : v >= 33 ? 'mid' : 'lo') + '" style="width:' + v + '%"></span></span></div>'; }).join('') +
      '<p class="small muted">💰 War chest ' + E.fmt(x.chest || 0) + ' · 📜 ' + U.plural(x.laws.length, 'law') + ' passed</p>';
  }
  function items(j) {
    var x = st(), out = [{ info: true, html: card(j) }];
    if (!x.picked) out.push({ icon: '🏛️', label: 'Choose my party', sub: 'Now: ' + x.party, onClick: pickParty });
    out.push({ icon: '🎙️', label: 'Give a speech', sub: 'Rhetoric ' + sv('rhet'), disabled: count('pol_speech') >= 2, onClick: function () {
      bump('pol_speech'); learn('rhet', 1.5);
      if (U.chance(U.clamp(0.3 + sv('rhet') / 160, 0.2, 0.9))) { j.perf = U.clamp(j.perf + U.rand(3, 7), 0, 100); E.fame(1); return done(good('My speech on ' + U.pick(['the economy', 'healthcare', 'education', 'crime', 'the environment', 'taxes']) + ' brought the room to its feet. 🎙️')); }
      j.perf = Math.max(0, j.perf - 4); done(bad('I stumbled over my words. The clip is going around online.'));
    } });
    out.push({ icon: '🤝', label: 'Meet voters', sub: 'Grassroots ' + sv('grass'), disabled: count('pol_voters') >= 2, onClick: function () { bump('pol_voters'); learn('grass', 2); j.perf = U.clamp(j.perf + U.rand(1, 4) + Math.round(sv('grass') / 40), 0, 100); done('I shook hands and listened at a ' + U.pick(['county fair', 'diner', 'town hall', 'farmers market', 'union hall', 'church picnic']) + '.'); } });
    out.push({ icon: '💰', label: 'Hold a fundraiser', sub: 'Fundraising ' + sv('fund') + ' · fills the war chest', disabled: count('pol_fund') > 0, onClick: function () {
      bump('pol_fund'); learn('fund', 3);
      var raised = E.$(Math.round(U.rand(8, 20) * 1000 * (j.level + 1) * (0.5 + sv('fund') / 40) * (1 + S().fame / 100)));
      x.chest = (x.chest || 0) + raised; E.stat('happy', -2);
      done('I worked the room at a $' + U.pick(['500', '1,000', '2,500']) + '-a-plate dinner and raised ' + E.fmt(raised) + ' for my campaign. 💰');
    } });
    out.push({ icon: '📜', label: 'Propose a bill', sub: 'Policy ' + sv('pol'), disabled: count('pol_bill') > 0, onClick: function () { proposeBill(j); } });
    var pw = POWERS[j.level];
    out.push({ icon: pw[0], label: pw[1], sub: pw[2], disabled: count('pol_power') > 0, onClick: function () { power(j); } });
    if (j.level < D.POLITICS.levels.length - 1) out.push({ icon: '🗳️', label: 'Run for ' + D.POLITICS.levels[j.level + 1][0], sub: j.levelYears < 2 ? 'Serve 2 years first' : 'Win to move up', disabled: j.levelYears < 2 || count('campaign') > 0 || !!(S().yearActs || {}).campaign, onClick: function () { campaign(j.level + 1); } });
    out.push({ icon: '📚', label: 'Legislative record', sub: U.plural(x.laws.length, 'law'), onClick: record });
    return out;
  }
  function pickParty() {
    var x = st();
    ui().choose('🏛️ My party', 'Which party do I run with? It shapes the bills I push and the voters I win.', parties().map(function (p) {
      return { label: p[3] + ' ' + p[0], fn: function () { x.party = p[0]; x.short = p[1]; x.lean = p[2]; x.icon = p[3]; x.picked = true; done('I\'m running as a member of the ' + p[0] + '.'); } };
    }));
  }
  function proposeBill(j) {
    var x = st(), passed = x.laws.map(function (l) { return l.title; }), pool = U.shuffle(BILLS.filter(function (b) { return (b[1] === 0 || b[1] === x.lean || x.lean === 0) && passed.indexOf(b[0]) < 0; })).slice(0, 3);
    if (!pool.length) return done(nope('I\'ve already passed everything on my agenda. Time to run for higher office.'));
    ui().choose('📜 Propose a bill', 'What do I put my name on this year?', pool.map(function (b) {
      return { label: U.cap(b[0]) + (b[1] === x.lean && b[1] !== 0 ? ' (my base loves it)' : b[1] === 0 ? ' (bipartisan)' : ''), fn: function () {
        if (count('pol_bill')) return done(nope('I already pushed a big bill this year.'));
        bump('pol_bill'); learn('pol', 2);
        var p = U.clamp(0.25 + sv('pol') / 200 + j.perf / 300 + (b[1] === 0 ? 0.12 : 0), 0.1, 0.85);
        if (U.chance(p)) {
          x.laws.push({ title: b[0], year: S().year, office: j.level });
          j.perf = U.clamp(j.perf + U.rand(5, 10) + (b[1] === x.lean && b[1] !== 0 ? 3 : 0), 0, 100); E.karma(2); E.fame(1);
          if (x.laws.length >= 10) E.achieve('lawmaker');
          return done(good('My bill for ' + b[0] + ' passed and became law! 📜'));
        }
        j.perf = Math.max(0, j.perf - 4); done(bad('My bill for ' + b[0] + ' was voted down.'));
      } };
    }));
  }
  function power(j) {
    var x = st(); if (count('pol_power')) return done(nope('I already did that this year.'));
    bump('pol_power');
    if (j.level === 0) { learn('grass', 2); if (U.chance(0.5 + sv('grass') / 200)) { j.perf = Math.min(100, j.perf + 6); return done(good('I won funding for a new ' + U.pick(['library branch', 'crosswalk', 'community center', 'playground']) + ' in my district.')); } return done('The council shelved my project until next year.'); }
    if (j.level === 1) { if (U.chance(0.45 + sv('pol') / 200)) { j.perf = Math.min(100, j.perf + 8); x.laws.push({ title: 'a city ' + U.pick(['transit line', 'park', 'housing project', 'pothole blitz']), year: S().year, office: 1 }); return done(good('My city project opened on time and under budget. 🏙️')); } j.perf = Math.max(0, j.perf - 5); return done(bad('The project went over budget and the papers are calling it a boondoggle.')); }
    if (j.level === 2) {
      var bill = U.pick(BILLS);
      return ui().choose('✒️ ' + U.cap(bill[0]), 'The legislature passed ' + bill[0] + '. Do I sign it?', [
        { label: 'Sign it', fn: function () { x.laws.push({ title: bill[0], year: S().year, office: 2 }); j.perf = U.clamp(j.perf + (bill[1] === x.lean || bill[1] === 0 ? 5 : -4), 0, 100); done('I signed ' + bill[0] + ' into law. ✒️'); } },
        { label: 'Veto it', fn: function () { j.perf = U.clamp(j.perf + (bill[1] === -x.lean ? 5 : -3), 0, 100); learn('rhet', 1); done('I vetoed ' + bill[0] + '.'); } }
      ]);
    }
    if (j.level === 3) { learn('rhet', 3); E.stat('health', -3); if (U.chance(0.35 + sv('rhet') / 200)) { j.perf = Math.min(100, j.perf + 7); E.fame(3); return done(good('I spoke for 14 hours straight. The bill died, and my base is thrilled. 🗣️')); } j.perf = Math.max(0, j.perf - 3); return done('I held the floor all night, but the votes were there. The bill passed anyway.'); }
    var order = U.pick(BILLS.filter(function (b) { return b[1] === x.lean || b[1] === 0; }));
    x.laws.push({ title: order[0] + ' (executive order)', year: S().year, office: 4 });
    if (U.chance(0.25)) { j.perf = Math.max(0, j.perf - 6); return done(bad('I signed an executive order on ' + order[0] + '. A court blocked it within a week.')); }
    j.perf = Math.min(100, j.perf + 5); return done(good('I signed an executive order on ' + order[0] + '. 📜'));
  }
  // Campaigning: pick a budget, then face the debate.
  function campaign(level) {
    var office = D.POLITICS.levels[level][0];
    ui().menu('Campaign for ' + office, function () {
      var c = chest();
      return [{ info: true, html: '<p class="muted">Looks, smarts, karma, fame and my political skills all sway voters. A bigger budget helps, and the war chest pays first' + (c ? ' (' + E.fmt(c) + ' in it)' : '') + '. A criminal record hurts.</p>' }].concat(E.campaigns.map(function (cm, i) {
        var cost = E.campaignCost(i, level);
        return { icon: ['🚪', '📣', '📺', '🚀'][i], label: cm[0], sub: 'Win chance ~' + Math.round(E.electionChance(level, i) * 100) + '%', right: cost ? E.fmt(cost) : 'Free', disabled: !!(S().yearActs || {}).campaign || cost > S().money + c, onClick: function () { debate(level, i); } };
      }));
    });
  }
  function debate(level, tier) {
    ui().choose('🎤 The debate', 'Two weeks before the election, my opponent and I face off on live TV. How do I play it?', [
      { label: '⚔️ Go on the attack', fn: function () { go(level, tier, U.chance(0.3 + sv('rhet') / 200) ? 0.08 : -0.06, 'rhet'); } },
      { label: '📜 Win on the details', fn: function () { go(level, tier, (sv('pol') - 40) / 400 + 0.02, 'pol'); } },
      { label: '😊 Stay positive and relatable', fn: function () { go(level, tier, (sv('grass') - 40) / 500 + 0.03, 'grass'); } }
    ]);
  }
  function go(level, tier, b, k) {
    var s = S();
    if ((s.yearActs || {}).campaign) return done(nope('I already ran a campaign this year.'));
    s.yearActs = s.yearActs || {}; s.yearActs.campaign = 1;
    learn(k, 2); learn('rhet', 1);
    s.flags.debate = b;
    var r = E.runForOffice(level, tier);
    s.flags.debate = 0;
    if (r.ok) { var x = st(); if (x.offices.indexOf(level) < 0) x.offices.push(level); x.inOffice = level; ui().closeAll(); }
    done(r.ok ? good((b > 0.03 ? 'I won the debate. ' : b < 0 ? 'The debate went badly, but ' : '') + r.msg) : bad((b < 0 ? 'I lost the debate. ' : '') + r.msg));
  }
  function record() {
    ui().menu('Legislative record', function () {
      var x = st(), rows = [], names = D.POLITICS.levels.map(function (l) { return l[0]; });
      rows.push({ icon: x.icon, label: x.party, sub: 'Offices held: ' + (x.offices.length ? x.offices.slice().sort().map(function (o) { return names[o]; }).join(', ') : 'none yet') });
      x.laws.slice().reverse().forEach(function (l) { rows.push({ icon: '📜', label: U.cap(l.title), sub: l.year + ' · as ' + names[l.office] }); });
      if (x.rank) rows.push({ icon: '📚', label: 'Ranked #' + x.rank + ' by historians' });
      if (x.memoir) rows.push({ icon: '📖', label: 'Memoir: "' + x.memoir + '"' });
      if (rows.length === 1) rows.push({ info: true, html: '<p class="muted">No laws yet. Propose a bill.</p>' });
      return rows;
    });
  }
  // After office: memoirs and the speaking circuit.
  function formerItems() {
    var x = S().pol; if (!x || !x.offices || !x.offices.length || job()) return [];
    var top = Math.max.apply(null, x.offices), title = D.POLITICS.levels[top][0];
    var out = [];
    if (!x.memoir) out.push({ icon: '📖', label: 'Write my political memoir', sub: 'Former ' + title, onClick: function () {
      x.memoir = U.pick(['A Promise Kept', 'The Long Road', 'Hard Choices', 'Dreams of My Town', 'Becoming', 'Profiles in Grit', 'No Easy Answers']);
      var adv = E.$(Math.round([50000, 150000, 800000, 2500000, 15000000][top] * U.randf(0.6, 1.4)));
      E.addMoney(adv); E.fame(3); E.achieve('author');
      done(good('My memoir "' + x.memoir + '" came out. The advance was ' + E.fmt(adv) + '. 📖'));
    } });
    out.push({ icon: '🎤', label: 'Give paid speeches', sub: 'Former ' + title, disabled: count('pol_circuit') > 0, onClick: function () {
      bump('pol_circuit');
      var fee = E.$(Math.round([3000, 15000, 60000, 150000, 400000][top] * U.rand(2, 6)));
      E.addMoney(fee); done('I gave speeches to conferences and banks this year and earned ' + E.fmt(fee) + '. 🎤');
    } });
    out.push({ icon: '📚', label: 'Legislative record', onClick: record });
    return out;
  }

  // ------------------------------------------------------------ events
  var CRISES = [
    ['A water main burst and half the district has no water.', 'a burst water main'],
    ['A hurricane is bearing down on the coast.', 'a hurricane'],
    ['Teachers are threatening a strike.', 'a teachers\' strike'],
    ['The budget has a huge hole in it.', 'a budget shortfall'],
    ['A factory that employs thousands is about to close.', 'a factory closing']
  ];
  def('pol_crisis', { cond: function () { return !!job(); }, build: function (d) {
    var j = job(), c = U.pick(CRISES);
    return { icon: '🚨', title: 'Crisis', text: c[0] + ' Everyone is looking at me.', choices: [
      { label: 'Get on the ground and lead', run: function () { learn('grass', 2); if (U.chance(0.4 + sv('grass') / 200)) { j.perf = Math.min(100, j.perf + 9); E.fame(2); return good('I was there day and night. People saw it. My handling of ' + c[1] + ' won praise across the aisle.'); } j.perf = Math.max(0, j.perf - 5); return bad('I showed up, but the response was a mess.'); } },
      { label: 'Bring in experts and a detailed plan', run: function () { learn('pol', 2); if (U.chance(0.4 + sv('pol') / 200)) { j.perf = Math.min(100, j.perf + 7); return good('My plan for ' + c[1] + ' worked. Boring, effective, popular.'); } j.perf = Math.max(0, j.perf - 4); return bad('The plan took too long. Voters wanted action.'); } },
      { label: 'Blame the other party', run: function () { learn('rhet', 1); if (U.chance(0.3 + sv('rhet') / 250)) { j.perf = Math.min(100, j.perf + 3); return 'My base rallied behind me. Everyone else rolled their eyes.'; } j.perf = Math.max(0, j.perf - 8); E.karma(-2); return bad('Voters saw through it. My approval sank.'); } }
    ] };
  } });
  def('pol_endorse', { cond: function () { return !!job(); }, build: function () {
    var j = job(), who = U.pick(['the biggest labor union in the state', 'a beloved former president', 'a pop superstar', 'the largest newspaper', 'a famous athlete', 'a popular talk-show host']);
    return { icon: '📣', title: 'Endorsement', text: U.cap(who) + ' wants to publicly endorse me.', choices: [
      { label: 'Accept and campaign together', run: function () { j.perf = Math.min(100, j.perf + U.rand(3, 7)); E.fame(2); learn('grass', 1); return good('The endorsement from ' + who + ' made headlines. 📣'); } },
      { label: 'Politely decline', run: function () { return 'I thanked them but kept my distance.'; } }
    ] };
  } });

  return { st: st, items: items, yearly: yearly, check: check, bonus: bonus, chest: chest, spend: spend, campaign: campaign, formerItems: formerItems, lastApproval: function (v) { if (S().pol) S().pol.lastApproval = v; } };
})();
