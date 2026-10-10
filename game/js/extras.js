/* TheLife — v1.6: family tree, holidays, New Year's resolutions, tattoos,
 * coming out. Events are registered into TL.events.defs; the yearly hook is
 * called from TL.features.yearly. */
TL.extras = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function def(id, o) { o.id = id; o.w = o.w || 10; TL.events.defs[id] = o; }
  function oppositeOf(g) { return g === 'M' ? 'F' : 'M'; }

  // ====================================================================
  // FAMILY TREE
  // ====================================================================
  // Earlier generations, recorded when the family line continues.
  function recordAncestor(prev, st) {
    var d = prev.me;
    var title = TL.coup && TL.coup.titleOf ? TL.coup.titleOf(prev) : null; // crowned ancestors are remembered by their title
    st.lineage = (prev.lineage || []).concat([{ first: d.first, last: d.last, gender: d.gender, gen: prev.gen, born: prev.year - d.age, died: prev.year, age: d.age, cause: prev.cause, title: title }]);
  }
  function node(icon, name, sub, cls) {
    return '<div class="tn ' + (cls || '') + '"><span class="tn-ico">' + icon + '</span><span class="tn-txt"><b>' + U.esc(name) + '</b><small>' + U.esc(sub) + '</small></span></div>';
  }
  function personNode(p) {
    var A = TL.actions;
    return node(A.personIcon(p), p.first + ' ' + p.last, A.roleLabel(p) + (p.alive ? ' · ' + p.age : ' · †' + (p.died || '')), p.alive ? '' : 'dead');
  }
  function tier(label, nodes) {
    if (!nodes.length) return '';
    return '<div class="tier"><div class="tier-h">' + label + '</div><div class="tier-row">' + nodes.join('') + '</div></div>';
  }
  function treeHtml() {
    var s = S(), m = me(), all = s.people;
    function of(roles) { return all.filter(function (p) { return roles.indexOf(p.role) >= 0; }).sort(function (a, b) { return b.age - a.age; }); }
    function known(a) { return all.some(function (p) { return p.first === a.first && p.last === a.last && p.died === a.died; }); }
    var html = '';
    var anc = (s.lineage || []).filter(function (a) { return !known(a); });
    html += tier('Ancestors', anc.map(function (a) { return a.title ? node('👑', a.title, a.first + ' ' + a.last + ' · Gen ' + a.gen + ' · ' + a.born + '–' + a.died, 'dead') : node('🪦', a.first + ' ' + a.last, 'Gen ' + a.gen + ' · ' + a.born + '–' + a.died + ' · ' + a.cause, 'dead'); }));
    // Relatives still in my life who once wore the crown keep their title too.
    function titled(p) { var t = (s.lineage || []).filter(function (a) { return a.title && a.first === p.first && a.last === p.last && a.died === p.died; })[0]; return t ? node('👑', t.title, TL.actions.roleLabel(p) + ' · †' + (p.died || ''), 'dead') : personNode(p); }
    html += tier('Grandparents', of(['grandparent']).map(titled));
    html += tier('Parents', of(['mother', 'father', 'stepmother', 'stepfather']).map(titled));
    var mine = [node(TL.actions.personIcon({ alive: !s.dead, age: m.age, gender: m.gender }), m.first + ' ' + m.last, 'Me · ' + m.age + (s.gen > 1 ? ' · Gen ' + s.gen : ''), 'me')];
    html += tier('Me', mine.concat(of(['spouse', 'fiance', 'partner']).filter(function (p) { return p.alive; }).map(personNode)));
    html += tier('Siblings', of(['sibling']).map(personNode));
    html += tier('Children', of(['child']).map(personNode));
    html += tier('Grandchildren', of(['grandchild']).map(personNode));
    var living = all.filter(function (p) { return p.alive && ['mother', 'father', 'grandparent', 'sibling', 'child', 'grandchild', 'spouse'].indexOf(p.role) >= 0; }).length;
    var rulers = (s.lineage || []).filter(function (a) { return a.title; }).length;
    return '<div class="tree-sum">' + U.plural(s.gen, 'generation') + ' · ' + U.plural(living, 'living relative') + (rulers ? ' · 👑 ' + U.plural(rulers, 'ruler') + ' in the family line' : '') + '</div><div class="tree">' + html + '</div>';
  }
  function treeMenu() {
    E.achieve('roots');
    ui().menu('Family tree', function () { return [{ info: true, html: treeHtml() }]; });
  }

  // ====================================================================
  // TATTOOS
  // ====================================================================
  var DESIGNS = [
    ['❤️', 'A heart', 150], ['⚓', 'An anchor', 200], ['🐉', 'A dragon sleeve', 1200], ['💀', 'A skull', 300],
    ['🌹', 'A rose', 250], ['🦋', 'A butterfly', 200], ['🌀', 'A tribal band', 400], ['✍️', 'A quote in Latin', 180]
  ];
  function tattoos() { return S().tattoos || (S().tattoos = []); }
  function getTattoo(icon, name, cost, extra) {
    if (S().money < cost) return done(nope('I can\'t afford that tattoo.'));
    E.addMoney(-cost);
    var t = { icon: icon, name: name, year: S().year };
    if (extra) Object.keys(extra).forEach(function (k) { t[k] = extra[k]; });
    tattoos().push(t);
    E.achieve('inked');
    if (U.chance(0.08)) { E.stat('looks', -3); E.stat('happy', -6); t.botched = true; return done(bad('The artist botched it. ' + name + ' looks like ' + U.pick(['a potato', 'a melted candle', 'a confused pigeon', 'abstract art']) + '. 😬')); }
    E.stat('happy', U.rand(3, 7)); E.stat('looks', 1);
    done(good('I got a tattoo: ' + name.charAt(0).toLowerCase() + name.slice(1) + '. ' + icon));
  }
  function tattooMenu() {
    if (me().age < 18) return done(nope('I need to be 18 to get a tattoo.'));
    ui().menu('Tattoo parlor', function () {
      var items = [{ info: true, html: '<p>' + (tattoos().length ? 'I have ' + U.plural(tattoos().length, 'tattoo') + '.' : 'Ink is forever… mostly.') + '</p>' }];
      items.push({ section: 'Get inked' });
      DESIGNS.forEach(function (d) {
        var cost = E.$(d[2]);
        items.push({ icon: d[0], label: d[1], right: E.fmt(cost), onClick: function () { getTattoo(d[0], d[1], cost); } });
      });
      var p = E.partner();
      if (p) items.push({ icon: '💘', label: p.first + '\'s name', sub: 'What could go wrong?', right: E.fmt(E.$(120)), onClick: function () { E.rel(p, 12); getTattoo('💘', p.first + '\'s name', E.$(120), { partnerId: p.id }); } });
      if (tattoos().length) {
        items.push({ section: 'Laser removal' });
        tattoos().forEach(function (t, i) {
          var cost = E.$(900);
          items.push({ icon: t.icon, label: 'Remove ' + t.name.charAt(0).toLowerCase() + t.name.slice(1), sub: 'Got it in ' + t.year + (t.botched ? ' · botched' : ''), right: E.fmt(cost), onClick: function () {
            if (S().money < cost) return done(nope('Laser removal costs ' + E.fmt(cost) + '.'));
            E.addMoney(-cost); tattoos().splice(i, 1); E.stat('happy', -2); if (t.botched) E.stat('looks', 3);
            done('I had the tattoo lasered off. That hurt more than getting it. 😖');
          } });
        });
      }
      return items;
    });
  }

  // ====================================================================
  // NEW YEAR'S RESOLUTIONS
  // ====================================================================
  var RESOLUTIONS = {
    fit: ['🏋️', 'Get in shape', function () { return me().athl; }, 5],
    save: ['💰', 'Save more money', function () { return S().money; }, null],
    read: ['📚', 'Read more books', function () { return me().smarts; }, 3],
    happy: ['😊', 'Be happier', function () { return me().happy; }, 5]
  };
  function checkResolution() {
    var s = S(), r = s.resolution;
    if (!r || s.year <= r.year) return;
    var R = RESOLUTIONS[r.type];
    s.resolution = null;
    if (!R) return;
    var now = R[2](), need = R[3] != null ? r.base + R[3] : r.base + Math.max(E.$(1000), Math.abs(r.base) * 0.1);
    if (now >= need) { E.stat('happy', 6); E.log('🎆 I kept my New Year\'s resolution to ' + R[1].toLowerCase() + '!', 'good'); E.achieve('resolute'); }
    else E.log('🙈 I broke my New Year\'s resolution to ' + R[1].toLowerCase() + '.');
  }

  // ====================================================================
  // EVENTS
  // ====================================================================
  def('new_year', { min: 13, max: 100, w: 9, cond: function () { return !S().resolution && !S().prison; }, build: function () {
    return { icon: '🎆', title: 'New Year\'s resolution', text: 'The clock struck midnight. What\'s my resolution this year?', choices: Object.keys(RESOLUTIONS).map(function (k) {
      var R = RESOLUTIONS[k];
      return { label: R[0] + ' ' + R[1], run: function () { S().resolution = { type: k, base: R[2](), year: S().year }; return 'My resolution: ' + R[1].toLowerCase() + '. This year is the year!'; } };
    }).concat([{ label: 'Resolutions are pointless', run: function () { return 'I didn\'t make a resolution. No pressure.'; } }]) };
  } });

  def('halloween', { min: 3, max: 13, w: 12, build: function () {
    function go(costume, bonus) {
      return function () {
        var s = S(); s.flags.halloween = (s.flags.halloween || 0) + 1;
        if (s.flags.halloween >= 3) E.achieve('trickortreat');
        E.stat('happy', U.rand(4, 8) + bonus);
        if (U.chance(0.15)) { E.stat('health', -3); return 'I went trick-or-treating as ' + costume + ' and ate so much candy I threw up. 🎃'; }
        if (U.chance(0.12)) { E.stat('happy', 4); return good('My ' + costume.replace(/^an? /, '') + ' costume won the neighborhood contest! 🏆'); }
        return 'I went trick-or-treating as ' + costume + ' and filled a whole pillowcase with candy. 🍬';
      };
    }
    return { icon: '🎃', title: 'Halloween', text: 'It\'s Halloween! What should I dress up as?', choices: [
      { label: '🦸 A superhero', run: go('a superhero', 0) },
      { label: '👻 A ghost (a bedsheet with holes)', run: go('a ghost', -2) },
      { label: me().gender === 'F' ? '👸 A princess' : '🏴‍☠️ A pirate', run: go(me().gender === 'F' ? 'a princess' : 'a pirate', 0) },
      { label: '🤖 A homemade cardboard robot', run: go('a cardboard robot', 2) }
    ] };
  } });

  def('holiday_gifts', { min: 2, max: 15, w: 8, cond: function () { return E.parentsAround().length > 0; }, build: function () {
    var gift = U.pick(['a bike', 'a video game console', 'a puppy plushie', 'a chemistry set', 'socks. Lots of socks', 'a skateboard', 'a tablet', 'a book I didn\'t ask for']);
    var ps = E.parentsAround();
    return { icon: '🎁', title: 'Holiday morning', text: 'I unwrapped my big present from my parents: ' + gift + '.', choices: [
      { label: 'Hug them and say thank you', run: function () { ps.forEach(function (p) { E.rel(p, 6); }); E.stat('happy', 5); return 'I thanked my parents for ' + gift + '. Best holiday ever. 🎄'; } },
      { label: 'Throw a tantrum', run: function () { ps.forEach(function (p) { E.rel(p, -8); }); E.stat('happy', -3); return bad('I threw a tantrum. Nobody enjoyed the holidays.'); } },
      { label: 'Regift it to a friend', run: function () { E.karma(2); return 'I regifted ' + gift + ' to a friend. They loved it.'; } }
    ] };
  } });

  def('holiday_dinner', { min: 25, max: 100, w: 6, cond: function () { return !S().prison && E.people(['mother', 'father', 'sibling', 'child']).length >= 2; }, build: function () {
    var fam = E.people(['mother', 'father', 'sibling', 'child', 'spouse']);
    var cost = E.$(U.rand(150, 600));
    return { icon: '🦃', title: 'Holiday dinner', text: 'The family wants to get together for the holidays this year.', choices: [
      { label: 'Host it (' + E.fmt(cost) + ')', run: function () { if (S().money < cost) { fam.forEach(function (p) { E.rel(p, 2); }); return 'I couldn\'t afford much, so we ordered pizza. It was still fun.'; } E.addMoney(-cost); fam.forEach(function (p) { E.rel(p, 6); }); E.stat('happy', 6); return U.chance(0.2) ? 'I hosted the holiday dinner. ' + U.pick(fam).first + ' and I got into a heated debate over dessert, but it was lovely. 🦃' : good('I hosted the holiday dinner. Everyone went home full and happy. 🦃'); } },
      { label: 'Just show up with a pie', run: function () { fam.forEach(function (p) { E.rel(p, 3); }); E.stat('happy', 3); return 'I brought a pie to the family dinner. 🥧'; } },
      { label: 'Volunteer at a shelter instead', run: function () { E.karma(5); fam.forEach(function (p) { E.rel(p, -2); }); E.stat('happy', 4); return 'I spent the holiday serving meals at a shelter.'; } },
      { label: 'Skip it this year', run: function () { fam.forEach(function (p) { E.rel(p, -6); }); return bad('I skipped the family dinner. Some people noticed.'); } }
    ] };
  } });

  def('secret_santa', { min: 18, max: 70, w: 5, cond: function () { return S().job && !S().prison && E.people('coworker').length > 0; }, build: function () {
    var c = U.pick(E.people('coworker'));
    return { icon: '🎅', title: 'Secret Santa', text: 'I drew ' + c.first + ' in the office Secret Santa.', choices: [
      { label: 'A thoughtful gift (' + E.fmt(E.$(50)) + ')', run: function () { E.addMoney(-E.$(50)); E.rel(c, 12); return good(c.first + ' loved the gift. We\'re closer now.'); } },
      { label: 'A gag gift', run: function () { if (U.chance(0.6)) { E.rel(c, 6); return 'The whole office laughed at my gag gift. 😂'; } E.rel(c, -10); return bad(c.first + ' did not find my gag gift funny.'); } },
      { label: 'A last-minute gas station candle', run: function () { E.rel(c, -3); return 'I gave ' + c.first + ' a gas station candle. Smooth.'; } }
    ] };
  } });

  def('coming_out', { min: 13, max: 40, w: 14, once: true, cond: function () { return me().interest !== oppositeOf(me().gender) && !S().flags.out; }, build: function () {
    var who = me().interest === 'A' ? 'I like people of any gender' : 'I\'m gay';
    var ps = E.parentsAround();
    return { icon: '🏳️‍🌈', title: 'Coming out', text: 'I\'ve known for a while that ' + who + '. Should I tell people?', choices: [
      { label: ps.length ? 'Tell my parents' : 'Tell my family', run: function () {
        S().flags.out = true; E.achieve('proud');
        var fam = ps.length ? ps : E.people(['sibling', 'grandparent']);
        if (!fam.length || U.chance(0.75)) { fam.forEach(function (p) { E.rel(p, 8); }); E.stat('happy', 12); return good('I came out to my family. They hugged me and said they love me no matter what. 🏳️‍🌈'); }
        fam.forEach(function (p) { E.rel(p, -15); }); E.stat('happy', -4); return bad('I came out to my family. It didn\'t go well, but at least I\'m being honest.');
      } },
      { label: 'Tell my friends first', run: function () { S().flags.out = true; E.achieve('proud'); E.people(['friend', 'best friend']).forEach(function (p) { E.rel(p, 8); }); E.stat('happy', 10); return good('I came out to my friends. They threw me a little party. 🎉'); } },
      { label: 'Post it on social media', run: function () { S().flags.out = true; E.achieve('proud'); S().followers += U.rand(20, 400); E.stat('happy', 8); return good('I came out online. The support in the comments made me cry. 🏳️‍🌈'); } },
      { label: 'Not yet', run: function () { S().flags['ev_coming_out'] = false; E.stat('happy', -2); return 'I\'m not ready to tell anyone yet.'; } }
    ] };
  } });

  // ====================================================================
  // YEARLY
  // ====================================================================
  function yearly() {
    var s = S();
    checkResolution();
    // A partner's name tattoo after a breakup.
    tattoos().forEach(function (t) {
      if (t.partnerId && !t.regret) {
        var p = E.person(t.partnerId);
        if (!p || !p.alive || ['spouse', 'fiance', 'partner'].indexOf(p.role) < 0) { t.regret = true; E.stat('happy', -4); E.log('😬 I still have ' + t.name + ' tattooed on me. Awkward.'); }
      }
    });
  }

  function aboutRows() {
    var rows = [];
    if (tattoos().length) rows.push(['🖋️ Tattoos', tattoos().map(function (t) { return t.icon; }).join(' ')]);
    if (S().resolution && RESOLUTIONS[S().resolution.type]) rows.push(['🎆 Resolution', RESOLUTIONS[S().resolution.type][1]]);
    return rows;
  }

  return { treeMenu: treeMenu, treeHtml: treeHtml, tattooMenu: tattooMenu, recordAncestor: recordAncestor, yearly: yearly, aboutRows: aboutRows };
})();
