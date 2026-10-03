/* TheLife — static game data. All money values are in base "US dollars"; the
 * engine scales them with the current country's `k` factor (currency * wealth). */
TL.data = (function () {
  var COUNTRIES = [
    { name: 'United States', flag: '🇺🇸', cur: '$', k: 1, life: 79, tax: 0.24,
      male: ['James', 'Michael', 'Jayden', 'Ethan', 'Noah', 'Liam', 'Mason', 'Logan', 'Tyrone', 'Marcus', 'Carter', 'Wyatt', 'Andre', 'Caleb', 'Hunter', 'Dylan'],
      female: ['Emma', 'Olivia', 'Ava', 'Sophia', 'Madison', 'Aaliyah', 'Harper', 'Chloe', 'Brianna', 'Kayla', 'Zoe', 'Abigail', 'Destiny', 'Hailey', 'Riley', 'Nevaeh'],
      last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis', 'Miller', 'Wilson', 'Jackson', 'Thompson', 'Harris', 'Robinson', 'Walker', 'Young', 'King', 'Carter', 'Washington', 'Brooks'] },
    { name: 'United Kingdom', flag: '🇬🇧', cur: '£', k: 0.8, life: 81, tax: 0.25,
      male: ['Oliver', 'George', 'Harry', 'Jack', 'Charlie', 'Alfie', 'Freddie', 'Archie', 'Theo', 'Oscar', 'Callum', 'Rhys', 'Kian', 'Declan'],
      female: ['Amelia', 'Isla', 'Poppy', 'Ella', 'Lily', 'Evie', 'Freya', 'Sienna', 'Imogen', 'Maisie', 'Niamh', 'Rosie', 'Phoebe', 'Tilly'],
      last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Evans', 'Wright', 'Walker', 'Hughes', 'Green', 'Hall', 'Clarke', 'Patel', 'Wood', 'Turner', 'Cooper', 'Ward'] },
    { name: 'Canada', flag: '🇨🇦', cur: 'C$', k: 1.25, life: 82, tax: 0.26,
      male: ['Liam', 'Lucas', 'Benjamin', 'William', 'Nathan', 'Owen', 'Félix', 'Logan', 'Samuel', 'Jacob', 'Connor', 'Émile'],
      female: ['Charlotte', 'Olivia', 'Emma', 'Léa', 'Chloé', 'Avery', 'Maya', 'Sophie', 'Zoé', 'Brooklyn', 'Megan', 'Camille'],
      last: ['Tremblay', 'Gagnon', 'Roy', 'Côté', 'Smith', 'Brown', 'Martin', 'Campbell', 'MacDonald', 'Wilson', 'Leblanc', 'Anderson', 'Singh', 'Bouchard'] },
    { name: 'Australia', flag: '🇦🇺', cur: 'A$', k: 1.4, life: 83, tax: 0.27,
      male: ['Jack', 'Cooper', 'Lachlan', 'Riley', 'Hudson', 'Harrison', 'Mitchell', 'Bailey', 'Flynn', 'Kai', 'Jayden', 'Tom'],
      female: ['Charlotte', 'Matilda', 'Isla', 'Mia', 'Grace', 'Ruby', 'Chloe', 'Sienna', 'Jasmine', 'Tahlia', 'Kirra', 'Holly'],
      last: ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Nguyen', 'Kelly', 'Ryan', 'Murphy', 'Mitchell', "O'Brien", 'Kennedy'] },
    { name: 'Mexico', flag: '🇲🇽', cur: 'MX$', k: 7, life: 75, tax: 0.2,
      male: ['Santiago', 'Mateo', 'Diego', 'José', 'Luis', 'Juan', 'Carlos', 'Miguel', 'Alejandro', 'Emiliano', 'Jorge', 'Ricardo'],
      female: ['Sofía', 'Valentina', 'Regina', 'Camila', 'Ximena', 'María', 'Guadalupe', 'Fernanda', 'Daniela', 'Mariana', 'Lucía', 'Renata'],
      last: ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Reyes'] },
    { name: 'Brazil', flag: '🇧🇷', cur: 'R$', k: 2.4, life: 76, tax: 0.22,
      male: ['Miguel', 'Arthur', 'Heitor', 'Bernardo', 'Davi', 'Gabriel', 'Pedro', 'Lucas', 'Rafael', 'Thiago', 'João', 'Caio'],
      female: ['Alice', 'Helena', 'Laura', 'Manuela', 'Valentina', 'Sophia', 'Isabella', 'Beatriz', 'Larissa', 'Ana', 'Júlia', 'Yasmin'],
      last: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Carvalho'] },
    { name: 'Germany', flag: '🇩🇪', cur: '€', k: 0.85, life: 81, tax: 0.3,
      male: ['Ben', 'Paul', 'Leon', 'Finn', 'Elias', 'Jonas', 'Luis', 'Felix', 'Lukas', 'Maximilian', 'Tobias', 'Niklas'],
      female: ['Mia', 'Emma', 'Hannah', 'Sofia', 'Anna', 'Lea', 'Lena', 'Marie', 'Clara', 'Lina', 'Johanna', 'Greta'],
      last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Koch', 'Richter', 'Wolf'] },
    { name: 'France', flag: '🇫🇷', cur: '€', k: 0.82, life: 82, tax: 0.3,
      male: ['Gabriel', 'Léo', 'Raphaël', 'Louis', 'Arthur', 'Hugo', 'Jules', 'Adam', 'Lucas', 'Théo', 'Mathis', 'Enzo'],
      female: ['Jade', 'Louise', 'Emma', 'Alice', 'Chloé', 'Lina', 'Léa', 'Manon', 'Inès', 'Camille', 'Margaux', 'Juliette'],
      last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre'] },
    { name: 'Italy', flag: '🇮🇹', cur: '€', k: 0.7, life: 83, tax: 0.3,
      male: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Andrea', 'Gabriele', 'Riccardo', 'Marco', 'Giuseppe', 'Luca', 'Matteo'],
      female: ['Sofia', 'Giulia', 'Aurora', 'Alice', 'Ginevra', 'Emma', 'Giorgia', 'Beatrice', 'Chiara', 'Francesca', 'Martina', 'Elena'],
      last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti'] },
    { name: 'Spain', flag: '🇪🇸', cur: '€', k: 0.65, life: 83, tax: 0.28,
      male: ['Hugo', 'Martín', 'Lucas', 'Pablo', 'Daniel', 'Alejandro', 'Álvaro', 'Adrián', 'Javier', 'Sergio', 'Diego', 'Mario'],
      female: ['Lucía', 'Sofía', 'Martina', 'María', 'Paula', 'Julia', 'Carmen', 'Valeria', 'Alba', 'Noa', 'Irene', 'Elena'],
      last: ['García', 'Fernández', 'González', 'Rodríguez', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Navarro'] },
    { name: 'Japan', flag: '🇯🇵', cur: '¥', k: 110, life: 85, tax: 0.23,
      male: ['Haruto', 'Sota', 'Yuto', 'Riku', 'Hinata', 'Ren', 'Kaito', 'Takumi', 'Daiki', 'Kenji', 'Hiroshi', 'Shota'],
      female: ['Yui', 'Himari', 'Mio', 'Sakura', 'Hina', 'Aoi', 'Rin', 'Yuna', 'Akari', 'Emi', 'Haruka', 'Nanami'],
      last: ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Yamada', 'Sasaki'] },
    { name: 'South Korea', flag: '🇰🇷', cur: '₩', k: 950, life: 83, tax: 0.24,
      male: ['Min-jun', 'Seo-jun', 'Do-yun', 'Ji-ho', 'Ha-jun', 'Joon-woo', 'Hyun-woo', 'Ji-hoon', 'Sung-min', 'Tae-yang'],
      female: ['Seo-yeon', 'Ji-woo', 'Ha-eun', 'Min-seo', 'Soo-ah', 'Ji-yoo', 'Yoon-seo', 'Chae-won', 'Da-eun', 'Ye-jin'],
      last: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Shin'] },
    { name: 'India', flag: '🇮🇳', cur: '₹', k: 22, life: 70, tax: 0.18,
      male: ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Sai', 'Rohan', 'Ishaan', 'Kabir', 'Rahul', 'Vikram', 'Amit', 'Karan'],
      female: ['Aadhya', 'Ananya', 'Diya', 'Saanvi', 'Priya', 'Isha', 'Kavya', 'Meera', 'Riya', 'Neha', 'Pooja', 'Aarohi'],
      last: ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Iyer', 'Nair', 'Mehta', 'Joshi', 'Das', 'Rao', 'Chopra', 'Verma'] },
    { name: 'Nigeria', flag: '🇳🇬', cur: '₦', k: 300, life: 62, tax: 0.18,
      male: ['Chinedu', 'Emeka', 'Oluwaseun', 'Tunde', 'Ifeanyi', 'Chukwuemeka', 'Ayodele', 'Babajide', 'Obinna', 'Kelechi', 'Femi', 'Musa'],
      female: ['Adaeze', 'Chiamaka', 'Ngozi', 'Folake', 'Funmilayo', 'Amaka', 'Temitope', 'Zainab', 'Ifeoma', 'Yetunde', 'Aisha', 'Blessing'],
      last: ['Okafor', 'Adeyemi', 'Okonkwo', 'Balogun', 'Nwosu', 'Eze', 'Ogunleye', 'Bello', 'Ibrahim', 'Okeke', 'Adebayo', 'Chukwu'] },
    { name: 'South Africa', flag: '🇿🇦', cur: 'R', k: 7, life: 66, tax: 0.24,
      male: ['Thabo', 'Sipho', 'Lwazi', 'Bandile', 'Kagiso', 'Pieter', 'Johan', 'Liam', 'Mandla', 'Tshepo', 'Themba', 'Ethan'],
      female: ['Lerato', 'Naledi', 'Ayanda', 'Zanele', 'Thandiwe', 'Anele', 'Lindiwe', 'Amahle', 'Busisiwe', 'Chloe', 'Nomvula', 'Mia'],
      last: ['Nkosi', 'Dlamini', 'Ndlovu', 'Khumalo', 'Mokoena', 'van der Merwe', 'Botha', 'Naidoo', 'Mahlangu', 'Zulu', 'Pretorius', 'Mthembu'] },
    { name: 'Philippines', flag: '🇵🇭', cur: '₱', k: 20, life: 72, tax: 0.2,
      male: ['Jose', 'Juan', 'Mark', 'John Paul', 'Christian', 'Angelo', 'Paolo', 'Miguel', 'Carlo', 'Rafael', 'Jericho', 'Nathaniel'],
      female: ['Maria', 'Angel', 'Princess', 'Mary Grace', 'Kristine', 'Jasmine', 'Andrea', 'Nicole', 'Bea', 'Althea', 'Joy', 'Camille'],
      last: ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Villanueva', 'Ramos', 'Aquino', 'Dela Cruz'] },
    { name: 'Jamaica', flag: '🇯🇲', cur: 'J$', k: 90, life: 75, tax: 0.25,
      male: ['Andre', 'Dwayne', 'Kemar', 'Jermaine', 'Omar', 'Rohan', 'Shamar', 'Delroy', 'Tajay', 'Romario', 'Javane', 'Leon'],
      female: ['Shanice', 'Tanisha', 'Kimone', 'Shantel', 'Monique', 'Tamara', 'Alecia', 'Kerry-Ann', 'Rushane', 'Nadine', 'Sasha', 'Jada'],
      last: ['Brown', 'Williams', 'Campbell', 'Thomas', 'Clarke', 'Grant', 'Reid', 'Morgan', 'Francis', 'Stewart', 'Henry', 'Bailey'] }
  ];

  // Education ranks: higher number = more education.
  var EDU_RANK = { none: 0, hs: 1, trade: 1, bachelor: 2, mba: 3, law: 3, med: 3, vet: 3, dental: 3, phd: 4 };
  // Trade school specialties (2 years, after high school).
  var TRADES = [['Electrical', '⚡'], ['Plumbing', '🔧'], ['Welding', '🔥'], ['HVAC', '❄️']];

  var MAJORS = ['Accounting', 'Architecture', 'Art', 'Biology', 'Business', 'Chemistry', 'Communications',
    'Computer Science', 'Criminal Justice', 'Economics', 'Education', 'Engineering', 'English', 'Finance',
    'Graphic Design', 'History', 'Journalism', 'Marketing', 'Mathematics', 'Music', 'Nursing', 'Philosophy',
    'Physics', 'Political Science', 'Psychology', 'Theater'];
  var PREMED = ['Biology', 'Chemistry', 'Nursing', 'Psychology', 'Physics'];

  var GRAD_SCHOOLS = [
    { id: 'law', name: 'Law School', years: 3, cost: 50000, minSmarts: 60, degree: 'Juris Doctor' },
    { id: 'med', name: 'Medical School', years: 4, cost: 60000, minSmarts: 72, majors: PREMED, degree: 'Doctor of Medicine' },
    { id: 'mba', name: 'Business School (MBA)', years: 2, cost: 60000, minSmarts: 55, degree: 'MBA' },
    { id: 'phd', name: 'Graduate School (PhD)', years: 5, cost: 0, minSmarts: 70, degree: 'PhD' },
    { id: 'vet', name: 'Veterinary School', years: 4, cost: 45000, minSmarts: 66, majors: PREMED, degree: 'Doctor of Veterinary Medicine' },
    { id: 'dental', name: 'Dental School', years: 4, cost: 55000, minSmarts: 68, majors: PREMED, degree: 'Doctor of Dental Surgery' }
  ];

  /* Careers. levels: [title, base salary]. edu: minimum degree. majors: required
   * bachelor majors (any if omitted). stat: governing stat used for hiring and
   * performance. */
  var CAREERS = [
    // No education
    { id: 'fastfood', name: 'Fast Food', edu: 'none', minAge: 16, stat: 'happy', levels: [['Crew Member', 19000], ['Shift Leader', 24000], ['Assistant Manager', 32000], ['Restaurant Manager', 48000]] },
    { id: 'retail', name: 'Retail', edu: 'none', minAge: 16, stat: 'looks', levels: [['Sales Associate', 22000], ['Senior Associate', 27000], ['Department Lead', 34000], ['Store Manager', 52000]] },
    { id: 'janitor', name: 'Custodial', edu: 'none', minAge: 18, stat: 'health', levels: [['Janitor', 24000], ['Senior Janitor', 29000], ['Head Custodian', 36000]] },
    { id: 'construction', name: 'Construction', edu: 'none', minAge: 18, stat: 'athl', levels: [['Laborer', 32000], ['Carpenter', 45000], ['Foreman', 62000], ['Site Manager', 88000]] },
    { id: 'waiter', name: 'Hospitality', edu: 'none', minAge: 16, stat: 'looks', levels: [['Busser', 18000], ['Waiter', 26000], ['Head Waiter', 34000], ['Maître d\'', 46000]] },
    { id: 'driver', name: 'Transport', edu: 'none', minAge: 21, stat: 'health', levels: [['Delivery Driver', 34000], ['Truck Driver', 52000], ['Senior Trucker', 64000], ['Fleet Manager', 80000]] },
    { id: 'security', name: 'Security', edu: 'none', minAge: 18, stat: 'athl', levels: [['Security Guard', 28000], ['Senior Guard', 34000], ['Security Supervisor', 46000]] },
    { id: 'barber', name: 'Salon', edu: 'none', minAge: 18, stat: 'looks', levels: [['Hairstylist Apprentice', 21000], ['Hairstylist', 32000], ['Senior Stylist', 45000], ['Salon Owner', 70000]] },
    { id: 'model', name: 'Modeling', edu: 'none', minAge: 16, stat: 'looks', minStat: 78, fame: 2, levels: [['Catalog Model', 30000], ['Fashion Model', 70000], ['Runway Model', 160000], ['Supermodel', 900000]] },
    // High school
    { id: 'military', name: 'Military', edu: 'hs', minAge: 18, stat: 'athl', levels: [['Private', 25000], ['Corporal', 32000], ['Sergeant', 42000], ['Lieutenant', 56000], ['Captain', 72000], ['Major', 90000], ['Colonel', 115000], ['General', 195000]] },
    { id: 'police', name: 'Law Enforcement', edu: 'hs', minAge: 21, stat: 'athl', noRecord: true, levels: [['Police Officer', 48000], ['Detective', 70000], ['Sergeant', 82000], ['Lieutenant', 96000], ['Police Chief', 145000]] },
    { id: 'firefighter', name: 'Fire Department', edu: 'hs', minAge: 18, stat: 'athl', levels: [['Firefighter', 45000], ['Engineer', 58000], ['Fire Captain', 76000], ['Fire Chief', 115000]] },
    { id: 'mechanic', name: 'Auto Repair', edu: 'hs', minAge: 18, stat: 'smarts', levels: [['Apprentice Mechanic', 30000], ['Mechanic', 45000], ['Master Mechanic', 62000], ['Shop Owner', 90000]] },
    { id: 'realestate', name: 'Real Estate', edu: 'hs', minAge: 18, stat: 'looks', levels: [['Leasing Agent', 32000], ['Real Estate Agent', 60000], ['Senior Broker', 110000], ['Brokerage Owner', 200000]] },
    { id: 'chef', name: 'Culinary', edu: 'hs', minAge: 18, stat: 'smarts', levels: [['Line Cook', 28000], ['Sous Chef', 42000], ['Head Chef', 65000], ['Executive Chef', 98000]] },
    { id: 'flight', name: 'Aviation', edu: 'hs', minAge: 21, stat: 'looks', levels: [['Flight Attendant', 45000], ['Senior Flight Attendant', 58000], ['Purser', 72000]] },
    // Bachelor
    { id: 'software', name: 'Software', edu: 'bachelor', majors: ['Computer Science', 'Mathematics', 'Engineering', 'Physics'], minAge: 20, stat: 'smarts', levels: [['Junior Developer', 72000], ['Software Engineer', 98000], ['Senior Engineer', 138000], ['Staff Engineer', 175000], ['Engineering Director', 220000], ['CTO', 340000]] },
    { id: 'accountant', name: 'Accounting', edu: 'bachelor', majors: ['Accounting', 'Finance', 'Business', 'Economics', 'Mathematics'], minAge: 20, stat: 'smarts', levels: [['Junior Accountant', 52000], ['Accountant', 68000], ['Senior Accountant', 88000], ['Controller', 125000], ['CFO', 260000]] },
    { id: 'teacher', name: 'Teaching', edu: 'bachelor', minAge: 21, stat: 'smarts', levels: [['Substitute Teacher', 32000], ['Teacher', 50000], ['Senior Teacher', 62000], ['Vice Principal', 82000], ['Principal', 105000]] },
    { id: 'nurse', name: 'Nursing', edu: 'bachelor', majors: ['Nursing', 'Biology'], minAge: 21, stat: 'smarts', levels: [['Nursing Assistant', 36000], ['Registered Nurse', 76000], ['Charge Nurse', 90000], ['Nurse Manager', 112000]] },
    { id: 'journalist', name: 'Journalism', edu: 'bachelor', majors: ['Journalism', 'English', 'Communications', 'Political Science', 'History'], minAge: 21, stat: 'smarts', fame: 1, levels: [['Staff Writer', 40000], ['Reporter', 55000], ['Senior Correspondent', 78000], ['Editor', 98000], ['Editor-in-Chief', 160000]] },
    { id: 'design', name: 'Design', edu: 'bachelor', majors: ['Art', 'Graphic Design', 'Architecture', 'Marketing', 'Communications'], minAge: 21, stat: 'smarts', levels: [['Junior Designer', 45000], ['Graphic Designer', 60000], ['Senior Designer', 82000], ['Art Director', 120000], ['Creative Director', 175000]] },
    { id: 'marketing', name: 'Marketing', edu: 'bachelor', majors: ['Marketing', 'Business', 'Communications', 'Economics', 'Psychology', 'Journalism'], minAge: 21, stat: 'looks', levels: [['Marketing Coordinator', 46000], ['Marketing Specialist', 62000], ['Marketing Manager', 95000], ['Marketing Director', 150000], ['CMO', 250000]] },
    { id: 'engineer', name: 'Engineering', edu: 'bachelor', majors: ['Engineering', 'Physics', 'Mathematics'], minAge: 21, stat: 'smarts', levels: [['Engineer in Training', 65000], ['Engineer', 85000], ['Senior Engineer', 110000], ['Principal Engineer', 145000], ['Chief Engineer', 190000]] },
    { id: 'finance', name: 'Finance', edu: 'bachelor', majors: ['Finance', 'Economics', 'Mathematics', 'Business', 'Accounting'], minAge: 21, stat: 'smarts', levels: [['Financial Analyst', 75000], ['Associate', 120000], ['Vice President', 190000], ['Director', 300000], ['Managing Director', 650000]] },
    { id: 'architect', name: 'Architecture', edu: 'bachelor', majors: ['Architecture', 'Engineering', 'Art'], minAge: 22, stat: 'smarts', levels: [['Architectural Intern', 50000], ['Architect', 82000], ['Senior Architect', 110000], ['Principal Architect', 160000]] },
    { id: 'social', name: 'Social Work', edu: 'bachelor', majors: ['Psychology', 'Education', 'Philosophy', 'Criminal Justice', 'History', 'English'], minAge: 21, stat: 'happy', levels: [['Caseworker', 38000], ['Social Worker', 52000], ['Senior Social Worker', 64000], ['Program Director', 85000]] },
    { id: 'detective', name: 'Federal Agency', edu: 'bachelor', majors: ['Criminal Justice', 'Political Science', 'Psychology', 'Computer Science', 'Accounting'], minAge: 23, stat: 'athl', noRecord: true, levels: [['Special Agent Trainee', 58000], ['Special Agent', 82000], ['Senior Special Agent', 108000], ['Special Agent in Charge', 150000], ['Bureau Director', 220000]] },
    { id: 'pilot', name: 'Airline Pilot', edu: 'bachelor', minAge: 23, stat: 'smarts', minStat: 55, levels: [['First Officer', 85000], ['Captain', 190000], ['Senior Captain', 260000]] },
    // Graduate
    { id: 'lawyer', name: 'Law', edu: 'law', minAge: 24, stat: 'smarts', levels: [['Junior Associate', 90000], ['Associate', 135000], ['Senior Associate', 180000], ['Partner', 340000], ['Managing Partner', 600000]] },
    { id: 'judge', name: 'Judiciary', edu: 'law', minAge: 38, stat: 'smarts', minStat: 70, noRecord: true, levels: [['Magistrate', 140000], ['District Judge', 205000], ['Appeals Judge', 235000], ['Supreme Court Justice', 285000]] },
    { id: 'doctor', name: 'Medicine', edu: 'med', minAge: 26, stat: 'smarts', levels: [['Resident', 64000], ['Physician', 215000], ['Attending Physician', 290000], ['Chief of Medicine', 430000]] },
    { id: 'surgeon', name: 'Surgery', edu: 'med', minAge: 27, stat: 'smarts', minStat: 75, levels: [['Surgical Resident', 68000], ['Surgeon', 360000], ['Senior Surgeon', 480000], ['Chief of Surgery', 650000]] },
    { id: 'executive', name: 'Corporate', edu: 'mba', minAge: 24, stat: 'smarts', levels: [['Management Associate', 105000], ['Manager', 140000], ['Vice President', 230000], ['Senior VP', 380000], ['CEO', 1200000]] },
    { id: 'professor', name: 'Academia', edu: 'phd', minAge: 26, stat: 'smarts', levels: [['Postdoc', 56000], ['Assistant Professor', 82000], ['Associate Professor', 108000], ['Professor', 150000], ['Dean', 240000]] },
    { id: 'scientist', name: 'Research', edu: 'phd', minAge: 26, stat: 'smarts', levels: [['Research Scientist', 96000], ['Senior Scientist', 132000], ['Principal Scientist', 180000], ['Chief Scientist', 260000]] },
    { id: 'vet', name: 'Veterinary', edu: 'vet', minAge: 25, stat: 'smarts', levels: [['Associate Veterinarian', 95000], ['Veterinarian', 115000], ['Senior Veterinarian', 135000], ['Clinic Owner', 190000]] },
    { id: 'dentist', name: 'Dentistry', edu: 'dental', minAge: 25, stat: 'smarts', levels: [['Associate Dentist', 140000], ['Dentist', 175000], ['Senior Dentist', 210000], ['Practice Owner', 300000]] },
    // v1.4 careers
    { id: 'electrician', name: 'Electrical', edu: 'trade', majors: ['Electrical'], minAge: 18, stat: 'smarts', levels: [['Apprentice Electrician', 38000], ['Journeyman Electrician', 62000], ['Master Electrician', 85000], ['Electrical Contractor', 130000]] },
    { id: 'plumber', name: 'Plumbing', edu: 'trade', majors: ['Plumbing'], minAge: 18, stat: 'health', levels: [['Apprentice Plumber', 36000], ['Plumber', 58000], ['Master Plumber', 80000], ['Plumbing Contractor', 120000]] },
    { id: 'welder', name: 'Welding', edu: 'trade', majors: ['Welding'], minAge: 18, stat: 'athl', levels: [['Welder\'s Helper', 34000], ['Welder', 52000], ['Certified Welder', 68000], ['Welding Supervisor', 90000]] },
    { id: 'hvac', name: 'HVAC', edu: 'trade', majors: ['HVAC'], minAge: 18, stat: 'smarts', levels: [['HVAC Apprentice', 35000], ['HVAC Technician', 56000], ['Senior HVAC Technician', 72000], ['HVAC Contractor', 110000]] },
    { id: 'trainer', name: 'Fitness', edu: 'hs', minAge: 18, stat: 'athl', minStat: 60, levels: [['Personal Trainer', 34000], ['Senior Trainer', 48000], ['Head Trainer', 62000], ['Gym Owner', 95000]] },
    { id: 'gamedev', name: 'Game Development', edu: 'bachelor', majors: ['Computer Science', 'Graphic Design', 'Art', 'Mathematics'], minAge: 21, stat: 'smarts', levels: [['Junior Game Developer', 62000], ['Game Developer', 85000], ['Senior Game Developer', 115000], ['Lead Designer', 145000], ['Studio Director', 210000]] },
    { id: 'zookeeper', name: 'Zoo', edu: 'bachelor', majors: ['Biology'], minAge: 21, stat: 'health', levels: [['Zookeeper', 36000], ['Senior Zookeeper', 45000], ['Curator', 68000], ['Zoo Director', 110000]] },
    { id: 'pharmacist', name: 'Pharmacy', edu: 'bachelor', majors: ['Chemistry', 'Biology'], minAge: 22, stat: 'smarts', minStat: 60, levels: [['Pharmacy Intern', 40000], ['Pharmacist', 125000], ['Senior Pharmacist', 140000], ['Pharmacy Director', 165000]] },
    { id: 'fashion', name: 'Fashion', edu: 'bachelor', majors: ['Art', 'Graphic Design', 'Marketing'], minAge: 21, stat: 'looks', levels: [['Design Assistant', 38000], ['Fashion Designer', 65000], ['Senior Fashion Designer', 95000], ['Creative Director', 180000]] },
    // Astronauts are chosen from very few applicants: hard (-0.5 hire chance) and fit.
    { id: 'astronaut', name: 'Space Agency', edu: 'bachelor', majors: ['Engineering', 'Physics', 'Mathematics', 'Computer Science', 'Biology', 'Chemistry'], minAge: 26, maxAge: 46, stat: 'smarts', minStat: 75, hard: 0.5,
      req: function () { return TL.S.me.athl < 60 ? 'Needs athleticism 60+' : null; },
      levels: [['Astronaut Candidate', 70000], ['Astronaut', 105000], ['Mission Specialist', 130000], ['Mission Commander', 165000], ['Chief Astronaut', 190000]] }
  ];

  // Part-time and freelance work for teens and students.
  var PART_TIME = [
    { id: 'pt_babysit', name: 'Babysitter', minAge: 13, salary: 5000 },
    { id: 'pt_paper', name: 'Newspaper Delivery', minAge: 12, salary: 3500 },
    { id: 'pt_dogwalk', name: 'Dog Walker', minAge: 12, salary: 4000 },
    { id: 'pt_lifeguard', name: 'Lifeguard', minAge: 15, salary: 8000, stat: 'athl' },
    { id: 'pt_grocery', name: 'Grocery Bagger', minAge: 14, salary: 7000 },
    { id: 'pt_barista', name: 'Barista', minAge: 16, salary: 10000 },
    { id: 'pt_tutor', name: 'Tutor', minAge: 15, salary: 9000, stat: 'smarts', minStat: 65 },
    { id: 'pt_cashier', name: 'Cashier', minAge: 15, salary: 8500 },
    { id: 'pt_rideshare', name: 'Rideshare Driver', minAge: 21, salary: 16000 },
    { id: 'pt_valet', name: 'Valet', minAge: 18, salary: 12000 }
  ];

  // Fame careers: entered through auditions/tryouts, pay scales with fame.
  var FAME_CAREERS = [
    { id: 'actor', name: 'Acting', verb: 'Audition', stat: 'looks', minAge: 8,
      levels: [['Extra', 12000], ['Background Actor', 25000], ['Supporting Actor', 90000], ['Lead Actor', 450000], ['Movie Star', 4000000], ['A-List Legend', 15000000]] },
    { id: 'musician', name: 'Music', verb: 'Record a demo', stat: 'smarts', minAge: 12,
      levels: [['Street Performer', 8000], ['Local Act', 22000], ['Signed Artist', 120000], ['Chart Topper', 1500000], ['Superstar', 9000000], ['Icon', 25000000]] },
    { id: 'athlete', name: 'Pro Sports', verb: 'Try out', stat: 'athl', minAge: 17, maxAge: 32,
      levels: [['Practice Squad', 60000], ['Bench Player', 450000], ['Starter', 2500000], ['All-Star', 12000000], ['MVP', 30000000]] }
  ];
  // Politics: offices are won in elections, then held for 4-year terms.
  var POLITICS = { id: 'politician', name: 'Politics', stat: 'looks', minAge: 25, termLimit: 2,
    levels: [['City Council Member', 45000], ['Mayor', 120000], ['Governor', 180000], ['Senator', 175000], ['President', 400000]] };
  var SPORTS = ['Basketball', 'Football', 'Soccer', 'Baseball', 'Hockey', 'Tennis'];
  var GENRES = ['Pop', 'Hip Hop', 'Rock', 'Country', 'R&B', 'EDM', 'Jazz', 'Reggae', 'Indie', 'Latin'];

  var HOUSES = [
    { type: 'Studio Apartment', min: 60000, max: 140000, beds: 0, upkeep: 0.012 },
    { type: 'Condo', min: 120000, max: 320000, beds: 2, upkeep: 0.012 },
    { type: 'Townhouse', min: 180000, max: 420000, beds: 3, upkeep: 0.012 },
    { type: 'Starter Home', min: 150000, max: 300000, beds: 2, upkeep: 0.014 },
    { type: 'Family House', min: 280000, max: 600000, beds: 4, upkeep: 0.014 },
    { type: 'Farmhouse', min: 250000, max: 700000, beds: 4, upkeep: 0.015 },
    { type: 'Beach House', min: 600000, max: 2200000, beds: 4, upkeep: 0.016 },
    { type: 'Penthouse', min: 1200000, max: 6000000, beds: 3, upkeep: 0.012 },
    { type: 'Luxury Villa', min: 1800000, max: 7000000, beds: 6, upkeep: 0.016 },
    { type: 'Mansion', min: 4000000, max: 25000000, beds: 10, upkeep: 0.018 },
    { type: 'Castle', min: 15000000, max: 60000000, beds: 25, upkeep: 0.02 }
  ];
  var STREETS = ['Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Willow', 'Lake', 'Hill', 'Sunset', 'River', 'Park', 'Birch', 'Harbor', 'Ocean', 'Highland', 'Meadow', 'Ridge', 'Valley'];
  var STREET_TYPES = ['St', 'Ave', 'Rd', 'Ln', 'Blvd', 'Way', 'Ct', 'Dr'];

  var CARS = [
    { type: 'Used Hatchback', min: 3000, max: 9000 },
    { type: 'Scooter', min: 1500, max: 4000 },
    { type: 'Motorcycle', min: 6000, max: 22000 },
    { type: 'Compact Sedan', min: 18000, max: 28000 },
    { type: 'Minivan', min: 30000, max: 45000 },
    { type: 'Pickup Truck', min: 32000, max: 65000 },
    { type: 'Family SUV', min: 35000, max: 60000 },
    { type: 'Electric Sedan', min: 42000, max: 95000 },
    { type: 'Luxury Sedan', min: 60000, max: 140000 },
    { type: 'Sports Coupe', min: 70000, max: 180000 },
    { type: 'Luxury SUV', min: 90000, max: 220000 },
    { type: 'Supercar', min: 250000, max: 600000 },
    { type: 'Hypercar', min: 1500000, max: 3500000 },
    { type: 'Private Jet', min: 3000000, max: 70000000 },
    { type: 'Superyacht', min: 8000000, max: 150000000 }
  ];
  var CAR_COLORS = ['Black', 'White', 'Silver', 'Red', 'Blue', 'Gray', 'Green', 'Yellow', 'Orange', 'Midnight Blue', 'Pearl White'];

  var JEWELRY = [
    { type: 'Silver Necklace', price: 400 }, { type: 'Gold Watch', price: 4500 }, { type: 'Diamond Earrings', price: 9000 },
    { type: 'Engagement Ring', price: 6000, ring: true }, { type: 'Luxury Engagement Ring', price: 30000, ring: true },
    { type: 'Pearl Necklace', price: 2500 }, { type: 'Ruby Bracelet', price: 12000 }, { type: 'Diamond Tiara', price: 250000 },
    { type: 'Rare Painting', price: 750000 }
  ];

  var PETS = [
    { species: 'Dog', breeds: ['Labrador', 'German Shepherd', 'Golden Retriever', 'Beagle', 'Poodle', 'Bulldog', 'Husky', 'Chihuahua', 'Pit Bull', 'Mutt'], price: 800, life: 13 },
    { species: 'Cat', breeds: ['Tabby', 'Siamese', 'Persian', 'Maine Coon', 'Sphynx', 'Bengal', 'Calico'], price: 300, life: 15 },
    { species: 'Rabbit', breeds: ['Holland Lop', 'Lionhead', 'Rex'], price: 120, life: 9 },
    { species: 'Parrot', breeds: ['African Grey', 'Macaw', 'Cockatoo', 'Budgie'], price: 1500, life: 40 },
    { species: 'Hamster', breeds: ['Syrian', 'Dwarf'], price: 40, life: 3 },
    { species: 'Snake', breeds: ['Ball Python', 'Corn Snake', 'Boa'], price: 250, life: 20 },
    { species: 'Horse', breeds: ['Arabian', 'Thoroughbred', 'Mustang', 'Clydesdale'], price: 12000, life: 28 },
    { species: 'Tortoise', breeds: ['Sulcata', 'Russian'], price: 350, life: 80 }
  ];
  var PET_NAMES = ['Max', 'Bella', 'Charlie', 'Luna', 'Rocky', 'Daisy', 'Milo', 'Coco', 'Buddy', 'Lola', 'Zeus', 'Nala', 'Toby', 'Pepper', 'Shadow', 'Oreo', 'Biscuit', 'Ginger', 'Bruno', 'Mochi'];

  /* Illnesses. dmg: health lost per year untreated. cure: chance a doctor cures.
   * incurable conditions can only be managed (treatment halves damage). */
  var ILLNESSES = [
    { name: 'Common Cold', minAge: 0, p: 0.07, dmg: 3, cure: 0.95, cost: 80, selfHeal: 0.8 },
    { name: 'Flu', minAge: 0, p: 0.05, dmg: 8, cure: 0.9, cost: 150, selfHeal: 0.6 },
    { name: 'Ear Infection', minAge: 0, maxAge: 12, p: 0.04, dmg: 4, cure: 0.95, cost: 120, selfHeal: 0.4 },
    { name: 'Chickenpox', minAge: 1, maxAge: 12, p: 0.02, dmg: 6, cure: 0.9, cost: 100, selfHeal: 0.8 },
    { name: 'Strep Throat', minAge: 3, p: 0.025, dmg: 6, cure: 0.95, cost: 150, selfHeal: 0.6 },
    { name: 'Asthma', minAge: 2, maxAge: 40, p: 0.003, dmg: 1, cure: 0, cost: 400, incurable: true },
    { name: 'Acne', minAge: 12, maxAge: 25, p: 0.06, dmg: 0, looks: -5, cure: 0.8, cost: 200, selfHeal: 0.3 },
    { name: 'Migraine', minAge: 10, p: 0.02, dmg: 3, cure: 0.6, cost: 250, selfHeal: 0.2 },
    { name: 'PTSD', minAge: 18, p: 0, dmg: 2, happy: -12, cure: 0.35, cost: 800, therapy: true },
    { name: 'Depression', minAge: 12, p: 0.02, dmg: 4, happy: -15, cure: 0.45, cost: 600, therapy: true },
    { name: 'Anxiety', minAge: 10, p: 0.02, dmg: 2, happy: -10, cure: 0.5, cost: 500, therapy: true },
    { name: 'Insomnia', minAge: 15, p: 0.015, dmg: 4, happy: -6, cure: 0.6, cost: 300, selfHeal: 0.2 },
    { name: 'Food Poisoning', minAge: 3, p: 0.03, dmg: 6, cure: 0.95, cost: 200, selfHeal: 0.9 },
    { name: 'Kidney Stones', minAge: 25, p: 0.012, dmg: 6, cure: 0.85, cost: 3500, selfHeal: 0.5 },
    { name: 'Pneumonia', minAge: 0, p: 0.01, dmg: 14, cure: 0.8, cost: 2500, oldRisk: true, selfHeal: 0.35 },
    { name: 'High Blood Pressure', minAge: 35, p: 0.025, dmg: 2, cure: 0, cost: 600, incurable: true },
    { name: 'Type 2 Diabetes', minAge: 35, p: 0.012, dmg: 3, cure: 0, cost: 1200, incurable: true },
    { name: 'Arthritis', minAge: 50, p: 0.03, dmg: 1, cure: 0, cost: 800, incurable: true },
    { name: 'Heart Disease', minAge: 45, p: 0.008, dmg: 6, cure: 0.3, cost: 45000, oldRisk: true, selfHeal: 0 },
    { name: 'Cancer', minAge: 30, p: 0.006, dmg: 16, cure: 0.45, cost: 80000, oldRisk: true, selfHeal: 0.05 },
    { name: 'Dementia', minAge: 68, p: 0.015, dmg: 3, smarts: -10, cure: 0, cost: 5000, incurable: true },
    { name: 'Osteoporosis', minAge: 55, p: 0.02, dmg: 1, cure: 0, cost: 900, incurable: true },
    { name: 'Chlamydia', minAge: 16, p: 0, dmg: 3, cure: 0.95, cost: 150, std: true },
    { name: 'Herpes', minAge: 16, p: 0, dmg: 1, happy: -4, cure: 0, cost: 400, incurable: true, std: true },
    { name: 'Broken Arm', minAge: 3, p: 0, dmg: 5, cure: 0.98, cost: 2500, selfHeal: 0.5, injury: true },
    { name: 'Broken Leg', minAge: 3, p: 0, dmg: 8, cure: 0.98, cost: 4000, selfHeal: 0.4, injury: true },
    { name: 'Concussion', minAge: 3, p: 0, dmg: 6, smarts: -3, cure: 0.9, cost: 1500, selfHeal: 0.6, injury: true },
    { name: 'Alcoholism', minAge: 14, p: 0, dmg: 6, happy: -5, cure: 0.35, cost: 15000, addiction: true, rehab: true },
    { name: 'Gambling Addiction', minAge: 18, p: 0, dmg: 1, happy: -8, cure: 0.4, cost: 8000, addiction: true, rehab: true },
    { name: 'Nicotine Addiction', minAge: 10, p: 0, dmg: 3, cure: 0.5, cost: 1500, addiction: true, rehab: true }
  ];

  // Crimes: p = success chance baseline, reward range, sentence years if caught.
  var CRIMES = [
    { id: 'shoplift', icon: '🛍️', name: 'Shoplift', minAge: 8, p: 0.7, reward: [20, 400], jail: [0, 1], karma: -3, desc: 'Swipe something from a store' },
    { id: 'pickpocket', icon: '👛', name: 'Pickpocket', minAge: 10, p: 0.6, reward: [10, 900], jail: [0, 1], karma: -4, desc: 'Lift a wallet from a stranger' },
    { id: 'vandalism', icon: '🎨', name: 'Vandalism', minAge: 10, p: 0.7, reward: [0, 0], jail: [0, 1], karma: -3, desc: 'Spray-paint a building' },
    { id: 'burglary', icon: '🏚️', name: 'Burglary', minAge: 14, p: 0.5, reward: [300, 18000], jail: [1, 4], karma: -8, desc: 'Break into a house' },
    { id: 'gta', icon: '🚗', name: 'Grand Theft Auto', minAge: 14, p: 0.45, reward: [2000, 60000], jail: [2, 6], karma: -9, desc: 'Steal a car and fence it' },
    { id: 'fraud', icon: '💳', name: 'Credit Card Fraud', minAge: 16, p: 0.5, reward: [1000, 30000], jail: [2, 7], karma: -8, desc: 'Run stolen card numbers', stat: 'smarts' },
    { id: 'embezzle', icon: '💼', name: 'Embezzle from Employer', minAge: 18, p: 0.55, reward: [5000, 250000], jail: [3, 12], karma: -10, desc: 'Skim from your company', needsJob: true, stat: 'smarts' },
    { id: 'bank', icon: '🏦', name: 'Bank Robbery', minAge: 18, p: 0.3, reward: [20000, 900000], jail: [8, 25], karma: -15, desc: 'Rob a bank' },
    { id: 'heist', icon: '💎', name: 'Jewelry Heist', minAge: 20, p: 0.2, reward: [100000, 5000000], jail: [10, 30], karma: -15, desc: 'Pull off a high-end heist', stat: 'smarts' }
  ];

  var CLUBS = ['Chess Club', 'Drama Club', 'Debate Team', 'Robotics Club', 'Student Council', 'Band', 'Choir', 'Art Club', 'Yearbook', 'Science Olympiad'];
  var SPORTS_TEAMS = ['Basketball Team', 'Soccer Team', 'Track Team', 'Swim Team', 'Football Team', 'Volleyball Team', 'Cheerleading', 'Wrestling Team', 'Baseball Team', 'Tennis Team'];

  var VACATIONS = [
    { name: 'Road Trip', cost: 1200 }, { name: 'New York City Weekend', cost: 3000 }, { name: 'London Sightseeing', cost: 4500 }, { name: 'Rome & the Vatican', cost: 5000 },
    { name: 'Dubai Luxury Stay', cost: 9000 }, { name: 'Carnival in Rio de Janeiro', cost: 5500 }, { name: 'Sydney Harbour', cost: 7500 }, { name: 'Machu Picchu Trek', cost: 6000 }, { name: 'Santorini Sunsets', cost: 6500 }, { name: 'Seoul Food Tour', cost: 5000 }, { name: 'Camping in the Mountains', cost: 600 }, { name: 'Beach Resort in Cancún', cost: 4000 },
    { name: 'Paris Getaway', cost: 6000 }, { name: 'Tokyo Adventure', cost: 7000 }, { name: 'Safari in Kenya', cost: 9000 },
    { name: 'Bali Retreat', cost: 5000 }, { name: 'Northern Lights in Iceland', cost: 5500, aurora: true }, { name: 'Maldives Overwater Villa', cost: 18000 }, { name: 'Antarctica Expedition', cost: 30000 },
    { name: 'Private Island Charter', cost: 250000 }
  ];

  var TRAITS = ['Ambitious', 'Lazy', 'Kind', 'Mean', 'Funny', 'Shy', 'Outgoing', 'Jealous', 'Loyal', 'Greedy', 'Generous', 'Moody', 'Cheerful', 'Nerdy', 'Athletic', 'Artsy', 'Romantic', 'Stubborn'];

  var ZODIAC = [
    ['Capricorn', 1, 19], ['Aquarius', 2, 18], ['Pisces', 3, 20], ['Aries', 4, 19], ['Taurus', 5, 20], ['Gemini', 6, 20],
    ['Cancer', 7, 22], ['Leo', 8, 22], ['Virgo', 9, 22], ['Libra', 10, 22], ['Scorpio', 11, 21], ['Sagittarius', 12, 21], ['Capricorn', 12, 31]
  ];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  var ACHIEVEMENTS = [
    { id: 'centenarian', name: 'Centenarian', desc: 'Live to 100', icon: '🎂' },
    { id: 'millionaire', name: 'Millionaire', desc: 'Have a net worth of 1M (local)', icon: '💰' },
    { id: 'billionaire', name: 'Billionaire', desc: 'Have a net worth of 1B (local)', icon: '🏦' },
    { id: 'graduate', name: 'Graduate', desc: 'Earn a bachelor\'s degree', icon: '🎓' },
    { id: 'doctorate', name: 'Doctor Doctor', desc: 'Earn an MD or PhD', icon: '🩺' },
    { id: 'lawyer', name: 'Objection!', desc: 'Earn a law degree', icon: '⚖️' },
    { id: 'married', name: 'Tied the Knot', desc: 'Get married', icon: '💍' },
    { id: 'divorced', name: 'It\'s Not You', desc: 'Get divorced', icon: '💔' },
    { id: 'parent', name: 'Parenthood', desc: 'Have a child', icon: '👶' },
    { id: 'bigfamily', name: 'Cheaper by the Dozen', desc: 'Have 5 or more children', icon: '👨‍👩‍👧‍👦' },
    { id: 'homeowner', name: 'Homeowner', desc: 'Buy a house', icon: '🏠' },
    { id: 'mogul', name: 'Real Estate Mogul', desc: 'Own 5 properties at once', icon: '🏘️' },
    { id: 'jailbird', name: 'Jailbird', desc: 'Go to prison', icon: '⛓️' },
    { id: 'escape', name: 'Great Escape', desc: 'Break out of prison', icon: '🏃' },
    { id: 'famous', name: 'Famous', desc: 'Reach 80 fame', icon: '⭐' },
    { id: 'influencer', name: 'Influencer', desc: 'Get 1 million followers', icon: '📱' },
    { id: 'ceo', name: 'Top of the Ladder', desc: 'Reach the top level of any career', icon: '🏆' },
    { id: 'lottery', name: 'Jackpot', desc: 'Win the lottery jackpot', icon: '🎰' },
    { id: 'petlover', name: 'Pet Lover', desc: 'Own 3 pets at once', icon: '🐾' },
    { id: 'globetrotter', name: 'Globetrotter', desc: 'Take 5 vacations', icon: '✈️' },
    { id: 'emigrant', name: 'New Beginnings', desc: 'Emigrate to another country', icon: '🧳' },
    { id: 'saint', name: 'Saint', desc: 'Have extremely high karma', icon: '😇' },
    { id: 'villain', name: 'Villain', desc: 'Have extremely low karma', icon: '😈' },
    { id: 'gymrat', name: 'Gym Rat', desc: 'Reach 95 athleticism', icon: '💪' },
    { id: 'genius', name: 'Genius', desc: 'Reach 100 smarts', icon: '🧠' },
    { id: 'heartbreaker', name: 'Heartbreaker', desc: 'Have 10 exes', icon: '💘' },
    { id: 'entrepreneur', name: 'Entrepreneur', desc: 'Start a business', icon: '📈' },
    { id: 'dynasty', name: 'Dynasty', desc: 'Reach the 3rd generation', icon: '👑' },
    { id: 'survivor', name: 'Survivor', desc: 'Beat cancer', icon: '🎗️' },
    { id: 'retired', name: 'Golden Years', desc: 'Retire from a career', icon: '🌅' },
    { id: 'royal', name: 'Long Live the Crown', desc: 'Become king or queen', icon: '🤴' },
    { id: 'godfather', name: 'The Godfather', desc: 'Become boss of a crime family', icon: '🕴️' },
    { id: 'author', name: 'Bestselling Author', desc: 'Publish a bestseller', icon: '📚' },
    { id: 'polymath', name: 'Renaissance Soul', desc: 'Reach 80 in three skills', icon: '🎭' },
    { id: 'award', name: 'And the Winner Is...', desc: 'Win a major award', icon: '🏆' },
    { id: 'nobel', name: 'Nobel Laureate', desc: 'Win a Nobel Prize', icon: '🏅' },
    { id: 'valedictorian', name: 'Valedictorian', desc: 'Graduate high school at the top of your class', icon: '🥇' },
    { id: 'landlord', name: 'Landlord', desc: 'Rent out 3 properties at once', icon: '🔑' },
    { id: 'timetraveler', name: 'Do-Over', desc: 'Use the Time Machine', icon: '⏳' },
    { id: 'bucketlist', name: 'No Regrets', desc: 'Complete your whole bucket list', icon: '📝' },
    { id: 'inked', name: 'Inked', desc: 'Get a tattoo', icon: '🖋️' },
    { id: 'proud', name: 'Proud', desc: 'Come out', icon: '🏳️‍🌈' },
    { id: 'resolute', name: 'Resolute', desc: 'Keep a New Year\'s resolution', icon: '🎆' },
    { id: 'trickortreat', name: 'Trick or Treat', desc: 'Go trick-or-treating 3 times', icon: '🎃' },
    { id: 'roots', name: 'Roots', desc: 'Look at your family tree', icon: '🌳' },
    { id: 'challenger', name: 'Challenger', desc: 'Complete a challenge', icon: '⭐' },
    { id: 'challenge_master', name: 'Challenge Master', desc: 'Earn 5 challenge stars', icon: '🌟' },
    { id: 'dna', name: 'Who Am I?', desc: 'Take a DNA test', icon: '🧬' },
    { id: 'enlisted', name: 'Service', desc: 'Join the military', icon: '🎖️' },
    { id: 'officer', name: 'Commissioned', desc: 'Become a military officer', icon: '⭐' },
    { id: 'operator', name: 'Operator', desc: 'Pass special forces selection', icon: '🪖' },
    { id: 'purple_heart', name: 'Purple Heart', desc: 'Be wounded in action', icon: '💜' },
    { id: 'medal_of_honor', name: 'Above and Beyond', desc: 'Receive the highest award for valor', icon: '🏅' },
    { id: 'general', name: 'Flag Officer', desc: 'Become a general or admiral', icon: '🌟' },
    { id: 'creator_silver', name: 'Silver Play Button', desc: 'Reach 100K subscribers on a channel', icon: '🥈' },
    { id: 'creator_gold', name: 'Gold Play Button', desc: 'Reach 1 million subscribers', icon: '🥇' },
    { id: 'creator_diamond', name: 'Diamond Play Button', desc: 'Reach 10 million subscribers', icon: '💎' },
    { id: 'hustler', name: 'Hustler', desc: 'Work 10 side hustles in one life', icon: '💼' },
    { id: 'whale', name: 'Crypto Whale', desc: 'Hold a million in crypto', icon: '🐋' },
    { id: 'state_champ', name: 'State Champion', desc: 'Win a high school state championship', icon: '🏆' },
    { id: 'all_american', name: 'All-American', desc: 'Be named an All-American in college', icon: '🎖️' },
    { id: 'drafted', name: 'Going Pro', desc: 'Get drafted into a pro league from college', icon: '📝' },
    { id: 'big_break', name: 'Big Break', desc: 'Land the lead in a studio film', icon: '🎬' },
    { id: 'box_office', name: 'Billion-Dollar Star', desc: 'Star in a movie that grosses $1 billion', icon: '🍿' },
    { id: 'oscar', name: 'Oscar Winner', desc: 'Win an Academy Award', icon: '🏆' },
    { id: 'egot', name: 'EGOT', desc: 'Win an Emmy, Grammy, Oscar and Tony', icon: '👑' },
    { id: 'number_one', name: 'Number One', desc: 'Top the Billboard charts', icon: '🥇' },
    { id: 'platinum', name: 'Gone Platinum', desc: 'Have a release certified Platinum', icon: '💿' },
    { id: 'signed', name: 'Signed', desc: 'Sign with a major record label', icon: '📝' },
    { id: 'rock_hof', name: 'Rock and Roll Hall of Famer', desc: 'Get inducted into the Rock and Roll Hall of Fame', icon: '🎸' },
    { id: 'walk_of_fame', name: 'Walk of Fame', desc: 'Get a star on the Hollywood Walk of Fame', icon: '⭐' },
    { id: 'mogul', name: 'Mogul', desc: 'Own businesses worth $50 million', icon: '🏙️' },
    { id: 'ranger', name: 'Rangers Lead the Way', desc: 'Earn the Ranger tab', icon: '🗡️' },
    { id: 'champion', name: 'Champion', desc: 'Win a pro championship or a Grand Slam', icon: '🏆' },
    { id: 'league_mvp', name: 'Most Valuable', desc: 'Win a league MVP (or finish No. 1 in tennis)', icon: '🥇' },
    { id: 'grand_slam', name: 'Grand Slam', desc: 'Win a tennis Grand Slam', icon: '🎾' },
    { id: 'pro_hof', name: 'Immortal', desc: 'Make a pro sports Hall of Fame', icon: '🏛️' },
    { id: 'franchise', name: 'Franchise', desc: 'Run a business with 5 locations', icon: '🗺️' },
    { id: 'five_stars', name: 'Five Stars', desc: 'Earn a 5-star rating for your business', icon: '⭐' },
    { id: 'unicorn', name: 'Unicorn', desc: 'Build a startup valued at $1 billion', icon: '🦄' },
    { id: 'ipo', name: 'Ring the Bell', desc: 'Take a company public', icon: '🔔' },
    { id: 'caught_early', name: 'Caught It Early', desc: 'Get diagnosed with stage 1 cancer', icon: '🔬' },
    { id: 'second_chance', name: 'Second Chance', desc: 'Survive a heart attack', icon: '🚑' },
    { id: 'market_millionaire', name: 'Wall Street', desc: 'Grow a stock portfolio to $1 million', icon: '📈' },
    { id: 'buy_the_dip', name: 'Buy the Dip', desc: 'Buy stocks during a market crash', icon: '🛒' },
    { id: 'history_buff', name: 'Witness to History', desc: 'Live through 10 historic moments', icon: '📜' },
    { id: 'veteran_war', name: 'Answered the Call', desc: 'Serve in a historic war', icon: '🎖️' },
    { id: 'consul', name: 'Consul of Rome', desc: 'Be elected consul in Ancient Rome', icon: '🏛️' },
    { id: 'centurion', name: 'Centurion', desc: 'Rise to centurion in the legions', icon: '🦅' },
    { id: 'rudis', name: 'The Wooden Sword', desc: 'Win your freedom from the arena', icon: '🗡️' },
    { id: 'charioteer_champ', name: 'Hero of the Circus', desc: 'Win 100 chariot races', icon: '🐎' },
    { id: 'freedom', name: 'Libertas', desc: 'Be born into slavery and win your freedom', icon: '🕊️' },
    { id: 'vesuvius', name: 'Out of the Ashes', desc: 'Survive the eruption of Vesuvius', icon: '🌋' },
    { id: 'sage', name: 'The Sage', desc: 'Become head of a school of philosophy', icon: '🦉' },
    { id: 'magnum_opus', name: 'Magnum Opus', desc: 'Write five philosophical treatises', icon: '📜' },
    { id: 'imperial_tutor', name: 'Tutor to an Emperor', desc: 'Teach philosophy to the imperial heir', icon: '👑' },
    { id: 'knighted', name: 'Arise, Sir Knight', desc: 'Be knighted in medieval England', icon: '🗡️' },
    { id: 'crusader', name: 'Crusader', desc: 'Take the cross and come home alive', icon: '✝️' },
    { id: 'black_death', name: 'The Great Mortality', desc: 'Survive the Black Death', icon: '💀' },
    { id: 'master_craftsman', name: 'Masterpiece', desc: 'Become a guild master', icon: '🏆' },
    { id: 'abbot', name: 'Prince of the Church', desc: 'Become an abbot, abbess or bishop', icon: '⛪' },
    { id: 'town_air', name: 'Town Air Makes You Free', desc: 'Escape serfdom by living a year and a day in a town', icon: '🕊️' },
    { id: 'tourney_champ', name: 'Champion of the Lists', desc: 'Win five tournaments', icon: '🐎' },
    { id: 'neck_verse', name: 'The Neck Verse', desc: 'Escape the gallows by reading Latin', icon: '📖' },
    { id: 'agincourt', name: 'We Happy Few', desc: 'Fight at Agincourt', icon: '🏹' },
    { id: 'vestal', name: 'Keeper of the Flame', desc: 'Serve thirty years as a Vestal Virgin', icon: '🔥' },
    { id: 'usurper', name: 'Seize the Throne', desc: 'Overthrow the emperor of Rome or the king of England', icon: '👑' },
    { id: 'rebel', name: 'Rise Up', desc: 'Lead a revolt that wins', icon: '🔥' },
    { id: 'long_reign', name: 'Long Live the King', desc: 'Rule for twenty years', icon: '🏰' },
    { id: 'conqueror', name: 'Conqueror', desc: 'Take five provinces in war as a ruler', icon: '🚩' },
    { id: 'valhalla', name: 'Valhalla', desc: 'Die in battle as a Viking', icon: '⚔️' },
    { id: 'vinland', name: 'Vinland', desc: 'Sail to North America five hundred years before Columbus', icon: '🌲' },
    { id: 'sea_king', name: 'Sea-King', desc: 'Lead a fleet of longships', icon: '⛵' },
    { id: 'skald', name: 'Mead of Poetry', desc: 'Compose a drápa that wins a gold ring', icon: '🎶' },
    { id: 'settler', name: 'Land-Taker', desc: 'Settle Iceland or Greenland', icon: '🧊' },
    { id: 'mystic', name: 'Revelations', desc: 'Write a book of visions as an anchoress or anchorite', icon: '✍️' },
    { id: 'hoops_draft', name: 'First Rounder', desc: 'Get drafted in the first round', icon: '🧢' },
    { id: 'hoops_ring', name: 'Ring Chaser', desc: 'Win a pro basketball championship', icon: '💍' },
    { id: 'hoops_mvp', name: 'Most Valuable', desc: 'Win basketball MVP', icon: '🏀' },
    { id: 'hoops_hof', name: 'Hall of Famer', desc: 'Make the Basketball Hall of Fame', icon: '🏛️' },
    { id: 'hoops_clutch', name: 'Ice in My Veins', desc: 'Hit a game-winner yourself in a playoff Game 7', icon: '🧊' },
    { id: 'hoops_gold', name: 'Gold Standard', desc: 'Win Olympic gold in basketball', icon: '🥇' },
    { id: 'astronaut', name: 'To Infinity', desc: 'Go to space', icon: '🚀' },
    { id: 'twins', name: 'Double Trouble', desc: 'Have twins', icon: '👯' },
    { id: 'tradesman', name: 'Skilled Trade', desc: 'Earn a trade certificate', icon: '🔧' }
  ];

  var BUSINESS_TYPES = [
    { type: 'Food Truck', cost: 100000, base: 0.35 }, { type: 'Coffee Shop', cost: 250000, base: 0.3 },
    { type: 'Gym', cost: 300000, base: 0.28 }, { type: 'Restaurant', cost: 500000, base: 0.25 },
    { type: 'Tech Startup', cost: 250000, base: 0.6, volatile: true }, { type: 'Clothing Brand', cost: 120000, base: 0.35, volatile: true },
    { type: 'Car Dealership', cost: 1500000, base: 0.2 }, { type: 'Nightclub', cost: 900000, base: 0.3, volatile: true },
    { type: 'Hotel', cost: 6000000, base: 0.16 }
  ];

  /* Stocks. price: starting share price in base dollars; beta: how hard it
   * follows the overall market; drift: long-run yearly return; vol: its own
   * yearly swings on top of the market; div: dividend yield. */
  var STOCKS = [
    { sym: 'VOO', name: 'S&P 500 Index Fund', sector: 'Index fund', price: 480, beta: 1, drift: 0.075, vol: 0.02, div: 0.014 },
    { sym: 'BND', name: 'Total Bond Fund', sector: 'Bonds', price: 72, beta: 0.08, drift: 0.035, vol: 0.05, div: 0.035 },
    { sym: 'AAPL', name: 'Apple', sector: 'Tech', price: 180, beta: 1.2, drift: 0.095, vol: 0.22, div: 0.005 },
    { sym: 'MSFT', name: 'Microsoft', sector: 'Tech', price: 400, beta: 1.1, drift: 0.09, vol: 0.2, div: 0.008 },
    { sym: 'NVDA', name: 'Nvidia', sector: 'Chips', price: 120, beta: 1.7, drift: 0.13, vol: 0.45, div: 0.001 },
    { sym: 'TSLA', name: 'Tesla', sector: 'Cars', price: 250, beta: 1.6, drift: 0.1, vol: 0.55, div: 0 },
    { sym: 'AMZN', name: 'Amazon', sector: 'Retail & cloud', price: 180, beta: 1.2, drift: 0.09, vol: 0.27, div: 0 },
    { sym: 'WMT', name: 'Walmart', sector: 'Retail', price: 70, beta: 0.5, drift: 0.065, vol: 0.15, div: 0.014 },
    { sym: 'KO', name: 'Coca-Cola', sector: 'Drinks', price: 62, beta: 0.55, drift: 0.055, vol: 0.13, div: 0.03 },
    { sym: 'PFE', name: 'Pfizer', sector: 'Pharma', price: 28, beta: 0.6, drift: 0.045, vol: 0.24, div: 0.05 },
    { sym: 'GS', name: 'Goldman Sachs', sector: 'Banking', price: 450, beta: 1.35, drift: 0.075, vol: 0.25, div: 0.024 }
  ];
  // Tickers from saves before v1.22 and the real stock each one became.
  var OLD_STOCKS = { FRUT: 'AAPL', MEGA: 'WMT', ROKT: 'TSLA', OILX: 'AMZN', HLTH: 'PFE', BANK: 'GS', INDX: 'VOO', COIN: 'NVDA' };

  /* Ancient lands: not in COUNTRIES (so they never show up in pickers or
   * emigration), but D.country() finds them. k: local coin per base dollar. */
  var ANCIENT = [
    { name: 'Roman Empire', ancient: 'rome', flag: '🏛️', cur: '🪙', k: 0.01, life: 72, tax: 0.05,
      male: ['Gaius', 'Lucius', 'Marcus', 'Publius', 'Quintus', 'Titus', 'Gnaeus', 'Sextus', 'Aulus', 'Decimus', 'Tiberius', 'Servius', 'Manius', 'Appius', 'Numerius', 'Spurius'],
      female: ['Julia', 'Cornelia', 'Claudia', 'Livia', 'Aurelia', 'Valeria', 'Octavia', 'Antonia', 'Flavia', 'Caecilia', 'Sulpicia', 'Tullia', 'Junia', 'Fabia', 'Domitia', 'Lucilla', 'Agrippina', 'Faustina'],
      last: ['Aurelius', 'Cornelius', 'Valerius', 'Claudius', 'Fabius', 'Flavius', 'Junius', 'Antonius', 'Caecilius', 'Domitius', 'Sulpicius', 'Tullius', 'Livius', 'Octavius', 'Aemilius', 'Licinius', 'Pompeius', 'Sempronius', 'Calpurnius', 'Plautius', 'Vibius', 'Terentius'],
      cities: ['Rome', 'Rome', 'Rome', 'Ostia', 'Pompeii', 'Neapolis', 'Capua', 'Mediolanum', 'Londinium', 'Lugdunum', 'Carthage', 'Alexandria', 'Antioch', 'Athens', 'Ephesus', 'Corinth', 'Herculaneum'] },
    { name: 'Kingdom of England', ancient: 'medieval', flag: '🏰', cur: '🪙', k: 0.02, life: 70, tax: 0.05,
      male: ['William', 'John', 'Robert', 'Richard', 'Thomas', 'Walter', 'Hugh', 'Henry', 'Roger', 'Geoffrey', 'Ralph', 'Simon', 'Adam', 'Gilbert', 'Nicholas', 'Stephen', 'Osbert', 'Piers'],
      female: ['Alice', 'Agnes', 'Matilda', 'Joan', 'Isabel', 'Margery', 'Emma', 'Cecily', 'Margaret', 'Edith', 'Eleanor', 'Beatrice', 'Juliana', 'Avice', 'Maud', 'Rohese', 'Sibyl', 'Christina'],
      last: ['Smith', 'Miller', 'Baker', 'Carter', 'Fletcher', 'Cooper', 'Thatcher', 'Mason', 'Taylor', 'Webster', 'Brewer', 'Ward', 'Shepherd', 'Atwood', 'Fisher', 'Cook', 'Reeve', 'Fowler', 'Archer', 'Hayward', 'Godwin', 'Langley'],
      cities: ['London', 'London', 'London', 'York', 'York', 'Norwich', 'Bristol', 'Winchester', 'Lincoln', 'Canterbury', 'Oxford', 'Coventry', 'Exeter', 'Chester', 'Durham', 'Southampton'] },
    { name: 'Viking Norway', ancient: 'viking', flag: '🪓', cur: '🪙', k: 0.02, life: 68, tax: 0.05,
      male: ['Bjorn', 'Erik', 'Ragnar', 'Leif', 'Harald', 'Olaf', 'Sigurd', 'Ivar', 'Gunnar', 'Thorstein', 'Ulf', 'Halfdan', 'Knut', 'Sven', 'Arne', 'Egil', 'Hakon', 'Ketil', 'Torvald', 'Asger'],
      female: ['Astrid', 'Freydis', 'Gudrun', 'Ingrid', 'Sigrid', 'Thora', 'Ragnhild', 'Aslaug', 'Helga', 'Gunnhild', 'Thyra', 'Ylva', 'Solveig', 'Hild', 'Brynhild', 'Asa', 'Estrid', 'Tove'],
      last: ['Bjornsson', 'Eriksson', 'Ragnarsson', 'Leifsson', 'Haraldsson', 'Olafsson', 'Sigurdsson', 'Ivarsson', 'Gunnarsson', 'Thorsteinsson', 'Ulfsson', 'Halfdansson', 'Knutsson', 'Svensson', 'Egilsson', 'Hakonsson', 'Ketilsson'],
      cities: ['Kaupang', 'Kaupang', 'Hedeby', 'Birka', 'Ribe'] }
  ];

  return {
    COUNTRIES: COUNTRIES, ANCIENT: ANCIENT, EDU_RANK: EDU_RANK, MAJORS: MAJORS, PREMED: PREMED, GRAD_SCHOOLS: GRAD_SCHOOLS,
    TRADES: TRADES, CAREERS: CAREERS, PART_TIME: PART_TIME, FAME_CAREERS: FAME_CAREERS, POLITICS: POLITICS, SPORTS: SPORTS, GENRES: GENRES,
    HOUSES: HOUSES, STREETS: STREETS, STREET_TYPES: STREET_TYPES, CARS: CARS, CAR_COLORS: CAR_COLORS,
    JEWELRY: JEWELRY, PETS: PETS, PET_NAMES: PET_NAMES, ILLNESSES: ILLNESSES, CRIMES: CRIMES, CLUBS: CLUBS,
    SPORTS_TEAMS: SPORTS_TEAMS, VACATIONS: VACATIONS, TRAITS: TRAITS, ZODIAC: ZODIAC, MONTHS: MONTHS,
    ACHIEVEMENTS: ACHIEVEMENTS, BUSINESS_TYPES: BUSINESS_TYPES, STOCKS: STOCKS, OLD_STOCKS: OLD_STOCKS,
    career: function (id) {
      var all = CAREERS.concat(FAME_CAREERS, [POLITICS]);
      for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
      return TL.ancient ? TL.ancient.career(id) : null;
    },
    illness: function (name) {
      for (var i = 0; i < ILLNESSES.length; i++) if (ILLNESSES[i].name === name) return ILLNESSES[i];
      return null;
    },
    country: function (name) {
      for (var i = 0; i < COUNTRIES.length; i++) if (COUNTRIES[i].name === name) return COUNTRIES[i];
      for (i = 0; i < ANCIENT.length; i++) if (ANCIENT[i].name === name) return ANCIENT[i];
      return COUNTRIES[0];
    },
    // Roman family names: Aurelius for men, Aurelia for women (js/ancient.js).
    // Medieval English surnames stay as they are.
    // A family name for this person in an early era: Roman nomina change ending
    // with gender (js/ancient.js); Norse patronymics are -son or -dottir (js/viking.js).
    surname: function (last, gender, era) {
      if (era === 'rome') return this.gentile(last, gender);
      if (era === 'viking') { var stem = String(last).replace(/(sson|sdottir|son|dottir)$/, ''); return stem === last ? last : stem + (gender === 'F' ? 'sdottir' : 'sson'); }
      return last;
    },
    gentile: function (last, gender) {
      var stem = String(last).replace(/(ius|ia|us|a)$/, '');
      if (stem === last) return last;
      return stem + (/ius$|ia$/.test(last) ? (gender === 'F' ? 'ia' : 'ius') : (gender === 'F' ? 'a' : 'us'));
    }
  };
})();
