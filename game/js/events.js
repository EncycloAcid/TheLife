/* TheLife — random and scripted life events with choices.
 * Each def: { min, max, w, cond(), build(data) -> {icon, title, text, choices:[{label, run(data)->result}]} }
 * A result is a string or {text, cls}; it is logged and shown to the player. */
TL.events = (function () {
  var U = TL.util, D = TL.data, E = TL.engine;
  function S() { return TL.S; }
  function me() { return TL.S.me; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function roll100() { return U.rand(1, 100); }

  var defs = {};
  function def(id, o) { o.id = id; o.w = o.w || 10; defs[id] = o; }

  // ---------- scripted ----------
  def('after_hs', {
    scripted: true,
    build: function () {
      return {
        icon: '🎓', title: 'What\'s next?', text: 'I finished high school. What do I want to do with my life?',
        choices: [
          { label: 'Go to university', run: function () { TL.actions.openUniversity(); return null; } },
          { label: 'Go to trade school', run: function () { TL.actions.tradeMenu(); return null; } },
          { label: 'Start working', run: function () { return 'I decided to skip college and join the workforce.'; } },
          { label: 'Take a gap year', run: function () { E.stat('happy', 10); return 'I\'m taking a gap year to figure things out. 🌍'; } }
        ]
      };
    }
  });
  def('funeral', {
    scripted: true,
    build: function (d) {
      var p = E.person(d.pid);
      return {
        icon: '⚰️', title: 'Funeral', text: 'The funeral for my ' + E.relWord(p) + ' ' + E.fullName(p) + ' is being held. Will I attend?',
        choices: [
          { label: 'Attend and give a eulogy', run: function () { E.stat('happy', 5); E.karma(2); return 'I gave a moving eulogy for ' + p.first + '. Everyone was in tears.'; } },
          { label: 'Attend quietly', run: function () { E.stat('happy', 2); return 'I paid my respects to ' + p.first + '.'; } },
          { label: 'Skip it', run: function () { E.karma(-3); E.people(['mother', 'father', 'sibling']).forEach(function (x) { E.rel(x, -10); }); return bad('I skipped ' + p.first + '\'s funeral. My family is upset.'); } }
        ]
      };
    }
  });
  def('spouse_leaves', {
    scripted: true,
    build: function (d) {
      var p = E.person(d.pid);
      return {
        icon: '💔', title: 'Marriage trouble', text: p.first + ' says they are unhappy and wants a divorce.',
        choices: [
          { label: 'Beg them to stay', run: function () {
            if (U.chance(0.4)) { E.rel(p, 30); return good(p.first + ' agreed to give our marriage another chance.'); }
            TL.actions.divorce(p, true); return bad(p.first + ' divorced me anyway.');
          } },
          { label: 'Suggest couples therapy', run: function () {
            E.addMoney(-E.$(2000));
            if (U.chance(0.55)) { E.rel(p, 35); return good('Therapy worked. Our marriage is stronger now.'); }
            TL.actions.divorce(p, true); return bad('Therapy didn\'t help. We\'re divorced.');
          } },
          { label: 'Accept the divorce', run: function () { TL.actions.divorce(p, true); return 'We agreed to split up.'; } }
        ]
      };
    }
  });
  def('pregnancy', {
    scripted: true,
    build: function (d) {
      var p = E.person(d.pid);
      var iAm = me().gender === 'F';
      return {
        icon: '🤰', title: 'Pregnancy', text: (iAm ? 'I\'m pregnant' : p.first + ' is pregnant') + (p.role === 'spouse' ? '!' : ', and we\'re not married.') + ' What should we do?',
        choices: [
          { label: 'Keep the baby', run: function () { S().flags.pregnant = { with: p.id }; E.rel(p, 10); return good('We\'re expecting a baby next year! 🍼'); } },
          { label: 'Put up for adoption', run: function () { E.stat('happy', -8); return 'The baby will be adopted by a loving family.'; } }
        ]
      };
    }
  });
  def('crime_caught', {
    scripted: true,
    build: function (d) {
      return {
        icon: '🚔', title: 'Arrested', text: 'The police arrested me for ' + d.crime.toLowerCase() + '. I\'m going to trial.',
        choices: [
          { label: 'Hire a top lawyer (' + E.fmt(E.$(25000)) + ')', run: function () { return trial(d, 0.5, E.$(25000)); } },
          { label: 'Hire a cheap lawyer (' + E.fmt(E.$(3000)) + ')', run: function () { return trial(d, 0.22, E.$(3000)); } },
          { label: 'Public defender', run: function () { return trial(d, 0.1, 0); } },
          { label: 'Plead guilty (shorter sentence)', run: function () { E.jail(Math.max(0, Math.floor(d.years / 2)), d.crime); return 'I pleaded guilty.'; } }
        ]
      };
    }
  });
  function trial(d, p, cost) {
    E.addMoney(-cost);
    if (U.chance(p)) { E.stat('happy', 15); return good('The jury found me NOT GUILTY! 🙌'); }
    E.jail(d.years, d.crime);
    return bad('The jury found me guilty.');
  }

  // ---------- childhood (0-12) ----------
  def('baby_first_word', { min: 1, max: 2, w: 6, once: true, build: function () {
    var ps = E.people(['mother', 'father']);
    return { icon: '🗣️', title: 'First words', text: 'I\'m about to say my first word! What will it be?', choices: [
      { label: '"Mama"', run: function () { var m = E.people('mother')[0]; if (m) E.rel(m, 10); return 'My first word was "Mama"! My mom was thrilled.'; } },
      { label: '"Dada"', run: function () { var f = E.people('father')[0]; if (f) E.rel(f, 10); return 'My first word was "Dada"! My dad was thrilled.'; } },
      { label: '"No!"', run: function () { return 'My first word was "No!" My parents weren\'t surprised.'; } }
    ] };
  } });
  def('toddler_tantrum', { min: 2, max: 5, w: 8, build: function () {
    return { icon: '😤', title: 'Tantrum', text: 'My parents won\'t buy me a toy at the store.', choices: [
      { label: 'Throw a tantrum', run: function () { E.people(['mother', 'father']).forEach(function (p) { E.rel(p, -5); }); return 'I screamed on the floor of the store. Everyone stared.'; } },
      { label: 'Say "please" nicely', run: function () { E.karma(1); if (U.chance(0.5)) { E.stat('happy', 5); return good('They bought me the toy!'); } return 'They still said no, but they were proud of me.'; } },
      { label: 'Accept it', run: function () { return 'I behaved myself.'; } }
    ] };
  } });
  def('imaginary_friend', { min: 3, max: 7, w: 5, build: function () {
    var n = U.pick(['Mr. Wiggles', 'Captain Sparkle', 'Zorp', 'Princess Bubbles', 'Big Ted']);
    return { icon: '👻', title: 'Imaginary friend', text: 'I have an imaginary friend named ' + n + '. My parents think I\'m too old for this.', choices: [
      { label: 'Keep playing with ' + n, run: function () { E.stat('happy', 6); return 'I\'ll never abandon ' + n + '.'; } },
      { label: 'Say goodbye to ' + n, run: function () { E.stat('smarts', 2); return 'I said goodbye to ' + n + '. I\'m a big kid now.'; } }
    ] };
  } });
  def('bully', { min: 7, max: 16, w: 9, cond: function () { return S().edu; }, build: function () {
    var b = E.makePerson({ age: me().age + U.rand(0, 2) });
    return { icon: '👊', title: 'Bully', text: b.first + ' ' + b.last + ' has been bullying me at school and just shoved me in the hallway.', choices: [
      { label: 'Fight back', run: function () {
        if (U.chance(me().athl / 100 + 0.2)) { E.stat('happy', 10); return good('I punched ' + b.first + ' in the face. They never bothered me again.'); }
        E.stat('health', -8); E.stat('happy', -8); return bad(b.first + ' beat me up. I have a black eye.');
      } },
      { label: 'Tell a teacher', run: function () { if (U.chance(0.6)) return b.first + ' got detention.'; E.stat('happy', -5); return bad('The teacher did nothing. Now I\'m a "snitch".'); } },
      { label: 'Roast them', run: function () {
        if (U.chance(me().smarts / 150 + 0.2)) { S().edu.popularity = U.clamp(S().edu.popularity + 10, 0, 100); return good('I roasted ' + b.first + ' so hard the whole class laughed at them.'); }
        E.stat('happy', -6); return bad('My comeback fell flat.');
      } },
      { label: 'Ignore it', run: function () { E.stat('happy', -4); return 'I ignored ' + b.first + '.'; } }
    ] };
  } });
  def('found_money', { min: 5, max: 90, w: 5, build: function () {
    var amt = E.$(U.pick([20, 50, 100, 500]));
    return { icon: '💵', title: 'Found money', text: 'I found a wallet on the sidewalk with ' + E.fmt(amt) + ' inside and an ID card.', choices: [
      { label: 'Return it to the owner', run: function () { E.karma(5); E.stat('happy', 4); if (U.chance(0.3)) { E.addMoney(amt); return good('The owner was so grateful they gave me ' + E.fmt(amt) + ' as a reward!'); } return good('I returned the wallet. I feel good about myself.'); } },
      { label: 'Keep the cash', run: function () { E.karma(-4); E.addMoney(amt); return 'I pocketed ' + E.fmt(amt) + '.'; } },
      { label: 'Turn it in to the police', run: function () { E.karma(3); return 'I handed the wallet to the police.'; } }
    ] };
  } });
  def('stray_animal', { min: 6, max: 70, w: 5, build: function () {
    var sp = U.pick(['dog', 'cat']);
    return { icon: sp === 'dog' ? '🐶' : '🐱', title: 'Stray ' + sp, text: 'A skinny stray ' + sp + ' followed me home.', choices: [
      { label: 'Adopt it', run: function () {
        var par = me().age < 18 ? E.people(['mother', 'father'])[0] : null;
        if (par && U.chance(0.4)) return 'My parents said no pets. I had to take it to a shelter.';
        var pet = TL.actions.addPet(sp === 'dog' ? 'Dog' : 'Cat', 'Mutt', U.rand(1, 5));
        E.karma(3); return good('I adopted the ' + sp + ' and named it ' + pet.name + '!');
      } },
      { label: 'Take it to a shelter', run: function () { E.karma(2); return 'I brought the ' + sp + ' to a shelter.'; } },
      { label: 'Shoo it away', run: function () { E.karma(-2); return 'I chased the ' + sp + ' away.'; } }
    ] };
  } });
  def('school_play', { min: 7, max: 13, w: 5, cond: function () { return S().edu; }, build: function () {
    return { icon: '🎭', title: 'School play', text: 'My school is putting on a play. Do I want to audition?', choices: [
      { label: 'Audition for the lead', run: function () { if (U.chance(me().looks / 150 + 0.2)) { E.stat('happy', 10); E.fame(1); S().flags.acting = (S().flags.acting || 0) + 1; return good('I got the lead role and nailed it!'); } return 'I got cast as "Tree #3".'; } },
      { label: 'Work backstage', run: function () { E.stat('smarts', 2); return 'I helped build the sets.'; } },
      { label: 'No thanks', run: function () { return 'I skipped the play.'; } }
    ] };
  } });
  def('science_fair', { min: 8, max: 17, w: 5, cond: function () { return S().edu; }, build: function () {
    return { icon: '🔬', title: 'Science fair', text: 'The science fair is coming up. What\'s my project?', choices: [
      { label: 'Baking-soda volcano', run: function () { return 'My volcano erupted beautifully. I got a participation ribbon.'; } },
      { label: 'Build a robot', run: function () { if (U.chance(me().smarts / 110)) { E.stat('smarts', 4); E.stat('happy', 8); return good('My robot won first place! 🥇'); } E.stat('happy', -3); return bad('My robot caught fire during the demo.'); } },
      { label: 'Skip it', run: function () { return 'I didn\'t enter.'; } }
    ] };
  } });
  def('cheat_test', { min: 10, max: 24, w: 6, cond: function () { return S().edu; }, build: function () {
    return { icon: '📝', title: 'Big exam', text: 'A classmate is offering the answers to tomorrow\'s big exam.', choices: [
      { label: 'Take the answers', run: function () {
        E.karma(-4);
        if (U.chance(0.25)) { S().edu.grade = Math.max(0, S().edu.grade - 15); E.stat('happy', -10); return bad('I got caught cheating and received a zero!'); }
        S().edu.grade = Math.min(100, S().edu.grade + 8); return 'I aced the exam... with some help.';
      } },
      { label: 'Study all night instead', run: function () { E.stat('smarts', 2); S().edu.grade = Math.min(100, S().edu.grade + 4); E.stat('health', -2); return 'I pulled an all-nighter and did well.'; } },
      { label: 'Report the cheater', run: function () { E.karma(3); S().edu.popularity = Math.max(0, S().edu.popularity - 10); return 'I reported it. Some classmates are mad at me.'; } }
    ] };
  } });
  def('lost_tooth', { min: 5, max: 8, w: 4, once: true, build: function () {
    return { icon: '🦷', title: 'Loose tooth', text: 'My tooth fell out!', choices: [
      { label: 'Put it under my pillow', run: function () { var a = E.$(U.rand(1, 5)); E.addMoney(a); return good('The Tooth Fairy left me ' + E.fmt(a) + '!'); } },
      { label: 'Keep it in a jar', run: function () { return 'I added it to my collection. My parents are concerned.'; } }
    ] };
  } });
  def('kid_cookie', { min: 4, max: 9, w: 4, build: function () {
    return { icon: '🍪', title: 'Cookie jar', text: 'Mom said no more cookies, but the cookie jar is right there...', choices: [
      { label: 'Sneak one', run: function () { if (U.chance(0.5)) { E.stat('happy', 3); return 'Delicious. I got away with it.'; } var m = E.people('mother')[0]; if (m) E.rel(m, -5); return bad('I got caught with crumbs on my face. Grounded!'); } },
      { label: 'Ask nicely', run: function () { return U.chance(0.4) ? good('Mom gave me one!') : 'Mom said no.'; } },
      { label: 'Leave it', run: function () { E.karma(1); return 'I resisted temptation.'; } }
    ] };
  } });
  def('parents_fight', { min: 4, max: 17, w: 5, cond: function () { return E.people(['mother', 'father']).length === 2; }, build: function () {
    return { icon: '🗯️', title: 'Parents fighting', text: 'My parents are screaming at each other downstairs again.', choices: [
      { label: 'Try to calm them down', run: function () { if (U.chance(0.5)) { E.people(['mother', 'father']).forEach(function (p) { E.rel(p, 5); }); return good('They stopped and hugged me.'); } return 'They told me to go to my room.'; } },
      { label: 'Hide in my room', run: function () { E.stat('happy', -5); return 'I put on headphones and cried quietly.'; } },
      { label: 'Run away for the night', run: function () { E.stat('health', -3); E.people(['mother', 'father']).forEach(function (p) { E.rel(p, -8); }); return bad('I slept at the park. My parents were furious when they found me.'); } }
    ] };
  } });
  def('sibling_fight', { min: 4, max: 17, w: 5, cond: function () { return E.people('sibling').length; }, build: function () {
    var s = U.pick(E.people('sibling'));
    return { icon: '🥊', title: 'Sibling squabble', text: s.first + ' broke my favorite toy and laughed about it.', choices: [
      { label: 'Tell our parents', run: function () { E.rel(s, -5); return s.first + ' got grounded.'; } },
      { label: 'Break something of theirs', run: function () { E.rel(s, -15); E.karma(-2); return bad('Now we\'re at war.'); } },
      { label: 'Forgive them', run: function () { E.rel(s, 10); E.karma(2); return good('I forgave ' + s.first + '. We played video games together.'); } }
    ] };
  } });
  def('talent_show', { min: 8, max: 17, w: 4, cond: function () { return S().edu; }, build: function () {
    return { icon: '🎤', title: 'Talent show', text: 'The school talent show is this weekend.', choices: [
      { label: 'Sing', run: function () { if (U.chance(0.4)) { E.stat('happy', 8); S().flags.music = (S().flags.music || 0) + 1; return good('I won the talent show with my singing!'); } E.stat('happy', -5); return bad('My voice cracked. Kids are still laughing.'); } },
      { label: 'Do stand-up comedy', run: function () { if (U.chance(0.45)) { S().edu.popularity += 8; return good('I killed it. Everyone thinks I\'m hilarious.'); } return 'Nobody laughed. Tough crowd.'; } },
      { label: 'Just watch', run: function () { return 'I watched from the audience.'; } }
    ] };
  } });
  def('sports_tryout', { min: 11, max: 17, w: 5, cond: function () { return S().edu && !S().edu.team && (S().edu.stage === 'middle' || S().edu.stage === 'high'); }, build: function () {
    var t = U.pick(D.SPORTS_TEAMS);
    return { icon: '🏅', title: 'Tryouts', text: 'Tryouts for the ' + t + ' are happening today.', choices: [
      { label: 'Try out', run: function () {
        if (TL.sports) return TL.sports.eventTryout(t);
        if (U.chance(me().athl / 100 + 0.1)) { S().edu.team = t; me().athl = U.clamp(me().athl + 5, 0, 100); E.stat('happy', 6); if (me().athl > 80 && me().age >= 15) S().flags.athleteScholar = true; return good('I made the ' + t + '!'); }
        return 'I didn\'t make the cut.';
      } },
      { label: 'Not interested', run: function () { return 'Sports aren\'t my thing.'; } }
    ] };
  } });

  // ---------- teens (13-19) ----------
  def('teen_party', { min: 14, max: 22, w: 8, build: function () {
    return { icon: '🥳', title: 'House party', text: 'A popular kid invited me to a party while their parents are away.', choices: [
      { label: 'Go and party hard', run: function () {
        E.stat('happy', 8);
        if (S().edu) S().edu.popularity = U.clamp(S().edu.popularity + 6, 0, 100);
        if (U.chance(0.2)) { E.stat('health', -6); return bad('I drank too much and threw up on the host\'s dog.'); }
        if (U.chance(0.12)) { return bad('The cops showed up and busted the party! My parents had to pick me up.'); }
        return good('Best. Night. Ever.');
      } },
      { label: 'Go but stay sober', run: function () { E.stat('happy', 4); return 'I had fun and drove everyone home safely.'; } },
      { label: 'Stay home and study', run: function () { E.stat('smarts', 2); if (S().edu) S().edu.study++; return 'I stayed home and studied.'; } }
    ] };
  } });
  def('cigarette', { min: 12, max: 25, w: 6, cond: function () { return !E.hasCondition('Nicotine Addiction'); }, build: function () {
    return { icon: '🚬', title: 'Peer pressure', text: 'Some older kids are offering me a cigarette.', choices: [
      { label: 'Try it', run: function () { E.stat('health', -3); if (U.chance(0.35)) { E.addCondition('Nicotine Addiction'); return bad('I got hooked on nicotine.'); } return 'I coughed my lungs out. Not for me.'; } },
      { label: 'Say no', run: function () { E.karma(1); return 'I said no. Smoking is gross.'; } }
    ] };
  } });
  def('teen_crush', { min: 13, max: 18, w: 7, cond: function () { return !E.partner(); }, build: function () {
    var c = E.makePerson({ age: me().age + U.rand(-1, 1), gender: me().interest === 'A' ? undefined : me().interest, role: 'partner' });
    return { icon: '💌', title: 'Crush', text: 'I have a huge crush on ' + c.first + ' from class.', choices: [
      { label: 'Ask them out', run: function () {
        if (U.chance(0.3 + me().looks / 200)) { c.rel = U.rand(55, 80); S().people.push(c); S().counts.dates++; E.stat('happy', 12); return good(c.first + ' said yes! We\'re dating now. 💕'); }
        E.stat('happy', -10); return bad(c.first + ' laughed and said no.');
      } },
      { label: 'Write an anonymous note', run: function () { return U.chance(0.3) ? 'They posted my note online. Everyone is trying to figure out who wrote it.' : 'I never found out if they read it.'; } },
      { label: 'Keep it to myself', run: function () { return 'I admired ' + c.first + ' from afar.'; } }
    ] };
  } });
  def('learners_permit', { min: 16, max: 17, w: 20, once: true, build: function () {
    return { icon: '🚗', title: 'Driving test', text: 'I\'m old enough to take my driving test!', choices: [
      { label: 'Take the test', run: function () {
        if (U.chance(0.55 + me().smarts / 300)) { S().flags.license = true; E.stat('happy', 8); return good('I passed my driving test! 🚗'); }
        return bad('I failed. I hit a traffic cone... and the examiner\'s car.');
      } },
      { label: 'Not yet', run: function () { return 'I\'ll take it later.'; } }
    ] };
  } });
  def('runaway', { min: 13, max: 17, w: 2, cond: function () { return E.people(['mother', 'father']).some(function (p) { return p.rel < 30; }); }, build: function () {
    return { icon: '🎒', title: 'Home life', text: 'Things at home are unbearable. My friend says I can crash at their place.', choices: [
      { label: 'Run away', run: function () { E.stat('happy', -5); E.people(['mother', 'father']).forEach(function (p) { E.rel(p, -15); }); return bad('I ran away. The police brought me back three days later.'); } },
      { label: 'Talk to my parents', run: function () { E.people(['mother', 'father']).forEach(function (p) { E.rel(p, 12); }); return good('We had a long, honest talk. Things are better.'); } },
      { label: 'Tough it out', run: function () { return 'I\'ll be 18 soon enough.'; } }
    ] };
  } });
  def('prom', { min: 17, max: 18, w: 18, once: true, cond: function () { return S().edu && S().edu.stage === 'high'; }, build: function () {
    var pt = E.partner();
    return { icon: '🕺', title: 'Prom', text: 'Prom night is here!', choices: [
      { label: pt ? 'Go with ' + pt.first : 'Go with friends', run: function () {
        E.stat('happy', 10); if (pt) E.rel(pt, 10);
        if (U.chance(0.2)) { if (S().edu) S().edu.popularity += 10; return good('I was crowned Prom ' + (me().gender === 'M' ? 'King' : 'Queen') + '! 👑'); }
        return good('Prom was magical.');
      } },
      { label: 'Skip prom', run: function () { return 'Prom is overrated anyway.'; } }
    ] };
  } });

  // ---------- adults ----------
  def('coworker_flirt', { min: 20, max: 60, w: 5, cond: function () { return S().job && !S().job.fame; }, build: function () {
    var c = E.makePerson({ age: me().age + U.rand(-6, 6), gender: me().interest === 'A' ? undefined : me().interest, role: 'partner' });
    var pt = E.partner();
    return { icon: '😏', title: 'Office flirt', text: 'My coworker ' + c.first + ' has been flirting with me by the coffee machine.', choices: [
      { label: pt ? 'Have an affair' : 'Ask them out', run: function () {
        if (pt) {
          E.karma(-6);
          if (U.chance(0.4)) { E.rel(pt, -40); return bad(pt.first + ' found out I was cheating!'); }
          E.stat('happy', 6); return 'I had a secret fling with ' + c.first + '.';
        }
        if (U.chance(0.5)) { c.rel = U.rand(55, 75); S().people.push(c); S().counts.dates++; return good(c.first + ' and I are dating now!'); }
        return 'They were just being friendly. Awkward.';
      } },
      { label: 'Keep it professional', run: function () { E.karma(1); return 'I kept things professional.'; } },
      { label: 'Report to HR', run: function () { return 'HR had a talk with ' + c.first + '.'; } }
    ] };
  } });
  def('boss_overtime', { min: 18, max: 70, w: 6, cond: function () { return S().job && !S().job.fame && !S().job.partTime && !S().job.mil; }, build: function () {
    return { icon: '💼', title: 'Overtime', text: 'My boss is asking me to work this weekend to meet a deadline.', choices: [
      { label: 'Work the weekend', run: function () { S().job.perf = Math.min(100, S().job.perf + 10); E.stat('happy', -4); return 'My boss appreciated the extra effort.'; } },
      { label: 'Politely decline', run: function () { S().job.perf = Math.max(0, S().job.perf - 4); return 'I declined. My boss wasn\'t thrilled.'; } },
      { label: 'Call in "sick"', run: function () { if (U.chance(0.3)) { S().job.perf -= 15; return bad('My boss saw my beach photos online.'); } E.stat('happy', 5); return 'I enjoyed a long weekend.'; } }
    ] };
  } });
  def('investment_tip', { min: 21, max: 80, w: 4, build: function () {
    var amt = E.$(U.pick([1000, 5000, 20000]));
    return { icon: '📈', title: 'Hot tip', text: 'A friend says they have an investment that will "definitely double". They want ' + E.fmt(amt) + '.', choices: [
      { label: 'Invest ' + E.fmt(amt), run: function () {
        if (S().money < amt) return 'I don\'t have that kind of money.';
        E.addMoney(-amt);
        if (U.chance(0.3)) { E.addMoney(amt * 3); return good('It actually worked! I got ' + E.fmt(amt * 3) + ' back.'); }
        return bad('It was a Ponzi scheme. The money is gone.');
      } },
      { label: 'Pass', run: function () { return 'I passed on the "opportunity".'; } }
    ] };
  } });
  def('mugging', { min: 14, max: 90, w: 4, build: function () {
    var amt = Math.min(Math.max(0, S().money), E.$(U.rand(40, 600)));
    return { icon: '🔪', title: 'Mugged!', text: 'A mugger corners me in an alley and demands my wallet.', choices: [
      { label: 'Hand it over', run: function () { E.addMoney(-amt); E.stat('happy', -5); return 'I gave up my wallet with ' + E.fmt(amt) + '.'; } },
      { label: 'Fight', run: function () {
        if (U.chance(me().athl / 120 + 0.1)) { E.stat('happy', 8); E.fame(1); return good('I disarmed the mugger and held him for police. The local news called me a hero!'); }
        E.stat('health', -U.rand(10, 25)); E.addMoney(-amt); if (U.chance(0.3)) E.addCondition('Concussion'); return bad('I got badly hurt and they took my wallet anyway.');
      } },
      { label: 'Run', run: function () { if (U.chance(me().athl / 100 + 0.2)) return 'I got away!'; E.addMoney(-amt); return bad('They caught me and took ' + E.fmt(amt) + '.'); } }
    ] };
  } });
  def('car_accident', { min: 16, max: 95, w: 3, cond: function () { return S().assets.some(function (a) { return a.kind === 'car'; }); }, build: function () {
    var car = S().assets.filter(function (a) { return a.kind === 'car'; })[0];
    return { icon: '💥', title: 'Car accident', text: 'Someone ran a red light and T-boned my ' + car.name + '!', choices: [
      { label: 'Sue the other driver', run: function () { if (U.chance(0.55)) { var a = E.$(U.rand(5000, 80000)); E.addMoney(a); return good('I won ' + E.fmt(a) + ' in the lawsuit.'); } E.addMoney(-E.$(4000)); return bad('I lost the case and paid legal fees.'); } },
      { label: 'Let insurance handle it', run: function () { car.cond = Math.max(0, car.cond - 40); car.value = Math.round(car.value * 0.7); E.stat('health', -U.rand(2, 12)); return 'Insurance fixed it, mostly. My neck hurts.'; } }
    ] };
  } });
  def('lottery_ticket', { min: 18, max: 95, w: 3, build: function () {
    return { icon: '🎟️', title: 'Scratch card', text: 'I found an unscratched lottery ticket on the bus seat.', choices: [
      { label: 'Scratch it', run: function () { var r = roll100(); if (r > 97) { var a = E.$(100000); E.addMoney(a); return good('I won ' + E.fmt(a) + '!!!'); } if (r > 70) { var b = E.$(U.pick([10, 50, 100])); E.addMoney(b); return 'I won ' + E.fmt(b) + '.'; } return 'Nothing. Figures.'; } },
      { label: 'Throw it away', run: function () { return 'Probably a loser anyway.'; } }
    ] };
  } });
  def('jury_duty', { min: 21, max: 75, w: 3, build: function () {
    return { icon: '⚖️', title: 'Jury duty', text: 'I\'ve been summoned for jury duty. The defendant is accused of robbery.', choices: [
      { label: 'Vote guilty', run: function () { return 'The defendant was convicted.'; } },
      { label: 'Vote not guilty', run: function () { return 'It was a hung jury. The defendant walked free.'; } },
      { label: 'Try to get out of it', run: function () { return U.chance(0.5) ? 'I got dismissed.' : bad('The judge held me in contempt for lying. Oops.'); } }
    ] };
  } });
  def('celebrity_encounter', { min: 10, max: 90, w: 3, build: function () {
    var c = E.makePerson({ age: U.rand(25, 60) });
    return { icon: '🤩', title: 'Celebrity sighting', text: 'I spotted the famous ' + U.pick(['actor', 'singer', 'athlete', 'TV host']) + ' ' + E.fullName(c) + ' at a café!', choices: [
      { label: 'Ask for a selfie', run: function () { S().flags.metCeleb = true; if (U.chance(0.6)) { S().followers += U.rand(10, 500); return good('They said yes! My selfie went mildly viral.'); } return 'Their bodyguard shoved me away.'; } },
      { label: 'Try to befriend them', run: function () { S().flags.metCeleb = true; if (U.chance(0.2)) { c.role = 'friend'; c.rel = 50; c.job = 'Celebrity'; c.money = E.$(20000000); S().people.push(c); E.fame(3); return good('We hit it off! ' + c.first + ' is now my friend.'); } return 'They politely declined.'; } },
      { label: 'Play it cool', run: function () { S().flags.metCeleb = true; return 'I pretended not to notice.'; } }
    ] };
  } });
  def('charity_ask', { min: 18, max: 95, w: 4, cond: function () { return S().money > E.$(1000); }, build: function () {
    var amt = Math.max(E.$(100), Math.round(S().money * 0.05));
    return { icon: '🎗️', title: 'Charity drive', text: 'A children\'s hospital is asking for donations.', choices: [
      { label: 'Donate ' + E.fmt(amt), run: function () { E.addMoney(-amt); E.karma(6); E.stat('happy', 6); return good('I donated ' + E.fmt(amt) + '. It felt great.'); } },
      { label: 'Volunteer my time', run: function () { E.karma(4); E.stat('happy', 4); return 'I spent weekends volunteering at the hospital.'; } },
      { label: 'Decline', run: function () { return 'I declined.'; } }
    ] };
  } });
  def('neighbor_noise', { min: 18, max: 90, w: 4, build: function () {
    return { icon: '🔊', title: 'Noisy neighbor', text: 'My neighbor has been blasting music at 3 AM for a week.', choices: [
      { label: 'Knock and ask nicely', run: function () { return U.chance(0.6) ? good('They apologized and turned it down.') : 'They slammed the door in my face.'; } },
      { label: 'Call the police', run: function () { return 'The police gave them a warning.'; } },
      { label: 'Blast my own music back', run: function () { E.stat('happy', 3); E.karma(-1); return 'It\'s a war now.'; } }
    ] };
  } });
  def('family_loan', { min: 22, max: 80, w: 4, cond: function () { return S().money > E.$(5000) && E.people(['sibling', 'mother', 'father', 'child']).filter(function (p) { return p.age >= 18; }).length; }, build: function () {
    var p = U.pick(E.people(['sibling', 'mother', 'father', 'child']).filter(function (p) { return p.age >= 18; }));
    var amt = E.$(U.pick([1000, 3000, 8000, 15000]));
    return { icon: '🤲', title: 'Family favor', text: 'My ' + E.relWord(p) + ' ' + p.first + ' is broke and is asking to borrow ' + E.fmt(amt) + '.', choices: [
      { label: 'Lend it', run: function () { E.addMoney(-amt); E.rel(p, 15); E.karma(2); if (U.chance(0.4)) { E.addMoney(amt); return good(p.first + ' paid me back in full!'); } return p.first + ' thanked me. I doubt I\'ll see that money again.'; } },
      { label: 'Give it as a gift', run: function () { E.addMoney(-amt); E.rel(p, 25); E.karma(4); return good(p.first + ' burst into tears of gratitude.'); } },
      { label: 'Refuse', run: function () { E.rel(p, -15); return p.first + ' is upset with me.'; } }
    ] };
  } });
  def('midlife', { min: 40, max: 55, w: 4, once: true, build: function () {
    return { icon: '🏍️', title: 'Midlife crisis', text: 'I\'ve been feeling restless. Is this all there is?', choices: [
      { label: 'Buy a sports car', run: function () { var p = E.$(90000); if (S().money < p) return 'I can\'t afford one. I bought sunglasses instead.'; E.addMoney(-p); S().assets.push({ id: U.uid(), kind: 'car', type: 'Sports Coupe', name: 'Red Sports Coupe', value: p, price: p, cond: 100, loan: 0 }); E.stat('happy', 12); return good('I bought a red sports coupe. I feel 25 again.'); } },
      { label: 'Take up a new hobby', run: function () { E.stat('happy', 8); return 'I started ' + U.pick(['pottery', 'salsa dancing', 'rock climbing', 'painting', 'guitar lessons']) + '.'; } },
      { label: 'Get therapy', run: function () { E.addMoney(-E.$(1500)); E.stat('happy', 10); return 'Talking it out really helped.'; } }
    ] };
  } });
  def('health_scare', { min: 35, max: 90, w: 4, build: function () {
    return { icon: '🩺', title: 'Chest pain', text: 'I\'ve been having sharp chest pains.', choices: [
      { label: 'Go to the ER', run: function () { E.addMoney(-E.$(2000)); if (U.chance(0.3)) { E.addCondition('Heart Disease'); return bad('Tests revealed heart disease. I need treatment.'); } return 'It was just heartburn. Phew.'; } },
      { label: 'Ignore it', run: function () { if (U.chance(0.25)) { E.addCondition('Heart Disease'); E.stat('health', -15); return bad('I had a heart attack!'); } return 'The pain went away on its own.'; } }
    ] };
  } });
  def('wedding_invite', { min: 20, max: 70, w: 3, cond: function () { return E.people(['friend', 'sibling']).filter(function (p) { return p.age >= 20; }).length; }, build: function () {
    var p = U.pick(E.people(['friend', 'sibling']).filter(function (p) { return p.age >= 20; }));
    return { icon: '💒', title: 'Wedding', text: p.first + ' is getting married and invited me to the wedding.', choices: [
      { label: 'Attend with a nice gift', run: function () { E.addMoney(-E.$(300)); E.rel(p, 15); E.stat('happy', 6); return good('I danced all night at ' + p.first + '\'s wedding!'); } },
      { label: 'Give a toast', run: function () { if (U.chance(0.6)) { E.rel(p, 20); return good('My toast brought the house down.'); } E.rel(p, -10); return bad('I told an embarrassing story. ' + p.first + ' is furious.'); } },
      { label: 'Skip it', run: function () { E.rel(p, -20); return p.first + ' noticed I wasn\'t there.'; } }
    ] };
  } });
  def('viral_video', { min: 13, max: 60, w: 2, cond: function () { return S().social.platform; }, build: function () {
    return { icon: '📱', title: 'Going viral', text: 'A video I posted is blowing up online!', choices: [
      { label: 'Ride the wave', run: function () { var f = U.rand(5000, 250000); S().followers += f; E.fame(U.rand(3, 8)); return good('I gained ' + f.toLocaleString() + ' followers!'); } },
      { label: 'Delete it', run: function () { return 'I deleted it. I don\'t want the attention.'; } }
    ] };
  } });
  def('scam_call', { min: 55, max: 100, w: 4, build: function () {
    var amt = Math.max(0, Math.round(S().money * 0.2));
    return { icon: '☎️', title: 'Phone call', text: 'A man claiming to be from the tax office says I owe back taxes and must pay in gift cards immediately.', choices: [
      { label: 'Pay him', run: function () { E.addMoney(-amt); return bad('It was a scam. I lost ' + E.fmt(amt) + '.'); } },
      { label: 'Hang up', run: function () { return 'I hung up. Nice try.'; } },
      { label: 'Waste his time', run: function () { E.stat('happy', 5); return 'I kept him on the phone for 45 minutes pretending to find my glasses. 😂'; } }
    ] };
  } });
  def('grandkid_visit', { min: 55, max: 100, w: 5, cond: function () { return E.people('child').filter(function (c) { return c.age >= 25; }).length; }, build: function () {
    var c = U.pick(E.people('child').filter(function (c) { return c.age >= 25; }));
    return { icon: '👵', title: 'Family visit', text: c.first + ' wants to bring the family over for Sunday dinner.', choices: [
      { label: 'Cook a feast', run: function () { E.rel(c, 15); E.stat('happy', 10); return good('We had a wonderful family dinner.'); } },
      { label: 'Order pizza', run: function () { E.rel(c, 6); E.stat('happy', 5); return 'Pizza night with the family!'; } },
      { label: 'I\'m too tired', run: function () { E.rel(c, -8); return c.first + ' was disappointed.'; } }
    ] };
  } });
  def('workplace_injury', { min: 18, max: 65, w: 2, cond: function () { return S().job && !S().job.pro && ['construction', 'firefighter', 'military', 'police', 'athlete', 'driver'].indexOf(S().job.career) >= 0; }, build: function () {
    var inj = U.pick(['Broken Arm', 'Broken Leg', 'Concussion']);
    return { icon: '🚑', title: 'Injury at work', text: 'I got hurt on the job!', choices: [
      { label: 'Go to the hospital', run: function () { E.addCondition(inj); E.stat('health', -10); return bad('I have a ' + inj.toLowerCase() + '.'); } },
      { label: 'Walk it off', run: function () { if (U.chance(0.5)) return 'I\'m tougher than I look.'; E.addCondition(inj); E.stat('health', -18); return bad('It got worse. I have a ' + inj.toLowerCase() + '.'); } }
    ] };
  } });
  def('rich_relative', { min: 10, max: 80, w: 1, build: function () {
    var amt = E.$(U.pick([20000, 50000, 250000, 1000000]));
    return { icon: '✉️', title: 'Mysterious letter', text: 'A lawyer says a distant relative I never met left me something in their will.', choices: [
      { label: 'Claim it', run: function () { E.addMoney(amt); return good('I received ' + E.fmt(amt) + '!'); } },
      { label: 'Donate it all', run: function () { E.karma(15); E.stat('happy', 10); return good('I donated the entire ' + E.fmt(amt) + ' to charity.'); } }
    ] };
  } });
  def('robbed_house', { min: 18, max: 95, w: 2, cond: function () { return S().assets.some(function (a) { return a.kind === 'house'; }); }, build: function () {
    var loss = E.$(U.rand(1000, 12000));
    return { icon: '🏚️', title: 'Break-in', text: 'I came home to find my house has been burglarized.', choices: [
      { label: 'File an insurance claim', run: function () { E.addMoney(-Math.round(loss * 0.2)); return 'Insurance covered most of it.'; } },
      { label: 'Hunt down the burglar myself', run: function () { if (U.chance(0.2)) { E.fame(2); return good('I tracked them down and got my stuff back!'); } E.addMoney(-loss); E.stat('health', -5); return bad('I never found them and lost ' + E.fmt(loss) + ' in stuff.'); } }
    ] };
  } });
  def('promotion_offer', { min: 22, max: 65, w: 3, cond: function () { var j = S().job; return j && !j.partTime && !j.fame && j.level < D.career(j.career).levels.length - 1; }, build: function () {
    var j = S().job, c = D.career(j.career);
    return { icon: '🧳', title: 'Relocation offer', text: 'My company offers me a promotion to ' + c.levels[j.level + 1][0] + ', but I\'d need to relocate and work longer hours.', choices: [
      { label: 'Accept', run: function () { j.level++; j.levelYears = 0; E.stat('happy', -3); E.people(['friend']).forEach(function (p) { E.rel(p, -10); }); var pt = E.partner(); if (pt) E.rel(pt, -8); return good('I\'m now ' + E.an(E.jobTitle(j)) + ' earning ' + E.fmt(E.jobSalary(j)) + '!'); } },
      { label: 'Decline', run: function () { return 'I stayed where I am.'; } }
    ] };
  } });
  def('elderly_fall', { min: 70, max: 110, w: 4, build: function () {
    return { icon: '🦯', title: 'A fall', text: 'I slipped on the stairs.', choices: [
      { label: 'Call for help', run: function () { E.stat('health', -5); return 'Paramedics checked me out. Just bruises.'; } },
      { label: 'Get up on my own', run: function () { if (U.chance(0.5)) return 'Still got it!'; E.addCondition('Broken Leg'); E.stat('health', -15); return bad('I broke my hip... er, leg.'); } }
    ] };
  } });
  def('retirement_home', { min: 80, max: 110, w: 3, once: true, build: function () {
    return { icon: '🏡', title: 'Assisted living', text: 'My family suggests I move into a retirement home.', choices: [
      { label: 'Move in', run: function () { E.stat('health', 5); E.stat('happy', -3); S().flags.retirementHome = true; return 'I moved into Sunny Acres. The bingo is intense.'; } },
      { label: 'Absolutely not', run: function () { E.stat('happy', 3); return 'I\'m staying in my own home, thank you very much.'; } }
    ] };
  } });
  def('addiction_temptation', { min: 18, max: 80, w: 3, cond: function () { return !E.hasCondition('Alcoholism') && me().happy < 45; }, build: function () {
    return { icon: '🍺', title: 'Rough patch', text: 'Life has been hard lately. A few drinks every night would take the edge off...', choices: [
      { label: 'Start drinking', run: function () { E.stat('happy', 5); if (U.chance(0.5)) { E.addCondition('Alcoholism'); return bad('I developed a drinking problem.'); } return 'I\'m drinking more than I should.'; } },
      { label: 'Go for a run instead', run: function () { E.stat('health', 3); me().athl = U.clamp(me().athl + 2, 0, 100); E.stat('happy', 3); return good('Exercise cleared my head.'); } },
      { label: 'Call a friend', run: function () { var f = E.people('friend')[0]; if (f) { E.rel(f, 8); E.stat('happy', 6); return good('I talked to ' + f.first + ' for hours. I feel better.'); } return 'I realized I don\'t have anyone to call.'; } }
    ] };
  } });
  def('kid_trouble', { min: 25, max: 70, w: 4, cond: function () { return E.people('child').filter(function (c) { return c.age >= 6 && c.age < 18; }).length; }, build: function () {
    var c = U.pick(E.people('child').filter(function (c) { return c.age >= 6 && c.age < 18; }));
    var what = U.pick(['got suspended for fighting', 'got caught shoplifting', 'is failing math', 'dyed their hair green without asking', 'crashed the car']);
    return { icon: '🧒', title: 'Parenting', text: 'My ' + (c.gender === 'M' ? 'son' : 'daughter') + ' ' + c.first + ' ' + what + '.', choices: [
      { label: 'Ground them', run: function () { E.rel(c, -8); return c.first + ' is grounded for a month.'; } },
      { label: 'Have a heart-to-heart', run: function () { E.rel(c, 10); c.smarts = U.clamp(c.smarts + 3, 0, 100); return good('We had a great talk. ' + c.first + ' promised to do better.'); } },
      { label: 'Laugh it off', run: function () { E.rel(c, 5); E.karma(-1); return 'Kids will be kids.'; } }
    ] };
  } });
  def('partner_propose', { min: 20, max: 70, w: 4, cond: function () { var p = E.partner(); return p && p.role === 'partner' && p.rel > 70; }, build: function () {
    var p = E.partner();
    return { icon: '💍', title: 'Proposal', text: p.first + ' got down on one knee and asked me to marry them!', choices: [
      { label: 'Say yes!', run: function () { p.role = 'fiance'; E.stat('happy', 15); E.rel(p, 10); return good('We\'re engaged! 💍'); } },
      { label: 'I need more time', run: function () { E.rel(p, -15); return p.first + ' was hurt, but understands.'; } },
      { label: 'Break up', run: function () { p.role = 'ex'; S().counts.exes++; return bad('I broke up with ' + p.first + '.'); } }
    ] };
  } });
  def('in_prison_gang', { min: 14, max: 100, w: 12, cond: function () { return S().prison; }, build: function () {
    return { icon: '🏴', title: 'Prison gang', text: 'A prison gang wants me to join them.', choices: [
      { label: 'Join', run: function () { E.karma(-3); S().flags.gang = true; return 'I\'m a member now. Nobody messes with me.'; } },
      { label: 'Refuse', run: function () { if (U.chance(0.4)) { E.stat('health', -15); return bad('They jumped me in the showers.'); } return 'They left me alone... for now.'; } }
    ] };
  } });
  def('snitch', { min: 14, max: 100, w: 6, cond: function () { return S().prison && S().prison.remaining > 1; }, build: function () {
    return { icon: '🐀', title: 'Offer from the warden', text: 'The warden will cut my sentence if I snitch on another inmate.', choices: [
      { label: 'Snitch', run: function () { if (U.chance(0.6)) { S().prison.remaining = Math.max(1, S().prison.remaining - 2); return good('My sentence was reduced by 2 years.'); } E.stat('health', -25); return bad('The other inmates found out. I barely survived.'); } },
      { label: 'Stay loyal', run: function () { return 'Snitches get stitches.'; } }
    ] };
  } });
  def('lawsuit', { min: 25, max: 90, w: 1, cond: function () { return S().money > E.$(50000); }, build: function () {
    var amt = Math.round(S().money * U.randf(0.05, 0.25));
    return { icon: '📄', title: 'Sued!', text: 'Someone is suing me for ' + E.fmt(amt) + ', claiming they slipped on my property.', choices: [
      { label: 'Settle', run: function () { E.addMoney(-Math.round(amt / 2)); return 'I settled for ' + E.fmt(Math.round(amt / 2)) + '.'; } },
      { label: 'Fight it in court', run: function () { E.addMoney(-E.$(8000)); if (U.chance(0.55)) return good('I won the case!'); E.addMoney(-amt); return bad('I lost and had to pay ' + E.fmt(amt) + '.'); } }
    ] };
  } });
  def('fan_encounter', { min: 12, max: 90, w: 6, cond: function () { return S().fame >= 40; }, build: function () {
    return { icon: '📸', title: 'Paparazzi', text: 'Paparazzi are swarming me outside a restaurant.', choices: [
      { label: 'Pose for photos', run: function () { E.fame(2); return 'I struck a pose. I\'m on every gossip site.'; } },
      { label: 'Smash a camera', run: function () { E.fame(4); E.karma(-3); if (U.chance(0.3)) { E.addMoney(-E.$(20000)); return bad('The photographer sued me.'); } return 'The video of my outburst went viral.'; } },
      { label: 'Sneak out the back', run: function () { return 'I slipped out unnoticed.'; } }
    ] };
  } });
  def('endorsement', { min: 16, max: 80, w: 5, cond: function () { return S().fame >= 50 || S().followers > 200000; }, build: function () {
    var amt = E.$(Math.round(S().fame * U.rand(2000, 20000) + S().followers * 0.1));
    var brand = U.pick(['a sneaker brand', 'an energy drink', 'a fast food chain', 'a luxury watchmaker', 'a mobile game', 'a skincare line']);
    return { icon: '🤝', title: 'Endorsement deal', text: brand.charAt(0).toUpperCase() + brand.slice(1) + ' offers me ' + E.fmt(amt) + ' to be their spokesperson.', choices: [
      { label: 'Accept', run: function () { E.addMoney(amt); E.fame(2); return good('I signed the deal for ' + E.fmt(amt) + '.'); } },
      { label: 'Negotiate for more', run: function () { if (U.chance(0.5)) { E.addMoney(Math.round(amt * 1.6)); return good('They agreed to ' + E.fmt(Math.round(amt * 1.6)) + '!'); } return bad('They walked away from the deal.'); } },
      { label: 'Decline', run: function () { return 'I don\'t want to sell out.'; } }
    ] };
  } });

  // ---------- v1.1 events ----------
  // Generic workplace events skip careers with their own systems (military, basketball).
  function hasJob(ids) { var j = S().job; return j && !j.partTime && (!ids ? !j.mil && !j.hoops && !j.acting && !j.music && !j.pro : ids.indexOf(j.career) >= 0); }
  function houses() { return S().assets.filter(function (a) { return a.kind === 'house'; }); }
  def('reelection', {
    scripted: true,
    build: function () {
      var j = S().job;
      if (!j || !j.politics) return null;
      var limit = j.level === D.POLITICS.levels.length - 1 && j.terms >= D.POLITICS.termLimit;
      var title = E.jobTitle(j);
      var retire = { label: 'Retire from politics', run: function () { E.quitJob(true); if (j.level >= 2) { S().retired = true; S().pension = Math.round(E.jobSalary(j) * 0.5); } return 'I stepped down as ' + title + ' after ' + U.plural(j.years, 'year') + ' in office.'; } };
      if (limit) return { icon: '🏛️', title: 'Term limit', text: 'I\'ve served the maximum number of terms as President. It\'s time to leave office.', choices: [retire] };
      var choices = E.campaigns.slice(0, 3).map(function (c, i) {
        var cost = E.campaignCost(i, j.level);
        return { label: 'Run again: ' + c[0] + (cost ? ' (' + E.fmt(cost) + ')' : ''), run: function () { return E.reelect(i); } };
      });
      choices.push(retire);
      return { icon: '🗳️', title: 'Election year', text: 'My term as ' + title + ' is ending. My approval rating is ' + j.perf + '%. Do I run for re-election?', choices: choices };
    }
  });
  def('political_scandal', { min: 25, max: 100, w: 8, cond: function () { return S().job && S().job.politics; }, build: function () {
    var what = U.pick(['old photos of me at a college party', 'my use of campaign funds for a vacation', 'an affair rumor', 'a leaked recording of me insulting voters', 'my unpaid parking tickets']);
    return { icon: '📰', title: 'Scandal!', text: 'A reporter is about to publish a story about ' + what + '.', choices: [
      { label: 'Deny everything', run: function () { var j = S().job; if (U.chance(0.5)) return 'The story fizzled out.'; j.perf = Math.max(0, j.perf - 20); E.karma(-2); return bad('Nobody believed me. My approval rating plunged.'); } },
      { label: 'Apologize publicly', run: function () { var j = S().job; j.perf = Math.max(0, j.perf - 6); E.karma(2); return 'My sincere apology limited the damage.'; } },
      { label: 'Pay the reporter off', run: function () { var c = E.$(50000); if (S().money < c) return bad('I couldn\'t afford it. The story ran.'); E.addMoney(-c); E.karma(-5); if (U.chance(0.25)) { S().job.perf = Math.max(0, S().job.perf - 35); return bad('The bribe attempt became an even bigger story!'); } return 'The story quietly disappeared.'; } }
    ] };
  } });
  def('campaign_donor', { min: 25, max: 100, w: 6, cond: function () { return S().job && S().job.politics; }, build: function () {
    var amt = E.$(U.pick([50000, 200000, 1000000]) * (S().job.level + 1));
    return { icon: '🤝', title: 'Wealthy donor', text: 'A billionaire offers ' + E.fmt(amt) + ' for my "campaign", in exchange for a few favors.', choices: [
      { label: 'Accept', run: function () { E.addMoney(amt); E.karma(-8); if (U.chance(0.2)) { E.jail(U.rand(2, 6), 'Corruption'); return bad('Federal agents uncovered the deal.'); } return 'I accepted the "donation".'; } },
      { label: 'Refuse', run: function () { E.karma(4); S().job.perf = Math.min(100, S().job.perf + 3); return good('I refused. Word got out and voters respect my integrity.'); } }
    ] };
  } });
  def('natural_disaster', { min: 18, max: 100, w: 2, cond: function () { return houses().length; }, build: function () {
    var h = U.pick(houses()), kind = U.pick(['flood', 'earthquake', 'wildfire', 'tornado', 'hurricane']);
    var dmg = Math.round(h.value * U.randf(0.1, 0.35));
    return { icon: '🌪️', title: 'Natural disaster', text: 'A ' + kind + ' damaged my property at ' + h.name + '.', choices: [
      { label: 'Repair it (' + E.fmt(dmg) + ')', run: function () { E.addMoney(-dmg); h.cond = Math.max(h.cond, 70); return 'I paid ' + E.fmt(dmg) + ' to repair the damage.'; } },
      { label: 'File an insurance claim', run: function () { if (U.chance(0.6)) { h.cond = Math.max(h.cond, 60); return good('Insurance covered the repairs.'); } h.cond = Math.max(0, h.cond - 35); h.value = Math.round(h.value * 0.8); return bad('The insurer denied my claim, citing an "act of God".'); } },
      { label: 'Leave it', run: function () { h.cond = Math.max(0, h.cond - 35); h.value = Math.round(h.value * 0.8); return bad('The damage is dragging down the property value.'); } }
    ] };
  } });
  def('tax_audit', { min: 25, max: 100, w: 2, cond: function () { return S().money > E.$(100000); }, build: function () {
    var owed = Math.round(S().money * U.randf(0.03, 0.12));
    return { icon: '🧾', title: 'Tax audit', text: 'The tax office is auditing me and says I owe ' + E.fmt(owed) + '.', choices: [
      { label: 'Pay it', run: function () { E.addMoney(-owed); return 'I paid the back taxes.'; } },
      { label: 'Hire an accountant (' + E.fmt(E.$(5000)) + ')', run: function () { E.addMoney(-E.$(5000)); if (U.chance(0.6)) return good('My accountant got the claim thrown out.'); E.addMoney(-owed); return bad('They still made me pay.'); } },
      { label: 'Hide my money offshore', run: function () { E.karma(-5); if (U.chance(0.35)) { E.addMoney(-owed * 2); E.jail(U.rand(1, 4), 'Tax Evasion'); return bad('I was caught hiding assets.'); } return 'The auditors couldn\'t find anything.'; } }
    ] };
  } });
  def('reunion', { min: 28, max: 55, w: 4, once: true, cond: function () { return E.hasDegree('hs'); }, build: function () {
    return { icon: '🎉', title: 'High school reunion', text: 'I\'ve been invited to my high school reunion.', choices: [
      { label: 'Go and brag about my life', run: function () { var nw = E.netWorth(); if (nw > E.$(500000) || S().fame > 30) { E.stat('happy', 10); return good('Everyone was impressed by how well I\'m doing.'); } E.stat('happy', -5); return 'People could tell I was exaggerating.'; } },
      { label: 'Find my old crush', run: function () {
        if (E.partner() && E.partner().role !== 'partner') { E.karma(-2); return 'We reminisced about old times. Nothing more.'; }
        var c = E.makePerson({ age: me().age + U.rand(-1, 1), gender: me().interest === 'A' ? undefined : me().interest, role: 'partner' });
        if (!E.partner() && U.chance(0.4)) { c.rel = 65; S().people.push(c); return good('Sparks flew with ' + c.first + '. We\'re dating now!'); }
        return c.first + ' is happily married with three kids.';
      } },
      { label: 'Skip it', run: function () { return 'I have no interest in the past.'; } }
    ] };
  } });
  def('headhunter', { min: 24, max: 62, w: 4, cond: function () { return hasJob() && !S().job.fame && !S().job.politics; }, build: function () {
    var j = S().job, boost = U.randf(1.12, 1.35);
    return { icon: '📞', title: 'Recruiter call', text: 'A headhunter offers me the same role at a competitor for ' + Math.round((boost - 1) * 100) + '% more money.', choices: [
      { label: 'Take the offer', run: function () { j.mult = (j.mult || 1) * boost; j.perf = 55; j.levelYears = 0; j.company = U.pick(['Apex', 'Summit', 'Nova', 'Atlas', 'Pioneer']) + ' ' + U.pick(['Group', 'Inc.', 'Partners']); return good('I switched to ' + j.company.replace(/\.$/, '') + '. New salary: ' + E.fmt(E.jobSalary(j)) + '.'); } },
      { label: 'Use it to get a raise', run: function () { if (U.chance(0.5)) { j.mult = (j.mult || 1) * (1 + (boost - 1) / 2); return good('My boss matched part of the offer!'); } j.perf = Math.max(0, j.perf - 10); return bad('My boss called my bluff.'); } },
      { label: 'Stay loyal', run: function () { j.perf = Math.min(100, j.perf + 4); return 'I turned it down.'; } }
    ] };
  } });
  def('identity_theft', { min: 18, max: 100, w: 2, build: function () {
    var loss = Math.min(Math.max(0, S().money), E.$(U.rand(500, 8000)));
    return { icon: '🕵️', title: 'Identity theft', text: 'Someone opened credit cards in my name!', choices: [
      { label: 'Freeze my credit and report it', run: function () { E.addMoney(-Math.round(loss * 0.2)); return 'I caught it quickly and lost only ' + E.fmt(Math.round(loss * 0.2)) + '.'; } },
      { label: 'Track down the thief online', run: function () { if (U.chance(me().smarts / 150)) return good('I found the thief and the police arrested them!'); E.addMoney(-loss); return bad('I got nowhere and lost ' + E.fmt(loss) + '.'); } }
    ] };
  } });
  def('deployment', { min: 18, max: 60, w: 10, cond: function () { return hasJob(['military']) && !S().job.mil; }, build: function () {
    return { icon: '🎖️', title: 'Deployment', text: 'My unit is being deployed overseas.', choices: [
      { label: 'Volunteer for the front line', run: function () {
        var r = U.rand(1, 100), j = S().job;
        if (r <= 15) { E.stat('health', -U.rand(20, 40)); E.addCondition(U.pick(['Broken Leg', 'Concussion'])); return bad('I was wounded in combat.'); }
        if (r <= 55) { j.perf = Math.min(100, j.perf + 20); E.fame(3); return good('I was awarded a medal for bravery! 🎖️'); }
        return 'I served with distinction and came home safe.';
      } },
      { label: 'Request a support role', run: function () { S().job.perf = Math.min(100, S().job.perf + 5); return 'I handled logistics for the deployment.'; } },
      { label: 'Go AWOL', run: function () { E.karma(-5); E.fire('I deserted my unit.'); if (U.chance(0.5)) E.jail(U.rand(1, 3), 'Desertion'); return bad('I deserted.'); } }
    ] };
  } });
  def('pet_sick', { min: 6, max: 100, w: 4, cond: function () { return S().pets.length; }, build: function () {
    var pet = U.pick(S().pets), cost = E.$(U.pick([400, 1500, 4000]));
    return { icon: '🐾', title: 'Sick pet', text: 'My ' + pet.species.toLowerCase() + ' ' + pet.name + ' is very sick. Surgery costs ' + E.fmt(cost) + '.', choices: [
      { label: 'Pay for surgery', run: function () { E.addMoney(-cost); pet.rel = Math.min(100, pet.rel + 20); if (U.chance(0.8)) return good(pet.name + ' made a full recovery!'); pet.dead = true; S().pets = S().pets.filter(function (p) { return !p.dead; }); E.stat('happy', -10); return bad(pet.name + ' didn\'t make it.'); } },
      { label: 'Home remedies', run: function () { if (U.chance(0.4)) return pet.name + ' pulled through!'; S().pets = S().pets.filter(function (p) { return p !== pet; }); E.stat('happy', -12); return bad(pet.name + ' passed away.'); } }
    ] };
  } });
  def('blind_date', { min: 20, max: 60, w: 4, cond: function () { return !E.partner() && E.people(['friend', 'best friend']).length; }, build: function () {
    var f = U.pick(E.people(['friend', 'best friend']));
    var c = E.makePerson({ age: U.clamp(me().age + U.rand(-5, 5), 18, 90), gender: me().interest === 'A' ? undefined : me().interest, role: 'partner' });
    return { icon: '🌹', title: 'Blind date', text: f.first + ' wants to set me up on a blind date with their friend ' + c.first + '.', choices: [
      { label: 'Go on the date', run: function () { E.rel(f, 5); if (U.chance(0.5)) { c.rel = 60; S().people.push(c); S().counts.dates++; return good(c.first + ' and I hit it off. We\'re dating!'); } return c.first + ' spent the whole dinner talking about their ex.'; } },
      { label: 'No thanks', run: function () { return 'I\'m happy being single.'; } }
    ] };
  } });
  def('market_crash', { min: 18, max: 100, w: 4, cond: function () { return Object.keys(S().stocks).length; }, build: function () {
    return { icon: '📉', title: 'Market crash', text: 'The stock market is in free fall!', choices: [
      { label: 'Panic sell everything', run: function () { var s = S(), got = 0; Object.keys(s.stocks).forEach(function (k) { got += Math.round(s.stocks[k] * s.prices[k] * 0.75); s.prices[k] = Math.round(s.prices[k] * 0.75 * 100) / 100; }); s.stocks = {}; E.addMoney(got); return bad('I sold everything at a loss for ' + E.fmt(got) + '.'); } },
      { label: 'Hold', run: function () { var s = S(); Object.keys(s.prices).forEach(function (k) { s.prices[k] = Math.round(s.prices[k] * 0.72 * 100) / 100; }); return 'I held my shares and watched them fall. Hopefully they recover.'; } },
      { label: 'Buy the dip', run: function () { var s = S(); Object.keys(s.prices).forEach(function (k) { s.prices[k] = Math.round(s.prices[k] * 0.72 * 100) / 100; }); var spend = Math.round(Math.max(0, s.money) * 0.3), sym = Object.keys(s.stocks)[0], sh = Math.floor(spend / s.prices[sym]); if (sh > 0 && isFinite(sh)) { s.stocks[sym] += sh; E.addMoney(-Math.round(sh * s.prices[sym])); return 'I bought ' + sh + ' more shares of ' + sym + ' at bargain prices.'; } return 'I wanted to buy, but I didn\'t have the cash.'; } }
    ] };
  } });
  def('ufo', { min: 10, max: 100, w: 2, build: function () {
    return { icon: '🛸', title: 'Strange lights', text: 'I saw strange lights hovering over the field behind my home.', choices: [
      { label: 'Film it', run: function () { if (S().social.platform) { var f = U.rand(100, 20000); S().followers += f; return good('My UFO video got me ' + f.toLocaleString() + ' new followers.'); } return 'The footage is blurry. Nobody believes me.'; } },
      { label: 'Walk toward the lights', run: function () { if (U.chance(0.1)) { E.stat('smarts', 10); return good('I woke up the next morning with no memory... but I feel smarter?'); } return 'It was just a drone.'; } },
      { label: 'Go back to bed', run: function () { return 'Not my problem.'; } }
    ] };
  } });
  def('drowning', { min: 12, max: 75, w: 2, build: function () {
    return { icon: '🌊', title: 'Emergency', text: 'Someone is drowning in the lake!', choices: [
      { label: 'Dive in to save them', run: function () { if (U.chance(me().athl / 100 + 0.2)) { E.karma(10); E.fame(5); E.stat('happy', 10); return good('I saved their life! The local news called me a hero.'); } E.stat('health', -15); return bad('I nearly drowned too. Lifeguards pulled us both out.'); } },
      { label: 'Call for help', run: function () { E.karma(2); return 'Paramedics arrived in time.'; } },
      { label: 'Walk away', run: function () { E.karma(-10); return bad('I walked away. I\'ll never forget it.'); } }
    ] };
  } });
  def('babysit_grandkids', { min: 45, max: 100, w: 5, cond: function () { return E.people('grandchild').filter(function (g) { return g.age < 12; }).length; }, build: function () {
    var g = U.pick(E.people('grandchild').filter(function (g) { return g.age < 12; }));
    return { icon: '🧸', title: 'Grandparent duty', text: 'My ' + E.relWord(g) + ' ' + g.first + ' is staying with me for the weekend.', choices: [
      { label: 'Spoil them rotten', run: function () { E.addMoney(-E.$(200)); E.rel(g, 15); E.stat('happy', 8); return good('We ate ice cream for dinner. ' + g.first + ' adores me.'); } },
      { label: 'Teach them something', run: function () { g.smarts = Math.min(100, g.smarts + 5); E.rel(g, 8); return 'I taught ' + g.first + ' how to ' + U.pick(['fish', 'bake bread', 'play chess', 'ride a bike', 'whistle']) + '.'; } },
      { label: 'Nap the whole time', run: function () { E.rel(g, -5); return g.first + ' watched TV all weekend.'; } }
    ] };
  } });
  def('lemon_car', { min: 17, max: 100, w: 2, cond: function () { return S().assets.some(function (a) { return a.kind === 'car' && a.cond < 50; }); }, build: function () {
    var car = S().assets.filter(function (a) { return a.kind === 'car' && a.cond < 50; })[0], cost = Math.round(car.price * 0.15);
    return { icon: '🔧', title: 'Car trouble', text: 'My ' + car.name + ' broke down on the highway.', choices: [
      { label: 'Fix it (' + E.fmt(cost) + ')', run: function () { E.addMoney(-cost); car.cond = 80; return 'The mechanic got it running again.'; } },
      { label: 'Sell it for scrap', run: function () { var v = Math.round(car.value * 0.3); E.addMoney(v); S().assets = S().assets.filter(function (a) { return a !== car; }); return 'I sold it for scrap for ' + E.fmt(v) + '.'; } }
    ] };
  } });

  // ---------- v1.2 events ----------
  function hasCar() { return S().assets.some(function (a) { return a.kind === 'car' && ['Private Jet', 'Superyacht'].indexOf(a.type) < 0; }); }
  def('speeding', { min: 16, max: 95, w: 4, cond: hasCar, build: function () {
    var fine = E.$(U.pick([150, 300, 600]));
    return { icon: '🚓', title: 'Pulled over', text: 'A cop pulled me over for doing 25 over the speed limit.', choices: [
      { label: 'Accept the ticket (' + E.fmt(fine) + ')', run: function () { E.addMoney(-fine); return 'I paid the ' + E.fmt(fine) + ' fine.'; } },
      { label: 'Talk my way out of it', run: function () { if (U.chance(me().looks / 200 + 0.15)) return good('The officer let me off with a warning. 😇'); E.addMoney(-fine * 2); return bad('The officer was not charmed. Double fine.'); } },
      { label: 'Floor it', run: function () {
        E.karma(-4);
        if (U.chance(0.3)) { E.stat('happy', 6); return 'I lost them in traffic! My heart is pounding.'; }
        E.jail(U.rand(0, 2), 'Evading Police'); return bad('They caught me after a high-speed chase.');
      } }
    ] };
  } });
  def('dui', { min: 18, max: 90, w: 3, cond: hasCar, build: function () {
    return { icon: '🍻', title: 'Last call', text: 'I had a few too many drinks at a bar. My car is in the parking lot.', choices: [
      { label: 'Call a rideshare', run: function () { E.addMoney(-E.$(30)); E.karma(1); return 'I got home safe and picked up my car the next day.'; } },
      { label: 'Drive home anyway', run: function () {
        E.karma(-5);
        var r = U.rand(1, 100);
        if (r <= 20) { E.jail(U.rand(0, 1), 'DUI'); E.addMoney(-E.$(5000)); S().flags.license = false; return bad('I was arrested for drunk driving and lost my license.'); }
        if (r <= 30) { E.stat('health', -U.rand(15, 35)); var car = S().assets.filter(function (a) { return a.kind === 'car'; })[0]; if (car) car.cond = Math.max(0, car.cond - 50); return bad('I crashed into a tree. I\'m lucky to be alive.'); }
        return 'I made it home... this time.';
      } }
    ] };
  } });
  def('road_rage', { min: 17, max: 90, w: 3, cond: hasCar, build: function () {
    return { icon: '🤬', title: 'Road rage', text: 'Someone cut me off and is now tailgating me, honking and yelling.', choices: [
      { label: 'Let them pass', run: function () { E.karma(1); return 'I let them go. Not worth it.'; } },
      { label: 'Brake check them', run: function () { if (U.chance(0.3)) { E.addMoney(-E.$(2500)); return bad('They rear-ended me and it was ruled my fault.'); } return 'They backed off.'; } },
      { label: 'Pull over and confront them', run: function () { if (U.chance(me().athl / 150)) { E.stat('happy', 5); return 'They drove off the moment I got out of the car.'; } E.stat('health', -U.rand(8, 20)); return bad('It turned into a fistfight. I lost.'); } }
    ] };
  } });
  def('royal_suitor', { min: 18, max: 45, w: 6, cond: function () { return S().royal && !E.partner(); }, build: function () {
    var c = E.makePerson({ age: U.clamp(me().age + U.rand(-4, 4), 18, 60), gender: me().interest === 'A' ? undefined : me().interest, role: 'partner' });
    c.job = U.pick(['Duke', 'Countess', 'Heir to a shipping fortune', 'Olympic rower', 'Diplomat', 'Barista']);
    return { icon: '💌', title: 'A royal match?', text: 'The palace wants to introduce me to ' + c.first + ' ' + c.last + ' (' + c.job.toLowerCase() + ').', choices: [
      { label: 'Agree to meet', run: function () { if (U.chance(0.55)) { c.rel = 60; S().people.push(c); S().royal.popularity = Math.min(100, S().royal.popularity + 5); return good('We got along wonderfully. The tabloids are thrilled about the royal romance.'); } return c.first + ' was charming but there was no spark.'; } },
      { label: 'I\'ll choose my own partner', run: function () { S().royal.popularity = Math.max(0, S().royal.popularity - 2); return 'I told the palace I\'ll find love on my own terms.'; } }
    ] };
  } });
  def('royal_tabloid', { min: 14, max: 100, w: 5, cond: function () { return S().royal; }, build: function () {
    return { icon: '📰', title: 'Tabloid story', text: 'A tabloid claims I ' + U.pick(['was rude to a waiter', 'spent a fortune on a yacht', 'am secretly feuding with my family', 'fell asleep during a state dinner']) + '.', choices: [
      { label: 'Issue a statement', run: function () { S().royal.popularity = Math.max(0, S().royal.popularity - 2); return 'The palace issued a statement. The story faded.'; } },
      { label: 'Sue the tabloid', run: function () { if (U.chance(0.5)) { var w = E.$(250000); E.addMoney(w); return good('I won the lawsuit and ' + E.fmt(w) + ' in damages.'); } S().royal.popularity = Math.max(0, S().royal.popularity - 6); return bad('I lost the case. The story got even bigger.'); } },
      { label: 'Ignore it', run: function () { S().royal.popularity = Math.max(0, S().royal.popularity - 4); return 'I never complain, never explain.'; } }
    ] };
  } });
  // Modern royal life (v1.39): the crown is a job with its own crises.
  function pop(d) { var r = S().royal; r.popularity = U.clamp(r.popularity + d, 0, 100); }
  function monarch() { return S().royal && S().royal.monarch; }
  def('royal_state_visit', { min: 18, w: 5, cond: function () { return !!S().royal; }, build: function () {
    var where = U.pick(['Japan', 'India', 'Canada', 'Kenya', 'Brazil', 'Australia', 'Germany', 'Mexico']);
    return { icon: '🎖️', title: 'A state visit to ' + where, text: 'The government has asked me to lead a state visit to ' + where + '. Every word I say will be in the papers.', choices: [
      { label: 'Learn a few phrases and charm everyone', run: function () { if (U.chance(0.45 + me().smarts / 250)) { pop(U.rand(5, 10)); E.fame(3); return good('My little speech in the local language went viral. ' + where + ' loved me.'); } pop(-3); return bad('I mispronounced the president\'s name at the state banquet. Twice.'); } },
      { label: 'Stick to the script', run: function () { pop(2); return 'Handshakes, wreaths, a banquet. Nothing went wrong, and nobody will remember it.'; } },
      { label: 'Ask to skip it', run: function () { pop(-6); E.stat('happy', 3); return 'The papers called me lazy. I spent the week at home.'; } }
    ] };
  } });
  def('royal_crisis', { min: 18, w: 4, cond: monarch, build: function () {
    return { icon: '📜', title: 'A constitutional crisis', text: 'Parliament has passed a law half the country hates. Tradition says I sign it. Some people are begging me to refuse.', choices: [
      { label: 'Sign it: the monarch stays above politics', run: function () { pop(-2); E.karma(1); return 'I signed. Commentators praised my restraint; the protesters booed my car.'; } },
      { label: 'Refuse to sign', run: function () { if (U.chance(0.4)) { pop(12); E.fame(6); return good('I refused. Half the country cheered, and the government backed down.'); } pop(-15); E.fame(6); return bad('I refused, and a crisis followed. There is talk of abolishing the monarchy.'); } }
    ] };
  } });
  def('royal_memoir', { min: 25, w: 3, cond: function () { return !!S().royal; }, build: function () {
    return { icon: '📕', title: 'A tell-all memoir', text: 'A former palace aide is publishing a memoir full of stories about me.', choices: [
      { label: 'Try to block it in court', run: function () { E.addMoney(-E.$(400000)); if (U.chance(0.4)) return good('The judge blocked publication. My lawyers cost a fortune.'); pop(-6); return bad('The court refused, and the publicity made it a bestseller.'); } },
      { label: 'Publish my own side of the story', run: function () { var w = E.$(U.rand(2, 8) * 1000000); E.addMoney(w); pop(U.chance(0.5) ? 5 : -8); E.fame(5); return 'My own book earned ' + E.fmt(w) + '. Not everyone at the palace is speaking to me.'; } },
      { label: 'Stay silent', run: function () { pop(-2); return 'I said nothing. The story was forgotten in a month.'; } }
    ] };
  } });
  def('royal_service', { min: 18, max: 30, w: 4, cond: function () { return !!S().royal && !monarch() && !S().mil; }, build: function () {
    return { icon: '🪖', title: 'Serve in the armed forces?', text: 'Royals have long served in the military. The palace thinks a few years in uniform would be good for my image.', choices: [
      { label: 'Serve as a helicopter pilot', run: function () { pop(10); E.stat('health', 3); me().athl = Math.min(100, me().athl + 6); E.fame(4); return good('I flew search-and-rescue missions for three years. The people saw a royal who did real work.'); } },
      { label: 'Decline politely', run: function () { pop(-3); return 'I said I would serve the nation in other ways.'; } }
    ] };
  } });
  def('royal_charity', { min: 16, w: 5, cond: function () { return !!S().royal; }, build: function () {
    var cause = U.pick(['mental health', 'veterans', 'children\'s hospitals', 'wildlife', 'homelessness', 'clean oceans']);
    return { icon: '🎗️', title: 'Become a patron?', text: 'A charity for ' + cause + ' has asked me to become its royal patron.', choices: [
      { label: 'Accept and get involved', run: function () { pop(6); E.karma(6); E.stat('happy', 4); return good('I visited every project and raised millions for ' + cause + '.'); } },
      { label: 'Lend my name only', run: function () { pop(1); return 'My name is on their letterhead now.'; } }
    ] };
  } });

  def('mob_favor', { min: 18, max: 100, w: 6, cond: function () { return S().mob && !S().prison; }, build: function () {
    var mob = S().mob;
    return { icon: '🕴️', title: 'A favor', text: 'The ' + mob.family + ' family needs me to hide a package for a few weeks. No questions asked.', choices: [
      { label: 'Do it', run: function () { mob.respect = Math.min(100, mob.respect + 8); mob.heat = Math.min(100, mob.heat + 6); E.karma(-2); return 'I kept the package safe. The family won\'t forget it.'; } },
      { label: 'Refuse', run: function () { mob.respect = Math.max(0, mob.respect - 12); return bad('The family is unhappy with me.'); } }
    ] };
  } });

  // ---------- v1.4 home events ----------
  function homeIs(t) { return me().age >= 18 && !S().prison && E.home().type === t; }
  def('parents_rent', { min: 22, max: 50, w: 6, cond: function () { return homeIs('parents') && !S().flags.parentRent && E.parentsAround().length > 0 && !(S().job && S().job.mil); }, build: function () {
    var rent = E.$(U.pick([3000, 5000, 8000]));
    var p = E.parentsAround()[0];
    return { icon: '🏠', title: 'House rules', text: 'My ' + E.relWord(p) + ' says it\'s time I either pay rent or move out.', choices: [
      { label: 'Pay rent (' + E.fmt(rent) + '/yr)', run: function () { S().flags.parentRent = rent; E.rel(p, 8); return 'I agreed to pay my parents rent.'; } },
      { label: 'Move into a studio apartment', run: function () { var dep = Math.round(E.$(12000) / 6); if (S().money < dep) { E.rel(p, -5); return bad('I couldn\'t afford the deposit. Awkward.'); } E.addMoney(-dep); E.moveHome({ type: 'rent', tier: 1 }); E.rel(p, 5); return good('I finally moved out! 📦'); } },
      { label: 'Beg to stay rent-free', run: function () { if (U.chance(p.rel / 120)) return good(p.first + ' caved. I can stay for free.'); E.rel(p, -12); return bad(p.first + ' is not happy with me.'); } }
    ] };
  } });
  def('rent_hike', { min: 18, max: 100, w: 5, cond: function () { return homeIs('rent') && E.home().tier >= 1; }, build: function () {
    var h = E.home(), pct = U.pick([8, 12, 15, 20]);
    return { icon: '📈', title: 'Rent increase', text: 'My landlord is raising the rent by ' + pct + '%.', choices: [
      { label: 'Accept it', run: function () { h.mult = (h.mult || 1) * (1 + pct / 100); return 'My rent is now ' + E.fmt(E.rentCost()) + '/yr.'; } },
      { label: 'Negotiate', run: function () { if (U.chance(0.45 + me().smarts / 400)) return good('I talked them out of it!'); h.mult = (h.mult || 1) * (1 + (pct + 5) / 100); return bad('The landlord raised it even more for "attitude".'); } },
      { label: 'Move somewhere cheaper', run: function () { E.moveHome({ type: 'rent', tier: h.tier - 1 }); return 'I moved into a ' + E.RENT_TIERS[h.tier - 1][0].toLowerCase() + '.'; } }
    ] };
  } });
  def('roommate', { min: 18, max: 60, w: 6, cond: function () { return homeIs('rent') && E.home().tier === 0; }, build: function () {
    var r = E.makePerson({ age: me().age + U.rand(-4, 6) });
    var what = U.pick(['keeps eating my food', 'plays drums at 2 AM', 'never does the dishes', 'has a secret pet snake', 'keeps "borrowing" my clothes']);
    return { icon: '🛏️', title: 'Roommate trouble', text: 'My roommate ' + r.first + ' ' + what + '.', choices: [
      { label: 'Confront them', run: function () { if (U.chance(0.55)) return good(r.first + ' apologized. Things are better.'); E.stat('happy', -4); return bad('It turned into a screaming match.'); } },
      { label: 'Leave a passive-aggressive note', run: function () { E.stat('happy', 2); return 'I left a note on the fridge. 🙃'; } },
      { label: 'Befriend them instead', run: function () { r.role = 'friend'; r.rel = 55; S().people.push(r); return good(r.first + ' and I actually became friends.'); } }
    ] };
  } });
  def('shelter', { min: 18, max: 100, w: 12, cond: function () { return homeIs('homeless'); }, build: function () {
    return { icon: '🏚️', title: 'A helping hand', text: 'A shelter offers me a bed and help getting back on my feet.', choices: [
      { label: 'Accept their help', run: function () { E.stat('health', 6); E.stat('happy', 5); if (U.chance(0.4)) { E.addMoney(E.$(2000)); return good('They helped me find some work. I saved ' + E.fmt(E.$(2000)) + '.'); } return good('I got warm meals and a safe place to sleep.'); } },
      { label: 'Ask family for help', run: function () { var p = E.parentsAround().concat(E.people(['sibling', 'child'])).filter(function (x) { return x.age >= 18 && x.rel >= 40; })[0]; if (p && U.chance(0.6)) { E.moveHome({ type: p.role === 'mother' || p.role === 'father' ? 'parents' : 'rent', tier: 1 }); return good(p.first + ' helped me get a roof over my head.'); } return bad('Nobody could take me in.'); } },
      { label: 'Refuse', run: function () { return 'I\'d rather manage on my own.'; } }
    ] };
  } });

  // ---------- v1.4 life events ----------
  function job(id) { var j = S().job; return j && j.career === id && !S().prison; }
  def('space_mission', { min: 26, max: 70, w: 30, cond: function () { return job('astronaut') && S().job.level >= 1; }, build: function () {
    var dest = U.pick(['the International Space Station', 'a lunar orbit mission', 'a Moon landing', 'a spacewalk to repair a satellite', 'a six-month station expedition']);
    return { icon: '🚀', title: 'Mission assignment', text: 'I\'ve been selected for ' + dest + '!', choices: [
      { label: 'Launch! 🚀', run: function () {
        if (U.chance(0.012)) { E.die('a spacecraft accident'); return bad('Something went terribly wrong during launch...'); }
        var j = S().job; j.perf = Math.min(100, j.perf + 15); E.fame(U.rand(6, 12)); E.stat('happy', 15);
        S().flags.space = (S().flags.space || 0) + 1; E.achieve('astronaut');
        return good('The mission was a success! I saw Earth from space. 🌍');
      } },
      { label: 'Stay on the ground crew', run: function () { S().job.perf = Math.min(100, S().job.perf + 3); return 'I supported the mission from mission control.'; } }
    ] };
  } });
  def('first_steps', { min: 1, max: 1, w: 20, once: true, build: function () {
    return { icon: '🚼', title: 'First steps', text: 'I\'m trying to take my very first steps!', choices: [
      { label: 'Keep trying', run: function () { me().athl = U.clamp(me().athl + 3, 0, 100); E.people(['mother', 'father']).forEach(function (p) { E.rel(p, 5); }); return good('I took my first wobbly steps! My parents cheered.'); } },
      { label: 'Crawl instead', run: function () { return 'Walking is overrated. I\'m a crawler.'; } },
      { label: 'Plop down and cry', run: function () { return 'I fell on my diaper and wailed.'; } }
    ] };
  } });
  def('daycare_bite', { min: 2, max: 5, w: 6, build: function () {
    var k = E.makePerson({ age: me().age });
    return { icon: '🧸', title: 'Daycare drama', text: 'A kid named ' + k.first + ' bit me at daycare!', choices: [
      { label: 'Bite back', run: function () { E.karma(-1); E.stat('happy', 3); return 'I bit ' + k.first + ' right back. We were both put in time-out.'; } },
      { label: 'Tell the teacher', run: function () { return k.first + ' had to sit in the corner.'; } },
      { label: 'Cry', run: function () { E.stat('happy', -3); return 'I cried until snack time.'; } }
    ] };
  } });
  def('lost_in_store', { min: 4, max: 8, w: 5, build: function () {
    return { icon: '🛒', title: 'Lost!', text: 'I lost my parents in a huge department store.', choices: [
      { label: 'Stay where I am', run: function () { E.stat('smarts', 1); return good('My parents found me right where they left me. Smart move!'); } },
      { label: 'Ask an employee for help', run: function () { return 'They called my parents over the loudspeaker.'; } },
      { label: 'Go exploring', run: function () { if (U.chance(0.5)) { E.stat('happy', 4); return 'I found the toy aisle! My parents found me an hour later.'; } E.stat('happy', -6); return bad('I ended up in the parking lot, terrified.'); } }
    ] };
  } });
  def('pet_request', { min: 6, max: 13, w: 5, cond: function () { return !S().pets.length && E.parentsAround().length; }, build: function () {
    var sp = U.pick(['Dog', 'Cat', 'Hamster', 'Rabbit']);
    return { icon: '🥺', title: 'Can we get a pet?', text: 'I really, really want a ' + sp.toLowerCase() + '.', choices: [
      { label: 'Beg my parents', run: function () { var p = E.parentsAround()[0]; if (U.chance(p.rel / 130)) { var pet = TL.actions.addPet(sp); return good('They said yes! Meet ' + pet.name + ' the ' + sp.toLowerCase() + '! 🐾'); } return 'They said "maybe when you\'re older."'; } },
      { label: 'Promise to do all my chores', run: function () { if (U.chance(0.5)) { var pet = TL.actions.addPet(sp); return good('Deal! ' + pet.name + ' joined the family.'); } return 'They didn\'t believe me.'; } },
      { label: 'Forget it', run: function () { return 'I\'ll get one when I\'m grown up.'; } }
    ] };
  } });
  def('lottery_pool', { min: 21, max: 65, w: 4, cond: function () { var j = S().job; return j && !j.partTime && !j.fame && !S().prison; }, build: function () {
    var buy = E.$(20);
    return { icon: '🎟️', title: 'Office lottery pool', text: 'My coworkers are pooling money for the big lottery jackpot. It\'s ' + E.fmt(buy) + ' to join.', choices: [
      { label: 'Join the pool', run: function () { E.addMoney(-buy); if (Math.random() < 0.004) { var share = E.$(U.rand(200000, 2000000)); E.addMoney(share); E.achieve('lottery'); return good('WE WON! My share of the jackpot is ' + E.fmt(share) + '! 🎉'); } if (U.chance(0.1)) { var sm = E.$(U.rand(20, 200)); E.addMoney(sm); return 'We won a small prize. My cut: ' + E.fmt(sm) + '.'; } return 'We didn\'t win anything.'; } },
      { label: 'Sit this one out', run: function () { return 'I kept my money.'; } }
    ] };
  } });
  def('marathon_invite', { min: 16, max: 65, w: 4, cond: function () { return !S().flags.marathon && E.people(['friend', 'best friend']).length; }, build: function () {
    var f = U.pick(E.people(['friend', 'best friend']));
    return { icon: '🏃', title: 'Marathon', text: f.first + ' wants us to run a marathon together.', choices: [
      { label: 'Let\'s do it', run: function () { E.rel(f, 8); if (U.chance(me().athl / 110 + 0.1)) { S().flags.marathon = true; me().athl = U.clamp(me().athl + 3, 0, 100); return good('We crossed the finish line together! 🏅'); } E.stat('health', -4); return bad('I cramped up at mile 16 and had to walk off the course.'); } },
      { label: 'Cheer from the sidelines', run: function () { E.rel(f, 3); return 'I held a funny sign at mile 20.'; } }
    ] };
  } });
  def('reality_show', { min: 18, max: 40, w: 3, once: true, cond: function () { return (me().looks >= 70 || S().fame >= 30) && !S().prison; }, build: function () {
    return { icon: '📺', title: 'Reality TV', text: 'A producer wants me on a dating reality show filmed in a tropical villa.', choices: [
      { label: 'Sign me up', run: function () {
        E.fame(U.rand(5, 15)); if (S().social.platform) S().followers += U.rand(5000, 80000);
        var pt = E.partner();
        if (pt) { E.rel(pt, -30); return bad('I went on the show while dating ' + pt.first + '. They were NOT happy.'); }
        if (U.chance(0.4)) { var c = E.addPerson({ role: 'partner', age: me().age + U.rand(-3, 3), gender: me().interest === 'A' ? undefined : me().interest, rel: 65 }); return good('I coupled up with ' + c.first + ' and we won the show! 🌴'); }
        return 'I was voted off in week two, but gained a ton of followers.';
      } },
      { label: 'No way', run: function () { return 'I\'d rather keep my dignity.'; } }
    ] };
  } });
  def('grandkid_tuition', { min: 55, max: 110, w: 5, cond: function () { return E.people('grandchild').some(function (g) { return g.age >= 17 && g.age <= 19; }) && S().money > E.$(10000); }, build: function () {
    var g = E.people('grandchild').filter(function (g) { return g.age >= 17 && g.age <= 19; })[0];
    var amt = E.$(U.pick([5000, 20000, 60000]));
    return { icon: '🎓', title: 'College fund', text: 'My ' + E.relWord(g) + ' ' + g.first + ' got into college and asks if I can help with tuition (' + E.fmt(amt) + ').', choices: [
      { label: 'Pay it', run: function () { E.addMoney(-amt); E.rel(g, 30); E.karma(4); g.job = 'University Student'; return good(g.first + ' hugged me and cried. Best money I ever spent.'); } },
      { label: 'Pay half', run: function () { E.addMoney(-Math.round(amt / 2)); E.rel(g, 12); return g.first + ' was grateful for the help.'; } },
      { label: 'Tell them to take out loans', run: function () { E.rel(g, -10); return g.first + ' said they understood. They didn\'t.'; } }
    ] };
  } });
  def('old_friend', { min: 55, max: 110, w: 4, build: function () {
    var f = E.makePerson({ age: me().age + U.rand(-3, 3) });
    return { icon: '💌', title: 'A voice from the past', text: 'My childhood friend ' + E.fullName(f) + ' found me online and wants to catch up.', choices: [
      { label: 'Meet for coffee', run: function () { f.role = 'friend'; f.rel = U.rand(60, 85); S().people.push(f); E.stat('happy', 8); return good('We talked for hours like no time had passed.'); } },
      { label: 'Just send a nice reply', run: function () { E.stat('happy', 2); return 'We traded a few messages.'; } },
      { label: 'Ignore it', run: function () { return 'Some things are better left in the past.'; } }
    ] };
  } });
  def('tech_help', { min: 70, max: 110, w: 4, cond: function () { return E.people(['grandchild', 'child']).some(function (p) { return p.age >= 10; }); }, build: function () {
    var k = U.pick(E.people(['grandchild', 'child']).filter(function (p) { return p.age >= 10; }));
    return { icon: '📱', title: 'New phone', text: 'My new smartphone is baffling me. ' + k.first + ' offers to help.', choices: [
      { label: 'Let them teach me', run: function () { E.rel(k, 8); E.stat('smarts', 2); if (!S().social.platform && U.chance(0.4)) { S().social.platform = true; S().followers = U.rand(5, 50); return good(k.first + ' even set me up on social media! 📱'); } return 'I can finally video call!'; } },
      { label: 'Throw it out the window', run: function () { E.stat('happy', 3); return 'Back to my trusty landline.'; } }
    ] };
  } });
  def('will_dispute', { min: 65, max: 110, w: 4, cond: function () { return E.people('child').filter(function (c) { return c.age >= 18; }).length >= 2 && S().money > E.$(50000); }, build: function () {
    var kids = E.people('child').filter(function (c) { return c.age >= 18; });
    return { icon: '📜', title: 'Family feud', text: kids[0].first + ' and ' + kids[1].first + ' are arguing about who gets what when I\'m gone.', choices: [
      { label: 'Split everything equally', run: function () { S().will = null; kids.forEach(function (k) { E.rel(k, 3); }); return 'I told them my estate will be split equally.'; } },
      { label: 'Name ' + kids[0].first + ' my main heir', run: function () { S().will = kids[0].id; E.rel(kids[0], 10); E.rel(kids[1], -15); return kids[0].first + ' is my main heir now. ' + kids[1].first + ' is fuming.'; } },
      { label: 'Threaten to leave it all to my cat', run: function () { kids.forEach(function (k) { E.rel(k, -3); }); E.stat('happy', 5); return 'That shut them up. 😼'; } }
    ] };
  } });

  // ---------- rolling ----------
  function eligible(def) {
    var s = S(), a = me().age;
    if (def.scripted) return false;
    // Each era only gets its own events (js/ancient.js, js/medieval.js); modern lives get the rest.
    if ((def.ancient || null) !== ((E.ancient && E.ancient()) || null)) return false;
    // Some things never happen to an emperor or a king (tax collectors, recruiters, matchmakers).
    if (def.notRuler && TL.ancient && TL.ancient.on() && (TL.ancient.st().rule || (TL.dynasty && TL.dynasty.royal()))) return false; // nor for the ruler's heir
    if (def.min != null && a < def.min) return false;
    if (def.max != null && a > def.max) return false;
    if (def.once && s.flags['ev_' + def.id]) return false;
    if (s.prison && def.id.indexOf('prison') < 0 && def.id !== 'snitch') return false;
    if (def.cond && !def.cond()) return false;
    return true;
  }
  // Variety: an event can't come back within 5 years of its last showing,
  // and each repeat makes it less likely (seen = {id: [lastAge, times]}).
  var COOLDOWN = 5;
  function roll() {
    var s = S(), age = me().age, seen = s.evSeen || (s.evSeen = {});
    var pool = Object.keys(defs).map(function (k) { return defs[k]; }).filter(eligible)
      .filter(function (d) { var h = seen[d.id]; return !h || age - h[0] >= COOLDOWN || age < h[0]; })
      .map(function (d) { var h = seen[d.id]; return { d: d, w: d.w / (1 + (h ? h[1] : 0) * 0.6) }; });
    var n = U.weighted([{ w: 25, n: 0 }, { w: 50, n: 1 }, { w: 25, n: 2 }]).n;
    if (age < 2) n = Math.min(n, 1);
    for (var i = 0; i < n && pool.length; i++) {
      var pick = U.weighted(pool), d = pick.d;
      pool = pool.filter(function (x) { return x !== pick; });
      s.pending.push({ id: d.id, data: {} });
      seen[d.id] = [age, ((seen[d.id] || [0, 0])[1]) + 1];
      if (d.once) s.flags['ev_' + d.id] = true;
    }
  }
  // The event shown to the player is remembered so that resolving a choice
  // uses exactly the same options (some events roll random offers in build).
  var shown = { p: null, ev: null };
  function build(p) {
    var d = defs[p.id];
    if (!d) return null;
    if (shown.p === p && shown.ev) return shown.ev;
    if (p.data && p.data.pid && !E.person(p.data.pid)) return null;
    // Circumstances may have changed since the event was queued (fired, jailed, sold the house...).
    if (d.cond && !d.cond()) return null;
    var ev = d.build(p.data || {});
    shown = { p: p, ev: ev };
    return ev;
  }
  // Resolve the pending event at the front of the queue with choice index i.
  function resolve(i) {
    var s = S(), p = s.pending.shift();
    if (!p) return null;
    var ev = build(p);
    if (!ev) return null;
    shown = { p: null, ev: null };
    if (!ev.choices[i]) return null;
    var res = ev.choices[i].run(p.data || {});
    if (res == null) return null;
    if (typeof res === 'string') res = { text: res, cls: '' };
    E.log(res.text, res.cls);
    return res;
  }

  return { defs: defs, roll: roll, build: build, resolve: resolve };
})();
