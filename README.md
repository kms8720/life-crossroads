# Life Crossroads

A browser game about the choices that shape a life. You walk from age 10 to age 80, and at each fork in the road you pick one of two paths. Your choices change how your character looks, who walks beside you, and which ending you reach.

The game is in Korean. It was made for a class presentation in "Conditions of Happiness" at GIST.

**Play: https://kms8720.github.io/life-crossroads/**

## Controls

| Action | Keys |
| --- | --- |
| Start | Click or tap anywhere on the first screen |
| Next / confirm | `Space`, `Enter`, `→` |
| Take the upper path | `1`, `↑` |
| Take the lower path | `2`, `↓` |
| Undo | `Backspace`, `←` |
| Full screen | `F` |
| Sound on/off | `M` |
| Show/hide gauges | `G` |
| Help | `H` |

The game works with a mouse, a keyboard, or a touch screen. It is designed for laptops and tablets in landscape.

## Editing the game

Almost everything players read lives in [`content.json`](content.json): questions, options, cards, and endings.

1. Open `content.json` on GitHub and click the pencil icon.
2. Make your change and commit it to `main`.
3. The site rebuilds automatically. The change is usually live within a couple of minutes.

Check progress on the [Actions tab](../../actions). You may need to refresh the game page to see a new version.

If `content.json` has a mistake, such as a missing comma, the build stops and the live site stays on the last working version. The failed run shows which line to fix.

### Fields in a question

| Field | Purpose |
| --- | --- |
| `title`, `context` | The question and its situation |
| `when` | Flags required for this question to appear |
| `contextIf` | A different situation text when certain flags are set |
| `options[].effects` | Points added to each of the four gauges |
| `options[].show` | What changes on screen, such as clothes, held items, facial expressions, and companions |
| `options[].set` | Flags set by this choice |
| `options[].lock` | Closes the option when certain flags are set |
| `options[].ifFlag` | Replaces parts of the option when certain flags are set |

Every player gets the same ten questions in the same order, with one fixed starting card and one fixed event card. This makes two playthroughs by the same person directly comparable.

## Development

Requires Node.js 22 or later. There are no dependencies to install.

```sh
npm test              # run the tests
npm run build:web     # write the site to dist/
```

| Path | Purpose |
| --- | --- |
| `content.json` | Game content |
| `src/engine.js` | Game rules, with no browser dependencies |
| `src/art.js` | SVG drawings |
| `src/app.js` | Screens, input, and animation |
| `src/style.css`, `src/template.html` | Styles and page shell |
| `src/results.html` | The page comparing first and second playthroughs |
| `config.json` | Database address and public key |
| `supabase/schema.sql` | Database table, access rules, and totals |
| `build.mjs` | Validates content and merges everything into one HTML file |
| `fonts/` | Embedded font subsets |
| `tools/subset_fonts.py` | Rebuilds the font subsets. Needs the original fonts and `fonttools` |

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds the site and publishes it to GitHub Pages.

## Saving results

GitHub Pages only serves files, so finished playthroughs are stored in a free [Supabase](https://supabase.com) project.

1. Create a project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor.
2. Put the project URL and the publishable key in `config.json`. Never use the secret key here, because this repository is public.

The publishable key can add a playthrough and read the totals, but it cannot read individual rows or names. Free projects pause after a week with no requests, so [`.github/workflows/keep-db-awake.yml`](.github/workflows/keep-db-awake.yml) sends a request every three days.

If the database is unavailable, the game still plays normally. It just doesn't save the result.

## Fonts

The embedded subsets of [Pretendard](https://github.com/orioncactus/pretendard) and Yanolja Yache are licensed under the [SIL Open Font License 1.1](https://openfontlicense.org/).
