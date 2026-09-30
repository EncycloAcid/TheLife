# TheLife 🌱

A deep, text-based life simulator for Android in the spirit of InstaLife/BitLife. Live one year at a time from birth to death, make choices, and build a family legacy across generations.

## Features

- **17 countries**, each with its own names, currency, tax rate and life expectancy. Emigrate mid-life.
- **Stats**: happiness, health, smarts, looks, plus athleticism, karma, fame and social-media followers.
- **Education**: elementary → middle → high school, a GED, trade school, university (26 majors; pay with parents, a scholarship, loans or savings), and graduate school (Law, Medicine, Veterinary, Dental, MBA, PhD). You can study, join clubs and sports teams, skip class or drop out.
- **Careers**: 50 career ladders with promotions, performance reviews, raises and firing, plus part-time jobs, odd jobs, retirement and pensions. **Job interviews** ask you a question, and your answer (or your smarts, fitness or looks) sways the hiring manager.
- **Trade school, vet school and dental school**: become an electrician, plumber, welder or HVAC tech after two years of training, or a veterinarian or dentist after grad school.
- **Astronaut**: a tough-to-land career for fit STEM graduates, with real space missions (and real risk).
- **Fame careers**: acting, music and pro sports, with auditions, big gigs, endorsement deals and paparazzi.
- **Politics**: run for City Council, then climb to Mayor, Governor, Senator and President. You campaign, give speeches, pass policies, survive scandals, take (or refuse) bribes, win re-elections and hit term limits.
- **Relationships**: parents, siblings, grandparents, friends, classmates, coworkers, partners and kids. You can talk, gift, prank, argue, and ask for or give money. Dating app, nightclubs, vacation romances, proposals, weddings (with prenups), cheating, divorce with asset splits, pregnancy, twins, IVF, surrogacy and adoption. Your adult children marry and give you grandchildren.
- **Where you live**: stay with your parents (they may start charging rent), rent anything from a shared room to a luxury loft, move into a house you own, or end up evicted and homeless.
- **Assets**: real estate with mortgages, renovation and rental income; cars, jets and yachts with financing; jewelry; a stock market; and businesses you can start and grow.
- **Health**: 29 illnesses, injuries and addictions. Doctors, herbalists, therapy, rehab and plastic surgery.
- **Activities**: gym, library, meditation, martial arts, instruments, social media, casino (blackjack, slots, roulette, horse racing), lottery, vacations, pets (8 species) and volunteering.
- **Crime & prison**: from shoplifting to jewelry heists, then trials with lawyers, prison gangs, appeals, escape attempts and good behavior.
- **Organized crime**: join a crime family and rise from Associate to Boss. You run jobs, earn respect, bribe detectives to cool the heat, survive FBI raids and rival families, or flip and become an informant.
- **Royalty**: choose to be born into a royal family. You have a place in the line of succession, royal duties, a popularity rating, tabloid scandals and arranged matches. You can be crowned, issue decrees, knight your friends, or abdicate. A revolution may overthrow you. The crown passes down your family line.
- **Hobbies & skills**: coding, writing, singing, painting, cooking, comedy, chess and fitness. Skills boost related careers. You can write books that earn royalties, sell paintings, build apps, and enter competitions and open mics.
- **Wills**: name a main heir to inherit most of your estate.
- **Awards**: win Academy Awards, Grammys, MVPs, Pulitzers and even the Nobel Prize, with ceremonies where you choose how to show up.
- **Student life**: take the SAT, run for class president, join a fraternity or sorority, go to campus parties, land internships (which help you get hired later) and study abroad.
- **Landlord life**: tenants who pay late, wreck the place, throw parties, or offer to buy your house.
- **Custom lives**: set your starting happiness, health, smarts and looks, and your family's wealth.
- **Time Machine**: go back up to five years, even after you die.
- **Bucket list**: every life gets five personal goals, from skydiving and running a marathon to seeing the Northern Lights.
- **Obituary & life chart**: when you die, read your obituary and see your net worth and happiness charted across your whole life.
- **Driving**: speeding tickets, drunk-driving choices and road rage.
- **~95 random life events** with choices, gated by age and circumstances.
- **Death & legacy**: an obituary with a life ribbon, a graveyard of past lives, and the option to continue as one of your children, or a grandchild if no children survive, with an inheritance.
- **43 achievements**, tracked per life and across all lives.
- **Backup & restore**: export all your lives as a code and restore them on any device.
- **Settings**: text size, and deleting all data.
- Works offline, autosaves, supports light and dark themes, and handles the Android back gesture.

## Install on Android

Every push builds the APKs in GitHub Actions. Open the **Actions** tab, pick the latest **Build Android APK** run, download the `TheLife-apk` artifact, and install `app-release.apk` on your phone. You'll need to allow installs from unknown sources.

## Build it yourself

Requirements: JDK 17+ and the Android SDK (API 35).

```bash
echo "sdk.dir=/path/to/Android/sdk" > local.properties
./gradlew assembleRelease        # → app/build/outputs/apk/release/app-release.apk
```

Or open the project in Android Studio and press Run.

The release build is signed with the debug key so it installs directly. Before publishing to Google Play, set up your own signing config in `app/build.gradle.kts`.

## Play in a browser

The game itself is plain HTML, CSS and JavaScript in [`game/`](game/), with no build step. Open `game/index.html` in any browser, or host the folder as a PWA.

## Project layout

```
game/                  The game (packaged into the APK as assets)
  js/util.js           RNG and formatting helpers
  js/data.js           Countries, careers, majors, houses, cars, illnesses, crimes, achievements…
  js/engine.js         Core simulation: aging, school, jobs, money, health, family, prison, legacy, saves
  js/events.js         Random and scripted life events with choices
  js/actions.js        Everything you can do from the four menus
  js/features.js       Royalty, organized crime, skills & books, wills
  js/ui.js             Screens, life log, bottom-sheet menus, dialogs
app/                   Android wrapper (Kotlin, WebView + WebViewAssetLoader)
tests/simulate.js      Headless fuzz test that plays hundreds of random lives
```

## Tests

```bash
node tests/simulate.js 200
```

This plays 200 families (plus their heirs) by tapping random menu items and choices every year. It fails on any exception or corrupted state, such as NaN money or stats out of range.
