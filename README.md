# Dagens ord

A Swedish vocabulary wheel in a single HTML file. Pick nouns, verbs, adjectives, or adverbs, then spin to discover a word with its forms, translations, examples, and a quiz.

Open `index.html` in a browser, keeping `dictionary.js` beside it. No server, build, dependencies, accounts, or tracking. Wheel sounds can be muted using the speaker button.

## Live vocabulary

The wheel fetches fresh Swedish entries from Wiktionary's public MediaWiki API. Each word type is selected from its Swedish category and must have usable inflections and two translated usage examples. Incomplete entries are skipped; no meanings, forms, or sentences are invented. Categories are cached only in memory for the current visit. Reloading fetches a fresh selection.

If the network or dictionary is unavailable, loading times out after 12 seconds and the wheel uses the original 60-word collection. The status below the spin button identifies live or fallback words.

Pronunciation uses embedded Swedish recordings where available, then a Swedish recording from Wiktionary or online Swedish text-to-speech. New words and examples need internet access for audio; the original collection's embedded audio works offline. The app never uses the browser's default language voice.

Dictionary definitions, forms, and examples are adapted from [Wiktionary contributors](https://en.wiktionary.org/) under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Adaptations select and format the content and may remove parenthetical editorial alternatives from examples. Live word cards link to their original revision and recording details. Recordings retain their individual licenses, available through those details. The app fetches entries directly, so no manual vocabulary updates or scheduled builds are needed. Changes to the upstream API or markup may require maintenance; the fallback collection remains available.

## GitHub Pages

After pushing to `Klicken/word-of-the-day`:

1. Open the repository's **Settings → Pages**.
2. Set **Source** to **Deploy from a branch**.
3. Choose **main** and **/(root)**, then save.

The website will be available at `https://klicken.github.io/word-of-the-day/` once GitHub finishes deploying.

The repository can remain private. GitHub Pages from a private repository requires GitHub Pro, Team, or Enterprise. The published website is public. See [GitHub's Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## Editing vocabulary

The `WORDS` array in `index.html` contains the offline vocabulary. Entries use the `noun`, `verb`, `adjective`, and `adverb` helpers. Each entry has forms, a definition, and two Swedish sentences with English translations. `dictionary.js` handles live dictionary requests and parsing.

The `swedish-audio-data` JSON block maps Swedish words and sentences to base64 MP3 recordings for offline playback.

## Parser checks

Open `tests/dictionary.html` in a browser. It checks inflections for all four word types, translated examples, Swedish language selection, source links, old and current HTML layouts, and unsafe URLs using synthetic fixtures. These checks run offline without dependencies.
