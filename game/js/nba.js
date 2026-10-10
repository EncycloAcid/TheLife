/* TheLife — real pro basketball history for js/hoops.js: every NBA and WNBA
 * franchise under the name it had in a given season, real champions and
 * MVPs, real star players with the teams they played for, and a league of
 * made-up stars for seasons that haven't happened yet. Years are the year a
 * season ends (the 2015-16 NBA season is 2016; WNBA seasons are calendar
 * years). */
TL.nba = (function () {
  var U = TL.util;
  function S() { return TL.S; }
  var BIG = 9999;

  // franchise id -> [[name, first season, last season], ...]
  var NBA = {
    atl: [['Tri-Cities Blackhawks', 1950, 1951], ['Milwaukee Hawks', 1952, 1955], ['St. Louis Hawks', 1956, 1968], ['Atlanta Hawks', 1969, BIG]],
    bos: [['Boston Celtics', 1947, BIG]],
    bkn: [['New York Nets', 1977, 1977], ['New Jersey Nets', 1978, 2012], ['Brooklyn Nets', 2013, BIG]],
    cha: [['Charlotte Hornets', 1989, 2002], ['Charlotte Bobcats', 2005, 2014], ['Charlotte Hornets', 2015, BIG]],
    chi: [['Chicago Bulls', 1967, BIG]],
    cle: [['Cleveland Cavaliers', 1971, BIG]],
    dal: [['Dallas Mavericks', 1981, BIG]],
    den: [['Denver Nuggets', 1977, BIG]],
    det: [['Fort Wayne Pistons', 1949, 1957], ['Detroit Pistons', 1958, BIG]],
    gsw: [['Philadelphia Warriors', 1947, 1962], ['San Francisco Warriors', 1963, 1971], ['Golden State Warriors', 1972, BIG]],
    hou: [['San Diego Rockets', 1968, 1971], ['Houston Rockets', 1972, BIG]],
    ind: [['Indiana Pacers', 1977, BIG]],
    lac: [['Buffalo Braves', 1971, 1978], ['San Diego Clippers', 1979, 1984], ['LA Clippers', 1985, BIG]],
    lal: [['Minneapolis Lakers', 1949, 1960], ['Los Angeles Lakers', 1961, BIG]],
    mem: [['Vancouver Grizzlies', 1996, 2001], ['Memphis Grizzlies', 2002, BIG]],
    mia: [['Miami Heat', 1989, BIG]],
    mil: [['Milwaukee Bucks', 1969, BIG]],
    min: [['Minnesota Timberwolves', 1990, BIG]],
    nop: [['New Orleans Hornets', 2003, 2013], ['New Orleans Pelicans', 2014, BIG]],
    nyk: [['New York Knicks', 1947, BIG]],
    okc: [['Seattle SuperSonics', 1968, 2008], ['Oklahoma City Thunder', 2009, BIG]],
    orl: [['Orlando Magic', 1990, BIG]],
    phi: [['Syracuse Nationals', 1950, 1963], ['Philadelphia 76ers', 1964, BIG]],
    phx: [['Phoenix Suns', 1969, BIG]],
    por: [['Portland Trail Blazers', 1971, BIG]],
    sac: [['Rochester Royals', 1949, 1957], ['Cincinnati Royals', 1958, 1972], ['Kansas City Kings', 1973, 1985], ['Sacramento Kings', 1986, BIG]],
    sas: [['San Antonio Spurs', 1977, BIG]],
    tor: [['Toronto Raptors', 1996, BIG]],
    uta: [['New Orleans Jazz', 1975, 1979], ['Utah Jazz', 1980, BIG]],
    was: [['Chicago Packers', 1962, 1962], ['Chicago Zephyrs', 1963, 1963], ['Baltimore Bullets', 1964, 1973], ['Capital Bullets', 1974, 1974], ['Washington Bullets', 1975, 1997], ['Washington Wizards', 1998, BIG]]
  };
  var WNBA = {
    atl: [['Atlanta Dream', 2008, BIG]], chi: [['Chicago Sky', 2006, BIG]], con: [['Orlando Miracle', 1999, 2002], ['Connecticut Sun', 2003, BIG]],
    dal: [['Detroit Shock', 1998, 2009], ['Tulsa Shock', 2010, 2015], ['Dallas Wings', 2016, BIG]], gsv: [['Golden State Valkyries', 2025, BIG]],
    ind: [['Indiana Fever', 2000, BIG]], lva: [['Utah Starzz', 1997, 2002], ['San Antonio Silver Stars', 2003, 2017], ['Las Vegas Aces', 2018, BIG]],
    las: [['Los Angeles Sparks', 1997, BIG]], min: [['Minnesota Lynx', 1999, BIG]], nyl: [['New York Liberty', 1997, BIG]], phx: [['Phoenix Mercury', 1997, BIG]],
    sea: [['Seattle Storm', 2000, BIG]], was: [['Washington Mystics', 1998, BIG]], hou: [['Houston Comets', 1997, 2008]], sac: [['Sacramento Monarchs', 1997, 2009]],
    cha: [['Charlotte Sting', 1997, 2006]], cle: [['Cleveland Rockers', 1997, 2003]], mia: [['Miami Sol', 2000, 2002]], por: [['Portland Fire', 2000, 2002], ['Portland Fire', 2026, BIG]],
    tor: [['Toronto Tempo', 2026, BIG]]
  };
  function nameIn(fr, y) { for (var i = 0; i < fr.length; i++) if (y >= fr[i][1] && y <= fr[i][2]) return fr[i][0]; return null; }
  function table(g) { return g === 'F' ? WNBA : NBA; }
  // The league's teams in a season (empty if the league didn't exist yet).
  function teams(g, y) {
    var t = table(g), out = [];
    var yy = g === 'F' ? y : Math.max(y, 1950);
    if (lg(g, y)) return TL.league.teamNames(g); // the simulated league (js/league.js)
    Object.keys(t).forEach(function (id) { var n = nameIn(t[id], yy); if (n && out.indexOf(n) < 0) out.push(n); });
    return out;
  }
  function exists(g, y) { return g === 'F' ? y >= 1997 : true; }
  // The franchise id behind a team name (any era).
  function fid(g, name) { var t = table(g), hit = null; Object.keys(t).forEach(function (id) { if (t[id].some(function (r) { return r[0] === name; })) hit = id; }); return hit; }
  function current(g, name, y) { if (lg(g, y)) return name; var id = fid(g, name); return id ? nameIn(table(g)[id], y) || name : name; }
  // The minor league's name by era.
  function minors(y) { return y < 2002 ? 'CBA' : y < 2006 ? 'NBDL' : y < 2018 ? 'D-League' : 'G League'; }

  // ---------------------------------------------------------- real results
  var CHAMPS = { 1947: 'gsw', 1949: 'lal', 1950: 'lal', 1951: 'sac', 1952: 'lal', 1953: 'lal', 1954: 'lal', 1955: 'phi', 1956: 'gsw', 1957: 'bos', 1958: 'atl', 1959: 'bos', 1960: 'bos', 1961: 'bos', 1962: 'bos', 1963: 'bos', 1964: 'bos', 1965: 'bos', 1966: 'bos', 1967: 'phi', 1968: 'bos', 1969: 'bos', 1970: 'nyk', 1971: 'mil', 1972: 'lal', 1973: 'nyk', 1974: 'bos', 1975: 'gsw', 1976: 'bos', 1977: 'por', 1978: 'was', 1979: 'okc', 1980: 'lal', 1981: 'bos', 1982: 'lal', 1983: 'phi', 1984: 'bos', 1985: 'lal', 1986: 'bos', 1987: 'lal', 1988: 'lal', 1989: 'det', 1990: 'det', 1991: 'chi', 1992: 'chi', 1993: 'chi', 1994: 'hou', 1995: 'hou', 1996: 'chi', 1997: 'chi', 1998: 'chi', 1999: 'sas', 2000: 'lal', 2001: 'lal', 2002: 'lal', 2003: 'sas', 2004: 'det', 2005: 'sas', 2006: 'mia', 2007: 'sas', 2008: 'bos', 2009: 'lal', 2010: 'lal', 2011: 'dal', 2012: 'mia', 2013: 'mia', 2014: 'sas', 2015: 'gsw', 2016: 'cle', 2017: 'gsw', 2018: 'gsw', 2019: 'tor', 2020: 'lal', 2021: 'mil', 2022: 'gsw', 2023: 'den', 2024: 'bos', 2025: 'okc' };
  var WCHAMPS = { 1997: 'hou', 1998: 'hou', 1999: 'hou', 2000: 'hou', 2001: 'las', 2002: 'las', 2003: 'dal', 2004: 'sea', 2005: 'sac', 2006: 'dal', 2007: 'phx', 2008: 'dal', 2009: 'phx', 2010: 'sea', 2011: 'min', 2012: 'ind', 2013: 'min', 2014: 'phx', 2015: 'min', 2016: 'las', 2017: 'min', 2018: 'sea', 2019: 'was', 2020: 'sea', 2021: 'chi', 2022: 'lva', 2023: 'lva', 2024: 'nyl', 2025: 'lva' };
  var MVPS = { 1956: 'Bob Pettit', 1957: 'Bob Cousy', 1958: 'Bill Russell', 1959: 'Bob Pettit', 1960: 'Wilt Chamberlain', 1961: 'Bill Russell', 1962: 'Bill Russell', 1963: 'Bill Russell', 1964: 'Oscar Robertson', 1965: 'Bill Russell', 1966: 'Wilt Chamberlain', 1967: 'Wilt Chamberlain', 1968: 'Wilt Chamberlain', 1969: 'Wes Unseld', 1970: 'Willis Reed', 1971: 'Kareem Abdul-Jabbar', 1972: 'Kareem Abdul-Jabbar', 1973: 'Dave Cowens', 1974: 'Kareem Abdul-Jabbar', 1975: 'Bob McAdoo', 1976: 'Kareem Abdul-Jabbar', 1977: 'Kareem Abdul-Jabbar', 1978: 'Bill Walton', 1979: 'Moses Malone', 1980: 'Kareem Abdul-Jabbar', 1981: 'Julius Erving', 1982: 'Moses Malone', 1983: 'Moses Malone', 1984: 'Larry Bird', 1985: 'Larry Bird', 1986: 'Larry Bird', 1987: 'Magic Johnson', 1988: 'Michael Jordan', 1989: 'Magic Johnson', 1990: 'Magic Johnson', 1991: 'Michael Jordan', 1992: 'Michael Jordan', 1993: 'Charles Barkley', 1994: 'Hakeem Olajuwon', 1995: 'David Robinson', 1996: 'Michael Jordan', 1997: 'Karl Malone', 1998: 'Michael Jordan', 1999: 'Karl Malone', 2000: 'Shaquille O\'Neal', 2001: 'Allen Iverson', 2002: 'Tim Duncan', 2003: 'Tim Duncan', 2004: 'Kevin Garnett', 2005: 'Steve Nash', 2006: 'Steve Nash', 2007: 'Dirk Nowitzki', 2008: 'Kobe Bryant', 2009: 'LeBron James', 2010: 'LeBron James', 2011: 'Derrick Rose', 2012: 'LeBron James', 2013: 'LeBron James', 2014: 'Kevin Durant', 2015: 'Stephen Curry', 2016: 'Stephen Curry', 2017: 'Russell Westbrook', 2018: 'James Harden', 2019: 'Giannis Antetokounmpo', 2020: 'Giannis Antetokounmpo', 2021: 'Nikola Jokić', 2022: 'Nikola Jokić', 2023: 'Joel Embiid', 2024: 'Nikola Jokić', 2025: 'Shai Gilgeous-Alexander' };
  var WMVPS = { 1997: 'Cynthia Cooper', 1998: 'Cynthia Cooper', 1999: 'Yolanda Griffith', 2000: 'Sheryl Swoopes', 2001: 'Lisa Leslie', 2002: 'Sheryl Swoopes', 2003: 'Lauren Jackson', 2004: 'Lisa Leslie', 2005: 'Sheryl Swoopes', 2006: 'Lisa Leslie', 2007: 'Lauren Jackson', 2008: 'Candace Parker', 2009: 'Diana Taurasi', 2010: 'Lauren Jackson', 2011: 'Tamika Catchings', 2012: 'Candace Parker', 2013: 'Maya Moore', 2014: 'Maya Moore', 2015: 'Elena Delle Donne', 2016: 'Nneka Ogwumike', 2017: 'Sylvia Fowles', 2018: 'Breanna Stewart', 2019: 'Elena Delle Donne', 2020: 'A\'ja Wilson', 2021: 'Jonquel Jones', 2022: 'A\'ja Wilson', 2023: 'Breanna Stewart', 2024: 'A\'ja Wilson', 2025: 'A\'ja Wilson' };

  // ---------------------------------------------------------- real stars
  // [name, [franchise, first season, last season], ...]
  var STARS = [
    ['George Mikan', ['lal', 1949, 1956]], ['Bob Cousy', ['bos', 1951, 1963]], ['Bob Pettit', ['atl', 1955, 1965]], ['Bill Russell', ['bos', 1957, 1969]],
    ['Elgin Baylor', ['lal', 1959, 1972]], ['Wilt Chamberlain', ['gsw', 1960, 1965], ['phi', 1965, 1968], ['lal', 1969, 1973]], ['Jerry West', ['lal', 1961, 1974]],
    ['Oscar Robertson', ['sac', 1961, 1970], ['mil', 1971, 1974]], ['Willis Reed', ['nyk', 1965, 1974]], ['Walt Frazier', ['nyk', 1968, 1977]], ['Wes Unseld', ['was', 1969, 1981]],
    ['Kareem Abdul-Jabbar', ['mil', 1970, 1975], ['lal', 1976, 1989]], ['Dave Cowens', ['bos', 1971, 1980]], ['Rick Barry', ['gsw', 1973, 1978]], ['Bob McAdoo', ['lac', 1973, 1977]],
    ['Pete Maravich', ['atl', 1971, 1974], ['uta', 1975, 1979]], ['Bill Walton', ['por', 1975, 1979]], ['George Gervin', ['sas', 1977, 1985]], ['Julius Erving', ['phi', 1977, 1987]],
    ['Moses Malone', ['hou', 1977, 1982], ['phi', 1983, 1986], ['was', 1987, 1988], ['atl', 1989, 1991]], ['Larry Bird', ['bos', 1980, 1992]], ['Magic Johnson', ['lal', 1980, 1991], ['lal', 1996, 1996]],
    ['Kevin McHale', ['bos', 1981, 1993]], ['Isiah Thomas', ['det', 1982, 1994]], ['Dominique Wilkins', ['atl', 1983, 1994]], ['Clyde Drexler', ['por', 1984, 1995], ['hou', 1995, 1998]],
    ['Michael Jordan', ['chi', 1985, 1993], ['chi', 1995, 1998], ['was', 2002, 2003]], ['Hakeem Olajuwon', ['hou', 1985, 2001]], ['Charles Barkley', ['phi', 1985, 1992], ['phx', 1993, 1996], ['hou', 1997, 2000]],
    ['John Stockton', ['uta', 1985, 2003]], ['Patrick Ewing', ['nyk', 1986, 2000]], ['Karl Malone', ['uta', 1986, 2003], ['lal', 2004, 2004]], ['Scottie Pippen', ['chi', 1988, 1998]],
    ['Reggie Miller', ['ind', 1988, 2005]], ['David Robinson', ['sas', 1990, 2003]], ['Gary Payton', ['okc', 1991, 2003]], ['Shaquille O\'Neal', ['orl', 1993, 1996], ['lal', 1997, 2004], ['mia', 2005, 2008], ['phx', 2008, 2009], ['cle', 2010, 2010]],
    ['Jason Kidd', ['dal', 1995, 1996], ['phx', 1997, 2001], ['bkn', 2002, 2008], ['dal', 2008, 2012]], ['Grant Hill', ['det', 1995, 2000]], ['Kevin Garnett', ['min', 1996, 2007], ['bos', 2008, 2013], ['bkn', 2014, 2015]],
    ['Allen Iverson', ['phi', 1997, 2006], ['den', 2007, 2008]], ['Kobe Bryant', ['lal', 1997, 2016]], ['Ray Allen', ['mil', 1997, 2003], ['okc', 2003, 2007], ['bos', 2008, 2012], ['mia', 2013, 2014]],
    ['Tim Duncan', ['sas', 1998, 2016]], ['Steve Nash', ['dal', 1999, 2004], ['phx', 2005, 2012]], ['Dirk Nowitzki', ['dal', 1999, 2019]], ['Paul Pierce', ['bos', 1999, 2013]],
    ['Vince Carter', ['tor', 1999, 2005], ['bkn', 2005, 2009]], ['Tracy McGrady', ['orl', 2001, 2004], ['hou', 2005, 2010]], ['Pau Gasol', ['mem', 2002, 2008], ['lal', 2008, 2014]], ['Tony Parker', ['sas', 2002, 2018]],
    ['Yao Ming', ['hou', 2003, 2011]], ['LeBron James', ['cle', 2004, 2010], ['mia', 2011, 2014], ['cle', 2015, 2018], ['lal', 2019, BIG]], ['Dwyane Wade', ['mia', 2004, 2016]], ['Carmelo Anthony', ['den', 2004, 2010], ['nyk', 2011, 2017]],
    ['Dwight Howard', ['orl', 2005, 2012]], ['Chris Paul', ['nop', 2006, 2011], ['lac', 2012, 2017], ['hou', 2018, 2019], ['okc', 2020, 2020], ['phx', 2021, 2023], ['gsw', 2024, 2024], ['sas', 2025, 2025]],
    ['Kevin Durant', ['okc', 2008, 2016], ['gsw', 2017, 2019], ['bkn', 2021, 2023], ['phx', 2023, 2025], ['hou', 2026, BIG]], ['Russell Westbrook', ['okc', 2009, 2019], ['hou', 2020, 2020], ['was', 2021, 2021], ['lal', 2022, 2023], ['lac', 2023, 2024], ['den', 2025, 2025]],
    ['Derrick Rose', ['chi', 2009, 2016]], ['Stephen Curry', ['gsw', 2010, BIG]], ['James Harden', ['okc', 2010, 2012], ['hou', 2013, 2021], ['bkn', 2021, 2022], ['phi', 2022, 2023], ['lac', 2024, BIG]],
    ['Paul George', ['ind', 2011, 2017], ['okc', 2018, 2019], ['lac', 2020, 2024], ['phi', 2025, BIG]], ['Kyrie Irving', ['cle', 2012, 2017], ['bos', 2018, 2019], ['bkn', 2020, 2023], ['dal', 2023, BIG]],
    ['Kawhi Leonard', ['sas', 2012, 2018], ['tor', 2019, 2019], ['lac', 2020, BIG]], ['Jimmy Butler', ['chi', 2012, 2017], ['min', 2018, 2018], ['phi', 2019, 2019], ['mia', 2020, 2024], ['gsw', 2025, BIG]],
    ['Klay Thompson', ['gsw', 2012, 2024], ['dal', 2025, BIG]], ['Damian Lillard', ['por', 2013, 2023], ['mil', 2024, 2025], ['por', 2026, BIG]], ['Anthony Davis', ['nop', 2013, 2019], ['lal', 2020, 2024], ['dal', 2025, BIG]],
    ['Draymond Green', ['gsw', 2013, BIG]], ['Giannis Antetokounmpo', ['mil', 2014, BIG]], ['Karl-Anthony Towns', ['min', 2016, 2024], ['nyk', 2025, BIG]], ['Devin Booker', ['phx', 2016, BIG]], ['Nikola Jokić', ['den', 2016, BIG]],
    ['Joel Embiid', ['phi', 2017, BIG]], ['Jayson Tatum', ['bos', 2018, BIG]], ['Donovan Mitchell', ['uta', 2018, 2022], ['cle', 2023, BIG]], ['Luka Dončić', ['dal', 2019, 2024], ['lal', 2025, BIG]],
    ['Trae Young', ['atl', 2019, BIG]], ['Shai Gilgeous-Alexander', ['lac', 2019, 2019], ['okc', 2020, BIG]], ['Ja Morant', ['mem', 2020, BIG]], ['Zion Williamson', ['nop', 2020, BIG]],
    ['Tyrese Haliburton', ['sac', 2021, 2022], ['ind', 2022, BIG]], ['Anthony Edwards', ['min', 2021, BIG]], ['Paolo Banchero', ['orl', 2023, BIG]], ['Victor Wembanyama', ['sas', 2024, BIG]], ['Cooper Flagg', ['dal', 2026, BIG]]
  ];
  var WSTARS = [
    ['Cynthia Cooper', ['hou', 1997, 2000]], ['Sheryl Swoopes', ['hou', 1997, 2007]], ['Tina Thompson', ['hou', 1997, 2008], ['las', 2009, 2011]], ['Lisa Leslie', ['las', 1997, 2009]],
    ['Yolanda Griffith', ['sac', 1999, 2007]], ['Becky Hammon', ['nyl', 1999, 2006], ['lva', 2007, 2014]], ['Lauren Jackson', ['sea', 2001, 2012]], ['Sue Bird', ['sea', 2002, 2022]],
    ['Tamika Catchings', ['ind', 2002, 2016]], ['Diana Taurasi', ['phx', 2004, 2024]], ['Cappie Pondexter', ['phx', 2006, 2009], ['nyl', 2010, 2014]], ['Candace Parker', ['las', 2008, 2020], ['chi', 2021, 2022], ['lva', 2023, 2023]],
    ['Sylvia Fowles', ['chi', 2008, 2014], ['min', 2015, 2022]], ['Maya Moore', ['min', 2011, 2018]], ['Nneka Ogwumike', ['las', 2012, 2023], ['sea', 2024, BIG]], ['Elena Delle Donne', ['chi', 2013, 2016], ['was', 2017, 2023]],
    ['Jewell Loyd', ['sea', 2015, 2024], ['lva', 2025, BIG]], ['Breanna Stewart', ['sea', 2016, 2022], ['nyl', 2023, BIG]], ['Kelsey Plum', ['lva', 2017, 2024], ['las', 2025, BIG]], ['A\'ja Wilson', ['lva', 2018, BIG]],
    ['Napheesa Collier', ['min', 2019, BIG]], ['Sabrina Ionescu', ['nyl', 2020, BIG]], ['Caitlin Clark', ['ind', 2024, BIG]], ['Angel Reese', ['chi', 2024, BIG]], ['Paige Bueckers', ['dal', 2025, BIG]]
  ];
  function stars(g) { return g === 'F' ? WSTARS : STARS; }
  // Real stars on a team in a season.
  function onTeam(g, team, y) {
    var id = fid(g, team); if (!id) return [];
    return stars(g).filter(function (p) { return p.slice(1).some(function (st) { return st[0] === id && y >= st[1] && y <= st[2]; }); }).map(function (p) { return p[0]; });
  }
  function active(g, y) { return stars(g).filter(function (p) { return p.slice(1).some(function (st) { return y >= st[1] && y <= st[2]; }); }).map(function (p) { return p[0]; }); }
  function champion(g, y) { var id = (g === 'F' ? WCHAMPS : CHAMPS)[y]; return id ? nameIn(table(g)[id], y) : null; }
  function mvp(g, y) { return (g === 'F' ? WMVPS : MVPS)[y] || null; }
  // Results are real through 2025; rosters through the 2025-26 season.
  var LAST_REAL = 2025, LAST_ROSTER = 2026;

  // ---------------------------------------------------------- made-up stars
  // Seasons past our data get a league of invented stars who age and retire.
  var ORIGINS = ['United States', 'United States', 'United States', 'Canada', 'France', 'Spain', 'Nigeria', 'Serbia', 'Australia', 'Germany', 'Greece', 'Slovenia'];
  function fake(g) {
    var x = S().hoops || (S().league = S().league || {}), y = S().year, key = g === 'F' ? 'wfake' : 'fake';
    var L = x[key] = x[key] || [];
    // Age the league one season at a time.
    if (x[key + 'Y'] !== y) {
      x[key + 'Y'] = y;
      L.forEach(function (p) { p.age++; p.ovr = U.clamp(p.ovr + (p.age < 26 ? U.rand(0, 3) : p.age < 30 ? U.rand(-1, 1) : U.rand(-4, 0)), 60, 98); });
      for (var i = L.length - 1; i >= 0; i--) if (L[i].age > 36 || L[i].ovr < 78) L.splice(i, 1);
      var tm = teams(g, y);
      while (L.length < 12) {
        var c = U.pick(ORIGINS), nm = TL.engine.randomName(g, null, c);
        L.push({ name: nm.first + ' ' + nm.last, team: U.pick(tm), age: U.rand(20, 31), ovr: U.rand(84, 95), from: c });
      }
    }
    return L;
  }
  // Is the simulated league running this season? Past our real data it
  // starts on its own (only seasons already played are simulated here).
  function lg(g, y) { if (!TL.league || !TL.S) return false; if (TL.league.active(g, y)) return true; if (y > LAST_REAL) { TL.league.ensure(g, y - 1); return TL.league.active(g, y); } return false; }
  function sim(g, y) { return TL.league && (TL.league.active(g, y) || y > LAST_REAL); }
  function starsOn(g, team, y) {
    if (lg(g, y)) return TL.league.starsOn(g, team);
    if (y <= LAST_ROSTER) return onTeam(g, team, y);
    return fake(g).filter(function (p) { return p.team === team; }).map(function (p) { return p.name; });
  }
  function anyStar(g, y, not) {
    if (lg(g, y)) return TL.league.anyStar(g, not);
    var list = y <= LAST_ROSTER ? active(g, y) : fake(g).map(function (p) { return p.name; });
    list = list.filter(function (n) { return (not || []).indexOf(n) < 0; });
    return list.length ? U.pick(list) : null;
  }
  // The season's real (or invented) MVP and champion.
  function mvpOf(g, y) { if (sim(g, y)) { var h = TL.league.hist(g, y); return h ? h.mvp : null; } if (y <= LAST_REAL) return mvp(g, y); var L = fake(g).slice().sort(function (a, b) { return b.ovr - a.ovr; }); return L.length ? L[0].name : null; }
  function champOf(g, y) { if (sim(g, y)) { var h = TL.league.hist(g, y); return h ? h.ch : null; } if (y <= LAST_REAL) return champion(g, y); var L = fake(g).slice().sort(function (a, b) { return b.ovr - a.ovr; }); return L.length && U.chance(0.5) ? L[0].team : U.pick(teams(g, y)); }

  // The raw real data, for seeding the simulated league.
  var _raw = { table: table, nameIn: nameIn, stars: stars, mvps: function (g) { return g === 'F' ? WMVPS : MVPS; }, LAST_REAL: LAST_REAL, LAST_ROSTER: LAST_ROSTER };
  return { _raw: _raw, teams: teams, exists: exists, current: current, minors: minors, starsOn: starsOn, anyStar: anyStar, mvpOf: mvpOf, champOf: champOf, LAST_REAL: LAST_REAL };
})();
