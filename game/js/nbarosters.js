/* TheLife — real NBA rosters for the 2025-26 season (as the season opened)
 * and WNBA rosters for the 2025 season,
 * used by js/league.js to seed the live league when it starts in 2025 or
 * later. Each entry is "Name/position/age during the season/rating", on the
 * league's 40-99 scale (role players sit around 68-75, stars 88+). Rosters
 * move all the time; these are a snapshot, and the simulated league takes
 * over from here with trades, drafts and retirements of its own. */
TL.nbaRosters = (function () {
  var R = {
    atl: 'Trae Young/PG/27/88, Jalen Johnson/SF/24/85, Dyson Daniels/SG/22/82, Kristaps Porzingis/C/30/83, Nickeil Alexander-Walker/SG/27/77, Onyeka Okongwu/C/25/79, Zaccharie Risacher/SF/20/76, Luke Kennard/SG/29/72, Mouhamed Gueye/PF/23/68, Vit Krejci/SG/25/69, Kobe Bufkin/PG/22/68, Asa Newell/PF/20/68, Caleb Houstan/SF/23/66',
    bos: 'Jaylen Brown/SG/29/88, Derrick White/PG/31/84, Payton Pritchard/PG/27/79, Anfernee Simons/SG/26/79, Sam Hauser/SF/28/73, Neemias Queta/C/26/71, Josh Minott/SF/23/68, Jordan Walsh/SG/21/67, Hugo Gonzalez/SF/19/67, Xavier Tillman/C/27/68, Luka Garza/C/27/67, Baylor Scheierman/SG/25/66, Jayson Tatum/SF/27/92',
    bkn: 'Michael Porter Jr./SF/27/80, Cam Thomas/SG/24/78, Nic Claxton/C/26/77, Noah Clowney/PF/21/71, Terance Mann/SG/29/71, Day\'Ron Sharpe/C/24/70, Ziaire Williams/SF/24/69, Egor Demin/PG/19/69, Nolan Traore/PG/19/67, Drake Powell/SG/20/67, Ben Saraf/PG/19/66, Danny Wolf/C/21/67, Haywood Highsmith/SF/29/68',
    cha: 'LaMelo Ball/PG/24/86, Brandon Miller/SF/23/82, Miles Bridges/PF/27/79, Collin Sexton/SG/27/76, Kon Knueppel/SF/20/74, Moussa Diabate/C/24/70, Grant Williams/PF/27/70, Tre Mann/PG/24/70, Josh Green/SG/25/69, Mason Plumlee/C/35/68, Pat Connaughton/SG/32/67, Liam McNeeley/SF/20/67, Ryan Kalkbrenner/C/23/66',
    chi: 'Josh Giddey/PG/23/81, Coby White/SG/25/80, Nikola Vucevic/C/35/79, Matas Buzelis/SF/21/76, Ayo Dosunmu/SG/26/74, Patrick Williams/PF/24/72, Kevin Huerter/SG/27/72, Isaac Okoro/SF/24/71, Zach Collins/C/28/70, Tre Jones/PG/26/71, Jalen Smith/PF/25/70, Julian Phillips/SF/22/66, Noa Essengue/PF/19/67',
    cle: 'Donovan Mitchell/SG/29/90, Evan Mobley/PF/24/88, Darius Garland/PG/26/85, Jarrett Allen/C/27/83, De\'Andre Hunter/SF/28/77, Max Strus/SF/29/74, Lonzo Ball/PG/28/72, Sam Merrill/SG/29/70, Dean Wade/PF/29/70, Larry Nance Jr./PF/32/69, Jaylon Tyson/SG/23/67, Craig Porter Jr./PG/26/66, Tyrese Proctor/PG/21/65',
    dal: 'Anthony Davis/PF/32/90, Kyrie Irving/PG/33/86, Cooper Flagg/SF/19/80, Klay Thompson/SG/35/77, P.J. Washington/PF/27/77, Dereck Lively II/C/21/77, Daniel Gafford/C/27/76, D\'Angelo Russell/PG/29/74, Max Christie/SG/22/72, Naji Marshall/SF/28/73, Caleb Martin/SF/30/69, Dante Exum/PG/30/68, Brandon Williams/PG/26/66',
    den: 'Nikola Jokic/C/30/98, Jamal Murray/PG/28/87, Aaron Gordon/PF/30/81, Christian Braun/SG/24/79, Cameron Johnson/SF/29/78, Jonas Valanciunas/C/33/74, Bruce Brown/SG/29/71, Tim Hardaway Jr./SG/33/71, Peyton Watson/SF/23/71, Julian Strawther/SG/23/68, Zeke Nnaji/PF/24/67, Jalen Pickett/PG/26/66, DaRon Holmes II/PF/23/66',
    det: 'Cade Cunningham/PG/24/91, Jalen Duren/C/22/81, Ausar Thompson/SF/22/79, Tobias Harris/PF/33/77, Jaden Ivey/SG/23/77, Isaiah Stewart/C/24/74, Duncan Robinson/SF/31/72, Caris LeVert/SG/31/71, Ron Holland II/SF/20/70, Marcus Sasser/PG/25/68, Paul Reed/C/26/68, Javonte Green/SF/32/66, Chaz Lanier/SG/24/65',
    gsw: 'Stephen Curry/PG/37/93, Jimmy Butler/SF/36/86, Draymond Green/PF/35/79, Brandin Podziemski/SG/22/76, Jonathan Kuminga/PF/23/77, Moses Moody/SG/23/72, Buddy Hield/SG/32/72, Al Horford/C/39/71, Gary Payton II/SG/33/68, De\'Anthony Melton/SG/27/70, Quinten Post/C/25/68, Trayce Jackson-Davis/C/25/68, Gui Santos/SF/23/66',
    hou: 'Kevin Durant/SF/37/91, Alperen Sengun/C/23/88, Amen Thompson/SF/22/84, Jabari Smith Jr./PF/22/79, Fred VanVleet/PG/31/79, Steven Adams/C/32/73, Tari Eason/PF/24/76, Reed Sheppard/PG/21/73, Dorian Finney-Smith/PF/32/71, Clint Capela/C/31/71, Josh Okogie/SG/27/68, Aaron Holiday/PG/29/68, Jeff Green/PF/39/65',
    ind: 'Pascal Siakam/PF/31/87, Bennedict Mathurin/SG/23/79, Andrew Nembhard/PG/25/78, Aaron Nesmith/SF/26/76, T.J. McConnell/PG/33/74, Obi Toppin/PF/27/73, Jarace Walker/PF/22/71, Isaiah Jackson/C/23/70, Ben Sheppard/SG/24/69, Johnny Furphy/SF/21/66, Jay Huff/C/27/67, Quenton Jackson/PG/27/65, Tyrese Haliburton/PG/25/90',
    lac: 'Kawhi Leonard/SF/34/90, James Harden/PG/36/87, Ivica Zubac/C/28/83, John Collins/PF/28/77, Bradley Beal/SG/32/76, Derrick Jones Jr./SF/28/73, Brook Lopez/C/37/72, Kris Dunn/PG/31/71, Chris Paul/PG/40/72, Bogdan Bogdanovic/SG/33/71, Nicolas Batum/PF/37/67, Kobe Sanders/SG/23/64',
    lal: 'Luka Doncic/PG/26/96, LeBron James/SF/41/90, Austin Reaves/SG/27/84, Rui Hachimura/PF/27/77, Deandre Ayton/C/27/78, Marcus Smart/PG/31/73, Jarred Vanderbilt/PF/26/70, Gabe Vincent/PG/29/68, Jake LaRavia/SF/24/70, Jaxson Hayes/C/25/68, Dalton Knecht/SG/24/68, Maxi Kleber/PF/34/66, Bronny James/PG/21/62',
    mem: 'Ja Morant/PG/26/88, Jaren Jackson Jr./PF/26/88, Zach Edey/C/23/78, Santi Aldama/PF/25/76, Kentavious Caldwell-Pope/SG/32/73, Jaylen Wells/SF/22/74, Vince Williams Jr./SF/25/71, Ty Jerome/PG/28/74, Brandon Clarke/PF/29/71, Scotty Pippen Jr./PG/25/69, GG Jackson/PF/21/69, Cedric Coward/SF/22/69, Jock Landale/C/30/66',
    mia: 'Bam Adebayo/C/28/86, Tyler Herro/SG/26/85, Norman Powell/SG/32/80, Andrew Wiggins/SF/30/77, Jaime Jaquez Jr./SF/25/75, Kel\'el Ware/C/21/76, Davion Mitchell/PG/27/72, Nikola Jovic/PF/22/72, Simone Fontecchio/SF/30/69, Pelle Larsson/SG/25/67, Kasparas Jakucionis/PG/19/68, Dru Smith/PG/28/65, Keshad Johnson/SF/24/64',
    mil: 'Giannis Antetokounmpo/PF/31/96, Kyle Kuzma/PF/30/76, Myles Turner/C/29/80, Bobby Portis/PF/30/76, Kevin Porter Jr./PG/25/75, Ryan Rollins/PG/23/71, AJ Green/SG/26/71, Gary Trent Jr./SG/27/71, Taurean Prince/SF/31/69, Gary Harris/SG/31/67, Cole Anthony/PG/25/70, Andre Jackson Jr./SF/24/66, Jericho Sims/C/27/65',
    min: 'Anthony Edwards/SG/24/93, Julius Randle/PF/31/84, Rudy Gobert/C/33/83, Jaden McDaniels/SF/25/79, Naz Reid/C/26/79, Donte DiVincenzo/SG/29/75, Mike Conley/PG/38/71, Terrence Shannon Jr./SG/25/68, Rob Dillingham/PG/21/69, Jaylen Clark/SG/24/67, Joe Ingles/SF/38/64, Leonard Miller/PF/22/64, Joan Beringer/C/19/65',
    nop: 'Zion Williamson/PF/25/86, Trey Murphy III/SF/25/82, Dejounte Murray/PG/29/80, Herbert Jones/SF/27/78, Jordan Poole/SG/26/77, Saddiq Bey/SF/26/72, Yves Missi/C/21/73, Derik Queen/C/20/72, Jeremiah Fears/PG/19/71, Jose Alvarado/PG/27/71, Kevon Looney/C/29/69, Karlo Matkovic/PF/24/67, Jordan Hawkins/SG/23/67',
    nyk: 'Jalen Brunson/PG/29/91, Karl-Anthony Towns/C/30/89, OG Anunoby/SF/28/84, Mikal Bridges/SF/29/83, Josh Hart/SG/30/80, Mitchell Robinson/C/27/75, Miles McBride/PG/25/73, Jordan Clarkson/SG/33/72, Guerschon Yabusele/PF/30/71, Landry Shamet/SG/28/67, Tyler Kolek/PG/24/65, Pacome Dadiet/SF/20/65, Ariel Hukporti/C/23/64',
    okc: 'Shai Gilgeous-Alexander/PG/27/97, Jalen Williams/SF/24/88, Chet Holmgren/C/23/86, Isaiah Hartenstein/C/27/79, Luguentz Dort/SG/26/77, Alex Caruso/SG/31/76, Cason Wallace/SG/22/76, Aaron Wiggins/SF/26/72, Isaiah Joe/SG/26/72, Kenrich Williams/PF/30/69, Jaylin Williams/PF/23/70, Ajay Mitchell/PG/23/70, Nikola Topic/PG/20/67',
    orl: 'Paolo Banchero/PF/23/89, Franz Wagner/SF/24/87, Desmond Bane/SG/27/83, Jalen Suggs/PG/24/80, Wendell Carter Jr./C/26/76, Tyus Jones/PG/29/72, Goga Bitadze/C/26/71, Jonathan Isaac/PF/28/71, Anthony Black/PG/22/71, Tristan da Silva/SF/24/69, Moritz Wagner/C/28/70, Jase Richardson/SG/20/67, Noah Penda/SF/20/65',
    phi: 'Joel Embiid/C/31/90, Tyrese Maxey/PG/25/89, Paul George/SF/35/83, VJ Edgecombe/SG/20/75, Kelly Oubre Jr./SF/30/75, Quentin Grimes/SG/25/76, Andre Drummond/C/32/71, Jared McCain/SG/21/74, Kyle Lowry/PG/39/66, Eric Gordon/SG/37/67, Adem Bona/C/22/67, Justin Edwards/SF/22/65, Trendon Watford/PF/25/68',
    phx: 'Devin Booker/SG/29/90, Jalen Green/SG/23/80, Dillon Brooks/SF/30/76, Grayson Allen/SG/30/73, Mark Williams/C/24/76, Royce O\'Neale/SF/32/71, Ryan Dunn/SF/22/69, Collin Gillespie/PG/26/68, Nick Richards/C/28/69, Oso Ighodaro/C/23/67, Jordan Goodwin/SG/27/67, Khaman Maluach/C/19/68, Rasheer Fleming/PF/21/64',
    por: 'Deni Avdija/SF/25/82, Shaedon Sharpe/SG/22/80, Jrue Holiday/PG/35/77, Scoot Henderson/PG/21/74, Toumani Camara/SF/25/76, Donovan Clingan/C/21/77, Jerami Grant/PF/31/76, Robert Williams III/C/28/72, Kris Murray/PF/25/67, Matisse Thybulle/SG/28/68, Yang Hansen/C/20/67, Blake Wesley/SG/22/64, Damian Lillard/PG/35/86',
    sac: 'Domantas Sabonis/C/29/88, Zach LaVine/SG/30/83, DeMar DeRozan/SF/36/82, Malik Monk/SG/27/77, Keegan Murray/PF/25/78, Dennis Schroder/PG/32/73, Russell Westbrook/PG/37/72, Keon Ellis/SG/25/71, Drew Eubanks/C/28/67, Devin Carter/PG/23/67, Dario Saric/PF/31/66, Nique Clifford/SG/23/67, Maxime Raynaud/C/22/65',
    sas: 'Victor Wembanyama/C/22/95, De\'Aaron Fox/PG/28/87, Stephon Castle/SG/21/79, Dylan Harper/PG/19/77, Devin Vassell/SG/25/77, Harrison Barnes/SF/33/74, Keldon Johnson/SF/26/73, Jeremy Sochan/PF/22/72, Julian Champagnie/SF/24/71, Luke Kornet/C/30/70, Kelly Olynyk/C/34/69, Carter Bryant/SF/20/67, Bismack Biyombo/C/33/63',
    tor: 'Scottie Barnes/SF/24/87, Brandon Ingram/SF/28/84, Immanuel Quickley/PG/26/79, RJ Barrett/SG/25/80, Jakob Poeltl/C/30/79, Gradey Dick/SG/22/73, Ochai Agbaji/SG/25/71, Jamal Shead/PG/23/69, Sandro Mamukelashvili/PF/26/68, Ja\'Kobe Walter/SG/21/67, Jamison Battle/SF/24/65, Collin Murray-Boyles/PF/20/69, Garrett Temple/SG/39/60',
    uta: 'Lauri Markkanen/PF/28/84, Keyonte George/PG/22/77, Walker Kessler/C/24/79, Jusuf Nurkic/C/31/71, Isaiah Collier/PG/21/70, Ace Bailey/SF/19/74, Kyle Filipowski/C/22/70, Cody Williams/SF/21/67, Brice Sensabaugh/SF/22/69, Svi Mykhailiuk/SF/28/67, Georges Niang/PF/32/67, Walter Clayton Jr./PG/22/68',
    was: 'CJ McCollum/SG/34/77, Alex Sarr/C/20/76, Bilal Coulibaly/SF/21/75, Khris Middleton/SF/34/74, Kyshawn George/SF/22/72, Bub Carrington/PG/20/70, Marvin Bagley III/PF/26/70, Corey Kispert/SF/26/71, Tre Johnson/SG/19/72, Justin Champagnie/SF/24/66, Cam Whitmore/SF/21/69, Will Riley/SF/19/66'
  };
  // WNBA rosters for the 2025 season (13 teams, with the new Valkyries).
  var W = {
    atl: 'Allisha Gray/SG/30/88, Rhyne Howard/SG/25/85, Brionna Jones/PF/29/82, Brittney Griner/C/34/78, Jordin Canada/PG/30/79, Naz Hillmon/PF/25/76, Maya Caldwell/SG/26/71, Te-Hina Paopao/PG/22/72, Nia Coffey/SF/30/70, Shatori Walker-Kimbrough/SG/30/68, Taylor Thierry/SF/23/66',
    chi: 'Angel Reese/PF/23/85, Kamilla Cardoso/C/24/80, Ariel Atkins/SG/29/81, Courtney Vandersloot/PG/36/76, Rachel Banham/SG/31/72, Michaela Onyenwere/SF/26/70, Elizabeth Williams/C/32/71, Kia Nurse/SG/29/68, Hailey Van Lith/PG/23/68, Rebecca Allen/SF/32/68, Maddy Westbeld/PF/22/66',
    con: 'Marina Mabrey/SG/29/80, Tina Charles/C/37/79, Bria Hartley/PG/32/73, Olivia Nelson-Ododa/C/25/74, Saniya Rivers/SG/21/72, Aneesah Morrow/PF/22/73, Aaliyah Edwards/PF/23/72, Leila Lacan/PG/21/70, Lindsay Allen/PG/30/68, Jacy Sheldon/SG/24/68, Rayah Marshall/C/22/65',
    dal: 'Paige Bueckers/PG/23/89, Arike Ogunbowale/SG/28/85, Myisha Hines-Allen/PF/29/76, Li Yueru/C/26/75, Maddy Siegrist/SF/25/74, Teaira McCowan/C/29/74, Tyasha Harris/PG/27/70, Aziaha James/SG/21/70, Luisa Geiselsoder/C/25/69, Haley Jones/SG/24/67, JJ Quinerly/PG/23/66',
    gsv: 'Kayla Thornton/SF/33/80, Veronica Burton/PG/25/80, Tiffany Hayes/SG/35/76, Janelle Salaun/SF/24/75, Temi Fagbenle/C/32/74, Iliana Rupert/C/24/73, Cecilia Zandalasini/SF/29/72, Carla Leite/PG/21/72, Kate Martin/SG/25/70, Monique Billings/PF/29/70, Laeticia Amihere/PF/24/68, Kaitlyn Chen/PG/23/66',
    ind: 'Caitlin Clark/PG/23/93, Aliyah Boston/C/24/88, Kelsey Mitchell/SG/29/87, Natasha Howard/PF/34/80, Lexie Hull/SG/25/74, Sophie Cunningham/SG/29/73, Aari McDonald/PG/26/72, Odyssey Sims/PG/32/71, Damiris Dantas/PF/33/70, Brianna Turner/PF/29/69, Makayla Timpson/PF/22/67, Sydney Colson/PG/35/66',
    lva: 'A\'ja Wilson/C/29/97, Jackie Young/SG/27/88, Chelsea Gray/PG/32/84, Jewell Loyd/SG/31/81, NaLyssa Smith/PF/25/76, Kiah Stokes/C/32/72, Dana Evans/PG/26/73, Cheyenne Parker-Tyus/PF/32/71, Megan Gustafson/C/28/69, Aaliyah Nye/SG/22/68, Kierstan Bell/SF/25/66',
    las: 'Kelsey Plum/PG/30/88, Dearica Hamby/PF/31/86, Rickea Jackson/SF/24/80, Azura Stevens/PF/29/78, Cameron Brink/PF/23/77, Julie Allemand/PG/29/73, Rae Burrell/SG/25/70, Mercedes Russell/C/29/69, Emma Cannon/PF/36/66, Sania Feagin/PF/22/66, Shey Peddy/SG/36/64',
    min: 'Napheesa Collier/PF/29/97, Kayla McBride/SG/33/85, Courtney Williams/PG/31/84, Alanna Smith/PF/29/81, DiJonai Carrington/SG/27/77, Bridget Carleton/SF/28/74, Natisha Hiedeman/PG/28/74, Jessica Shepard/PF/28/74, Diamond Miller/SG/24/70, Maria Kliundikova/C/28/68, Karlie Samuelson/SG/30/66',
    nyl: 'Breanna Stewart/PF/31/93, Sabrina Ionescu/PG/27/91, Jonquel Jones/C/31/87, Natasha Cloud/PG/33/80, Leonie Fiebich/SF/25/76, Emma Meesseman/PF/32/80, Nyara Sabally/PF/25/72, Kennedy Burke/SG/28/71, Isabelle Harrison/PF/32/70, Marine Johannes/SG/30/72, Rebekah Gardner/SF/35/67, Jaylyn Sherrod/PG/24/65',
    phx: 'Alyssa Thomas/PF/33/92, Kahleah Copper/SG/31/86, Satou Sabally/SF/27/86, DeWanna Bonner/SF/37/77, Sami Whitcomb/SG/37/73, Natasha Mack/PF/28/71, Kathryn Westbeld/PF/29/70, Monique Akoa Makani/PG/23/71, Kitija Laksa/SG/29/70, Lexi Held/SG/25/67, Kalani Brown/C/28/67',
    sea: 'Nneka Ogwumike/PF/35/86, Skylar Diggins/PG/35/86, Gabby Williams/SF/28/84, Ezi Magbegor/C/26/82, Brittney Sykes/SG/31/82, Erica Wheeler/PG/34/74, Dominique Malonga/C/19/74, Lexie Brown/SG/30/69, Katie Lou Samuelson/SF/28/68, Zia Cooke/SG/24/66, Mackenzie Holmes/PF/24/65',
    was: 'Kiki Iriafen/PF/22/81, Sonia Citron/SG/22/80, Shakira Austin/C/24/80, Jade Melbourne/PG/23/73, Stefanie Dolson/C/33/71, Emily Engstler/PF/25/70, Sug Sutton/PG/26/69, Georgia Amoore/PG/23/71, Lucy Olsen/SG/22/67, Alysha Clark/SF/38/66'
  };
  // Historical snapshots: each franchise's core rotation in a landmark season
  // (named by the year it ended), as "Name/position/birth year/rating".
  var HIST = {
    1986: {
      atl: 'Dominique Wilkins/SF/1960/90, Doc Rivers/PG/1961/80, Kevin Willis/PF/1962/77, Tree Rollins/C/1955/74, Randy Wittman/SG/1959/74, Spud Webb/PG/1963/72, Cliff Levingston/PF/1961/72, Jon Koncak/C/1963/70',
      bos: 'Larry Bird/SF/1956/97, Kevin McHale/PF/1957/90, Robert Parish/C/1953/86, Dennis Johnson/PG/1954/82, Danny Ainge/SG/1959/79, Bill Walton/C/1952/78, Scott Wedman/SF/1952/72, Jerry Sichting/PG/1956/71',
      chi: 'Michael Jordan/SG/1963/93, Orlando Woolridge/SF/1959/80, George Gervin/SG/1952/80, Quintin Dailey/SG/1961/75, Charles Oakley/PF/1963/75, Sidney Green/PF/1961/73, Dave Corzine/C/1956/72, Gene Banks/SF/1959/72',
      cle: 'World B. Free/SG/1953/80, Roy Hinson/PF/1961/76, John Bagley/PG/1960/73, Mel Turpin/C/1961/73, Phil Hubbard/PF/1956/72, Ron Anderson/SF/1958/70, Keith Lee/PF/1962/70, Edgar Jones/PF/1956/68',
      dal: 'Mark Aguirre/SF/1959/85, Rolando Blackman/SG/1959/84, Derek Harper/PG/1961/80, Sam Perkins/PF/1961/78, James Donaldson/C/1957/76, Jay Vincent/SF/1959/74, Brad Davis/PG/1955/72, Detlef Schrempf/SF/1963/72',
      den: 'Alex English/SF/1954/88, Fat Lever/PG/1960/82, Calvin Natt/SF/1957/78, Wayne Cooper/C/1956/74, Bill Hanzlik/SG/1957/72, Danny Schayes/C/1959/72, Mike Evans/PG/1955/70, Elston Turner/SG/1959/68',
      det: 'Isiah Thomas/PG/1961/91, Bill Laimbeer/C/1957/82, Kelly Tripucka/SF/1959/79, Vinnie Johnson/SG/1956/78, Joe Dumars/SG/1963/74, Rick Mahorn/PF/1958/74, John Long/SG/1956/73, Kent Benson/PF/1954/70',
      gsw: 'Purvis Short/SF/1957/82, Joe Barry Carroll/C/1958/80, Sleepy Floyd/PG/1960/79, Chris Mullin/SF/1963/76, Larry Smith/PF/1958/73, Terry Teagle/SG/1960/71, Greg Ballard/SF/1955/70, Lester Conner/PG/1959/69',
      hou: 'Hakeem Olajuwon/C/1963/92, Ralph Sampson/C/1960/86, Lewis Lloyd/SG/1959/77, John Lucas/PG/1953/76, Rodney McCray/SF/1961/76, Robert Reid/SF/1955/75, Mitchell Wiggins/SG/1959/70, Jim Petersen/PF/1962/68',
      ind: 'Herb Williams/C/1958/78, Clark Kellogg/PF/1961/77, Wayman Tisdale/PF/1964/76, Vern Fleming/PG/1961/76, Steve Stipanovich/C/1960/75, Terence Stansbury/SG/1961/68, Clint Richardson/SG/1956/67, Bill Garnett/PF/1960/66',
      lac: 'Marques Johnson/SF/1956/80, Derek Smith/SG/1961/79, Norm Nixon/PG/1955/77, Benoit Benjamin/C/1964/74, Michael Cage/PF/1962/73, Cedric Maxwell/SF/1955/72, Rory White/SF/1959/68, Franklin Edwards/PG/1959/67',
      lal: 'Magic Johnson/PG/1959/96, Kareem Abdul-Jabbar/C/1947/88, James Worthy/SF/1961/86, Byron Scott/SG/1961/80, Michael Cooper/SG/1956/77, Maurice Lucas/PF/1952/74, Kurt Rambis/PF/1958/72, A.C. Green/PF/1963/72',
      mil: 'Sidney Moncrief/SG/1957/88, Terry Cummings/PF/1961/84, Paul Pressey/SF/1958/79, Ricky Pierce/SG/1959/77, Alton Lister/C/1958/74, Craig Hodges/SG/1960/73, Randy Breuer/C/1960/70, Paul Mokeski/C/1957/68',
      bkn: 'Buck Williams/PF/1960/84, Micheal Ray Richardson/PG/1955/80, Otis Birdsong/SG/1955/78, Mike Gminski/C/1959/77, Darryl Dawkins/C/1957/75, Albert King/SF/1959/74, Mike O\'Koren/SF/1958/68, Kelvin Ransey/PG/1958/68',
      nyk: 'Bernard King/SF/1956/88, Patrick Ewing/C/1962/85, Gerald Wilkins/SG/1963/72, Rory Sparrow/PG/1958/72, Pat Cummings/PF/1956/72, Louis Orr/SF/1958/70, Trent Tucker/SG/1959/70, Ken Bannister/PF/1960/66',
      phi: 'Charles Barkley/PF/1963/89, Moses Malone/C/1955/88, Julius Erving/SF/1950/83, Maurice Cheeks/PG/1956/82, Andrew Toney/SG/1957/76, Bobby Jones/PF/1951/74, Sedale Threatt/PG/1961/68, Clemon Johnson/C/1956/66',
      phx: 'Walter Davis/SG/1954/84, Larry Nance/PF/1959/84, James Edwards/C/1955/76, Alvan Adams/C/1954/74, Jay Humphries/PG/1962/74, Mike Sanders/SF/1960/70, Ed Pinckney/PF/1963/70, Rod Foster/SG/1960/66',
      por: 'Clyde Drexler/SG/1962/86, Kiki Vandeweghe/SF/1958/84, Jim Paxson/SG/1957/78, Mychal Thompson/C/1955/75, Sam Bowie/C/1961/74, Terry Porter/PG/1963/72, Kenny Carr/PF/1955/72, Steve Colter/PG/1962/70',
      sac: 'Reggie Theus/PG/1957/83, Eddie Johnson/SF/1959/80, Otis Thorpe/PF/1962/76, LaSalle Thompson/C/1961/75, Mike Woodson/SG/1958/74, Larry Drew/PG/1958/72, Joe Kleine/C/1962/68, Terry Tyler/PF/1956/68',
      sas: 'Alvin Robertson/SG/1962/84, Mike Mitchell/SF/1956/80, Artis Gilmore/C/1949/78, Johnny Moore/PG/1958/74, David Greenwood/PF/1957/73, Wes Matthews/PG/1959/70, Marc Iavaroni/PF/1956/67, Steve Johnson/C/1957/70',
      okc: 'Tom Chambers/PF/1959/84, Jack Sikma/C/1955/82, Xavier McDaniel/PF/1963/80, Gerald Henderson/PG/1956/74, Al Wood/SF/1958/72, Tim McCormick/C/1962/70, Danny Vranes/SF/1958/68, Frank Brickowski/C/1959/68',
      uta: 'Adrian Dantley/SF/1956/88, Karl Malone/PF/1963/82, John Stockton/PG/1962/76, Mark Eaton/C/1957/76, Thurl Bailey/PF/1961/76, Rickey Green/PG/1954/74, Darrell Griffith/SG/1958/74, Bobby Hansen/SG/1961/68',
      was: 'Jeff Malone/SG/1961/82, Jeff Ruland/C/1958/80, Gus Williams/PG/1953/78, Cliff Robinson/PF/1960/78, Manute Bol/C/1962/72, Dan Roundfield/PF/1953/72, Frank Johnson/PG/1958/70, Tom McMillen/PF/1952/66'
    },
    1993: {
      atl: 'Dominique Wilkins/SF/1960/88, Kevin Willis/PF/1962/80, Mookie Blaylock/PG/1967/80, Stacey Augmon/SF/1968/76, Duane Ferrell/SF/1965/70, Paul Graham/SG/1967/68, Jon Koncak/C/1963/68, Adam Keefe/PF/1970/68',
      bos: 'Reggie Lewis/SF/1965/84, Robert Parish/C/1953/80, Kevin McHale/PF/1957/76, Dee Brown/PG/1968/76, Xavier McDaniel/SF/1963/76, Kevin Gamble/SG/1965/74, Sherman Douglas/PG/1966/72, Rick Fox/SF/1969/70',
      cha: 'Larry Johnson/PF/1969/86, Alonzo Mourning/C/1970/86, Kendall Gill/SG/1968/79, Dell Curry/SG/1964/77, Muggsy Bogues/PG/1965/76, Johnny Newman/SF/1963/74, Kenny Gattison/PF/1964/70, David Wingate/SG/1963/66',
      chi: 'Michael Jordan/SG/1963/98, Scottie Pippen/SF/1965/90, Horace Grant/PF/1965/82, B.J. Armstrong/PG/1967/77, Bill Cartwright/C/1957/72, John Paxson/PG/1960/70, Scott Williams/PF/1968/70, Stacey King/PF/1967/69',
      cle: 'Mark Price/PG/1964/88, Brad Daugherty/C/1965/86, Larry Nance/PF/1959/82, John Williams/PF/1962/77, Craig Ehlo/SG/1961/75, Gerald Wilkins/SG/1963/74, Terrell Brandon/PG/1970/72, Mike Sanders/SF/1960/68',
      dal: 'Derek Harper/PG/1961/80, Jim Jackson/SG/1970/77, Sean Rooks/C/1969/70, Doug Smith/PF/1969/68, Terry Davis/PF/1967/66, Randy White/PF/1967/66, Mike Iuzzolino/PG/1968/64, Tim Legler/SG/1966/64',
      den: 'Dikembe Mutombo/C/1966/83, Mahmoud Abdul-Rauf/PG/1969/79, LaPhonso Ellis/PF/1970/78, Reggie Williams/SF/1964/75, Bryant Stith/SG/1970/73, Robert Pack/PG/1969/72, Mark Macon/SG/1969/68, Kevin Brooks/SF/1969/64',
      det: 'Joe Dumars/SG/1963/86, Isiah Thomas/PG/1961/82, Dennis Rodman/PF/1961/82, Terry Mills/PF/1967/76, Bill Laimbeer/C/1957/75, Alvin Robertson/SG/1962/73, Mark Aguirre/SF/1959/72, Olden Polynice/C/1964/70',
      gsw: 'Chris Mullin/SF/1963/87, Tim Hardaway/PG/1966/87, Sarunas Marciulionis/SG/1964/78, Latrell Sprewell/SG/1970/77, Billy Owens/SF/1969/77, Tyrone Hill/PF/1968/73, Chris Gatling/PF/1967/72, Victor Alexander/C/1969/68',
      hou: 'Hakeem Olajuwon/C/1963/95, Otis Thorpe/PF/1962/81, Vernon Maxwell/SG/1965/78, Kenny Smith/PG/1965/77, Robert Horry/PF/1970/74, Sleepy Floyd/PG/1960/70, Carl Herrera/PF/1966/70, Scott Brooks/PG/1965/68',
      ind: 'Reggie Miller/SG/1965/88, Detlef Schrempf/SF/1963/84, Rik Smits/C/1966/79, Pooh Richardson/PG/1966/77, Dale Davis/PF/1969/76, Vern Fleming/PG/1961/72, George McCloud/SF/1967/68, Malik Sealy/SF/1970/66',
      lac: 'Danny Manning/PF/1966/86, Ron Harper/SG/1964/81, Mark Jackson/PG/1965/79, Ken Norman/PF/1964/75, Stanley Roberts/C/1970/74, Loy Vaught/PF/1968/74, Gary Grant/PG/1965/70, Elmore Spencer/C/1969/66',
      lal: 'James Worthy/SF/1961/79, Vlade Divac/C/1968/79, Sedale Threatt/PG/1961/77, A.C. Green/PF/1963/76, Byron Scott/SG/1961/75, Elden Campbell/PF/1968/72, Anthony Peeler/SG/1969/72, Doug Christie/SG/1970/70',
      mia: 'Glen Rice/SF/1967/82, Rony Seikaly/C/1965/80, Steve Smith/SG/1969/79, Grant Long/PF/1966/74, Brian Shaw/PG/1966/72, Harold Miner/SG/1971/70, Bimbo Coles/PG/1968/70, Willie Burton/SF/1968/68',
      mil: 'Eric Murdock/PG/1968/76, Blue Edwards/SF/1965/74, Frank Brickowski/C/1959/74, Todd Day/SG/1970/73, Fred Roberts/PF/1960/68, Anthony Avent/PF/1969/68, Lee Mayberry/PG/1970/68, Moses Malone/C/1955/66',
      min: 'Christian Laettner/PF/1969/80, Doug West/SG/1967/76, Chuck Person/SF/1964/76, Micheal Williams/PG/1966/76, Felton Spencer/C/1968/70, Luc Longley/C/1969/68, Thurl Bailey/PF/1961/67, Gerald Glass/SF/1967/66',
      bkn: 'Drazen Petrovic/SG/1964/87, Derrick Coleman/PF/1967/86, Kenny Anderson/PG/1970/81, Chris Morris/SF/1966/74, Sam Bowie/C/1961/72, Chris Dudley/C/1965/70, Rumeal Robinson/PG/1966/68, Rafael Addison/SF/1964/66',
      nyk: 'Patrick Ewing/C/1962/92, John Starks/SG/1965/81, Charles Oakley/PF/1963/80, Anthony Mason/PF/1966/76, Charles Smith/PF/1965/75, Doc Rivers/PG/1961/74, Rolando Blackman/SG/1959/72, Greg Anthony/PG/1967/70',
      orl: 'Shaquille O\'Neal/C/1972/90, Nick Anderson/SG/1967/81, Dennis Scott/SF/1968/78, Scott Skiles/PG/1964/77, Anthony Bowie/SG/1963/70, Terry Catledge/PF/1963/68, Brian Williams/PF/1969/68, Donald Royal/SF/1966/66',
      phi: 'Jeff Hornacek/SG/1963/82, Hersey Hawkins/SG/1966/80, Clarence Weatherspoon/PF/1970/78, Armen Gilliam/PF/1964/74, Johnny Dawkins/PG/1963/72, Tim Perry/PF/1965/72, Andrew Lang/C/1966/68, Manute Bol/C/1962/64',
      phx: 'Charles Barkley/PF/1963/95, Kevin Johnson/PG/1966/88, Dan Majerle/SG/1965/82, Tom Chambers/PF/1959/76, Danny Ainge/SG/1959/75, Richard Dumas/SF/1969/74, Cedric Ceballos/SF/1969/74, Mark West/C/1960/70',
      por: 'Clyde Drexler/SG/1962/88, Terry Porter/PG/1963/83, Clifford Robinson/PF/1966/80, Rod Strickland/PG/1966/78, Buck Williams/PF/1960/76, Jerome Kersey/SF/1962/76, Kevin Duckworth/C/1964/72, Mario Elie/SG/1963/70',
      sac: 'Mitch Richmond/SG/1965/88, Wayman Tisdale/PF/1964/79, Lionel Simmons/SF/1968/77, Spud Webb/PG/1963/75, Walt Williams/SF/1970/74, Duane Causwell/C/1968/70, Anthony Bonner/PF/1968/68, Pete Chilcutt/PF/1968/66',
      sas: 'David Robinson/C/1965/94, Sean Elliott/SF/1968/81, Dale Ellis/SG/1960/79, Avery Johnson/PG/1965/75, Antoine Carr/PF/1961/74, Vinny Del Negro/SG/1966/72, J.R. Reid/PF/1968/70, Lloyd Daniels/SG/1967/68',
      okc: 'Shawn Kemp/PF/1969/86, Gary Payton/PG/1968/83, Ricky Pierce/SG/1959/79, Derrick McKey/SF/1966/78, Eddie Johnson/SF/1959/76, Sam Perkins/PF/1961/76, Nate McMillan/PG/1964/72, Michael Cage/C/1962/70',
      uta: 'Karl Malone/PF/1963/95, John Stockton/PG/1962/90, Jeff Malone/SG/1961/80, Tyrone Corbin/SF/1962/74, Jay Humphries/PG/1962/70, Mark Eaton/C/1957/68, David Benoit/PF/1968/68, Larry Krystkowiak/PF/1964/66',
      was: 'Tom Gugliotta/PF/1969/78, Harvey Grant/PF/1965/78, Pervis Ellison/C/1967/76, Michael Adams/PG/1963/76, Rex Chapman/SG/1967/74, LaBradford Smith/SG/1969/68, Larry Stewart/SF/1968/66, Doug Overton/PG/1969/64'
    },
    2000: {
      atl: 'Dikembe Mutombo/C/1966/85, Jim Jackson/SG/1970/78, Alan Henderson/PF/1972/76, Jason Terry/PG/1977/74, Lorenzen Wright/PF/1975/72, Bimbo Coles/PG/1968/70, Roshown McLeod/SF/1975/68, Dion Glover/SG/1978/66',
      bos: 'Paul Pierce/SF/1977/84, Antoine Walker/PF/1976/84, Kenny Anderson/PG/1970/79, Vitaly Potapenko/C/1975/70, Tony Battie/C/1976/70, Eric Williams/SF/1972/70, Dana Barros/PG/1967/70, Adrian Griffin/SG/1974/68',
      cha: 'Eddie Jones/SG/1971/85, Anthony Mason/PF/1966/80, Baron Davis/PG/1979/79, David Wesley/PG/1970/77, Elden Campbell/C/1968/77, Derrick Coleman/PF/1967/76, Bobby Phills/SG/1969/74, Chucky Brown/PF/1968/66',
      chi: 'Elton Brand/PF/1979/82, Toni Kukoc/SF/1968/78, Ron Artest/SF/1979/75, Hersey Hawkins/SG/1966/72, Randy Brown/PG/1968/68, Chris Carr/SG/1974/68, Will Perdue/C/1965/66, Dickey Simpkins/PF/1972/64',
      cle: 'Shawn Kemp/PF/1969/82, Andre Miller/PG/1976/78, Lamond Murray/SF/1973/76, Zydrunas Ilgauskas/C/1975/74, Brevin Knight/PG/1975/74, Wesley Person/SG/1971/72, Bob Sura/SG/1973/72, Danny Ferry/PF/1966/68',
      dal: 'Michael Finley/SG/1973/86, Dirk Nowitzki/PF/1978/84, Steve Nash/PG/1974/78, Cedric Ceballos/SF/1969/74, Shawn Bradley/C/1972/72, Erick Strickland/SG/1973/72, Gary Trent/PF/1974/70, Hubert Davis/SG/1970/70',
      den: 'Antonio McDyess/PF/1974/85, Nick Van Exel/PG/1971/82, Raef LaFrentz/C/1976/76, Ron Mercer/SG/1976/76, James Posey/SF/1977/74, Chris Gatling/PF/1967/72, George McCloud/SF/1967/68, Bryant Stith/SG/1970/66',
      det: 'Grant Hill/SF/1972/93, Jerry Stackhouse/SG/1974/84, Lindsey Hunter/PG/1970/76, Christian Laettner/PF/1969/76, Jerome Williams/PF/1973/73, Terry Mills/PF/1967/70, Michael Curry/SF/1968/68, Jud Buechler/SF/1968/64',
      gsw: 'Antawn Jamison/PF/1976/80, Larry Hughes/SG/1979/76, Donyell Marshall/PF/1973/76, Mookie Blaylock/PG/1967/75, Chris Mills/SF/1970/74, Erick Dampier/C/1975/72, Jason Caffey/PF/1973/70, Vonteego Cummings/PG/1976/66',
      hou: 'Steve Francis/PG/1977/84, Hakeem Olajuwon/C/1963/78, Cuttino Mobley/SG/1975/78, Charles Barkley/PF/1963/74, Shandon Anderson/SF/1973/74, Kenny Thomas/PF/1977/72, Walt Williams/SF/1970/72, Bryce Drew/PG/1974/64',
      ind: 'Reggie Miller/SG/1965/86, Jalen Rose/SF/1973/84, Rik Smits/C/1966/80, Dale Davis/PF/1969/79, Mark Jackson/PG/1965/78, Austin Croshere/PF/1975/74, Travis Best/PG/1972/72, Jermaine O\'Neal/PF/1978/70',
      lac: 'Lamar Odom/SF/1979/80, Maurice Taylor/PF/1976/78, Derek Anderson/SG/1974/76, Michael Olowokandi/C/1975/72, Tyrone Nesby/SF/1976/70, Eric Piatkowski/SG/1970/70, Troy Hudson/PG/1976/68, Brian Skinner/PF/1976/66',
      lal: 'Shaquille O\'Neal/C/1972/98, Kobe Bryant/SG/1978/92, Glen Rice/SF/1967/80, Ron Harper/PG/1964/74, Robert Horry/PF/1970/74, Rick Fox/SF/1969/73, Derek Fisher/PG/1974/72, A.C. Green/PF/1963/70',
      mem: 'Shareef Abdur-Rahim/SF/1976/85, Mike Bibby/PG/1978/80, Michael Dickerson/SG/1975/76, Othella Harrington/PF/1974/73, Bryant Reeves/C/1973/72, Grant Long/PF/1966/66, Felipe Lopez/SG/1974/64, Doug West/SG/1967/64',
      mia: 'Alonzo Mourning/C/1970/91, Tim Hardaway/PG/1966/82, Jamal Mashburn/SF/1972/82, P.J. Brown/PF/1969/77, Dan Majerle/SG/1965/73, Voshon Lenard/SG/1973/72, Clarence Weatherspoon/PF/1970/72, Anthony Carter/PG/1975/68',
      mil: 'Ray Allen/SG/1975/87, Glenn Robinson/SF/1973/85, Sam Cassell/PG/1969/84, Tim Thomas/PF/1977/76, Ervin Johnson/C/1967/70, Robert Traylor/PF/1977/68, Danny Manning/PF/1966/68, Darvin Ham/PF/1973/64',
      min: 'Kevin Garnett/PF/1976/94, Terrell Brandon/PG/1970/82, Wally Szczerbiak/SF/1977/77, Joe Smith/PF/1975/76, Malik Sealy/SF/1970/74, Anthony Peeler/SG/1969/72, Rasho Nesterovic/C/1976/68, Sam Mitchell/PF/1963/68',
      bkn: 'Stephon Marbury/PG/1977/87, Keith Van Horn/PF/1975/82, Kendall Gill/SG/1968/76, Kerry Kittles/SG/1974/76, Jayson Williams/PF/1968/74, Johnny Newman/SF/1963/68, Jamie Feick/C/1974/68, Scott Burrell/SF/1971/66',
      nyk: 'Allan Houston/SG/1971/85, Latrell Sprewell/SG/1970/84, Patrick Ewing/C/1962/80, Marcus Camby/PF/1974/77, Larry Johnson/PF/1969/76, Charlie Ward/PG/1970/72, Kurt Thomas/PF/1972/72, Chris Childs/PG/1967/70',
      orl: 'Darrell Armstrong/PG/1968/80, Ben Wallace/C/1974/74, Corey Maggette/SF/1979/74, Matt Harpring/SF/1976/73, Bo Outlaw/PF/1971/72, John Amaechi/C/1970/72, Chucky Atkins/PG/1974/70, Pat Garrity/PF/1976/70',
      phi: 'Allen Iverson/SG/1975/94, Theo Ratliff/C/1973/80, Tyrone Hill/PF/1968/76, Eric Snow/PG/1973/76, Aaron McKie/SG/1972/74, George Lynch/SF/1970/72, Matt Geiger/C/1969/70, Kevin Ollie/PG/1972/64',
      phx: 'Jason Kidd/PG/1973/90, Penny Hardaway/SG/1971/84, Clifford Robinson/PF/1966/80, Tom Gugliotta/PF/1969/80, Shawn Marion/SF/1978/78, Rodney Rogers/PF/1971/77, Kevin Johnson/PG/1966/70, Luc Longley/C/1969/68',
      por: 'Rasheed Wallace/PF/1974/86, Scottie Pippen/SF/1965/84, Arvydas Sabonis/C/1964/80, Steve Smith/SG/1969/80, Damon Stoudamire/PG/1973/79, Bonzi Wells/SG/1976/76, Brian Grant/PF/1972/76, Detlef Schrempf/SF/1963/72',
      sac: 'Chris Webber/PF/1973/92, Vlade Divac/C/1968/82, Jason Williams/PG/1975/80, Peja Stojakovic/SF/1977/79, Corliss Williamson/PF/1973/77, Nick Anderson/SG/1967/72, Jon Barry/SG/1969/70, Scot Pollard/C/1975/68',
      sas: 'Tim Duncan/PF/1976/96, David Robinson/C/1965/88, Avery Johnson/PG/1965/77, Sean Elliott/SF/1968/74, Mario Elie/SG/1963/72, Terry Porter/PG/1963/72, Malik Rose/PF/1974/70, Jaren Jackson/SG/1967/68',
      okc: 'Gary Payton/PG/1968/93, Vin Baker/PF/1971/80, Brent Barry/SG/1971/77, Rashard Lewis/SF/1979/76, Ruben Patterson/SF/1975/76, Horace Grant/PF/1965/72, Vernon Maxwell/SG/1965/68, Shammond Williams/PG/1975/66',
      tor: 'Vince Carter/SG/1977/93, Tracy McGrady/SF/1979/84, Antonio Davis/C/1968/78, Doug Christie/SG/1970/78, Charles Oakley/PF/1963/74, Kevin Willis/PF/1962/72, Dee Brown/PG/1968/70, Muggsy Bogues/PG/1965/70',
      uta: 'Karl Malone/PF/1963/93, John Stockton/PG/1962/86, Jeff Hornacek/SG/1963/78, Bryon Russell/SF/1970/76, Howard Eisley/PG/1972/72, Greg Ostertag/C/1973/70, Quincy Lewis/SF/1977/64, Adam Keefe/PF/1970/64',
      was: 'Mitch Richmond/SG/1965/81, Juwan Howard/PF/1973/80, Rod Strickland/PG/1966/79, Richard Hamilton/SG/1978/74, Tracy Murray/SF/1971/72, Aaron Williams/PF/1971/68, Chris Whitney/PG/1971/68, Calvin Booth/C/1976/66'
    },
    2008: {
      atl: 'Joe Johnson/SG/1981/87, Josh Smith/PF/1985/83, Al Horford/C/1986/79, Marvin Williams/SF/1986/76, Mike Bibby/PG/1978/76, Josh Childress/SF/1983/74, Zaza Pachulia/C/1984/70, Acie Law/PG/1985/66',
      bos: 'Kevin Garnett/PF/1976/93, Paul Pierce/SF/1977/90, Ray Allen/SG/1975/86, Rajon Rondo/PG/1986/79, Kendrick Perkins/C/1984/74, James Posey/SF/1976/72, Eddie House/PG/1978/70, Glen Davis/PF/1986/68',
      cha: 'Gerald Wallace/SF/1982/82, Jason Richardson/SG/1981/82, Emeka Okafor/C/1982/79, Raymond Felton/PG/1984/77, Jared Dudley/SF/1985/70, Nazr Mohammed/C/1977/70, Matt Carroll/SG/1980/68, Adam Morrison/SF/1984/66',
      chi: 'Luol Deng/SF/1985/80, Ben Gordon/SG/1983/80, Kirk Hinrich/PG/1981/77, Drew Gooden/PF/1981/74, Andres Nocioni/SF/1979/74, Joakim Noah/C/1985/72, Tyrus Thomas/PF/1986/72, Thabo Sefolosha/SG/1984/68',
      cle: 'LeBron James/SF/1984/96, Zydrunas Ilgauskas/C/1975/80, Delonte West/SG/1983/74, Anderson Varejao/PF/1982/74, Wally Szczerbiak/SF/1977/72, Ben Wallace/C/1974/72, Daniel Gibson/PG/1986/72, Joe Smith/PF/1975/70',
      dal: 'Dirk Nowitzki/PF/1978/93, Jason Kidd/PG/1973/82, Josh Howard/SF/1980/81, Jason Terry/SG/1977/81, Jerry Stackhouse/SG/1974/74, Erick Dampier/C/1975/72, Brandon Bass/PF/1985/70, DeSagana Diop/C/1982/66',
      den: 'Carmelo Anthony/SF/1984/90, Allen Iverson/SG/1975/88, Marcus Camby/C/1974/82, Kenyon Martin/PF/1977/78, Nene/PF/1982/77, J.R. Smith/SG/1985/76, Linas Kleiza/SF/1985/70, Anthony Carter/PG/1975/68',
      det: 'Chauncey Billups/PG/1976/89, Richard Hamilton/SG/1978/84, Rasheed Wallace/PF/1974/84, Tayshaun Prince/SF/1980/80, Antonio McDyess/PF/1974/75, Rodney Stuckey/PG/1986/72, Jason Maxiell/PF/1983/70, Arron Afflalo/SG/1985/66',
      gsw: 'Baron Davis/PG/1979/87, Monta Ellis/SG/1985/82, Stephen Jackson/SF/1978/81, Andris Biedrins/C/1986/76, Al Harrington/PF/1980/75, Matt Barnes/SF/1980/72, Mickael Pietrus/SF/1982/70, Kelenna Azubuike/SG/1983/70',
      hou: 'Yao Ming/C/1980/91, Tracy McGrady/SG/1979/88, Shane Battier/SF/1978/77, Luis Scola/PF/1980/76, Rafer Alston/PG/1976/74, Carl Landry/PF/1983/72, Bobby Jackson/SG/1973/68, Dikembe Mutombo/C/1966/66',
      ind: 'Danny Granger/SF/1983/83, Jermaine O\'Neal/C/1978/80, Mike Dunleavy/SF/1980/80, Troy Murphy/PF/1980/75, Jamaal Tinsley/PG/1978/74, Jeff Foster/C/1977/70, Marquis Daniels/SG/1981/70, Kareem Rush/SG/1980/66',
      lac: 'Elton Brand/PF/1979/82, Corey Maggette/SF/1979/81, Chris Kaman/C/1982/80, Cuttino Mobley/SG/1975/74, Sam Cassell/PG/1969/72, Al Thornton/SF/1983/72, Tim Thomas/PF/1977/70, Brevin Knight/PG/1975/66',
      lal: 'Kobe Bryant/SG/1978/97, Pau Gasol/PF/1980/88, Lamar Odom/PF/1979/82, Andrew Bynum/C/1987/80, Derek Fisher/PG/1974/74, Vladimir Radmanovic/SF/1980/72, Jordan Farmar/PG/1986/72, Luke Walton/SF/1980/70',
      mem: 'Rudy Gay/SF/1986/81, Mike Miller/SF/1980/79, Juan Carlos Navarro/SG/1980/72, Kyle Lowry/PG/1986/72, Mike Conley/PG/1987/72, Hakim Warrick/PF/1982/72, Darko Milicic/C/1985/68, Kwame Brown/C/1982/66',
      mia: 'Dwyane Wade/SG/1982/90, Shawn Marion/SF/1978/82, Udonis Haslem/PF/1980/74, Ricky Davis/SG/1979/72, Jason Williams/PG/1975/70, Mark Blount/C/1975/68, Daequan Cook/SG/1987/68, Marcus Banks/PG/1981/64',
      mil: 'Michael Redd/SG/1979/86, Mo Williams/PG/1982/80, Andrew Bogut/C/1984/79, Charlie Villanueva/PF/1984/75, Desmond Mason/SF/1977/72, Yi Jianlian/PF/1987/70, Bobby Simmons/SF/1980/70, Ramon Sessions/PG/1986/68',
      min: 'Al Jefferson/C/1985/84, Randy Foye/PG/1983/74, Rashad McCants/SG/1984/73, Ryan Gomes/SF/1982/72, Corey Brewer/SF/1986/68, Sebastian Telfair/PG/1985/68, Craig Smith/PF/1983/68, Mark Madsen/PF/1976/62',
      bkn: 'Vince Carter/SG/1977/86, Richard Jefferson/SF/1980/84, Devin Harris/PG/1983/81, Nenad Krstic/C/1983/72, Josh Boone/PF/1984/68, Bostjan Nachbar/SF/1980/68, Sean Williams/PF/1986/66, Marcus Williams/PG/1986/66',
      nyk: 'Zach Randolph/PF/1981/82, Jamal Crawford/SG/1980/80, Eddy Curry/C/1982/77, David Lee/PF/1983/77, Stephon Marbury/PG/1977/74, Nate Robinson/PG/1984/74, Quentin Richardson/SF/1980/72, Renaldo Balkman/SF/1984/66',
      nop: 'Chris Paul/PG/1985/95, David West/PF/1980/84, Tyson Chandler/C/1982/80, Peja Stojakovic/SF/1977/79, Morris Peterson/SG/1977/72, Jannero Pargo/PG/1979/70, Bonzi Wells/SG/1976/68, Julian Wright/SF/1987/66',
      orl: 'Dwight Howard/C/1985/93, Hedo Turkoglu/SF/1979/83, Rashard Lewis/PF/1979/83, Jameer Nelson/PG/1982/77, Keith Bogans/SG/1980/68, Maurice Evans/SF/1978/68, J.J. Redick/SG/1984/68, Carlos Arroyo/PG/1979/68',
      phi: 'Andre Iguodala/SF/1984/83, Andre Miller/PG/1976/81, Samuel Dalembert/C/1981/77, Lou Williams/SG/1986/74, Thaddeus Young/PF/1988/72, Willie Green/SG/1981/70, Reggie Evans/PF/1980/68, Jason Smith/PF/1986/66',
      phx: 'Steve Nash/PG/1974/91, Amar\'e Stoudemire/PF/1982/90, Shaquille O\'Neal/C/1972/80, Leandro Barbosa/SG/1982/78, Grant Hill/SF/1972/76, Raja Bell/SG/1976/75, Boris Diaw/PF/1982/74, Brian Skinner/C/1976/64',
      por: 'Brandon Roy/SG/1984/86, LaMarcus Aldridge/PF/1985/80, Travis Outlaw/SF/1984/74, Jarrett Jack/PG/1983/74, Steve Blake/PG/1980/72, Joel Przybilla/C/1979/72, Martell Webster/SF/1986/70, James Jones/SF/1980/68',
      sac: 'Kevin Martin/SG/1983/84, Ron Artest/SF/1979/81, Brad Miller/C/1976/77, Beno Udrih/PG/1982/74, John Salmons/SF/1979/74, Francisco Garcia/SF/1981/72, Mikki Moore/C/1975/68, Spencer Hawes/C/1988/66',
      sas: 'Tim Duncan/PF/1976/93, Tony Parker/PG/1982/87, Manu Ginobili/SG/1977/87, Bruce Bowen/SF/1971/72, Michael Finley/SG/1973/70, Kurt Thomas/PF/1972/70, Fabricio Oberto/C/1975/68, Robert Horry/PF/1970/64',
      okc: 'Kevin Durant/SF/1988/82, Jeff Green/PF/1986/74, Chris Wilcox/PF/1982/72, Earl Watson/PG/1979/72, Luke Ridnour/PG/1981/72, Nick Collison/PF/1980/70, Damien Wilkins/SG/1980/68, Mickael Gelabale/SF/1983/64',
      tor: 'Chris Bosh/PF/1984/89, Jose Calderon/PG/1981/79, T.J. Ford/PG/1983/77, Andrea Bargnani/PF/1985/74, Anthony Parker/SG/1975/74, Jason Kapono/SF/1981/72, Rasho Nesterovic/C/1976/70, Jamario Moon/SF/1980/70',
      uta: 'Deron Williams/PG/1984/88, Carlos Boozer/PF/1981/86, Mehmet Okur/C/1979/80, Andrei Kirilenko/SF/1981/79, Ronnie Brewer/SG/1985/74, Kyle Korver/SG/1981/74, Paul Millsap/PF/1985/74, Matt Harpring/SF/1976/70',
      was: 'Gilbert Arenas/PG/1982/86, Caron Butler/SF/1980/85, Antawn Jamison/PF/1976/84, Brendan Haywood/C/1979/74, DeShawn Stevenson/SG/1981/72, Andray Blatche/PF/1986/70, Roger Mason/SG/1980/68, Nick Young/SG/1985/68'
    },
    2016: {
      atl: 'Paul Millsap/PF/1985/86, Al Horford/C/1986/85, Jeff Teague/PG/1988/80, Kyle Korver/SG/1981/76, Kent Bazemore/SF/1989/76, Dennis Schroder/PG/1993/76, Thabo Sefolosha/SF/1984/72, Mike Scott/PF/1988/70',
      bos: 'Isaiah Thomas/PG/1989/87, Jae Crowder/SF/1990/79, Avery Bradley/SG/1990/78, Marcus Smart/SG/1994/74, Amir Johnson/PF/1987/74, Evan Turner/SF/1988/74, Kelly Olynyk/C/1991/73, Jared Sullinger/PF/1992/73',
      bkn: 'Brook Lopez/C/1988/84, Thaddeus Young/PF/1988/79, Joe Johnson/SG/1981/76, Bojan Bogdanovic/SF/1989/74, Jarrett Jack/PG/1983/72, Shane Larkin/PG/1992/70, Rondae Hollis-Jefferson/SF/1995/68, Donald Sloan/PG/1988/66',
      cha: 'Kemba Walker/PG/1990/86, Nicolas Batum/SF/1988/81, Marvin Williams/PF/1986/77, Al Jefferson/C/1985/76, Jeremy Lin/PG/1988/76, Cody Zeller/C/1992/74, Courtney Lee/SG/1985/73, Frank Kaminsky/PF/1993/70',
      chi: 'Jimmy Butler/SG/1989/87, Pau Gasol/C/1980/81, Derrick Rose/PG/1988/77, Taj Gibson/PF/1985/75, Nikola Mirotic/PF/1991/74, Joakim Noah/C/1985/72, Doug McDermott/SF/1992/70, E\'Twaun Moore/SG/1989/68',
      cle: 'LeBron James/SF/1984/97, Kyrie Irving/PG/1992/88, Kevin Love/PF/1988/84, Tristan Thompson/C/1991/76, J.R. Smith/SG/1985/76, Iman Shumpert/SG/1990/72, Matthew Dellavedova/PG/1990/70, Richard Jefferson/SF/1980/68',
      dal: 'Dirk Nowitzki/PF/1978/84, Chandler Parsons/SF/1988/78, Deron Williams/PG/1984/77, Wesley Matthews/SG/1986/76, Zaza Pachulia/C/1984/74, J.J. Barea/PG/1984/74, Raymond Felton/PG/1984/70, Dwight Powell/PF/1991/68',
      den: 'Danilo Gallinari/SF/1988/82, Nikola Jokic/C/1995/80, Kenneth Faried/PF/1989/76, Will Barton/SG/1991/76, Gary Harris/SG/1994/74, Emmanuel Mudiay/PG/1996/72, Wilson Chandler/SF/1987/72, Jusuf Nurkic/C/1994/70',
      det: 'Andre Drummond/C/1993/85, Reggie Jackson/PG/1990/81, Tobias Harris/PF/1992/78, Marcus Morris/SF/1989/76, Kentavious Caldwell-Pope/SG/1993/75, Stanley Johnson/SF/1996/68, Aron Baynes/C/1986/68, Steve Blake/PG/1980/64',
      gsw: 'Stephen Curry/PG/1988/98, Klay Thompson/SG/1990/88, Draymond Green/PF/1990/87, Harrison Barnes/SF/1992/77, Andre Iguodala/SF/1984/76, Andrew Bogut/C/1984/74, Shaun Livingston/PG/1985/72, Festus Ezeli/C/1989/68',
      hou: 'James Harden/SG/1989/94, Dwight Howard/C/1985/83, Trevor Ariza/SF/1985/76, Patrick Beverley/PG/1988/74, Clint Capela/C/1994/74, Donatas Motiejunas/PF/1990/70, Terrence Jones/PF/1991/70, Corey Brewer/SF/1986/68',
      ind: 'Paul George/SF/1990/90, Monta Ellis/SG/1985/78, George Hill/PG/1986/77, Myles Turner/C/1996/74, Ian Mahinmi/C/1986/72, C.J. Miles/SF/1987/72, Rodney Stuckey/SG/1986/70, Solomon Hill/SF/1991/66',
      lac: 'Chris Paul/PG/1985/93, Blake Griffin/PF/1989/87, DeAndre Jordan/C/1988/84, J.J. Redick/SG/1984/80, Jamal Crawford/SG/1980/77, Jeff Green/PF/1986/72, Austin Rivers/SG/1992/70, Paul Pierce/SF/1977/66',
      lal: 'Kobe Bryant/SG/1978/78, Lou Williams/SG/1986/76, Jordan Clarkson/SG/1992/75, D\'Angelo Russell/PG/1996/74, Julius Randle/PF/1994/74, Nick Young/SG/1985/68, Larry Nance Jr./PF/1993/68, Roy Hibbert/C/1986/66',
      mem: 'Marc Gasol/C/1985/85, Mike Conley/PG/1987/84, Zach Randolph/PF/1981/80, Tony Allen/SG/1981/72, Matt Barnes/SF/1980/72, Mario Chalmers/PG/1986/72, Lance Stephenson/SG/1990/70, JaMychal Green/PF/1990/68',
      mia: 'Dwyane Wade/SG/1982/85, Chris Bosh/PF/1984/84, Hassan Whiteside/C/1989/82, Goran Dragic/PG/1986/80, Luol Deng/SF/1985/76, Justise Winslow/SF/1996/70, Gerald Green/SF/1986/70, Amar\'e Stoudemire/C/1982/64',
      mil: 'Giannis Antetokounmpo/SF/1994/84, Khris Middleton/SG/1991/82, Greg Monroe/C/1990/78, Jabari Parker/PF/1995/77, Michael Carter-Williams/PG/1991/72, O.J. Mayo/SG/1987/70, John Henson/C/1990/70, Jerryd Bayless/PG/1988/70',
      min: 'Karl-Anthony Towns/C/1995/85, Andrew Wiggins/SF/1995/80, Ricky Rubio/PG/1990/77, Zach LaVine/SG/1995/77, Gorgui Dieng/PF/1990/74, Shabazz Muhammad/SF/1992/70, Nemanja Bjelica/PF/1988/68, Kevin Garnett/PF/1976/66',
      nop: 'Anthony Davis/PF/1993/92, Jrue Holiday/PG/1990/82, Ryan Anderson/PF/1988/78, Eric Gordon/SG/1988/77, Tyreke Evans/SG/1989/77, Omer Asik/C/1986/68, Norris Cole/PG/1988/68, Alonzo Gee/SF/1987/66',
      nyk: 'Carmelo Anthony/SF/1984/88, Kristaps Porzingis/PF/1995/79, Robin Lopez/C/1988/75, Arron Afflalo/SG/1985/74, Jose Calderon/PG/1981/70, Derrick Williams/PF/1991/70, Langston Galloway/PG/1991/68, Kyle O\'Quinn/C/1990/68',
      okc: 'Kevin Durant/SF/1988/96, Russell Westbrook/PG/1988/95, Serge Ibaka/PF/1989/82, Enes Kanter/C/1992/78, Steven Adams/C/1993/77, Dion Waiters/SG/1991/74, Andre Roberson/SG/1991/70, Randy Foye/SG/1983/66',
      orl: 'Nikola Vucevic/C/1990/83, Victor Oladipo/SG/1992/80, Evan Fournier/SG/1992/78, Aaron Gordon/PF/1995/76, Elfrid Payton/PG/1994/74, Brandon Jennings/PG/1989/70, Mario Hezonja/SF/1995/68, Channing Frye/PF/1983/68',
      phi: 'Jahlil Okafor/C/1995/75, Nerlens Noel/C/1994/74, Robert Covington/SF/1990/74, Ish Smith/PG/1988/72, Isaiah Canaan/PG/1991/68, Jerami Grant/PF/1994/68, Hollis Thompson/SG/1991/66, Nik Stauskas/SG/1993/66',
      phx: 'Eric Bledsoe/PG/1989/82, Brandon Knight/PG/1991/79, Devin Booker/SG/1996/76, T.J. Warren/SF/1993/74, Tyson Chandler/C/1982/72, P.J. Tucker/SF/1985/72, Markieff Morris/PF/1989/72, Alex Len/C/1993/70',
      por: 'Damian Lillard/PG/1990/92, C.J. McCollum/SG/1991/85, Mason Plumlee/C/1990/75, Allen Crabbe/SG/1992/74, Al-Farouq Aminu/SF/1990/74, Ed Davis/PF/1989/72, Maurice Harkless/SF/1993/72, Meyers Leonard/C/1992/70',
      sac: 'DeMarcus Cousins/C/1990/91, Rajon Rondo/PG/1986/82, Rudy Gay/SF/1986/80, Darren Collison/PG/1987/77, Omri Casspi/SF/1988/74, Ben McLemore/SG/1993/70, Willie Cauley-Stein/C/1993/70, Kosta Koufos/C/1989/68',
      sas: 'Kawhi Leonard/SF/1991/93, LaMarcus Aldridge/PF/1985/86, Tony Parker/PG/1982/80, Tim Duncan/C/1976/78, Manu Ginobili/SG/1977/76, Danny Green/SG/1987/74, Patty Mills/PG/1988/72, Boris Diaw/PF/1982/72',
      tor: 'Kyle Lowry/PG/1986/90, DeMar DeRozan/SG/1989/88, Jonas Valanciunas/C/1992/78, Cory Joseph/PG/1991/74, DeMarre Carroll/SF/1986/72, Terrence Ross/SG/1991/72, Patrick Patterson/PF/1989/72, Bismack Biyombo/C/1992/72',
      uta: 'Gordon Hayward/SF/1990/86, Rudy Gobert/C/1992/82, Derrick Favors/PF/1991/81, Rodney Hood/SG/1992/76, Alec Burks/SG/1991/72, Trey Lyles/PF/1995/70, Shelvin Mack/PG/1990/70, Joe Ingles/SF/1987/70',
      was: 'John Wall/PG/1990/90, Bradley Beal/SG/1993/83, Marcin Gortat/C/1984/79, Otto Porter Jr./SF/1993/76, Nene/PF/1982/72, Jared Dudley/SF/1985/70, Ramon Sessions/PG/1986/70, Kris Humphries/PF/1985/66'
    },
    2021: {
      atl: 'Trae Young/PG/1998/89, John Collins/PF/1997/82, Clint Capela/C/1994/80, Bogdan Bogdanovic/SG/1992/78, De\'Andre Hunter/SF/1997/76, Danilo Gallinari/PF/1988/76, Kevin Huerter/SG/1998/74, Lou Williams/SG/1986/72',
      bos: 'Jayson Tatum/SF/1998/90, Jaylen Brown/SG/1996/87, Kemba Walker/PG/1990/80, Marcus Smart/PG/1994/77, Evan Fournier/SG/1992/76, Robert Williams III/C/1997/74, Tristan Thompson/C/1991/72, Payton Pritchard/PG/1998/68',
      bkn: 'Kevin Durant/SF/1988/95, James Harden/PG/1989/93, Kyrie Irving/PG/1992/90, Joe Harris/SG/1991/77, Blake Griffin/PF/1989/72, Jeff Green/PF/1986/72, Bruce Brown/SG/1996/72, DeAndre Jordan/C/1988/70',
      cha: 'LaMelo Ball/PG/2001/81, Terry Rozier/PG/1994/81, Gordon Hayward/SF/1990/80, Miles Bridges/PF/1998/77, P.J. Washington/PF/1998/76, Devonte\' Graham/PG/1995/74, Malik Monk/SG/1998/74, Cody Zeller/C/1992/70',
      chi: 'Zach LaVine/SG/1995/88, Nikola Vucevic/C/1990/85, Lauri Markkanen/PF/1997/76, Coby White/PG/2000/74, Thaddeus Young/PF/1988/74, Patrick Williams/PF/2001/72, Tomas Satoransky/PG/1991/70, Garrett Temple/SG/1986/68',
      cle: 'Collin Sexton/SG/1999/81, Jarrett Allen/C/1998/80, Darius Garland/PG/2000/78, Kevin Love/PF/1988/74, Larry Nance Jr./PF/1993/74, Isaac Okoro/SF/2001/70, Cedi Osman/SF/1995/70, Taurean Prince/SF/1994/68',
      dal: 'Luka Doncic/PG/1999/95, Kristaps Porzingis/C/1995/83, Tim Hardaway Jr./SG/1992/79, Jalen Brunson/PG/1996/77, Dorian Finney-Smith/SF/1993/74, Josh Richardson/SG/1993/74, Maxi Kleber/PF/1992/70, Dwight Powell/C/1991/70',
      den: 'Nikola Jokic/C/1995/98, Jamal Murray/PG/1997/87, Michael Porter Jr./SF/1998/84, Aaron Gordon/PF/1995/80, Will Barton/SG/1991/76, Monte Morris/PG/1995/74, JaMychal Green/PF/1990/70, Facundo Campazzo/PG/1991/70',
      det: 'Jerami Grant/PF/1994/82, Saddiq Bey/SF/1999/74, Mason Plumlee/C/1990/72, Isaiah Stewart/C/2001/72, Josh Jackson/SF/1997/72, Killian Hayes/PG/2001/68, Frank Jackson/SG/1998/68, Hamidou Diallo/SG/1998/68',
      gsw: 'Stephen Curry/PG/1988/97, Draymond Green/PF/1990/84, Andrew Wiggins/SF/1995/80, Kelly Oubre Jr./SF/1995/76, Jordan Poole/SG/1999/72, James Wiseman/C/2001/70, Kevon Looney/C/1996/68, Juan Toscano-Anderson/SF/1993/68',
      hou: 'Christian Wood/C/1995/82, John Wall/PG/1990/80, Eric Gordon/SG/1988/76, Kevin Porter Jr./SG/2000/74, Jae\'Sean Tate/SF/1995/72, Kelly Olynyk/C/1991/72, David Nwaba/SF/1993/68, Sterling Brown/SG/1995/66',
      ind: 'Domantas Sabonis/PF/1996/86, Malcolm Brogdon/PG/1992/84, Caris LeVert/SG/1994/80, Myles Turner/C/1996/79, T.J. Warren/SF/1993/76, Doug McDermott/SF/1992/74, Justin Holiday/SF/1989/72, T.J. McConnell/PG/1992/72',
      lac: 'Kawhi Leonard/SF/1991/95, Paul George/SF/1990/89, Reggie Jackson/PG/1990/77, Marcus Morris/PF/1989/76, Ivica Zubac/C/1997/74, Nicolas Batum/SF/1988/72, Terance Mann/SG/1996/72, Rajon Rondo/PG/1986/68',
      lal: 'LeBron James/SF/1984/96, Anthony Davis/PF/1993/92, Dennis Schroder/PG/1993/78, Kyle Kuzma/PF/1995/76, Montrezl Harrell/C/1994/76, Kentavious Caldwell-Pope/SG/1993/74, Andre Drummond/C/1993/74, Alex Caruso/SG/1994/72',
      mem: 'Ja Morant/PG/1999/87, Jaren Jackson Jr./PF/1999/80, Jonas Valanciunas/C/1992/80, Dillon Brooks/SF/1996/76, Desmond Bane/SG/1998/74, Kyle Anderson/SF/1993/74, Brandon Clarke/PF/1996/74, De\'Anthony Melton/SG/1998/72',
      mia: 'Jimmy Butler/SF/1989/91, Bam Adebayo/C/1997/87, Tyler Herro/SG/2000/79, Duncan Robinson/SF/1994/76, Victor Oladipo/SG/1992/76, Goran Dragic/PG/1986/74, Kendrick Nunn/PG/1995/74, Trevor Ariza/SF/1985/68',
      mil: 'Giannis Antetokounmpo/PF/1994/97, Khris Middleton/SF/1991/87, Jrue Holiday/PG/1990/86, Brook Lopez/C/1988/79, Bobby Portis/PF/1995/75, Donte DiVincenzo/SG/1997/74, P.J. Tucker/PF/1985/70, Pat Connaughton/SG/1993/70',
      min: 'Karl-Anthony Towns/C/1995/88, Anthony Edwards/SG/2001/80, D\'Angelo Russell/PG/1996/80, Malik Beasley/SG/1996/76, Ricky Rubio/PG/1990/72, Naz Reid/C/1999/70, Jaden McDaniels/SF/2000/70, Jarred Vanderbilt/PF/1999/68',
      nop: 'Zion Williamson/PF/2000/91, Brandon Ingram/SF/1997/86, Lonzo Ball/PG/1997/80, Steven Adams/C/1993/74, Eric Bledsoe/PG/1989/72, Josh Hart/SG/1995/72, Nickeil Alexander-Walker/SG/1998/70, Jaxson Hayes/C/2000/68',
      nyk: 'Julius Randle/PF/1994/88, RJ Barrett/SG/2000/78, Derrick Rose/PG/1988/77, Mitchell Robinson/C/1998/74, Immanuel Quickley/PG/1999/74, Nerlens Noel/C/1994/72, Reggie Bullock/SF/1991/72, Alec Burks/SG/1991/72',
      okc: 'Shai Gilgeous-Alexander/PG/1998/87, Luguentz Dort/SG/1999/74, Al Horford/C/1986/74, Darius Bazley/PF/2000/70, Kenrich Williams/PF/1994/68, Theo Maledon/PG/2001/66, Isaiah Roby/PF/1998/66, Aleksej Pokusevski/PF/2001/64',
      orl: 'Jonathan Isaac/PF/1997/76, Terrence Ross/SG/1991/74, Wendell Carter Jr./C/1999/74, Cole Anthony/PG/2000/72, Mo Bamba/C/1998/68, Chuma Okeke/PF/1998/68, Dwayne Bacon/SF/1995/66, R.J. Hampton/PG/2001/66',
      phi: 'Joel Embiid/C/1994/95, Ben Simmons/PG/1996/85, Tobias Harris/PF/1992/84, Seth Curry/SG/1990/77, Danny Green/SG/1987/72, Shake Milton/SG/1996/72, Matisse Thybulle/SG/1997/72, Dwight Howard/C/1985/70',
      phx: 'Devin Booker/SG/1996/91, Chris Paul/PG/1985/90, Deandre Ayton/C/1998/84, Mikal Bridges/SF/1996/82, Jae Crowder/PF/1990/76, Cameron Johnson/PF/1996/75, Cameron Payne/PG/1994/72, Dario Saric/PF/1994/70',
      por: 'Damian Lillard/PG/1990/94, C.J. McCollum/SG/1991/86, Norman Powell/SG/1993/80, Jusuf Nurkic/C/1994/78, Robert Covington/PF/1990/74, Carmelo Anthony/SF/1984/74, Enes Kanter/C/1992/72, Anfernee Simons/SG/1999/72',
      sac: 'De\'Aaron Fox/PG/1997/88, Harrison Barnes/SF/1992/79, Tyrese Haliburton/PG/2000/78, Richaun Holmes/C/1993/78, Buddy Hield/SG/1992/78, Marvin Bagley III/PF/1999/72, Delon Wright/PG/1992/72, Terence Davis/SG/1997/68',
      sas: 'DeMar DeRozan/SF/1989/86, Dejounte Murray/PG/1996/82, Keldon Johnson/SF/1999/76, Derrick White/SG/1994/76, Jakob Poeltl/C/1995/74, Patty Mills/PG/1988/72, Rudy Gay/SF/1986/72, Lonnie Walker IV/SG/1998/70',
      tor: 'Pascal Siakam/PF/1994/86, Fred VanVleet/PG/1994/85, Kyle Lowry/PG/1986/84, OG Anunoby/SF/1997/80, Gary Trent Jr./SG/1999/76, Chris Boucher/PF/1993/72, Khem Birch/C/1992/68, Malachi Flynn/PG/1998/66',
      uta: 'Donovan Mitchell/SG/1996/90, Rudy Gobert/C/1992/87, Mike Conley/PG/1987/84, Bojan Bogdanovic/SF/1989/80, Jordan Clarkson/SG/1992/79, Joe Ingles/SF/1987/76, Royce O\'Neale/SF/1993/72, Derrick Favors/C/1991/70',
      was: 'Bradley Beal/SG/1993/91, Russell Westbrook/PG/1988/88, Rui Hachimura/PF/1998/76, Daniel Gafford/C/1998/72, Davis Bertans/PF/1992/72, Thomas Bryant/C/1997/70, Raul Neto/PG/1992/68, Deni Avdija/SF/2001/66'
    }
  };
  // Parse once.
  var cache = {};
  function all(g) {
    g = g === 'F' ? 'F' : 'M';
    if (cache[g]) return cache[g];
    var src = g === 'F' ? W : R, out = cache[g] = {};
    Object.keys(src).forEach(function (f) {
      out[f] = src[f].split(', ').map(function (e) { var q = e.split('/'); return { n: q[0], pos: q[1], a: +q[2], o: +q[3] }; });
    });
    return out;
  }
  // Ratings drift with age between a snapshot and the season asked for:
  // young players rise, veterans fade (the same arc as js/league.js).
  function drift(o, born, from, to) {
    var step = to > from ? 1 : -1;
    for (var y = from; y !== to; y += step) { var a = (step > 0 ? y : y - 1) - born, d = a <= 22 ? 2 : a <= 25 ? 1 : a <= 30 ? 0 : a <= 33 ? -1.5 : -3; o += d * step; }
    return Math.round(Math.max(45, Math.min(99, o)));
  }
  var hcache = {};
  // The nearest historical snapshot within four seasons of y (men only), with
  // each player's age and rating moved to season y; players who weren't in
  // the league yet (under 19) or had retired (over 40) are left out.
  function historical(y) {
    var best = null;
    Object.keys(HIST).forEach(function (k) { var d = Math.abs(+k - y); if (d <= 4 && (best === null || d < Math.abs(best - y))) best = +k; });
    if (best === null) return null;
    var key = best + ':' + y;
    if (hcache[key]) return hcache[key];
    var src = HIST[best], out = hcache[key] = {};
    Object.keys(src).forEach(function (f) {
      out[f] = src[f].split(', ').map(function (e) { var q = e.split('/'), born = +q[2]; return { n: q[0], pos: q[1], a: y - born, o: drift(+q[3], born, best, y) }; })
        .filter(function (p) { return p.a >= 19 && p.a <= 40; });
    });
    out._from = best;
    return out;
  }
  // A player's position from any snapshot he appears in (for stars added by name).
  var pmap = null;
  function posOf(name) {
    if (!pmap) { pmap = {}; [R].concat(Object.keys(HIST).map(function (k) { return HIST[k]; })).forEach(function (src) { Object.keys(src).forEach(function (f) { src[f].split(', ').forEach(function (e) { var q = e.split('/'); pmap[q[0]] = q[1]; }); }); }); }
    return pmap[name] || null;
  }
  // Rosters for season y: the current snapshot from 2025, else a historical one.
  function forSeason(g, y) {
    if (y >= 2025) { var r = all(g), sh = y - season(g), out = {}; Object.keys(r).forEach(function (f) { out[f] = r[f].map(function (p) { return { n: p.n, pos: p.pos, a: p.a + sh, o: p.o }; }); }); return out; }
    return g === 'F' ? null : historical(y);
  }
  // The season each snapshot belongs to (NBA seasons are named by the year they end).

  function season(g) { return g === 'F' ? 2025 : 2026; }
  return { all: all, season: season, forSeason: forSeason, historical: historical, posOf: posOf, SEASON: 2026 };
})();
