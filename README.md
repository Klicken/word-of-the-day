# Dagens ord

A Swedish vocabulary wheel in a single HTML file. Pick nouns, verbs, adjectives, or adverbs, then spin to discover a word with its forms, translations, examples, and a quiz.

Open `index.html` in a browser. No server, build, dependencies, accounts, or tracking. Swedish pronunciation recordings are embedded for offline playback. Wheel sounds can be muted using the speaker button.

## GitHub Pages

After pushing to `Klicken/word-of-the-day`:

1. Open the repository's **Settings → Pages**.
2. Set **Source** to **Deploy from a branch**.
3. Choose **main** and **/(root)**, then save.

The website will be available at `https://klicken.github.io/word-of-the-day/` once GitHub finishes deploying.

The repository can remain private. GitHub Pages from a private repository requires GitHub Pro, Team, or Enterprise. The published website is public. See [GitHub's Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## Editing vocabulary

The `WORDS` array in `index.html` contains the vocabulary. Entries use the `noun`, `verb`, `adjective`, and `adverb` helpers. Each entry has forms, a definition, and two Swedish sentences with English translations.

The `swedish-audio-data` JSON block maps Swedish words and sentences to base64 MP3 recordings. Add corresponding Swedish recordings when adding new vocabulary. The app does not fall back to a different language if audio is missing.
