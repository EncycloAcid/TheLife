#!/usr/bin/env python3
"""Download real team and company logos into game/img/logos/ and write
game/js/logofiles.js (name key -> file). Personal-use build only.

Teams come from ESPN's public team API (96px PNGs via ESPN's image combiner);
companies from Google's favicon service. Anything missing keeps its colored
badge from js/logos.js. Re-run any time: python3 tools/fetch_logos.py
"""
import json, os, re, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'game', 'img', 'logos')
UA = {'User-Agent': 'curl/8.5.0'}
UA_SITE = {'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36'}

LEAGUES = ['football/nfl', 'basketball/nba', 'basketball/wnba', 'baseball/mlb', 'hockey/nhl', 'basketball/mens-college-basketball',
           'basketball/nba-development', 'soccer/eng.1', 'soccer/eng.2', 'soccer/esp.1', 'soccer/ita.1', 'soccer/ger.1', 'soccer/fra.1',
           'soccer/usa.1', 'soccer/usa.nwsl', 'soccer/usa.usl.1', 'soccer/mex.1', 'soccer/bra.1', 'soccer/jpn.1', 'soccer/ind.1',
           'soccer/aus.1', 'soccer/rsa.1', 'soccer/nga.1']
# Our name -> ESPN's name, where they differ.
ALIAS = {
    'inter milan': 'internazionale', 'olympique de marseille': 'marseille', 'olympique lyonnais': 'lyon', 'losc lille': 'lille',
    'chivas': 'guadalajara', 'club america': 'america', 'sao paulo fc': 'sao paulo', 'tigres uanl': 'tigres uanl', 'monterrey': 'monterrey',
    'atletico madrid': 'atletico madrid', 'bayer leverkusen': 'bayer leverkusen', 'eintracht frankfurt': 'eintracht frankfurt',
    'kashima antlers': 'kashima antlers', 'urawa red diamonds': 'urawa red diamonds', 'yokohama f. marinos': 'yokohama f. marinos',
    'mohun bagan': 'mohun bagan super giant', 'kaizer chiefs': 'kaizer chiefs', 'nj/ny gotham fc': 'gotham fc', 'la clippers': 'la clippers',
    'kansas city current': 'kansas city current', 'sydney fc': 'sydney fc', 'cf montreal': 'cf montreal', 'new york city fc': 'new york city fc',
    'rangers international': 'rangers international', 'santa cruz warriors': 'santa cruz warriors', 'gremio': 'gremio', 'uconn huskies': 'uconn huskies',
}
# Company -> website (for its favicon / app icon).
DOMAINS = {
    "McDonald's": 'mcdonalds.com', 'Burger King': 'bk.com', 'KFC': 'kfc.com', 'Subway': 'subway.com', 'Taco Bell': 'tacobell.com', "Wendy's": 'wendys.com',
    "Domino's": 'dominos.com', 'Pizza Hut': 'pizzahut.com', 'Starbucks': 'starbucks.com', 'Walmart': 'walmart.com', 'Target': 'target.com', 'Costco': 'costco.com',
    'IKEA': 'ikea.com', 'H&M': 'hm.com', 'Zara': 'zara.com', 'Best Buy': 'bestbuy.com', 'Nike': 'nike.com', 'Sephora': 'sephora.com', 'Apple': 'apple.com',
    'ABM Industries': 'abm.com', 'ISS': 'issworld.com', 'Cintas': 'cintas.com', 'Bechtel': 'bechtel.com', 'Skanska': 'skanska.com', 'Vinci': 'vinci.com',
    'Turner Construction': 'turnerconstruction.com', 'Fluor': 'fluor.com', 'Hochtief': 'hochtief.de', 'Marriott': 'marriott.com', 'Hilton': 'hilton.com', 'Hyatt': 'hyatt.com',
    'Four Seasons': 'fourseasons.com', 'The Cheesecake Factory': 'thecheesecakefactory.com', 'Olive Garden': 'olivegarden.com', 'UPS': 'ups.com', 'FedEx': 'fedex.com',
    'DHL': 'dhl.com', 'Uber': 'uber.com', 'Amazon': 'amazon.com', 'Greyhound': 'greyhound.com', 'Securitas': 'securitas.com', 'Allied Universal': 'aus.com',
    'G4S': 'g4s.com', 'Supercuts': 'supercuts.com', 'Great Clips': 'greatclips.com', 'Toni & Guy': 'toniandguy.com', 'IMG Models': 'imgmodels.com',
    'Elite Model Management': 'elitemodel.com', 'Ford Models': 'fordmodels.com', 'Wilhelmina Models': 'wilhelmina.com', 'Firestone': 'firestonecompleteautocare.com',
    'Midas': 'midas.com', 'Jiffy Lube': 'jiffylube.com', 'Pep Boys': 'pepboys.com', 'Kwik Fit': 'kwik-fit.com', 'Keller Williams': 'kw.com', 'RE/MAX': 'remax.com',
    'Coldwell Banker': 'coldwellbanker.com', "Sotheby's International Realty": 'sothebysrealty.com', 'Century 21': 'century21.com', 'Nobu': 'noburestaurants.com',
    'Gordon Ramsay Restaurants': 'gordonramsayrestaurants.com', 'The Ritz-Carlton': 'ritzcarlton.com', 'Delta Air Lines': 'delta.com', 'United Airlines': 'united.com',
    'American Airlines': 'aa.com', 'Emirates': 'emirates.com', 'British Airways': 'britishairways.com', 'Lufthansa': 'lufthansa.com', 'Qantas': 'qantas.com',
    'Air France': 'airfrance.com', 'Singapore Airlines': 'singaporeair.com', 'Cathay Pacific': 'cathaypacific.com', 'Google': 'google.com', 'Microsoft': 'microsoft.com',
    'Meta': 'meta.com', 'Netflix': 'netflix.com', 'Nvidia': 'nvidia.com', 'Salesforce': 'salesforce.com', 'Spotify': 'spotify.com', 'Adobe': 'adobe.com', 'IBM': 'ibm.com',
    'Oracle': 'oracle.com', 'Shopify': 'shopify.com', 'SAP': 'sap.com', 'Samsung': 'samsung.com', 'Deloitte': 'deloitte.com', 'PwC': 'pwc.com', 'EY': 'ey.com',
    'KPMG': 'kpmg.com', 'Grant Thornton': 'grantthornton.com', 'The New York Times': 'nytimes.com', 'The Washington Post': 'washingtonpost.com', 'CNN': 'cnn.com',
    'BBC': 'bbc.co.uk', 'Reuters': 'reuters.com', 'Associated Press': 'apnews.com', 'The Guardian': 'theguardian.com', 'Bloomberg': 'bloomberg.com', 'IDEO': 'ideo.com',
    'Pentagram': 'pentagram.com', 'Airbnb': 'airbnb.com', 'Figma': 'figma.com', 'Ogilvy': 'ogilvy.com', 'WPP': 'wpp.com', 'Publicis': 'publicisgroupe.com',
    'Coca-Cola': 'coca-cola.com', 'Procter & Gamble': 'pg.com', 'Unilever': 'unilever.com', 'Boeing': 'boeing.com', 'Airbus': 'airbus.com', 'Tesla': 'tesla.com',
    'General Electric': 'ge.com', 'Siemens': 'siemens.com', 'Toyota': 'toyota.com', 'Lockheed Martin': 'lockheedmartin.com', 'SpaceX': 'spacex.com',
    'Goldman Sachs': 'goldmansachs.com', 'JPMorgan Chase': 'jpmorganchase.com', 'Morgan Stanley': 'morganstanley.com', 'BlackRock': 'blackrock.com', 'Citi': 'citi.com',
    'HSBC': 'hsbc.com', 'Barclays': 'barclays.co.uk', 'UBS': 'ubs.com', 'Gensler': 'gensler.com', 'Foster + Partners': 'fosterandpartners.com',
    'Zaha Hadid Architects': 'zaha-hadid.com', 'Skidmore, Owings & Merrill': 'som.com', 'AECOM': 'aecom.com', 'Red Cross': 'redcross.org', 'UNICEF': 'unicef.org',
    'Save the Children': 'savethechildren.org', 'Salvation Army': 'salvationarmyusa.org', 'PepsiCo': 'pepsico.com', 'Pepsi': 'pepsi.com', 'Nestlé': 'nestle.com',
    'Berkshire Hathaway': 'berkshirehathaway.com', 'NASA': 'nasa.gov', 'CERN': 'home.cern', 'Pfizer': 'pfizer.com', 'Moderna': 'modernatx.com',
    'Johnson & Johnson': 'jnj.com', 'Max Planck Society': 'mpg.de', 'Google DeepMind': 'deepmind.google', 'Aspen Dental': 'aspendental.com',
    'Bupa Dental Care': 'bupa.co.uk', 'Pacific Dental Services': 'pacificdentalservices.com', 'Mr. Electric': 'mrelectric.com', 'Schneider Electric': 'se.com',
    'Roto-Rooter': 'rotorooter.com', 'Mr. Rooter Plumbing': 'mrrooter.com', 'Caterpillar': 'cat.com', 'Lincoln Electric': 'lincolnelectric.com',
    'Huntington Ingalls': 'hii.com', 'Carrier': 'carrier.com', 'Trane': 'trane.com', 'Daikin': 'daikin.com', 'Planet Fitness': 'planetfitness.com', 'Equinox': 'equinox.com',
    '24 Hour Fitness': '24hourfitness.com', "Gold's Gym": 'goldsgym.com', 'Anytime Fitness': 'anytimefitness.com', 'San Diego Zoo': 'sandiegozoo.org',
    'Bronx Zoo': 'bronxzoo.com', 'London Zoo': 'londonzoo.org', 'Taronga Zoo': 'taronga.org.au', 'Toronto Zoo': 'torontozoo.com', 'Singapore Zoo': 'mandai.com',
    'CVS Pharmacy': 'cvs.com', 'Walgreens': 'walgreens.com', 'Boots': 'boots.com', 'Gucci': 'gucci.com', 'Prada': 'prada.com', 'Louis Vuitton': 'louisvuitton.com',
    'Chanel': 'chanel.com', 'Versace': 'versace.com', 'Ralph Lauren': 'ralphlauren.com', 'Adidas': 'adidas.com', 'Puma': 'puma.com', 'Under Armour': 'underarmour.com',
    'New Balance': 'newbalance.com', 'Jordan Brand': 'jordan.com', 'Anta': 'anta.com', 'Li-Ning': 'lining.com', 'Gatorade': 'gatorade.com', 'State Farm': 'statefarm.com',
    'EA Sports FC': 'ea.com', 'Rawlings': 'rawlings.com', 'Bauer': 'bauer.com', 'CCM': 'ccmhockey.com', 'Tim Hortons': 'timhortons.com', 'Rolex': 'rolex.com',
    'Wilson': 'wilson.com', 'Lacoste': 'lacoste.com', 'Uniqlo': 'uniqlo.com', 'NordVPN': 'nordvpn.com', 'Raid: Shadow Legends': 'plarium.com', 'HelloFresh': 'hellofresh.com',
    'Squarespace': 'squarespace.com', 'Audible': 'audible.com', 'Manscaped': 'manscaped.com', 'Skillshare': 'skillshare.com', 'Honey': 'joinhoney.com', 'G Fuel': 'gfuel.com',
    'Ridge Wallet': 'ridge.com', 'Surfshark': 'surfshark.com', 'Factor Meals': 'factor75.com', 'Sub Pop': 'subpop.com', 'XL Recordings': 'xlrecordings.com',
    'Big Machine Records': 'bigmachinelabelgroup.com', 'Republic Records': 'republicrecords.com', 'Atlantic Records': 'atlanticrecords.com', 'Columbia Records': 'columbiarecords.com',
    'Interscope Records': 'interscope.com', 'Def Jam Recordings': 'defjam.com', 'A24': 'a24films.com', 'Neon': 'neonrated.com', 'Searchlight Pictures': 'searchlightpictures.com',
    'Focus Features': 'focusfeatures.com', 'IFC Films': 'ifcfilms.com', 'Magnolia Pictures': 'magpictures.com', 'Warner Bros.': 'warnerbros.com', 'Universal': 'universalpictures.com',
    'Paramount': 'paramount.com', 'Sony Pictures': 'sonypictures.com', 'Lionsgate': 'lionsgate.com', '20th Century Studios': '20thcenturystudios.com', 'Marvel Studios': 'marvel.com',
    'Lucasfilm': 'lucasfilm.com', 'Legendary': 'legendary.com', 'DreamWorks': 'dreamworks.com', 'HBO': 'hbo.com', 'Apple TV+': 'tv.apple.com', 'Hulu': 'hulu.com',
    'Prime Video': 'primevideo.com', 'FX': 'fxnetworks.com', 'NBC': 'nbc.com', 'ABC': 'abc.com', 'CBS': 'cbs.com', 'Fox': 'fox.com', 'Disney Channel': 'disneynow.com',
    'Nickelodeon': 'nick.com', 'Broadway': 'broadway.org', 'CAA': 'caa.com', 'WME': 'wmeagency.com', 'UTA': 'unitedtalent.com', 'Gersh': 'gersh.com',
    'ATP Tour': 'atptour.com', 'WTA Tour': 'wtatennis.com', 'Challenger Tour': 'atptour.com',
    'PWHL Boston': 'thepwhl.com', 'PWHL Minnesota': 'thepwhl.com', 'PWHL Montréal': 'thepwhl.com', 'PWHL New York': 'thepwhl.com', 'PWHL Ottawa': 'thepwhl.com', 'PWHL Toronto': 'thepwhl.com',
    'Yomiuri Giants': 'giants.jp', 'Hanshin Tigers': 'hanshintigers.jp', 'Fukuoka SoftBank Hawks': 'softbankhawks.co.jp', 'Hokkaido Nippon-Ham Fighters': 'fighters.co.jp',
    'Doosan Bears': 'doosanbears.com', 'LG Twins': 'lgtwins.com', 'Kia Tigers': 'tigers.co.kr', 'Samsung Lions': 'samsunglions.com',
    'Diablos Rojos del México': 'diablos.com.mx', 'Sultanes de Monterrey': 'sultanes.com.mx', 'Hershey Bears': 'hersheybears.com', 'Toronto Marlies': 'marlies.ca',
    'Coachella Valley Firebirds': 'cvfirebirds.com', 'Providence Bruins': 'providencebruins.com', 'Chicago Wolves': 'chicagowolves.com', 'Durham Bulls': 'milb.com/durham',
    'Real Madrid Baloncesto': 'realmadrid.com', 'FC Barcelona Bàsquet': 'fcbarcelona.com', 'Olympiacos': 'olympiacos.org', 'Panathinaikos': 'paobc.gr', 'Fenerbahçe': 'fenerbahce.org',
    'Anadolu Efes': 'anadoluefessk.org', 'Maccabi Tel Aviv': 'maccabi.co.il', 'Olimpia Milano': 'olimpiamilano.com', 'Virtus Bologna': 'virtus.it', 'ALBA Berlin': 'albaberlin.de',
    'Žalgiris Kaunas': 'zalgiris.lt', 'Partizan Belgrade': 'kkpartizan.rs', 'ASVEL': 'ldlcasvel.com', 'AS Monaco Basket': 'asmonaco.basketball', 'Bayern Munich Basketball': 'fcbayern.com',
    'Jeonbuk Hyundai Motors': 'hyundai-motorsfc.com', 'Ulsan HD': 'uhdfc.com', 'FC Seoul': 'fcseoul.com', 'Pohang Steelers': 'steelers.co.kr',
    'Kaya–Iloilo': 'kayafc.com', 'Harbour View': 'harbourviewfc.com',
}


