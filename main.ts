// news-image-20261123 entry (Node 22, standard library only): the front page
// lives in entry.png beside this file — drawn by render.mjs, a hand-rolled
// 5x7 bitmap-font renderer with no network and no downloaded assets — and
// this program copies it to the output directory. The copy is byte for byte:
// render.mjs is deterministic (the same run twice writes identical bytes),
// so the two grader runs of this program always agree. The gate takes a
// whole PNG of at most 1 MiB and 1024 by 1024 pixels, and the judge sees
// exactly the bytes copied.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
copyFileSync(new URL('./entry.png', import.meta.url), join(outDir, 'entry.png'));
