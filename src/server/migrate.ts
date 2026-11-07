// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { migrate, closeDb } from './db';
await migrate();
console.log('Database schema 1 is ready.');
await closeDb();
