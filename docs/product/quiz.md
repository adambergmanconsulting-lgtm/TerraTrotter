# Quiz

**Purpose:** How a TerraTrotter round works. This is the domain spine for map pinpoint, trivia, scoring, and saved progress.

## Fast path (read first)

- Two stages per continent: map pinpoint, then trivia. Eight questions each when the data allows.
- Study the map puts country names on the polygons. A click highlights the country, frames it, and fills an info box with ranks on that continent map (population, area, density, GDP), neighbors, coast, languages, religions, currency, and GDP per person. Zoom reveals smaller names. Study does not write a score.
- Pinpoint checks the clicked polygon against `country.cca3`.
- Trivia is built only from `public/data/countries.json`. No network calls during a round.
- Progress is `localStorage` key `terratrotter.progress.v1`, stored separately for Easy, Medium, and Hard. Older saves land on Medium. Answer rates by question type live in `terratrotter.answers.v1`. There are no accounts.
- Map clip boxes live in `src/domain/mapGeometry.ts`. Russia is quizzed as Europe. The Europe map draws the land west of 60°E, and the Asia map draws the land from that meridian to the date line. The player zooms with the wheel, a two-finger pinch, or the buttons, and drags to pan. A compass badge sits on the map frame. Creature plates appear only on the style comparison page.
- Flag choices use `public/flags/{cca2}.svg`, not emoji.

## Round

1. Player picks Easy, Medium, or Hard, then one of Africa, Americas, Asia, Europe, Oceania.
2. Pinpoint: the prompt names a country on that continent's clipped map. Easy and Medium also show its flag. A correct click turns the polygon green. A miss flashes red, then shows the right country. Easy has no clock. Medium allows 25 seconds. Hard allows 15 seconds and keeps small countries in the draw.
3. Trivia: an easy neighbor count (at most two borders, choices spaced apart), which listed country borders the target, population, area, capital, flag, landlocked, subregion, currency. Easy has no clock. Medium allows 20 seconds. Hard allows 12 seconds. A type missed on at least half of four or more answers is drawn less often on later rounds. On Easy and Medium, repeated map misses switch pinpoint to larger countries.
4. A correct answer scores 100 plus 20 for each earlier step of the current streak. Easy multiplies that by 1, Medium by 2, and Hard by 3. Time left on the question multiplies it again, up to 2 when the answer is immediate. Easy has no time limit; its speed is measured against the Medium limit. A miss scores 0 and clears the streak. The clock runs from the first question until the last answer.
5. Finishing writes that continent at that difficulty and keeps the best score, accuracy, and streak there, plus the time of that best score. A tie keeps the faster time. Saved scores from before this scale are multiplied by that level's weight once, with no speed bonus added. The home-card check appears only when that difficulty's best accuracy is 100%. Each card also marks which difficulties are already perfect. Older best scores have no stored time until a new round matches or beats them.

## Data

`npm run download-data` refreshes `public/data/countries.json` from the public REST Countries v3.1 snapshot, attaches major religions (Pew-based shares by ISO3 when available, else a dominant-religion name), attaches latest World Bank GDP and GDP per person (current US$), copies `world-atlas` countries-50m to `public/data/world-50m.json`, and saves each flag SVG into `public/flags/`. Set `SKIP_FLAGS=1` to refresh country rows without re-downloading flags. The live v3 API now requires a key, so the script uses the last public snapshot. The app reads those files at runtime and does not call an API.
