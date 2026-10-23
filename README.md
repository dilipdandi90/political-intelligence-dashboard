# Political Intelligence Dashboard: Pune (PC 34)

A React dashboard for the Pune Lok Sabha constituency in Maharashtra. It shows the constituency profile, Lok Sabha
results from 2009 to 2024, results for the six assembly segments inside it, and some indicators calculated from those
results (vote share, margins, turnout, swing).

There's no backend. The data lives in three JSON files under `public/data`, and a small data layer in `src/api` reads
them the way it would read a real API.

## Why Pune

I wanted a seat with enough history on the same boundaries to show trends. Pune's current boundaries date from the 2008
delimitation, so there are four Lok Sabha elections (2009, 2014, 2019, 2024) to compare. There are also four rounds of
assembly elections, plus the 2023 Kasba Peth by-election. One of its six segments, Pune Cantonment, is reserved for SC,
which makes the segment comparison a bit more interesting. The results are also well covered online, so I could check
numbers against more than one source.

## Tech stack

- React 19 (JavaScript, JSX) with Vite
- React Router for the five pages, with filter state kept in the URL
- Recharts for charts
- Plain CSS with custom properties (one stylesheet, light theme)
- Fetch API for loading data
- Vitest and React Testing Library for unit and integration tests
- Playwright for browser tests at desktop, tablet and mobile sizes

I picked Recharts over Chart.js because it's built from React components, which made it easy to wrap into a few
reusable chart components. It's the heaviest dependency, so it's split into its own chunk. Every page except the
overview is lazy-loaded. I skipped Tailwind and CSS-in-JS because one stylesheet built on design tokens was enough for
an app this size.

## Running it

You need Node 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173. No `.env` file or API keys are needed.

To run the production build:

```bash
npm run build
npm run preview
```

To see the loading and error states:

- Add `?mockError=all` to any URL and every request fails. You can also fail just one file with `?mockError=assembly`,
  `?mockError=lok-sabha` or `?mockError=constituency`.
- Put `VITE_MOCK_LATENCY_MS=1200` in a `.env.local` file to slow requests down.

## What's in it

- **Overview (`/`)**
  - Constituency facts and the six segments, with electors and the current MLA.
  - 2024 headline numbers.
  - Census 2011 figures, with a switch between district, city (PMC) and tehsil level.
  - The list of MPs since 1951.
- **Lok Sabha history (`/lok-sabha`)**
  - Pick which years to compare, and one year to look at in detail.
  - Summary table, party vote share chart, and a chart of margin, turnout and NOTA.
  - Candidate-wise results for the selected year.
- **Assembly segments (`/assembly`)**
  - Pick a segment and the years. Shows results by election, party vote share over time, and candidate-wise results.
  - Further down, all six segments side by side for one election.
- **Trends (`/trends`)**
  - The formulas.
  - Party swing between elections, seats won per party, turnout by segment.
  - A heat table of one party's vote share by segment and year.
- **Data (`/data`)**
  - Sources, assumptions and limitations, and how the mock API works.

Filters are stored in the query string (for example `/assembly?ac=210&compare=2019`), so a filtered view can be
bookmarked or shared, and the back button works.

## How the code is organised

```
public/data/          constituency.json, lok-sabha.json, assembly.json
src/api/              fetching, validation, caching
src/hooks/            useAsync (loading/error/retry), data hooks, URL filter state
src/utils/            electionMath.js (all formulas), formatting, party colours
src/components/       KPI cards, data table, filters, chart wrappers, layout
src/pages/            one file per route
src/styles/           index.css
e2e/                  Playwright tests
```

The main rule I followed: pages never fetch data and never do calculations themselves. A page gets data from a hook,
passes it through `electionMath.js`, and renders shared components. That way a formula exists in exactly one place, and
replacing the JSON with a real API would only touch `src/api`.

`src/api/schema.js` cleans every response before the UI sees it:

- Numbers that are missing or invalid become `null`.
- Broken candidate rows are dropped.
- A response of the wrong type raises a clear error.

So a bad data file shows an error message instead of crashing the page.

## Where the data comes from

| Data | Source |
| --- | --- |
| Lok Sabha results 2009–2024 | IndiaVotes, cross-checked against the Wikipedia page for the constituency (which cites ECI) |
| Assembly results 2009–2024 | IndiaVotes and the Wikipedia page for each assembly seat |
| 2023 Kasba Peth by-election | Wikipedia and Oneindia |
| Which areas each segment covers | ECI Delimitation Order, 2008 |
| Demographics | Census of India 2011, via census2011.co.in and citypopulation.de |
| List of MPs | Wikipedia |

How I checked the numbers:

- I took every vote count from two sources and compared them. They matched everywhere except Vadgaon Sheri 2019,
  where I used the ECI-cited figures and added a note to the record.
