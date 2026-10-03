/* TheLife — phone.js
 * The phone button in the header opens my phone (a computer before 2007).
 * Its main app is Buzzline, a social site where people post reviews and hot
 * takes: movies, sports, music, TV and whatever they're saying about me.
 * Real box-office hits, Best Picture winners and NBA/WNBA results show up
 * for their years; everything I do (films, seasons, albums, shows) gets
 * reviewed too. A page is generated once a year and cached in S().phone.
 */
TL.phone = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function count(key) { var y = S().yearActs || (S().yearActs = {}); return y[key] || 0; }
  function bump(key) { var y = S().yearActs || (S().yearActs = {}); y[key] = (y[key] || 0) + 1; }
  function big(n) { return n >= 1e9 ? (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(Math.round(n)); }
  function money(m) { return m >= 1000 ? '$' + (m / 1000).toFixed(2).replace(/0$/, '') + 'B' : '$' + Math.round(m) + 'M'; }

  // ------------------------------------------------------------ real movies
  // The movie everyone was talking about each year.
  var HITS = { 1975: 'Jaws', 1976: 'Rocky', 1977: 'Star Wars', 1978: 'Grease', 1979: 'Alien', 1980: 'The Empire Strikes Back', 1981: 'Raiders of the Lost Ark', 1982: 'E.T. the Extra-Terrestrial', 1983: 'Return of the Jedi', 1984: 'Ghostbusters', 1985: 'Back to the Future', 1986: 'Top Gun', 1987: 'Fatal Attraction', 1988: 'Who Framed Roger Rabbit', 1989: 'Batman', 1990: 'Home Alone', 1991: 'Terminator 2: Judgment Day', 1992: 'Aladdin', 1993: 'Jurassic Park', 1994: 'The Lion King', 1995: 'Toy Story', 1996: 'Independence Day', 1997: 'Titanic', 1998: 'Armageddon', 1999: 'The Matrix', 2000: 'Gladiator', 2001: 'Harry Potter and the Sorcerer\'s Stone', 2002: 'Spider-Man', 2003: 'Finding Nemo', 2004: 'Shrek 2', 2005: 'Star Wars: Revenge of the Sith', 2006: 'Pirates of the Caribbean: Dead Man\'s Chest', 2007: 'Transformers', 2008: 'The Dark Knight', 2009: 'Avatar', 2010: 'Inception', 2011: 'Harry Potter and the Deathly Hallows – Part 2', 2012: 'The Avengers', 2013: 'Frozen', 2014: 'Guardians of the Galaxy', 2015: 'Star Wars: The Force Awakens', 2016: 'Captain America: Civil War', 2017: 'Wonder Woman', 2018: 'Black Panther', 2019: 'Avengers: Endgame', 2020: 'Tenet', 2021: 'Spider-Man: No Way Home', 2022: 'Top Gun: Maverick', 2023: 'Barbie', 2024: 'Inside Out 2' };
  // Best Picture, by the year the film came out.
  var OSCARS = { 1975: 'One Flew Over the Cuckoo\'s Nest', 1976: 'Rocky', 1977: 'Annie Hall', 1978: 'The Deer Hunter', 1979: 'Kramer vs. Kramer', 1980: 'Ordinary People', 1981: 'Chariots of Fire', 1982: 'Gandhi', 1983: 'Terms of Endearment', 1984: 'Amadeus', 1985: 'Out of Africa', 1986: 'Platoon', 1987: 'The Last Emperor', 1988: 'Rain Man', 1989: 'Driving Miss Daisy', 1990: 'Dances with Wolves', 1991: 'The Silence of the Lambs', 1992: 'Unforgiven', 1993: 'Schindler\'s List', 1994: 'Forrest Gump', 1995: 'Braveheart', 1996: 'The English Patient', 1997: 'Titanic', 1998: 'Shakespeare in Love', 1999: 'American Beauty', 2000: 'Gladiator', 2001: 'A Beautiful Mind', 2002: 'Chicago', 2003: 'The Lord of the Rings: The Return of the King', 2004: 'Million Dollar Baby', 2005: 'Crash', 2006: 'The Departed', 2007: 'No Country for Old Men', 2008: 'Slumdog Millionaire', 2009: 'The Hurt Locker', 2010: 'The King\'s Speech', 2011: 'The Artist', 2012: 'Argo', 2013: '12 Years a Slave', 2014: 'Birdman', 2015: 'Spotlight', 2016: 'Moonlight', 2017: 'The Shape of Water', 2018: 'Green Book', 2019: 'Parasite', 2020: 'Nomadland', 2021: 'CODA', 2022: 'Everything Everywhere All at Once', 2023: 'Oppenheimer', 2024: 'Anora' };

  // ------------------------------------------------------------ the site
  // Online message boards from the mid-90s; smartphones from 2007.
  function available() { var s = S(); return !!(s && !s.dead && s.me.age >= 10 && s.year >= 1996 && !s.prison && (!TL.ancient || !TL.ancient.on())); }
  function device() { return S().year >= 2007 ? 'Phone' : 'Computer'; }
  function icon() { return S().year >= 2007 ? '📱' : '💻'; }
  function handle() { var m = me(); return '@' + (m.first + m.last).toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function stars(v) { var n = U.clamp(Math.round(v / 20), 1, 5); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }
  var USERS = ['filmbro_88', 'popcorn_queen', 'couchcritic', 'reel_talk', 'hoopsjunkie', 'statsguy', 'nosebleed_seats', 'vinylheart', 'bingewatcher', 'hottakehank', 'midnight_viewer', 'courtside_kay', 'the_real_dev', 'lurker_420', 'sofa_scout', 'cinephile_jo'];
  function user() { return '@' + U.pick(USERS); }
  function likes(f) { return Math.round(U.rand(3, 400) * (1 + (f || 0))); }
  function post(icon, text, who, l) { return { icon: icon, text: text, who: who || user(), likes: l != null ? l : likes(0) }; }
  function takeOn(score, subject, good, mid, bad) { return score >= 75 ? U.pick(good).replace('$', subject) : score >= 50 ? U.pick(mid).replace('$', subject) : U.pick(bad).replace('$', subject); }
  var FILM_GOOD = ['$ is a masterpiece. I cried twice.', 'Saw $ three times already. Go see it.', '$ deserves every award.', 'Nobody is talking enough about how good $ is.'];
  var FILM_MID = ['$ was fine? The trailer was better.', '$ had its moments. Popcorn movie.', 'Halfway through $ I checked my phone. Not bad, not great.'];
  var FILM_BAD = ['$ is two hours I\'ll never get back.', 'Who greenlit $?', 'Walked out of $. Sorry.', '$ is so bad it\'s almost good. Almost.'];
  var FAKE_W1 = ['Shadow', 'Crimson', 'Last', 'Silver', 'Northern', 'Burning', 'Quiet', 'Iron', 'Hollow', 'Neon'], FAKE_W2 = ['Run', 'Tide', 'Kingdom', 'Protocol', 'Summer', 'Line', 'Hour', 'Harbor', 'Signal', 'Heart'];
  function fakeTitle() { return 'The ' + U.pick(FAKE_W1) + ' ' + U.pick(FAKE_W2); }
  function reviewWord(y) { return y >= 1999 ? 'on Rotten Tomatoes' : 'with critics'; }

  // Movies: real hits and Best Picture winners, what I starred in, and a few other releases.
  function movies(y) {
    var out = [], ac = S().acting;
    // Past the real data, the movie world carries on with invented films.
    var hit = HITS[y] || (y > 2024 ? fakeTitle() : null), best = OSCARS[y - 1] || (y - 1 > 2024 ? fakeTitle() : null);
    if (hit) out.push(post('🔥', '"' + hit + '" is everywhere this year. ' + U.pick(['Lines around the block.', 'Everyone I know has seen it twice.', 'Spoilers everywhere, be careful online.', 'Box office records are falling.']), U.pick(['@boxofficewatch', '@moviebuzz', '@trending']), likes(30)));
    if (best) out.push(post('🏆', '"' + best + '" won Best Picture at this year\'s Oscars. ' + U.pick(['Well deserved.', 'Robbed! My pick was better.', 'Called it months ago.', 'The speech made me cry.']), U.pick(['@awardswatch', '@oscarpool', user()]), likes(20)));
    if (ac) ac.credits.filter(function (c) { return c.year >= y - 1 && c.review != null && c.kind !== 'commercial' && c.kind !== 'series'; }).slice(-3).forEach(function (c) {
      var usr = U.clamp(Math.round(c.review + U.rand(-15, 15)), 5, 99);
      out.push(post('🎬', '"' + c.title + '" ' + c.review + '% ' + reviewWord(c.year) + ' · users ' + stars(usr) + (c.gross ? ' · ' + money(c.gross) + ' worldwide' : '') + '. ' + takeOn(usr, me().first + ' ' + me().last, ['$ was incredible in it.', 'Give $ the Oscar already.', '$ carried the whole movie.'], ['$ was solid, the script wasn\'t.', 'Decent. $ tried their best.'], ['$ phoned this one in.', 'Even $ couldn\'t save it.']), user(), likes(S().fame / 3)));
    });
    for (var i = 0; i < 3; i++) {
      var t = fakeTitle(), sc = U.rand(12, 98);
      out.push(post('🎞️', '"' + t + '" ' + sc + '% ' + reviewWord(y) + ' · users ' + stars(U.clamp(sc + U.rand(-20, 20), 5, 99)) + '. ' + takeOn(sc, t, FILM_GOOD, FILM_MID, FILM_BAD)));
    }
    return out;
  }

  // Sports: last season around the league, my own seasons, and hot takes.
  function sports(y) {
    var out = [], nba = TL.nba, h = S().hoops, pro = S().pro, ly = y - 1;
    if (nba && nba.exists('M', ly)) {
      var ch = nba.champOf('M', ly), mvp = nba.mvpOf('M', ly);
      if (ch) out.push(post('🏆', 'The ' + ch + ' won the ' + ly + ' NBA title. ' + U.pick(['Dynasty talk starts now.', 'Parade was insane.', 'Never doubted them. (I doubted them.)', 'Best Finals in years.']), '@hoopscentral', likes(40)));
      if (mvp) out.push(post('⭐', mvp + ' was the ' + ly + ' NBA MVP. ' + U.pick(['Not even close.', 'Robbed someone, but okay.', 'Generational talent.', 'Voters got it right for once.']), '@hoopscentral', likes(25)));
      var star = nba.anyStar('M', y, []);
      if (star) out.push(post('🌶️', 'Hot take: ' + star + ' ' + U.pick(['is the most overrated player in the league.', 'is a top-5 player and it isn\'t close.', 'needs a new team.', 'would average 40 in the old days.']), '@hottakehank', likes(15)));
    }
    if (nba && nba.exists('F', ly)) { var wc = nba.champOf('F', ly); if (wc) out.push(post('🏆', 'The ' + wc + ' won the ' + ly + ' WNBA championship. ' + U.pick(['Unreal run.', 'Sold-out arenas all playoffs.', 'Give them the respect.']), '@wnbawire', likes(20))); }
    if (h && h.seasons && h.seasons.length) {
      var l = h.seasons[h.seasons.length - 1];
      if (l.year >= ly) {
        var r = U.clamp(Math.round(40 + (l.ppg || 0) * 2.2 + (l.result === 'Won the championship' ? 15 : 0)), 10, 99);
        out.push(post('🏀', (me().first + ' ' + me().last) + ' (' + l.team + '): ' + l.ppg + ' PPG, ' + (l.rpg || 0) + ' RPG, ' + (l.apg || 0) + ' APG. Fan rating ' + (r / 10).toFixed(1) + '/10. ' + takeOn(r, me().first, ['$ is HIM.', 'Bucket after bucket. $ is a problem.', 'Max contract, now.'], ['$ is fine. Role player energy.', '$ needs to work on that jumper.'], ['Bench $ already.', '$ is getting paid to watch.']), user(), likes(S().fame / 2)));
      }
    }
    if (pro && pro.seasons && pro.seasons.length) {
      var p = pro.seasons[pro.seasons.length - 1];
      if (p.year >= ly && p.team) out.push(post('🏟️', (me().first + ' ' + me().last) + ' had ' + (p.award ? 'a big season with the ' + p.team + ' (' + p.award + ')' : 'a ' + (p.ovr >= 80 ? 'strong' : p.ovr >= 70 ? 'solid' : 'quiet') + ' season with the ' + p.team) + '. ' + (p.injured ? 'Shame about the injury.' : U.pick(['Fans are buying the jersey.', 'Contract year coming up…', 'Trade rumors are heating up.'])), user(), likes(S().fame / 2)));
    }
    if (!out.length) out.push(post('🏟️', U.pick(['My fantasy team is a disaster this year.', 'Refs decided that game. I will not be taking questions.', 'Season tickets: worth it. My wallet disagrees.']), user()));
    return out;
  }

  // Music: what I released, plus whatever's topping the charts.
  function music(y) {
    var out = [], mu = S().music;
    if (mu) {
      (mu.albums || []).filter(function (a) { return a.year >= y - 1; }).forEach(function (a) { out.push(post('💿', '"' + a.title + '" by ' + (mu.name || me().first) + ': ' + a.review + ' Metacritic' + (a.peak ? ', #' + a.peak + ' on the Billboard 200' : '') + '. ' + takeOn(a.review, 'this album', ['$ is on repeat.', 'Album of the year. Don\'t argue.'], ['$ has three great songs and filler.', 'A grower. Give $ time.'], ['$ is a skip.', 'Who approved $?']), user(), likes(S().fame / 3))); });
      (mu.songs || []).filter(function (sg) { return sg.year >= y - 1 && sg.peak; }).slice(-2).forEach(function (sg) { out.push(post('🎵', '"' + sg.title + '" hit #' + sg.peak + ' on the Hot 100. ' + U.pick(['Can\'t get it out of my head.', 'Overplayed already.', 'Wedding DJ favorite incoming.']), user(), likes(S().fame / 3))); });
    }
    var art = E.randomName(U.pick(['M', 'F'])), nm = (art.first || art) + ' ' + (art.last || '');
    out.push(post('🎧', nm.trim() + '\'s new single is #1 this week. ' + U.pick(['A total earworm.', 'It\'s mid, sorry.', 'This is their best era.', 'The music video is wild.']), '@chartwatch', likes(10)));
    return out;
  }

  // TV: my show and the rest of what people are watching.
  function tv(y) {
    var out = [], ac = S().acting, sr = ac && ac.series;
    if (sr && sr.seasons) out.push(post('📺', '"' + sr.title + '" season ' + sr.seasons + ' on ' + sr.network + ': ' + (sr.quality || 50) + '%. ' + takeOn(sr.quality || 50, me().first + ' ' + me().last, ['$ is the best thing on TV.', 'Finale had me screaming.'], ['Solid season, slow middle.', '$ deserves better writing.'], ['This show jumped the shark.', 'Canceling my subscription over that finale.']), user(), likes(S().fame / 3)));
    out.push(post('📺', 'Is anyone else watching "' + fakeTitle() + '"? ' + U.pick(['I finished it in one weekend.', 'Episode 6 broke me.', 'Hyped up for nothing.', 'Best show of the year.']), user()));
    out.push(post('🍿', U.pick(['Reality TV is my guilty pleasure and I won\'t apologize.', 'Spoiler-free zone until Sunday please.', 'They canceled my favorite show after two seasons. Again.']), user()));
    return out;
  }

  // What people are saying about me.
  function aboutMe() {
    var s = S(), out = [], f = s.fame || 0, nm = me().first + ' ' + me().last;
    var feed = s.hoops && s.hoops.soc && s.hoops.soc.feed;
    var seen = {};
    if (feed && feed.length) feed.slice().reverse().filter(function (p) { if (seen[p.text]) return false; seen[p.text] = 1; return true; }).slice(0, 4).forEach(function (p) { out.push({ icon: p.who === 'me' ? '📱' : '💬', text: p.text, who: p.who === 'me' ? handle() : p.who, likes: p.likes }); });
    if (f < 10) { out.push(post('🔍', 'Searched "' + nm + '". ' + U.pick(['Nobody is talking about me yet.', 'Just my old school photos.', 'Three other people with my name, all more famous.']), handle(), 0)); return out; }
    var job = s.job ? s.job.title : null;
    out.push(post('💬', takeOn(Math.min(99, f + (s.karma || 50) / 3), nm, ['$ seems like a genuinely good person.', 'Met $ once. So nice.', 'Protect $ at all costs.'], ['$ is overrated, but I get it.', 'Not sure what $ is famous for, honestly.'], ['$ is the worst. Fight me.', 'Can we stop making $ famous?']), user(), likes(f)));
    if (job) out.push(post('📰', nm + ', ' + job.toLowerCase().replace(/^a-list/, 'A-list') + ', ' + U.pick(['was spotted at a coffee shop.', 'is trending again.', 'just liked a 4-year-old post. Suspicious.', 'has fans camping outside their house.']), U.pick(['@celebgossip', '@pagesix_fan', '@spotted']), likes(f)));
    if ((s.karma || 50) < 30) out.push(post('😬', 'Reminder that ' + nm + ' ' + U.pick(['never apologized.', 'has a long list of controversies.', 'is cancelled in my house.']), user(), likes(f / 2)));
    return out;
  }

  // ------------------------------------------------------------ cache
  function page() {
    var s = S(), c = s.phone;
    if (!c || c.year !== s.year) {
      var y = s.year;
      c = s.phone = { year: y, movies: movies(y), sports: sports(y), music: music(y), tv: tv(y), me: aboutMe() };
    }
    return c;
  }
  function rows(list) { return list.map(function (p) { return { icon: p.icon, label: p.text, sub: p.who + ' · ' + big(p.likes) + ' likes' }; }); }

  // Joining the conversation: one review a year.
  function writeReview() {
    if (count('ph_review')) return done(nope('I already posted a review this year. Don\'t become that person.'));
    bump('ph_review');
    var c = page(), topic = U.pick(['movie', 'game', 'album', 'show']), viral = U.chance(0.06 + (S().fame || 0) / 400);
    var text = topic === 'game' ? 'I posted a hot take about last night\'s game.' : topic === 'album' ? 'I wrote a long review of an album I love.' : topic === 'show' ? 'I posted my ranking of every episode of my favorite show.' : 'I posted a review of a movie I saw this weekend.';
    var mine = { icon: '✍️', text: text.replace(/^I posted |^I wrote /, '').replace(/^./, function (ch) { return ch.toUpperCase(); }), who: handle(), likes: viral ? U.rand(5000, 90000) : U.rand(0, 60) };
    c.me.unshift(mine);
    E.stat('happy', 2);
    if (viral) { if (S().social && S().social.platform) S().followers += U.rand(500, 5000); E.fame(1); return done({ text: text + ' It went viral! ' + big(mine.likes) + ' likes. 🚀', cls: 'good' }); }
    return done(text + ' ' + (mine.likes ? mine.likes + ' people liked it.' : 'Nobody liked it. The void stared back.'));
  }

  function open() {
    if (!available()) return done(nope(S().year < 1996 ? 'There\'s no internet to check yet.' : 'I can\'t use my ' + device().toLowerCase() + ' right now.'));
    ui().menu(icon() + ' ' + device(), function () {
      var c = page(), s = S(), items = [];
      items.push({ info: true, html: '<div class="hb-arch">🌐 Buzzline · reviews, scores and hot takes</div><p class="small muted">' + (s.year >= 2004 ? 'Everyone\'s talking. ' : 'The internet\'s busiest message boards. ') + 'Updated for ' + s.year + '.</p>' });
      items.push({ icon: '✍️', label: 'Post a review', sub: 'Movies, games, albums or shows', disabled: count('ph_review') > 0, onClick: writeReview });
      if (TL.actions.socialMenu && s.me.age >= 13 && (!TL.history || TL.history.exists('social'))) items.push({ icon: '📱', label: 'My social media', sub: s.social && s.social.platform ? big(s.followers || 0) + ' followers' : 'Create an account', onClick: TL.actions.socialMenu });
      items.push({ section: 'Movies' }); items = items.concat(rows(c.movies));
      items.push({ section: 'Sports' }); items = items.concat(rows(c.sports));
      items.push({ section: 'Music' }); items = items.concat(rows(c.music));
      items.push({ section: 'TV' }); items = items.concat(rows(c.tv));
      items.push({ section: 'About me' }); items = items.concat(rows(c.me));
      return items;
    });
  }

  return { open: open, available: available, icon: icon, device: device, HITS: HITS, OSCARS: OSCARS };
})();
