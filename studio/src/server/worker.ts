// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { maintenance } from './domains';
import { migrate } from './db';
import { tick, recoverJobs } from './publisher';
await migrate();
await recoverJobs();
console.log('Persona publishing worker ready. Run only one worker per instance.');
setInterval(() => void tick().catch(console.error), 1000);

void maintenance().catch(console.error);
setInterval(() => void maintenance().catch(console.error), 6 * 3600000);
