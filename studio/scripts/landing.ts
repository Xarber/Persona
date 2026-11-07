// SPDX-License-Identifier: AGPL-3.0-only
import { readFile, writeFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Landing } from '../src/client/components/Landing';

// Public product content only: never render account data into the static shell.
const file = 'dist/index.html';
const html = await readFile(file, 'utf8');
await writeFile(
  file,
  html.replace(
    '<div id="root"></div>',
    `<div id="root">${renderToStaticMarkup(createElement(Landing))}</div>`,
  ),
);
