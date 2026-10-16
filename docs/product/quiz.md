# Quiz

**Purpose:** How a TerraTrotter round works. This is the domain spine for map pinpoint, trivia, scoring, and saved progress.

## Fast path (read first)

- Two stages per continent: map pinpoint, then trivia. Eight questions each when the data allows.
- Pinpoint checks the clicked polygon against `country.cca3`.
- Trivia is built only from `public/data/countries.json`. No network calls during a round.
- Progress is `localStorage` key `terratrotter.progress.v1`. Answer rates by question type live in `terratrotter.answers.v1`. There are no accounts.
- Map clip boxes live in `src/domain/mapGeometry.ts`. The player can zoom and drag that map.
- Flag choices use `public/flags/{cca2}.svg`, not emoji.

## Round

1. Player picks one of Africa, Americas, Asia, Europe, Oceania.
2. Pinpoint: the prompt names a country on that continent's clipped map. A correct click turns the polygon green. A miss flashes red, then shows the right country. Twenty-five seconds.
3. Trivia: an easy neighbor count (at most two borders, choices spaced apart), which listed country borders the target, population, area, capital, flag, landlocked, subregion, currency. Twenty seconds. A type missed on at least half of four or more answers is drawn less often on later rounds. Repeated map misses switch pinpoint to larger countries.
4. Score is 100 for a correct answer plus 20 for each step of the current streak. A miss clears the streak and keeps the best streak.
5. Finishing writes the continent as completed and keeps the best score, accuracy, and streak. The home-card check appears only when that best accuracy is 100%.

## Data

`npm run download-data` refreshes `public/data/countries.json` from the public REST Countries v3.1 snapshot, copies `world-atlas` countries-50m to `public/data/world-50m.json`, and saves each flag SVG into `public/flags/`. The live v3 API now requires a key, so the script uses the last public snapshot. The app reads those files at runtime and does not call an API.
