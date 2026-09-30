# TheLife 🌱

A deep, text-based life simulator for Android in the spirit of InstaLife/BitLife. Live one year at a time from birth to death, make choices, and build a family legacy across generations.

## Features

- **17 countries**, each with its own names, currency, tax rate and life expectancy. Emigrate mid-life.
- **Stats**: happiness, health, smarts, looks, plus athleticism, karma, fame and social-media followers.
- **Education**: elementary → middle → high school, a GED, university (26 majors; pay with parents, a scholarship, loans or savings), and graduate school (Law, Medicine, MBA, PhD). You can study, join clubs and sports teams, skip class or drop out.
- **Careers**: 37 career ladders with promotions, performance reviews, raises and firing, plus part-time jobs, odd jobs, retirement and pensions.
- **Fame careers**: acting, music and pro sports, with auditions, big gigs, endorsement deals and paparazzi.
- **Relationships**: parents, siblings, grandparents, friends, classmates, coworkers, partners and kids. You can talk, gift, prank, argue, and ask for or give money. Dating app, nightclubs, vacation romances, proposals, weddings (with prenups), cheating, divorce with asset splits, pregnancy and adoption.
- **Assets**: real estate with mortgages, renovation and rental income; cars, jets and yachts with financing; jewelry; a stock market; and businesses you can start and grow.
- **Health**: 29 illnesses, injuries and addictions. Doctors, herbalists, therapy, rehab and plastic surgery.
- **Activities**: gym, library, meditation, martial arts, instruments, social media, casino (blackjack, slots, roulette, horse racing), lottery, vacations, pets (8 species) and volunteering.
- **Crime & prison**: from shoplifting to jewelry heists, then trials with lawyers, prison gangs, appeals, escape attempts and good behavior.
- **~60 random life events** with choices, gated by age and circumstances.
- **Death & legacy**: an obituary with a life ribbon, a graveyard of past lives, and the option to continue as one of your children (with an inheritance).
- **30 achievements**, tracked per life and across all lives.
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
  js/ui.js             Screens, life log, bottom-sheet menus, dialogs
app/                   Android wrapper (Kotlin, WebView + WebViewAssetLoader)
tests/simulate.js      Headless fuzz test that plays hundreds of random lives
```

## Tests

```bash
node tests/simulate.js 200
```

This plays 200 families (plus their heirs) by tapping random menu items and choices every year. It fails on any exception or corrupted state, such as NaN money or stats out of range.
