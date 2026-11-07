// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { parseDocument, type SiteDocument } from './schema';
export class History {
  past: SiteDocument[] = [];
  future: SiteDocument[] = [];
  constructor(public current: SiteDocument) {}
  commit(next: SiteDocument) {
    const valid = parseDocument(next);
    if (JSON.stringify(valid) === JSON.stringify(this.current)) return;
    this.past.push(this.current);
    if (this.past.length > 75) this.past.shift();
    this.current = valid;
    this.future = [];
  }
  undo() {
    const prev = this.past.pop();
    if (prev) {
      this.future.push(this.current);
      this.current = prev;
    }
    return this.current;
  }
  redo() {
    const next = this.future.pop();
    if (next) {
      this.past.push(this.current);
      this.current = next;
    }
    return this.current;
  }
}