def norm(s):
    s = s.lower().strip()
    s = re.sub(r'\s*\(.*\)\s*$', '', s)
    s = re.sub(r'^the\s+', '', s)
    s = re.sub(r'\s+(women|b)$', '', s)
    for a, b in (('é', 'e'), ('ã', 'a'), ('á', 'a'), ('ó', 'o'), ('í', 'i'), ('ê', 'e'), ('ç', 'c'), ('ü', 'u'), ('ë', 'e'), ('à', 'a')):
        s = s.replace(a, b)
    return s.strip()


def key(s):  # must match TL.logos.key()
    s = s.lower().strip()
    s = re.sub(r'\s*\(.*\)\s*$', '', s)
    s = re.sub(r'^the\s+', '', s)
    s = re.sub(r'\s+(women|b)$', '', s)
    return s.strip()


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', norm(s)).strip('-')[:60]


def get(url, timeout=20, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA_SITE if 'apple-touch' in url else UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            if e.code in (403, 429, 503) and i < tries - 1:
                time.sleep(2 * (i + 1))  # throttled: back off and retry
                continue
            raise


def bare(s):  # club names with and without FC / CF / SC
    return re.sub(r'^(fc|cf|sc|ac) |\s(fc|cf|sc)$', '', s).strip()


def width(data):
    """Pixel width of a PNG or the largest image in an ICO (0 if unknown)."""
    if data[:4] == b'\x89PNG':
        return int.from_bytes(data[16:20], 'big')
    if data[:4] == b'\x00\x00\x01\x00':
        n = int.from_bytes(data[4:6], 'little')
        return max(((data[6 + 16 * i] or 256) for i in range(min(n, 16))), default=0)
    return 0


def fallback(n, d, fn, files):
    """The site's own apple-touch-icon, then DuckDuckGo's icon (32px+)."""
    tries = [('https://www.%s/apple-touch-icon.png' % d, '.png'), ('https://%s/apple-touch-icon.png' % d, '.png'),
             ('https://icons.duckduckgo.com/ip3/%s.ico' % d, None)]
    for url, ext in tries:
        try:
            st, data = get(url, tries=1, timeout=12)
        except Exception:
            continue
        w = width(data)
        if st == 200 and w >= (64 if ext else 32):
            name = fn if data[:4] == b'\x89PNG' else fn[:-4] + '.ico'
            open(os.path.join(OUT, name), 'wb').write(data)
            files[key(n)] = name
            return True
    return False


def names():
    src = open(os.path.join(ROOT, 'game', 'js', 'logos.js'), encoding='utf-8').read()
    tb = src[src.index('var TEAMS'):src.index('var COMPANIES')]
    cb = src[src.index('var COMPANIES'):src.index('var MAP')]
    # Each entry is a quoted 'Name|ABBR|bg|fg' string (some names contain apostrophes).
    ent = lambda b: [m.group(2).split('|')[0] for m in re.finditer(r"(['\"])([^'\"]*?(?:'[^'\"|]*?)?\|[^'\"]*?)\1", b)]
    teams, cos = ent(tb), ent(cb)
    return teams, cos


def main():
    os.makedirs(OUT, exist_ok=True)
    teams, cos = names()
    files, misses = {}, []
    # ESPN team logos
    espn = {}
    for lg in LEAGUES:
        try:
            _, body = get('https://site.api.espn.com/apis/site/v2/sports/%s/teams?limit=500' % lg)
            for t in json.loads(body)['sports'][0]['leagues'][0]['teams']:
                t = t['team']
                logos = t.get('logos') or []
                if not logos:
                    continue
                href = logos[0]['href']
                for n in (t.get('displayName'), t.get('shortDisplayName'), t.get('name'), (t.get('location', '') + ' ' + t.get('name', '')).strip(), t.get('nickname')):
                    if n:
                        espn.setdefault(norm(n), href)
                        espn.setdefault(bare(norm(n)), href)
        except Exception as e:  # keep going; that league just keeps its badges
            print('league failed', lg, e, file=sys.stderr)
        time.sleep(0.3)
    print('espn names:', len(espn))
    for n in teams:
        k = norm(n)
        href = espn.get(ALIAS.get(k, k)) or espn.get(k) or espn.get(bare(k))
        if not href:
            if n in DOMAINS:
                cos.append(n)
            else:
                misses.append(n)
            continue
        path = urllib.parse.urlparse(href).path
        fn = slug(n) + '.png'
        try:
            st, data = get('https://a.espncdn.com/combiner/i?img=%s&h=96&w=96' % urllib.parse.quote(path))
            if st == 200 and data[:4] == b'\x89PNG':
                open(os.path.join(OUT, fn), 'wb').write(data)
                files[key(n)] = fn
            else:
                misses.append(n)
        except Exception:
            misses.append(n)
    # Company icons
    for n in cos:
        if key(n) in files:
            continue
        d = DOMAINS.get(n)
        if not d:
            misses.append(n)
            continue
        fn = 'co-' + slug(n) + '.png'
        ok = False
        for host in (d, 'www.' + d):
            url = 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=128&url=' + urllib.parse.quote('https://' + host, safe='')
            try:
                st, data = get(url, tries=1)
                if st == 200 and data[:4] == b'\x89PNG' and len(data) > 300:
                    open(os.path.join(OUT, fn), 'wb').write(data)
                    files[key(n)] = fn
                    ok = True
                    break
            except Exception:
                pass
        if not ok:
            ok = fallback(n, d, fn, files)
        if not ok:
            misses.append(n)
        time.sleep(0.05)
    js = '/* Generated by tools/fetch_logos.py: name key -> logo file in img/logos/. */\nTL.LOGO_FILES = ' + json.dumps(files, ensure_ascii=False, sort_keys=True, indent=0) + ';\n'
    open(os.path.join(ROOT, 'game', 'js', 'logofiles.js'), 'w', encoding='utf-8').write(js)
    print('logos:', len(files), 'missing:', len(misses))
    print('missing ->', ', '.join(sorted(set(misses))))


if __name__ == '__main__':
    main()
