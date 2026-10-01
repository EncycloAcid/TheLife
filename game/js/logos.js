/* TheLife — v1.18: team and company logos. Real logos live in img/logos/
 * (downloaded by tools/fetch_logos.py, listed in js/logofiles.js). Anything
 * without a logo file gets a badge in the team's real colors with its
 * standard abbreviation, or a monogram tile in the company's brand color.
 * If an image fails to load, the badge underneath shows instead.
 * TL.logos.badge(name) returns HTML; TL.logos.info(name) the raw data. */
TL.logos = (function () {
  // name | abbreviation | background | text  (t = team: round badge)
  var TEAMS = [
    // NFL
    'Kansas City Chiefs|KC|#E31837|#FFB81C', 'Dallas Cowboys|DAL|#041E42|#FFFFFF', 'Green Bay Packers|GB|#203731|#FFB612', 'New England Patriots|NE|#002244|#C60C30',
    'San Francisco 49ers|SF|#AA0000|#B3995D', 'Pittsburgh Steelers|PIT|#101820|#FFB612', 'Philadelphia Eagles|PHI|#004C54|#FFFFFF', 'Buffalo Bills|BUF|#00338D|#FFFFFF',
    'Baltimore Ravens|BAL|#241773|#9E7C0C', 'Detroit Lions|DET|#0076B6|#FFFFFF', 'Miami Dolphins|MIA|#008E97|#FC4C02', 'Chicago Bears|CHI|#0B162A|#C83803',
    'Toronto Argonauts|TOR|#002C5F|#6BA4D8', 'BC Lions|BC|#F15A22|#000000', 'Calgary Stampeders|CGY|#C8102E|#FFFFFF',
    // NBA
    'Atlanta Hawks|ATL|#E03A3E|#FFFFFF', 'Boston Celtics|BOS|#007A33|#FFFFFF', 'Brooklyn Nets|BKN|#000000|#FFFFFF', 'Charlotte Hornets|CHA|#1D1160|#00788C',
    'Chicago Bulls|CHI|#CE1141|#000000', 'Cleveland Cavaliers|CLE|#860038|#FDBB30', 'Dallas Mavericks|DAL|#00538C|#FFFFFF', 'Denver Nuggets|DEN|#0E2240|#FEC524',
    'Detroit Pistons|DET|#C8102E|#1D42BA', 'Golden State Warriors|GSW|#1D428A|#FFC72C', 'Houston Rockets|HOU|#CE1141|#FFFFFF', 'Indiana Pacers|IND|#002D62|#FDBB30',
    'LA Clippers|LAC|#C8102E|#1D428A', 'Los Angeles Lakers|LAL|#552583|#FDB927', 'Memphis Grizzlies|MEM|#5D76A9|#12173F', 'Miami Heat|MIA|#98002E|#F9A01B',
    'Milwaukee Bucks|MIL|#00471B|#EEE1C6', 'Minnesota Timberwolves|MIN|#0C2340|#78BE20', 'New Orleans Pelicans|NOP|#0C2340|#C8102E', 'New York Knicks|NYK|#006BB6|#F58426',
    'Oklahoma City Thunder|OKC|#007AC1|#EF3B24', 'Orlando Magic|ORL|#0077C0|#FFFFFF', 'Philadelphia 76ers|PHI|#006BB6|#ED174C', 'Phoenix Suns|PHX|#1D1160|#E56020',
    'Portland Trail Blazers|POR|#E03A3E|#000000', 'Sacramento Kings|SAC|#5A2D81|#FFFFFF', 'San Antonio Spurs|SAS|#C4CED4|#000000', 'Toronto Raptors|TOR|#CE1141|#000000',
    'Utah Jazz|UTA|#002B5C|#F9A01B', 'Washington Wizards|WAS|#002B5C|#E31837',
    // WNBA
    'Atlanta Dream|ATL|#E31837|#FFFFFF', 'Chicago Sky|CHI|#418FDE|#FFCD00', 'Connecticut Sun|CON|#0A2240|#F05023', 'Dallas Wings|DAL|#002B5C|#C4D600',
    'Golden State Valkyries|GSV|#B79AE0|#000000', 'Indiana Fever|IND|#002D62|#E03A3E', 'Las Vegas Aces|LV|#000000|#BA0C2F', 'Los Angeles Sparks|LA|#552583|#FDB927',
    'Minnesota Lynx|MIN|#266092|#79BC43', 'New York Liberty|NY|#6ECEB2|#000000', 'Phoenix Mercury|PHX|#201747|#CB6015', 'Seattle Storm|SEA|#2C5235|#FBE122', 'Washington Mystics|WAS|#0C2340|#C8102E',
    // G League & EuroLeague
    'South Bay Lakers|SBL|#552583|#FDB927', 'Santa Cruz Warriors|SCW|#1D428A|#FFC72C', 'Maine Celtics|MNE|#007A33|#FFFFFF', 'Westchester Knicks|WCK|#006BB6|#F58426',
    'Sioux Falls Skyforce|SXF|#002F87|#FFFFFF', 'Austin Spurs|AUS|#000000|#C4CED4', 'Iowa Wolves|IWA|#0C2340|#78BE20', 'Rio Grande Valley Vipers|RGV|#CE1141|#000000',
    'Real Madrid|RMA|#FFFFFF|#00529F', 'Real Madrid Baloncesto|RMA|#FFFFFF|#00529F', 'FC Barcelona|BAR|#A50044|#004D98', 'FC Barcelona Bàsquet|BAR|#A50044|#EDBB00',
    'Olympiacos|OLY|#CE1126|#FFFFFF', 'Panathinaikos|PAO|#007A3D|#FFFFFF', 'Fenerbahçe|FB|#00205B|#FFED00', 'Anadolu Efes|EFS|#003A70|#FFFFFF', 'Maccabi Tel Aviv|MTA|#FFE500|#0038B8',
    'Olimpia Milano|MIL|#E30613|#FFFFFF', 'Virtus Bologna|VIR|#000000|#FFFFFF', 'Bayern Munich|FCB|#DC052D|#FFFFFF', 'Bayern Munich Basketball|FCB|#DC052D|#FFFFFF', 'ALBA Berlin|ALB|#FFD100|#0055A4',
    'Žalgiris Kaunas|ZAL|#006A44|#FFFFFF', 'Partizan Belgrade|PAR|#000000|#FFFFFF', 'AS Monaco|ASM|#E2001A|#FFFFFF', 'AS Monaco Basket|ASM|#E2001A|#FFFFFF', 'ASVEL|ASV|#00205B|#FFFFFF',
    // College basketball
    'Duke Blue Devils|DUKE|#003087|#FFFFFF', 'Kentucky Wildcats|UK|#0033A0|#FFFFFF', 'Kansas Jayhawks|KU|#0051BA|#E8000D', 'North Carolina Tar Heels|UNC|#7BAFD4|#13294B',
    'UConn Huskies|UC|#000E2F|#FFFFFF', 'UCLA Bruins|UCLA|#2D68C4|#F2A900', 'Gonzaga Bulldogs|GONZ|#041E42|#C8102E', 'Villanova Wildcats|NOVA|#00205B|#FFFFFF',
    'Michigan State Spartans|MSU|#18453B|#FFFFFF', 'Arizona Wildcats|ARIZ|#CC0033|#003366', 'Baylor Bears|BU|#154734|#FFB81C', 'Texas Longhorns|TEX|#BF5700|#FFFFFF',
    'Houston Cougars|UH|#C8102E|#FFFFFF', 'Purdue Boilermakers|PUR|#000000|#CFB991', 'Indiana Hoosiers|IU|#990000|#EEEDEB', 'Syracuse Orange|SYR|#F76900|#000E54',
    // MLB, NPB, KBO, LMB
    'New York Yankees|NYY|#0C2340|#FFFFFF', 'Los Angeles Dodgers|LAD|#005A9C|#FFFFFF', 'Boston Red Sox|BOS|#BD3039|#0C2340', 'Chicago Cubs|CHC|#0E3386|#CC3433',
    'San Francisco Giants|SF|#FD5A1E|#27251F', 'Atlanta Braves|ATL|#13274F|#CE1141', 'Houston Astros|HOU|#002D62|#EB6E1F', 'Toronto Blue Jays|TOR|#134A8E|#FFFFFF',
    'St. Louis Cardinals|STL|#C41E3A|#FEDB00', 'New York Mets|NYM|#002D72|#FF5910',
    'Yomiuri Giants|YG|#F97709|#000000', 'Hanshin Tigers|HT|#FFE201|#000000', 'Fukuoka SoftBank Hawks|SBH|#F9C304|#000000', 'Hokkaido Nippon-Ham Fighters|NHF|#006298|#B3A369',
    'Doosan Bears|DSB|#131230|#ED1C24', 'LG Twins|LG|#C30452|#000000', 'Kia Tigers|KIA|#EA0029|#000000', 'Samsung Lions|SSL|#074CA1|#FFFFFF',
    'Diablos Rojos del México|DRM|#E4002B|#000000', 'Sultanes de Monterrey|SUL|#002F6C|#FFFFFF',
    // NHL & women hockey
    'Toronto Maple Leafs|TOR|#00205B|#FFFFFF', 'Montreal Canadiens|MTL|#AF1E2D|#192168', 'Edmonton Oilers|EDM|#041E42|#FF4C00', 'Boston Bruins|BOS|#000000|#FFB81C',
    'New York Rangers|NYR|#0038A8|#CE1126', 'Chicago Blackhawks|CHI|#CF0A2C|#000000', 'Vegas Golden Knights|VGK|#333F42|#B4975A', 'Pittsburgh Penguins|PIT|#000000|#FCB514',
    'Vancouver Canucks|VAN|#00205B|#00843D', 'Detroit Red Wings|DET|#CE1126|#FFFFFF',
    'PWHL Boston|BOS|#154734|#FFFFFF', 'PWHL Minnesota|MIN|#250E62|#FFFFFF', 'PWHL Montréal|MTL|#862633|#FFFFFF', 'PWHL New York|NY|#00A3AD|#FFFFFF', 'PWHL Ottawa|OTT|#A6192E|#FFFFFF', 'PWHL Toronto|TOR|#307FE2|#FFFFFF',
    // Soccer
    'Inter Miami|MIA|#F7B5CD|#231F20', 'LA Galaxy|LAG|#00245D|#FFD200', 'LAFC|LAFC|#000000|#C39E6D', 'Seattle Sounders|SEA|#5D9741|#005595', 'Atlanta United|ATL|#80000A|#A19060',
    'New York City FC|NYC|#6CACE4|#041E42', 'Toronto FC|TFC|#B81137|#FFFFFF', 'CF Montréal|MTL|#000000|#0033A1', 'Vancouver Whitecaps|VAN|#00245E|#FFFFFF',
    'Manchester United|MUN|#DA291C|#FBE122', 'Manchester City|MCI|#6CABDD|#FFFFFF', 'Liverpool|LIV|#C8102E|#FFFFFF', 'Arsenal|ARS|#EF0107|#FFFFFF', 'Chelsea|CHE|#034694|#FFFFFF',
    'Tottenham Hotspur|TOT|#132257|#FFFFFF', 'Newcastle United|NEW|#241F20|#FFFFFF', 'Aston Villa|AVL|#670E36|#95BFE5',
    'Atlético Madrid|ATM|#CB3524|#FFFFFF', 'Sevilla|SEV|#FFFFFF|#D81920', 'Real Sociedad|RSO|#0067B1|#FFFFFF', 'Valencia|VAL|#FFFFFF|#EE3524',
    'Juventus|JUV|#000000|#FFFFFF', 'AC Milan|MIL|#FB090B|#000000', 'Inter Milan|INT|#010E80|#FFFFFF', 'Napoli|NAP|#12A0D7|#FFFFFF', 'AS Roma|ROM|#8E1F2F|#F0BC42', 'Lazio|LAZ|#87D8F7|#FFFFFF',
    'Borussia Dortmund|BVB|#FDE100|#000000', 'RB Leipzig|RBL|#DD0741|#FFFFFF', 'Bayer Leverkusen|B04|#E32221|#000000', 'Eintracht Frankfurt|SGE|#000000|#E1000F',
    'Paris Saint-Germain|PSG|#004170|#DA291C', 'Olympique de Marseille|OM|#2FAEE0|#FFFFFF', 'Olympique Lyonnais|OL|#FFFFFF|#DA0812', 'LOSC Lille|LIL|#E01E13|#FFFFFF',
    'Club América|AME|#FFE500|#002F6C', 'Chivas|CHV|#CD1F2D|#FFFFFF', 'Cruz Azul|CAZ|#0047AB|#FFFFFF', 'Tigres UANL|TIG|#FDB913|#003DA5', 'Monterrey|MTY|#002F6C|#FFFFFF',
    'Flamengo|FLA|#C52613|#000000', 'Palmeiras|PAL|#006437|#FFFFFF', 'Corinthians|COR|#000000|#FFFFFF', 'São Paulo FC|SPFC|#FFFFFF|#FE0000', 'Santos|SAN|#FFFFFF|#000000', 'Grêmio|GRE|#0D80BF|#000000',
    'Kashima Antlers|KAS|#B71C3B|#FFFFFF', 'Urawa Red Diamonds|URA|#E6002D|#000000', 'Yokohama F. Marinos|YFM|#0040A0|#FFFFFF', 'Kawasaki Frontale|KAW|#23B6E6|#000000',
    'Jeonbuk Hyundai Motors|JEO|#006E3D|#FFD200', 'Ulsan HD|ULS|#00488F|#FFD200', 'FC Seoul|SEO|#000000|#E30613', 'Pohang Steelers|POH|#D51E28|#000000',
    'Mohun Bagan|MB|#007A33|#8C1D40', 'Mumbai City FC|MCFC|#58B1E3|#FFFFFF', 'Bengaluru FC|BFC|#0B3A82|#FFFFFF', 'Kerala Blasters|KBFC|#FFD100|#00438B',
    'Enyimba|ENY|#004E96|#FFFFFF', 'Rangers International|RAN|#E30613|#FFFFFF', 'Kano Pillars|KAN|#FFD500|#006633', 'Rivers United|RIV|#00539F|#FFFFFF',
    'Kaizer Chiefs|KC|#FDB913|#000000', 'Orlando Pirates|OP|#000000|#FFFFFF', 'Mamelodi Sundowns|SUN|#FFD200|#00843D',
    'Sydney FC|SFC|#6CACE4|#FFFFFF', 'Melbourne Victory|MV|#00205B|#FFFFFF', 'Western Sydney Wanderers|WSW|#C8102E|#000000',
    'Kaya–Iloilo|KAY|#E4002B|#FFFFFF', 'Stallion Laguna|STA|#004B87|#FFFFFF', 'Harbour View|HV|#00205B|#FFD100', 'Cavalier|CAV|#00205B|#FFFFFF', 'Mount Pleasant|MP|#000000|#FFD100',
    'Portland Thorns|POR|#151F2B|#AE122A', 'San Diego Wave|SD|#002F65|#F4B9D3', 'Kansas City Current|KC|#62CBC9|#CF3339', 'Orlando Pride|ORL|#633492|#FFFFFF',
    'NJ/NY Gotham FC|GFC|#000000|#A9F1FD', 'Washington Spirit|WAS|#000000|#ED1C24', 'North Carolina Courage|NC|#01426A|#AB0033',
    'Louisville City|LOU|#4F2D7F|#FFFFFF', 'Sacramento Republic|SAC|#A50034|#FFFFFF', 'Phoenix Rising|PHX|#E4002B|#000000', 'Tampa Bay Rowdies|TB|#00843D|#FDB913', 'Orange County SC|OC|#FF6B00|#000000',
    'Leeds United|LEE|#FFFFFF|#1D428A', 'Sunderland|SUN|#EB172B|#FFFFFF', 'Norwich City|NOR|#FFF200|#00A650', 'Middlesbrough|MID|#E11B22|#FFFFFF', 'Sheffield United|SHU|#EE2737|#000000',
    // Minor-league baseball & hockey
    'Durham Bulls|DUR|#002D62|#F26722', 'Las Vegas Aviators|LV|#000000|#E04403', 'Scranton/Wilkes-Barre RailRiders|SWB|#0C2340|#C8102E', 'Sacramento River Cats|SAC|#A6192E|#FFFFFF',
    'Syracuse Mets|SYR|#002D72|#FF5910', 'Oklahoma City Comets|OKC|#002D62|#E31937',
    'Hershey Bears|HER|#4F2C1D|#FFFFFF', 'Toronto Marlies|TOR|#00205B|#FFFFFF', 'Coachella Valley Firebirds|CV|#C8102E|#000000', 'Providence Bruins|PRO|#000000|#FFB81C', 'Chicago Wolves|CHI|#7A0019|#B4975A',
    // Women in football & softball
    'Boston Renegades|BOS|#002244|#C60C30', 'Minnesota Vixen|MIN|#4F2683|#FFC62F', 'St. Louis Slam|STL|#C41E3A|#FFFFFF', 'Arlington Impact|ARL|#041E42|#869397', 'D.C. Divas|DC|#A50034|#FFB612',
    'Talons|TAL|#7A1F2B|#FFFFFF', 'Volts|VLT|#0067B1|#FFE500', 'Blaze|BLZ|#E34B26|#000000', 'Bandits|BAN|#1A1A1A|#FFFFFF', 'Spark|SPK|#FF6F00|#FFFFFF', 'Cascade|CAS|#00857D|#FFFFFF'
  ];
  // name | monogram | background | text  (rounded tile)
  var COMPANIES = [
    "McDonald's|M|#DA291C|#FFC72C", 'Burger King|BK|#D62300|#F5EBDC', 'KFC|KFC|#A3080C|#FFFFFF', 'Subway|S|#008C15|#FFC600', 'Taco Bell|TB|#702082|#FFFFFF', "Wendy's|W|#E2203D|#FFFFFF",
    "Domino's|D|#006491|#FFFFFF", 'Pizza Hut|PH|#C8102E|#FFFFFF', 'Starbucks|S|#00704A|#FFFFFF', 'Walmart|W|#0071CE|#FFC220', 'Target|T|#CC0000|#FFFFFF', 'Costco|C|#E31837|#005DAA',
    'IKEA|IKEA|#0058A3|#FFDB00', 'H&M|H&M|#E50010|#FFFFFF', 'Zara|Z|#000000|#FFFFFF', 'Best Buy|BB|#0046BE|#FFE000', 'Nike|N|#111111|#FFFFFF', 'Sephora|S|#000000|#FFFFFF', 'Apple|A|#1D1D1F|#FFFFFF',
    'ABM Industries|ABM|#003A70|#FFFFFF', 'ISS|ISS|#002D72|#FFFFFF', 'Cintas|C|#003C71|#FFFFFF', 'Bechtel|B|#E21836|#FFFFFF', 'Skanska|S|#143275|#FFFFFF', 'Vinci|V|#004489|#E30613',
    'Turner Construction|T|#00205B|#FFFFFF', 'Fluor|F|#002B5C|#FFFFFF', 'Hochtief|H|#E30613|#FFFFFF', 'Marriott|M|#A50034|#FFFFFF', 'Hilton|H|#104C97|#FFFFFF', 'Hyatt|H|#5C3317|#FFFFFF',
    'Four Seasons|FS|#000000|#FFFFFF', 'The Cheesecake Factory|CF|#7A5C3B|#FFFFFF', 'Olive Garden|OG|#5A6E27|#FFFFFF', 'UPS|UPS|#351C15|#FFB500', 'FedEx|FX|#4D148C|#FF6600',
    'DHL|DHL|#FFCC00|#D40511', 'Uber|U|#000000|#FFFFFF', 'Amazon|a|#232F3E|#FF9900', 'Greyhound|G|#00539B|#FFFFFF', 'Securitas|S|#E2001A|#FFFFFF', 'Allied Universal|AU|#003865|#FFFFFF',
    'G4S|G4S|#D52B1E|#FFFFFF', 'Supercuts|S|#E31837|#FFFFFF', 'Great Clips|GC|#003DA5|#FFFFFF', 'Toni & Guy|T&G|#000000|#FFFFFF', 'IMG Models|IMG|#000000|#FFFFFF', 'Elite Model Management|E|#000000|#FFFFFF',
    'Ford Models|F|#000000|#FFFFFF', 'Wilhelmina Models|W|#000000|#FFFFFF', 'Firestone|F|#E21836|#FFFFFF', 'Midas|M|#FFD100|#000000', 'Jiffy Lube|JL|#E31837|#FFD100', 'Pep Boys|PB|#E31837|#FFFFFF', 'Kwik Fit|KF|#00205B|#FFD100',
    'Keller Williams|KW|#B40101|#FFFFFF', 'RE/MAX|RE|#003DA5|#DC1C2E', 'Coldwell Banker|CB|#012169|#FFFFFF', "Sotheby's International Realty|S|#002349|#FFFFFF", 'Century 21|21|#252526|#BEAF87',
    'Nobu|N|#000000|#FFFFFF', 'Gordon Ramsay Restaurants|GR|#000000|#C9A961', 'The Ritz-Carlton|RC|#00205B|#FFFFFF', 'Delta Air Lines|Δ|#003366|#E3132C', 'United Airlines|U|#002244|#FFFFFF',
    'American Airlines|AA|#0078D2|#C30019', 'Emirates|E|#D71A21|#FFFFFF', 'British Airways|BA|#075AAA|#EB2226', 'Lufthansa|LH|#05164D|#F9BA00', 'Qantas|Q|#E40000|#FFFFFF', 'Air France|AF|#002157|#FFFFFF',
    'Singapore Airlines|SQ|#F99F1C|#1D1F5F', 'Cathay Pacific|CX|#005D63|#FFFFFF', 'Google|G|#FFFFFF|#4285F4', 'Microsoft|MS|#737373|#FFFFFF', 'Meta|M|#0866FF|#FFFFFF', 'Netflix|N|#000000|#E50914',
    'Nvidia|N|#76B900|#000000', 'Salesforce|S|#00A1E0|#FFFFFF', 'Spotify|S|#1DB954|#000000', 'Adobe|A|#FA0F00|#FFFFFF', 'IBM|IBM|#0F62FE|#FFFFFF', 'Oracle|O|#C74634|#FFFFFF', 'Shopify|S|#95BF47|#FFFFFF',
    'SAP|SAP|#0FAAFF|#FFFFFF', 'Samsung|S|#1428A0|#FFFFFF', 'Deloitte|D.|#000000|#86BC25', 'PwC|PwC|#D04A02|#FFFFFF', 'EY|EY|#2E2E38|#FFE600', 'KPMG|KPMG|#00338D|#FFFFFF', 'Grant Thornton|GT|#4F2D7F|#FFFFFF',
    'The New York Times|T|#FFFFFF|#000000', 'The Washington Post|WP|#FFFFFF|#000000', 'CNN|CNN|#CC0000|#FFFFFF', 'BBC|BBC|#000000|#FFFFFF', 'Reuters|R|#FF8000|#FFFFFF', 'Associated Press|AP|#FFFFFF|#000000',
    'The Guardian|G|#052962|#FFFFFF', 'Bloomberg|B|#000000|#FFFFFF', 'IDEO|IDEO|#000000|#FFFFFF', 'Pentagram|P|#000000|#FFFFFF', 'Airbnb|A|#FF5A5F|#FFFFFF', 'Figma|F|#1E1E1E|#A259FF',
    'Ogilvy|O|#EA1D25|#FFFFFF', 'WPP|WPP|#000000|#FFFFFF', 'Publicis|P|#000000|#FFFFFF', 'Coca-Cola|C|#F40009|#FFFFFF', 'Procter & Gamble|P&G|#003DA5|#FFFFFF', 'Unilever|U|#1F36C7|#FFFFFF',
    'Boeing|B|#0033A1|#FFFFFF', 'Airbus|A|#00205B|#FFFFFF', 'Tesla|T|#E31937|#FFFFFF', 'General Electric|GE|#005EB8|#FFFFFF', 'Siemens|S|#009999|#FFFFFF', 'Toyota|T|#EB0A1E|#FFFFFF',
    'Lockheed Martin|LM|#002A5C|#FFFFFF', 'SpaceX|X|#000000|#FFFFFF', 'Goldman Sachs|GS|#7399C6|#FFFFFF', 'JPMorgan Chase|JPM|#117ACA|#FFFFFF', 'Morgan Stanley|MS|#00263A|#FFFFFF',
    'BlackRock|BLK|#000000|#FFFFFF', 'Citi|citi|#056DAE|#FFFFFF', 'HSBC|HSBC|#DB0011|#FFFFFF', 'Barclays|B|#00AEEF|#FFFFFF', 'UBS|UBS|#E60000|#FFFFFF', 'Gensler|G|#000000|#FFFFFF',
    'Foster + Partners|F+P|#000000|#FFFFFF', 'Zaha Hadid Architects|ZHA|#000000|#FFFFFF', 'Skidmore, Owings & Merrill|SOM|#000000|#FFFFFF', 'AECOM|A|#008768|#FFFFFF',
    'Red Cross|+|#FFFFFF|#ED1B2E', 'UNICEF|U|#1CABE2|#FFFFFF', 'Save the Children|SC|#DA291C|#FFFFFF', 'Salvation Army|SA|#EF3340|#FFFFFF', 'PepsiCo|P|#004B93|#FFFFFF', 'Pepsi|P|#004B93|#FFFFFF',
    'Nestlé|N|#63513D|#FFFFFF', 'Berkshire Hathaway|BRK|#000080|#FFFFFF', 'NASA|NASA|#0B3D91|#FFFFFF', 'CERN|CERN|#0033A0|#FFFFFF', 'Pfizer|P|#0093D0|#FFFFFF', 'Moderna|M|#E31837|#FFFFFF',
    'Johnson & Johnson|J&J|#EB1700|#FFFFFF', 'Max Planck Society|MPG|#006C66|#FFFFFF', 'Google DeepMind|DM|#4285F4|#FFFFFF', 'Aspen Dental|AD|#00A3E0|#FFFFFF', 'Bupa Dental Care|B|#0079C8|#FFFFFF',
    'Pacific Dental Services|PDS|#00467F|#FFFFFF', 'Mr. Electric|ME|#003DA5|#FFD100', 'Schneider Electric|SE|#3DCD58|#FFFFFF', 'Roto-Rooter|RR|#E31837|#FFFFFF', 'Mr. Rooter Plumbing|MR|#003DA5|#E31837',
    'Caterpillar|CAT|#FFCD11|#000000', 'Lincoln Electric|LE|#E31837|#FFFFFF', 'Huntington Ingalls|HII|#00205B|#FFFFFF', 'Carrier|C|#0033A0|#FFFFFF', 'Trane|T|#D71920|#FFFFFF', 'Daikin|D|#00A0E4|#FFFFFF',
    'Planet Fitness|PF|#5C2D91|#FFD100', 'Equinox|E|#000000|#FFFFFF', '24 Hour Fitness|24|#E31837|#FFFFFF', "Gold's Gym|G|#000000|#FFD100", 'Anytime Fitness|AF|#5F249F|#FFFFFF',
    'San Diego Zoo|SDZ|#00843D|#FFFFFF', 'Bronx Zoo|BZ|#00843D|#FFFFFF', 'London Zoo|LZ|#00843D|#FFFFFF', 'Taronga Zoo|TZ|#00843D|#FFFFFF', 'Toronto Zoo|TZ|#00843D|#FFFFFF', 'Singapore Zoo|SZ|#00843D|#FFFFFF',
    'CVS Pharmacy|CVS|#CC0000|#FFFFFF', 'Walgreens|W|#E31837|#FFFFFF', 'Boots|B|#05054B|#FFFFFF', 'Gucci|GG|#000000|#C9A961', 'Prada|P|#000000|#FFFFFF', 'Louis Vuitton|LV|#5C4033|#E8D7A9',
    'Chanel|CC|#000000|#FFFFFF', 'Versace|V|#000000|#D4AF37', 'Ralph Lauren|RL|#041E42|#FFFFFF',
    // Sports brands, sponsors
    'Adidas|A|#000000|#FFFFFF', 'Puma|P|#000000|#FFFFFF', 'Under Armour|UA|#1D1D1D|#FFFFFF', 'New Balance|NB|#CF0A2C|#FFFFFF', 'Jordan Brand|J|#000000|#CE1141', 'Anta|A|#E60012|#FFFFFF', 'Li-Ning|LN|#E60012|#FFFFFF',
    'Gatorade|G|#F96302|#FFFFFF', 'State Farm|SF|#E31837|#FFFFFF', 'EA Sports FC|EA|#000000|#11FF66', 'Rawlings|R|#C8102E|#FFFFFF', 'Bauer|B|#000000|#FFFFFF', 'CCM|CCM|#E31837|#FFFFFF',
    'Tim Hortons|TH|#C8102E|#FFFFFF', 'Rolex|R|#006039|#A37E2C', 'Wilson|W|#D50032|#FFFFFF', 'Lacoste|L|#004526|#FFFFFF', 'Uniqlo|UQ|#FF0000|#FFFFFF',
    'NordVPN|N|#4687FF|#FFFFFF', 'Raid: Shadow Legends|R|#3A1C0B|#E7B04A', 'HelloFresh|HF|#91C11E|#FFFFFF', 'Squarespace|S|#000000|#FFFFFF', 'Audible|A|#F8991C|#000000', 'Manscaped|M|#000000|#FFFFFF',
    'Skillshare|S|#00FF84|#000000', 'Honey|H|#FF6801|#FFFFFF', 'G Fuel|G|#000000|#7FFF00', 'Ridge Wallet|R|#000000|#FFFFFF', 'Surfshark|S|#178A9E|#FFFFFF', 'Factor Meals|F|#2E5A3C|#FFFFFF',
    // Record labels
    'Sub Pop|SP|#000000|#FFFFFF', 'XL Recordings|XL|#000000|#FFFFFF', 'Big Machine Records|BM|#000000|#FFFFFF', 'Republic Records|R|#000000|#FFFFFF', 'Atlantic Records|A|#000000|#FFFFFF',
    'Columbia Records|C|#E31837|#FFFFFF', 'Interscope Records|I|#000000|#FFFFFF', 'Def Jam Recordings|DJ|#000000|#FFFFFF',
    // Studios & networks
    'A24|A24|#000000|#FFFFFF', 'Neon|NEON|#000000|#FFFFFF', 'Searchlight Pictures|S|#1A1A1A|#FFFFFF', 'Focus Features|F|#000000|#FFFFFF', 'IFC Films|IFC|#000000|#FFFFFF', 'Magnolia Pictures|M|#5B2C6F|#FFFFFF',
    'Warner Bros.|WB|#004DB4|#FFFFFF', 'Universal|U|#000000|#FFFFFF', 'Paramount|P|#0064FF|#FFFFFF', 'Sony Pictures|S|#000000|#FFFFFF', 'Lionsgate|L|#000000|#C9A961', '20th Century Studios|20|#000000|#C9A961',
    'Marvel Studios|M|#EC1D24|#FFFFFF', 'Lucasfilm|L|#000000|#FFFFFF', 'Legendary|L|#000000|#FFFFFF', 'DreamWorks|DW|#0072CE|#FFFFFF', 'Netflix|N|#000000|#E50914', 'HBO|HBO|#000000|#FFFFFF',
    'Apple TV+|tv+|#000000|#FFFFFF', 'Hulu|hulu|#1CE783|#000000', 'Prime Video|P|#00A8E1|#FFFFFF', 'FX|FX|#000000|#FFFFFF', 'NBC|NBC|#FFFFFF|#6460AA', 'ABC|abc|#000000|#FFFFFF', 'CBS|CBS|#033963|#FFFFFF',
    'Fox|FOX|#000000|#FFFFFF', 'Disney Channel|D|#0E3B8C|#FFFFFF', 'Nickelodeon|N|#FF6600|#FFFFFF', 'Broadway|B|#000000|#FFD100',
    // Tennis tours
    'ATP Tour|ATP|#002865|#FFFFFF', 'WTA Tour|WTA|#5B2C83|#FFFFFF', 'Challenger Tour|ATP|#00A3E0|#FFFFFF',
    // Talent agencies
    'CAA|CAA|#000000|#FFFFFF', 'WME|WME|#000000|#FFFFFF', 'UTA|UTA|#000000|#FFFFFF', 'Gersh|G|#000000|#FFFFFF'
  ];
  var MAP = {};
  function key(name) {
    return String(name || '').toLowerCase().replace(/\s*\(.*\)\s*$/, '').replace(/^the\s+/, '').replace(/\s+(women|b)$/, '').trim();
  }
  TEAMS.forEach(function (r) { var p = r.split('|'); MAP[key(p[0])] = { abbr: p[1], bg: p[2], fg: p[3], team: true }; });
  COMPANIES.forEach(function (r) { var p = r.split('|'); if (!MAP[key(p[0])]) MAP[key(p[0])] = { abbr: p[1], bg: p[2], fg: p[3], team: false }; });
  // Neutral fallback: initials on a muted color picked from the name.
  var FALLBACK = ['#3A3A3C', '#2C4A6E', '#3E5C3A', '#6B3A3A', '#4B3A6B', '#6B5A2C', '#2C5C5C', '#5C3A52'];
  function info(name) {
    var k = key(name), hit = MAP[k];
    if (hit) return hit;
    var words = String(name || '').replace(/\s*\(.*\)\s*$/, '').replace(/^the\s+/i, '').split(/[\s-]+/).filter(function (w) { return /^[A-Z0-9]/.test(w) && !/^(Of|And|The|De|Del|La|Los)$/.test(w); });
    var abbr = words.length > 1 ? words.slice(0, 3).map(function (w) { return w.charAt(0); }).join('') : (words[0] || '?').slice(0, 2).toUpperCase();
    var h = 0; for (var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
    return { abbr: abbr, bg: FALLBACK[h % FALLBACK.length], fg: '#FFFFFF', team: false, generic: true };
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // shape: 'team' (round) or 'co' (rounded square); size: 'sm' or default.
  function badge(name, opts) {
    var i = info(name), o = opts || {}, round = o.shape ? o.shape === 'team' : i.team;
    var a = i.abbr, len = a.length;
    // Apple's monogram is its own glyph on Apple devices; elsewhere fall back to text.
    if (a === '') a = '';
    var file = TL.LOGO_FILES && TL.LOGO_FILES[key(name)];
    var img = file ? '<img src="img/logos/' + encodeURI(file) + '" alt="" loading="lazy" decoding="async" onerror="this.remove()">' : '';
    return '<span class="lg' + (round ? ' lg-round' : '') + (o.size ? ' lg-' + o.size : '') + ' lg-l' + Math.min(4, len || 1) + (file ? ' lg-pic' + (i.team ? ' lg-team' : '') : '') + '" style="--lb:' + i.bg + ';--lf:' + i.fg + '" role="img" aria-label="' + esc(String(name || '').replace(/^the /, '')) + '">' + img + esc(a || 'A') + '</span>';
  }
  return { badge: badge, info: info, key: key };
})();
