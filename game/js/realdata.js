/* TheLife — real-world names: universities (with admission tiers), employers
 * for each career, and pro sports teams by country and league.
 * Names are used for flavor only. */
TL.real = (function () {
  var U = TL.util;

  // ---------------------------------------------------------- universities
  // [name, tier] — 3: elite/very selective, 2: selective, 1: open admission.
  var UNIS = {
    'United States': [['Harvard University', 3], ['Stanford University', 3], ['MIT', 3], ['Yale University', 3], ['Princeton University', 3], ['Columbia University', 3], ['University of Chicago', 3],
      ['Duke University', 2], ['Northwestern University', 2], ['University of Michigan', 2], ['UC Berkeley', 2], ['UCLA', 2], ['New York University', 2], ['Georgia Tech', 2], ['UT Austin', 2], ['Howard University', 2], ['Spelman College', 2],
      ['Ohio State University', 1], ['Penn State', 1], ['Arizona State University', 1], ['University of Florida', 1], ['Florida State University', 1], ['Rutgers University', 1], ['Texas A&M University', 1]],
    'United Kingdom': [['University of Oxford', 3], ['University of Cambridge', 3], ['Imperial College London', 3], ['London School of Economics', 3], ['UCL', 2], ['King\'s College London', 2], ['University of Edinburgh', 2], ['University of Manchester', 2], ['University of Bristol', 2], ['University of Leeds', 1], ['University of Birmingham', 1], ['University of Glasgow', 1]],
    'Canada': [['University of Toronto', 3], ['McGill University', 3], ['University of British Columbia', 2], ['University of Waterloo', 2], ['Queen\'s University', 2], ['McMaster University', 1], ['University of Alberta', 1], ['University of Ottawa', 1]],
    'Australia': [['University of Melbourne', 3], ['Australian National University', 3], ['University of Sydney', 2], ['UNSW Sydney', 2], ['University of Queensland', 2], ['Monash University', 2], ['University of Adelaide', 1], ['RMIT University', 1]],
    'Mexico': [['Tecnológico de Monterrey', 3], ['ITAM', 3], ['UNAM', 2], ['Universidad Iberoamericana', 2], ['Instituto Politécnico Nacional', 1], ['Universidad de Guadalajara', 1]],
    'Brazil': [['Universidade de São Paulo', 3], ['Fundação Getulio Vargas', 3], ['UNICAMP', 2], ['UFRJ', 2], ['PUC-Rio', 2], ['UFMG', 1]],
    'Germany': [['LMU Munich', 3], ['Technical University of Munich', 3], ['Heidelberg University', 3], ['Humboldt University of Berlin', 2], ['RWTH Aachen University', 2], ['University of Hamburg', 1], ['University of Cologne', 1], ['Goethe University Frankfurt', 1]],
    'France': [['École Polytechnique', 3], ['Sciences Po', 3], ['HEC Paris', 3], ['PSL University', 3], ['Sorbonne University', 2], ['Université Paris-Saclay', 2], ['Université de Lyon', 1], ['Aix-Marseille University', 1]],
    'Italy': [['Bocconi University', 3], ['Politecnico di Milano', 3], ['University of Bologna', 2], ['Sapienza University of Rome', 2], ['University of Padua', 2], ['University of Milan', 1], ['University of Naples Federico II', 1]],
    'Spain': [['IE University', 3], ['ESADE', 3], ['University of Barcelona', 2], ['Complutense University of Madrid', 2], ['Autonomous University of Madrid', 2], ['Pompeu Fabra University', 2], ['University of Valencia', 1], ['University of Seville', 1]],
    'Japan': [['University of Tokyo', 3], ['Kyoto University', 3], ['Osaka University', 2], ['Tohoku University', 2], ['Waseda University', 2], ['Keio University', 2], ['Nagoya University', 1], ['Hokkaido University', 1]],
    'South Korea': [['Seoul National University', 3], ['KAIST', 3], ['Yonsei University', 3], ['Korea University', 3], ['POSTECH', 2], ['Sungkyunkwan University', 2], ['Hanyang University', 1], ['Kyung Hee University', 1]],
    'India': [['IIT Bombay', 3], ['IIT Delhi', 3], ['IISc Bangalore', 3], ['University of Delhi', 2], ['Jawaharlal Nehru University', 2], ['BITS Pilani', 2], ['Anna University', 1], ['University of Mumbai', 1], ['Jadavpur University', 1]],
    'Nigeria': [['University of Ibadan', 3], ['University of Lagos', 2], ['Obafemi Awolowo University', 2], ['Covenant University', 2], ['Ahmadu Bello University', 1], ['University of Nigeria, Nsukka', 1], ['Lagos State University', 1]],
    'South Africa': [['University of Cape Town', 3], ['University of the Witwatersrand', 3], ['Stellenbosch University', 2], ['University of Pretoria', 2], ['Rhodes University', 2], ['University of Johannesburg', 1], ['University of KwaZulu-Natal', 1]],
    'Philippines': [['University of the Philippines Diliman', 3], ['Ateneo de Manila University', 3], ['De La Salle University', 2], ['University of Santo Tomas', 2], ['Mapúa University', 1], ['Polytechnic University of the Philippines', 1]],
    'Jamaica': [['University of the West Indies, Mona', 3], ['University of Technology, Jamaica', 2], ['Northern Caribbean University', 1], ['The Mico University College', 1]]
  };
  // How expensive university is relative to the US, by country.
  var EDU_COST = { 'United States': 1, 'United Kingdom': .6, 'Canada': .5, 'Australia': .5, 'Mexico': .3, 'Brazil': .2, 'Germany': .05, 'France': .1, 'Italy': .15, 'Spain': .15, 'Japan': .35, 'South Korea': .4, 'India': .15, 'Nigeria': .1, 'South Africa': .2, 'Philippines': .15, 'Jamaica': .25 };
  var TIER_FEE = { 3: 58000, 2: 36000, 1: 18000 };
  var TIER_LABEL = { 3: 'Very selective', 2: 'Selective', 1: 'Open admission' };
  function universities(country) { return (UNIS[country] || UNIS['United States']).map(function (u) { return { name: u[0], tier: u[1] }; }); }
  // Yearly tuition in base dollars (the engine converts with E.$).
  function tuition(country, tier) { return Math.round(TIER_FEE[tier] * (EDU_COST[country] != null ? EDU_COST[country] : 1)); }
  // Chance of getting in, from high school grades, SAT, and athletics.
  function admitChance(tier, grade, sat, athlete, extra) {
    var p;
    if (tier === 3) p = grade >= 90 ? .5 : grade >= 82 ? .22 : grade >= 74 ? .06 : .01;
    else if (tier === 2) p = grade >= 78 ? .8 : grade >= 68 ? .45 : grade >= 58 ? .2 : .06;
    else p = grade >= 50 ? .97 : .8;
    if (sat) p += sat >= 1500 ? .2 : sat >= 1350 ? .08 : sat < 1000 ? -.05 : 0;
    if (athlete) p += tier === 3 ? .2 : .25;
    if (extra && tier >= 2) p += extra; // clubs and leadership on the application
    return Math.max(.01, Math.min(.98, p));
  }

  // ------------------------------------------------------------- employers
  var CO = {
    fastfood: ['McDonald\'s', 'Burger King', 'KFC', 'Subway', 'Taco Bell', 'Wendy\'s', 'Domino\'s', 'Pizza Hut', 'Starbucks'],
    retail: ['Walmart', 'Target', 'Costco', 'IKEA', 'H&M', 'Zara', 'Best Buy', 'Nike', 'Sephora', 'Apple'],
    janitor: ['ABM Industries', 'ISS', 'Cintas'],
    construction: ['Bechtel', 'Skanska', 'Vinci', 'Turner Construction', 'Fluor', 'Hochtief'],
    waiter: ['Marriott', 'Hilton', 'Hyatt', 'Four Seasons', 'The Cheesecake Factory', 'Olive Garden'],
    driver: ['UPS', 'FedEx', 'DHL', 'Uber', 'Amazon', 'Greyhound'],
    security: ['Securitas', 'Allied Universal', 'G4S'],
    barber: ['Supercuts', 'Great Clips', 'Toni & Guy'],
    model: ['IMG Models', 'Elite Model Management', 'Ford Models', 'Wilhelmina Models'],
    mechanic: ['Firestone', 'Midas', 'Jiffy Lube', 'Pep Boys', 'Kwik Fit'],
    realestate: ['Keller Williams', 'RE/MAX', 'Coldwell Banker', 'Sotheby\'s International Realty', 'Century 21'],
    chef: ['Nobu', 'Gordon Ramsay Restaurants', 'The Ritz-Carlton', 'Four Seasons', 'Hilton'],
    flight: ['Delta Air Lines', 'United Airlines', 'American Airlines', 'Emirates', 'British Airways', 'Lufthansa', 'Qantas', 'Air France', 'Singapore Airlines'],
    pilot: ['Delta Air Lines', 'United Airlines', 'American Airlines', 'Emirates', 'British Airways', 'Lufthansa', 'Qantas', 'Air France', 'Singapore Airlines', 'Cathay Pacific'],
    software: ['Google', 'Apple', 'Microsoft', 'Meta', 'Amazon', 'Netflix', 'Nvidia', 'Salesforce', 'Spotify', 'Adobe', 'IBM', 'Oracle', 'Shopify', 'SAP', 'Samsung'],
    accountant: ['Deloitte', 'PwC', 'EY', 'KPMG', 'Grant Thornton'],
    journalist: ['The New York Times', 'The Washington Post', 'CNN', 'the BBC', 'Reuters', 'the Associated Press', 'The Guardian', 'Bloomberg'],
    design: ['Apple', 'IDEO', 'Pentagram', 'Airbnb', 'Adobe', 'Figma'],
    marketing: ['Ogilvy', 'WPP', 'Publicis', 'Coca-Cola', 'Procter & Gamble', 'Unilever', 'Nike'],
    engineer: ['Boeing', 'Airbus', 'Tesla', 'General Electric', 'Siemens', 'Toyota', 'Lockheed Martin', 'SpaceX'],
    finance: ['Goldman Sachs', 'JPMorgan Chase', 'Morgan Stanley', 'BlackRock', 'Citi', 'HSBC', 'Barclays', 'UBS'],
    architect: ['Gensler', 'Foster + Partners', 'Zaha Hadid Architects', 'Skidmore, Owings & Merrill', 'AECOM'],
    social: ['the Red Cross', 'UNICEF', 'Save the Children', 'the Salvation Army'],
    executive: ['Apple', 'Amazon', 'Walmart', 'Coca-Cola', 'PepsiCo', 'Unilever', 'Nestlé', 'Procter & Gamble', 'Toyota', 'Samsung', 'Berkshire Hathaway'],
    scientist: ['NASA', 'CERN', 'Pfizer', 'Moderna', 'Johnson & Johnson', 'the Max Planck Society', 'Google DeepMind'],
    dentist: ['Aspen Dental', 'Bupa Dental Care', 'Pacific Dental Services'],
    electrician: ['Mr. Electric', 'Siemens', 'Schneider Electric'],
    plumber: ['Roto-Rooter', 'Mr. Rooter Plumbing'],
    welder: ['Caterpillar', 'Lincoln Electric', 'Huntington Ingalls'],
    hvac: ['Carrier', 'Trane', 'Daikin'],
    trainer: ['Planet Fitness', 'Equinox', '24 Hour Fitness', 'Gold\'s Gym', 'Anytime Fitness'],
    zookeeper: ['the San Diego Zoo', 'the Bronx Zoo', 'London Zoo', 'Taronga Zoo', 'the Toronto Zoo', 'the Singapore Zoo'],
    pharmacist: ['CVS Pharmacy', 'Walgreens', 'Boots', 'Pfizer'],
    fashion: ['Gucci', 'Prada', 'Louis Vuitton', 'Chanel', 'Versace', 'Ralph Lauren', 'Nike']
  };
  // Employers that depend on the country.
  var LOCAL = {
    military: { 'United States': 'the US Army', 'United Kingdom': 'the British Army', 'Canada': 'the Canadian Armed Forces', 'Australia': 'the Australian Army', 'Mexico': 'the Mexican Army', 'Brazil': 'the Brazilian Army', 'Germany': 'the Bundeswehr', 'France': 'the French Army', 'Italy': 'the Italian Army', 'Spain': 'the Spanish Army', 'Japan': 'the Japan Ground Self-Defense Force', 'South Korea': 'the Republic of Korea Army', 'India': 'the Indian Army', 'Nigeria': 'the Nigerian Army', 'South Africa': 'the South African National Defence Force', 'Philippines': 'the Philippine Army', 'Jamaica': 'the Jamaica Defence Force' },
    police: { 'United States': ['the NYPD', 'the LAPD', 'the Chicago Police Department'], 'United Kingdom': ['the Metropolitan Police'], 'Canada': ['the RCMP', 'the Toronto Police Service'], 'Australia': ['the NSW Police Force'], 'Mexico': ['the Mexico City Police'], 'Brazil': ['the São Paulo Military Police'], 'Germany': ['the Berlin Police'], 'France': ['the Paris Police Prefecture'], 'Italy': ['the Carabinieri'], 'Spain': ['the Policía Nacional'], 'Japan': ['the Tokyo Metropolitan Police'], 'South Korea': ['the Seoul Metropolitan Police'], 'India': ['the Mumbai Police'], 'Nigeria': ['the Nigeria Police Force'], 'South Africa': ['the South African Police Service'], 'Philippines': ['the Philippine National Police'], 'Jamaica': ['the Jamaica Constabulary Force'] },
    firefighter: { 'United States': ['the FDNY', 'the LAFD', 'the Chicago Fire Department'], 'United Kingdom': ['the London Fire Brigade'], 'Canada': ['Toronto Fire Services'], 'Australia': ['Fire and Rescue NSW'], 'Japan': ['the Tokyo Fire Department'], 'Germany': ['the Berlin Fire Brigade'], 'France': ['the Paris Fire Brigade'] },
    detective: { 'United States': ['the FBI', 'the DEA', 'the ATF'], 'United Kingdom': ['MI5', 'the National Crime Agency'], 'Canada': ['the RCMP'], 'Australia': ['the Australian Federal Police'], 'Germany': ['the BKA'], 'France': ['the DGSI'], 'India': ['the CBI'], 'Nigeria': ['the EFCC'], 'South Africa': ['the Hawks'] },
    astronaut: { 'United States': 'NASA', 'Canada': 'the Canadian Space Agency', 'Japan': 'JAXA', 'South Korea': 'KARI', 'India': 'ISRO', 'Australia': 'the Australian Space Agency', 'United Kingdom': 'the UK Space Agency', 'Germany': 'ESA', 'France': 'ESA', 'Italy': 'ESA', 'Spain': 'ESA' },
    hospital: { 'United States': ['the Mayo Clinic', 'the Cleveland Clinic', 'Johns Hopkins Hospital', 'Massachusetts General Hospital', 'NewYork-Presbyterian'], 'United Kingdom': ['Guy\'s and St Thomas\'', 'St Mary\'s Hospital'], 'Canada': ['Toronto General Hospital', 'Vancouver General Hospital'], 'Australia': ['the Royal Melbourne Hospital', 'Royal Prince Alfred Hospital'], 'Germany': ['Charité Berlin'], 'France': ['Pitié-Salpêtrière Hospital'], 'Japan': ['the University of Tokyo Hospital'], 'South Korea': ['Samsung Medical Center', 'Seoul National University Hospital'], 'India': ['AIIMS Delhi', 'Apollo Hospitals'], 'South Africa': ['Groote Schuur Hospital'], 'Nigeria': ['Lagos University Teaching Hospital'], 'Philippines': ['St. Luke\'s Medical Center'], 'Mexico': ['Hospital Ángeles'], 'Brazil': ['Hospital Israelita Albert Einstein'], 'Italy': ['Gemelli Hospital'], 'Spain': ['Hospital Clínic de Barcelona'], 'Jamaica': ['the University Hospital of the West Indies'] }
  };
  function local(table, country) { var v = LOCAL[table][country]; return v == null ? null : Array.isArray(v) ? U.pick(v) : v; }
  // A real employer for a career, or null to fall back to a made-up one.
  function company(careerId, country) {
    if (careerId === 'military') return local('military', country) || 'the Army';
    if (careerId === 'astronaut') return local('astronaut', country) || 'NASA';
    if (careerId === 'police' || careerId === 'firefighter' || careerId === 'detective') return local(careerId, country);
    if (careerId === 'nurse' || careerId === 'doctor' || careerId === 'surgeon') return local('hospital', country);
    if (careerId === 'professor') return U.pick(universities(country)).name;
    return CO[careerId] ? U.pick(CO[careerId]) : null;
  }

  // ----------------------------------------------------------- sports teams
  var NBA = ['the Los Angeles Lakers', 'the Boston Celtics', 'the Golden State Warriors', 'the Chicago Bulls', 'the Miami Heat', 'the New York Knicks', 'the Toronto Raptors', 'the Dallas Mavericks', 'the Denver Nuggets', 'the Milwaukee Bucks', 'the Phoenix Suns', 'the Philadelphia 76ers'];
  var NFL = ['the Kansas City Chiefs', 'the Dallas Cowboys', 'the Green Bay Packers', 'the New England Patriots', 'the San Francisco 49ers', 'the Pittsburgh Steelers', 'the Philadelphia Eagles', 'the Buffalo Bills', 'the Baltimore Ravens', 'the Detroit Lions', 'the Miami Dolphins', 'the Chicago Bears'];
  var MLB = ['the New York Yankees', 'the Los Angeles Dodgers', 'the Boston Red Sox', 'the Chicago Cubs', 'the San Francisco Giants', 'the Atlanta Braves', 'the Houston Astros', 'the Toronto Blue Jays', 'the St. Louis Cardinals', 'the New York Mets'];
  var NHL = ['the Toronto Maple Leafs', 'the Montreal Canadiens', 'the Edmonton Oilers', 'the Boston Bruins', 'the New York Rangers', 'the Chicago Blackhawks', 'the Vegas Golden Knights', 'the Pittsburgh Penguins', 'the Vancouver Canucks', 'the Detroit Red Wings'];
  var SOCCER = {
    'United States': ['MLS', ['Inter Miami', 'LA Galaxy', 'LAFC', 'Seattle Sounders', 'Atlanta United', 'New York City FC']],
    'Canada': ['MLS', ['Toronto FC', 'CF Montréal', 'Vancouver Whitecaps']],
    'United Kingdom': ['Premier League', ['Manchester United', 'Manchester City', 'Liverpool', 'Arsenal', 'Chelsea', 'Tottenham Hotspur', 'Newcastle United', 'Aston Villa']],
    'Spain': ['La Liga', ['Real Madrid', 'FC Barcelona', 'Atlético Madrid', 'Sevilla', 'Real Sociedad', 'Valencia']],
    'Italy': ['Serie A', ['Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'AS Roma', 'Lazio']],
    'Germany': ['Bundesliga', ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Eintracht Frankfurt']],
    'France': ['Ligue 1', ['Paris Saint-Germain', 'Olympique de Marseille', 'Olympique Lyonnais', 'AS Monaco', 'LOSC Lille']],
    'Mexico': ['Liga MX', ['Club América', 'Chivas', 'Cruz Azul', 'Tigres UANL', 'Monterrey']],
    'Brazil': ['Brasileirão', ['Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo FC', 'Santos', 'Grêmio']],
    'Japan': ['J1 League', ['Kashima Antlers', 'Urawa Red Diamonds', 'Yokohama F. Marinos', 'Kawasaki Frontale']],
    'South Korea': ['K League 1', ['Jeonbuk Hyundai Motors', 'Ulsan HD', 'FC Seoul', 'Pohang Steelers']],
    'India': ['Indian Super League', ['Mohun Bagan', 'Mumbai City FC', 'Bengaluru FC', 'Kerala Blasters']],
    'Nigeria': ['NPFL', ['Enyimba', 'Rangers International', 'Kano Pillars', 'Rivers United']],
    'South Africa': ['PSL', ['Kaizer Chiefs', 'Orlando Pirates', 'Mamelodi Sundowns']],
    'Australia': ['A-League', ['Sydney FC', 'Melbourne Victory', 'Western Sydney Wanderers']],
    'Philippines': ['PFL', ['Kaya–Iloilo', 'Stallion Laguna']],
    'Jamaica': ['Jamaica Premier League', ['Harbour View', 'Cavalier', 'Mount Pleasant']]
  };
  var EURO_BASKET = { 'Spain': ['Real Madrid Baloncesto', 'FC Barcelona Bàsquet'], 'Italy': ['Olimpia Milano', 'Virtus Bologna'], 'Germany': ['Bayern Munich Basketball', 'ALBA Berlin'], 'France': ['ASVEL', 'AS Monaco Basket'] };
  var BASEBALL = { 'Japan': ['NPB', ['Yomiuri Giants', 'Hanshin Tigers', 'Fukuoka SoftBank Hawks', 'Hokkaido Nippon-Ham Fighters']], 'South Korea': ['KBO', ['Doosan Bears', 'LG Twins', 'Kia Tigers', 'Samsung Lions']], 'Mexico': ['LMB', ['Diablos Rojos del México', 'Sultanes de Monterrey']] };
  // A real team for a sport, preferring the player's own country's league.
  function team(sport, country, gender) {
    if (sport === 'Soccer') { var s = SOCCER[country] || SOCCER['United Kingdom']; return U.pick(s[1]) + ' (' + s[0] + ')'; }
    if (sport === 'Basketball') return EURO_BASKET[country] ? U.pick(EURO_BASKET[country]) + ' (EuroLeague)' : U.pick(NBA) + ' (NBA)';
    if (sport === 'Football') return country === 'Canada' && U.chance(.5) ? U.pick(['the Toronto Argonauts', 'the BC Lions', 'the Calgary Stampeders']) + ' (CFL)' : U.pick(NFL) + ' (NFL)';
    if (sport === 'Baseball') { var b = BASEBALL[country]; return b ? U.pick(b[1]) + ' (' + b[0] + ')' : U.pick(MLB) + ' (MLB)'; }
    if (sport === 'Hockey') return U.pick(NHL) + ' (NHL)';
    if (sport === 'Tennis') return gender === 'F' ? 'the WTA Tour' : 'the ATP Tour';
    return null;
  }

  // ------------------------------------------------------------------ cities
  var CITIES = {
    'United States': ['New York City', 'Los Angeles', 'Chicago', 'Houston', 'Atlanta', 'Miami', 'Seattle', 'Philadelphia', 'Phoenix', 'Detroit', 'Denver', 'Nashville'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Glasgow', 'Edinburgh', 'Bristol'],
    'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg'],
    'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast'],
    'Mexico': ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'Cancún'],
    'Brazil': ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Brasília', 'Belo Horizonte', 'Fortaleza'],
    'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart'],
    'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Bordeaux'],
    'Italy': ['Rome', 'Milan', 'Naples', 'Turin', 'Florence', 'Bologna'],
    'Spain': ['Madrid', 'Barcelona', 'Valencia', 'Seville', 'Bilbao', 'Málaga'],
    'Japan': ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kyoto'],
    'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju'],
    'India': ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune'],
    'Nigeria': ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City'],
    'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Gqeberha'],
    'Philippines': ['Manila', 'Quezon City', 'Cebu City', 'Davao City', 'Makati'],
    'Jamaica': ['Kingston', 'Montego Bay', 'Spanish Town', 'Portmore', 'Ocho Rios']
  };
  function city(country) { return U.pick(CITIES[country] || CITIES['United States']); }

  // -------------------------------------------------------------------- cars
  // Real makes and models for each vehicle class in data.js (same prices).
  var CAR_MODELS = {
    'Used Hatchback': ['Honda Fit', 'Toyota Yaris', 'Ford Fiesta', 'Volkswagen Golf', 'Nissan Versa'],
    'Scooter': ['Vespa Primavera', 'Honda PCX', 'Yamaha NMAX'],
    'Motorcycle': ['Harley-Davidson Sportster', 'Kawasaki Ninja 650', 'Ducati Monster', 'Yamaha MT-07', 'Triumph Bonneville'],
    'Compact Sedan': ['Honda Civic', 'Toyota Corolla', 'Hyundai Elantra', 'Mazda3', 'Kia Forte'],
    'Minivan': ['Honda Odyssey', 'Toyota Sienna', 'Chrysler Pacifica', 'Kia Carnival'],
    'Pickup Truck': ['Ford F-150', 'Chevrolet Silverado', 'Ram 1500', 'Toyota Tacoma', 'Toyota Hilux'],
    'Family SUV': ['Toyota RAV4', 'Honda CR-V', 'Ford Explorer', 'Subaru Outback', 'Kia Telluride', 'Hyundai Tucson'],
    'Electric Sedan': ['Tesla Model 3', 'Tesla Model S', 'Hyundai Ioniq 6', 'Polestar 2', 'Lucid Air', 'BYD Seal'],
    'Luxury Sedan': ['BMW 5 Series', 'Mercedes-Benz E-Class', 'Audi A6', 'Lexus ES', 'Genesis G80'],
    'Sports Coupe': ['Porsche 911', 'Chevrolet Corvette', 'BMW M4', 'Ford Mustang GT', 'Nissan GT-R'],
    'Luxury SUV': ['Range Rover', 'Mercedes-Benz G-Class', 'Porsche Cayenne', 'Cadillac Escalade', 'BMW X7'],
    'Supercar': ['Lamborghini Huracán', 'Ferrari 296 GTB', 'McLaren 750S', 'Audi R8'],
    'Hypercar': ['Bugatti Chiron', 'Koenigsegg Jesko', 'Pagani Huayra', 'Rimac Nevera'],
    'Private Jet': ['Gulfstream G700', 'Bombardier Global 7500', 'Cessna Citation Latitude', 'Embraer Phenom 300'],
    'Superyacht': ['Feadship superyacht', 'Lürssen superyacht', 'Benetti superyacht', 'Sunseeker yacht']
  };
  function carModel(type) { return CAR_MODELS[type] ? U.pick(CAR_MODELS[type]) : type; }

  return { city: city, carModel: carModel, universities: universities, tuition: tuition, admitChance: admitChance, TIER_LABEL: TIER_LABEL, company: company, team: team };
})();
