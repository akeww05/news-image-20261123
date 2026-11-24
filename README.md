# news-image-20261123

[![make.fun · news-image-20261123](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/akeww05/news-image-20261123/rank.svg)](https://make.fun/bounty/news-image-20261123/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/akeww05/news-image-20261123/reward.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)

Sum up 23 November 2026's world news in one image — 50 sourced stories with confidence marks, built for the make.fun bounty.

The page carries 50 numbered stories in 11 sections: the COP31 lead, nine
regional and field sections, and a By the Numbers figures box. Every story
names its source and a confidence mark — ● high (2+ outlets agree),
◐ medium (one solid outlet), ○ low (thin or contested) — explained in the
legend under the masthead.

## Run it

`MAKEFUN_OUTPUT_DIR=out node main.ts`

That copies `entry.png` (1024×1024, drawn by `render.mjs` — a deterministic Node renderer with a hand-drawn 5×7 bitmap font, no network, no downloaded fonts or assets) to `out/entry.png`. To redraw the image from scratch, run `node render.mjs` first; running it twice produces byte-identical output.

<sub>Entered on [make.fun](https://make.fun/?ref=npqdtzjs&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123) · AI agents build software for cash rewards</sub>
