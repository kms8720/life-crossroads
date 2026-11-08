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

The game works with a mouse, a keyboard, or a touch screen. It is designed for landscape screens: laptops, tablets, and phones turned sideways. On a phone held upright, it asks the player to turn the phone. On Android it switches to full screen when the game starts. iPhone Safari does not allow that, so the address bar stays.

## Running the class

The site has three pages.

| Page | Use |
| --- | --- |
| [Game](https://kms8720.github.io/life-crossroads/) | Each student plays on their own laptop, tablet, or phone. Post this link on the LMS. |
| [Presentation](https://kms8720.github.io/life-crossroads/presentation/) | The shared screen. Five questions, decided by a show of hands. |
| [Results](https://kms8720.github.io/life-crossroads/results/) | The charts for slides 14, 15, 26 and 27. Updates every five seconds. Add `?demo` to preview with sample data. |
| [Presenter](https://kms8720.github.io/life-crossroads/admin/) | Clears the saved plays, records the hand count, and exports the charts as images. Needs the team passphrase. |

### Before the class

1. **Clear the saved playthroughs right before the class starts.** On the presenter page, press the reset button. Every finished playthrough counts, including tests, rehearsals, a preview for the professor, and students who open the link early. Any of them would be compared as someone's first play. Reset plays are kept in an archive, so the last reset can be undone from the same page.
2. **Check that the database is awake.** The presenter page should show the play counts. If it shows an error, open the Supabase dashboard and restore the project if it is paused.
3. Open the presentation page and the results page in two tabs on the classroom computer. Press `F` for full screen.

The first person to open the presenter page sets the team passphrase (six characters or more). To change it later, run `select public.admin_set_pin('new passphrase');` in the Supabase SQL Editor.

### During the class

- **Students must use the same name for both plays.** On the same device the name is filled in automatically. On a different device they have to type it again exactly.
- **Ask for a name nobody else in the class uses.** Plays with the same name count as one person, ignoring capital letters and spaces at either end. If someone plays three or more times, the first and the latest are compared.
- **A play is saved only when the ending screen appears.** Students who stop partway are not counted.
- **Team members should not finish a game on the student page during the class**, because it would be counted too. The presentation page never saves anything.
- If the database is unreachable, the game still plays normally but nothing is saved, and the results page stays blank.
- **Slide 13 hand count:** type the two numbers on the presenter page. They appear next to the game results on slide 14.
- **Charts for the slides:** on the presenter page, press a slide number. The chart is saved as a 3840×2160 JPG and copied to the clipboard, so it can be pasted straight into the slide.

On the presentation page:

| Action | Key |
| --- | --- |
| Enter the number of raised hands | `V` |
| Go with the option that got more hands | `Space` |
| Pick an option directly | `1`, `2` |
| Speaker notes | `N` |
| Skip this fork | `X` |

### If there is no internet

Run `npm run build`. It writes a single HTML file that runs offline to the folder containing this repository. Add `#presentation` to the end of its address for the shared screen. Without internet nothing is saved, so the results page will not work.

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
| `src/results.html` | The charts for the talk |
| `src/admin.html` | The presenter page |
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
