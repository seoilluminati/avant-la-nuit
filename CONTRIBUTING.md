# Contributing

Thanks for helping hikers and riders get home before dark.

## Most useful contributions

1. **Real-world timing reports.** Open an issue with the GPX file, your start time, your
   real arrival time and the activity. This is how the speed models get calibrated.
2. **Translations.** The UI is two dictionaries (`fr`, `en`) at the top of `web/app.js`.
   Copy one, translate it, add an option to the language toggle.
3. **Bug fixes and focused features** from the roadmap in the README.

## Ground rules

- **Zero runtime dependencies.** The library must stay a handful of plain ES modules that
  run in any browser, Node ≥ 18.3, Deno and workers. Leaflet is only loaded by the web app.
- **Safety first.** When in doubt, a model should err on the slow / early-dark side.
  Changes that make estimates more optimistic need data to back them.
- **Privacy.** The GPX never leaves the device. No analytics, no trackers.
- **Tests.** Every change to `src/` comes with a test in `test/`. Run `npm test` and
  `npm run check` before opening a pull request. No build step, no transpiler.

## Development

```bash
npm start   # web app on http://localhost:8787
npm test
```

## Pull requests

Keep them small and describe the user-visible effect. Maintainers aim to answer within a
week. By contributing you agree that your work is released under the MIT license and that
you follow the [Code of Conduct](CODE_OF_CONDUCT.md).