- Each record in the JSON carries its own source links, and the Data page lists all of them.
- `src/test/dataIntegrity.test.js` checks the files. Margins have to match winner minus runner-up, candidate votes
  can't exceed the valid total, and census totals have to add up.

## How the numbers are calculated

All formulas are in `src/utils/electionMath.js`.

- **Vote share** = candidate votes ÷ total valid votes × 100
- **Winning margin** = winner's votes − runner-up's votes
- **Margin %** = margin ÷ total valid votes × 100
- **Turnout** = votes polled ÷ registered electors × 100
- **NOTA share** = NOTA ÷ (valid votes + NOTA) × 100
- **Swing** = a party's share this election − its share in the previous one, in percentage points

"Total valid votes" here means votes for candidates, excluding NOTA. That's the definition ECI uses for deposit
forfeiture. ECI's live results site includes NOTA in the denominator, so its percentages come out slightly lower than
mine. I note this on the Trends and Data pages so the numbers don't look wrong next to each other.

If a formula's input is missing, the result is `null` and the UI shows "N/A". I never fill in a 0 or an estimate, and
charts leave a gap rather than drawing a line through missing years.

## Tests

```bash
npm test                          # unit + integration (Vitest)
npx playwright install chromium   # first time only
npm run test:e2e                  # browser tests at 1440px, 768px and 390px
npm run test:all                  # lint + both
```

If you'd rather use a browser that's already installed, run `PW_CHANNEL=msedge npm run test:e2e` (or `chrome`).

Right now there are 153 Vitest tests and 33 Playwright tests (11 tests × 3 screen sizes), all passing. They cover:

- **Calculations:** `electionMath.test.js` tests each formula and its edge cases. The integration tests also compare
  what's on screen against numbers I worked out by hand, for example the 2024 winner's 53.30% share and the 1,23,038
  margin.
- **Rendering with real data:** `pages.integration.test.jsx` renders every page using the actual JSON files.
- **Filters:** the same file changes each filter and checks that the tables and KPI cards update.
- **Missing or bad data:** `missingData.test.jsx` covers null values, a single-candidate election, an empty dataset,
  malformed rows, invalid JSON, a failed request with retry, and a network error. `schema.test.js` tests the validation
  layer on its own.
- **Screen sizes:** `e2e/dashboard.spec.js` loads every page in a real browser at three sizes. It fails if there are
  console errors or if the page scrolls sideways, and it checks that charts fit and that navigation and filters work.

One Windows issue I ran into: Vitest occasionally failed with "Timeout waiting for worker to respond" when the machine
was busy. I switched it to worker threads with at most 4 workers (see `vite.config.js`), and that fixed it. If it still
happens, run `npx vitest run --maxWorkers=1`.

## Limitations

- **ECI's site wouldn't load** while I was collecting data, so the numbers come from sources that republish ECI
  results, cross-checked against each other. Anyone citing a figure should confirm it against ECI's Form-21E or its
  statistical reports.
- **No census data at constituency level.** The Census doesn't publish figures for a Lok Sabha constituency, so I show
  district, city and tehsil figures and label each one. None of them matches the constituency boundary exactly. 2011 is
  the latest census available.
- **Some values are genuinely missing,** and they're marked N/A:
  - 2019 Lok Sabha electors (the sources disagree);
  - SC/ST share for PMC;
  - votes polled for Vadgaon Sheri (only a turnout % is published);
  - turnout for the 2023 by-election (the published number doesn't add up).
- **Small candidates** are grouped into one "Others" row. The full lists are on the source pages.
- **Elector counts** differ slightly between sources for some assembly elections, so treat turnout as accurate to
  about ±1 point.
- **Party splits.** Shiv Sena split in 2022 and the NCP in 2023. I kept the new parties separate, so their trend lines
  start at the split.
- **Elections before 2009** used different boundaries, so I only included the list of MPs for those years.
- **Aggregate results only.** The dashboard shows totals per constituency and doesn't try to say anything about how
  particular groups voted.

## If I had more time

- Pull the full candidate lists from ECI Form-21E instead of grouping small candidates.
- Add booth-level or ward-level results, if a reliable source exists.
- Add a map of the segments using the delimitation boundaries.
- Swap the static JSON for a small API, which should only need changes in `src/api`.

## Accessibility and responsive layout

- **Keyboard and screen readers:**
  - A skip link, and focus moves to the main content when you change page.
  - Every control has a label.
  - The year filters are real checkboxes.
  - Sortable table headers are buttons and announce their sort order.
  - Loading and error messages are announced to screen readers.
- **Layout:**
  - On desktop there's a sidebar menu; on smaller screens it becomes a scrollable tab bar.
  - Grids drop from three columns to two to one.
  - Wide tables scroll inside their own box, so the page never scrolls sideways.

## Data terms

Election results and census figures are public records. Text taken from Wikipedia is under CC BY-SA 4.0. This project
isn't affiliated with ECI or the Census, and every record links back to where it came from.
