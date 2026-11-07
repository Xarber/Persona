// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react';
import { Plus, Trash2, Copy, Database, ArrowLeft, Link } from 'lucide-react';
import { id, uniqueSlug, type SiteDocument, type ContentItem } from '../../shared/schema';
import { Empty, SearchBox } from './ui';
export function ContentManager({
  doc,
  onChange,
}: {
  doc: SiteDocument;
  onChange: (d: SiteDocument) => void;
}) {
  const [collection, setCollection] = useState(Object.keys(doc.collections)[0] || 'projects'),
    [selected, setSelected] = useState<string | null>(null),
    [search, setSearch] = useState('');
  const items = doc.collections[collection] || [],
    item = items.find((i) => i.id === selected);
  const change = (fn: (d: SiteDocument) => void) => {
    const next = structuredClone(doc);
    fn(next);
    onChange(next);
  };
  const update = (key: keyof ContentItem, value: unknown) =>
    change((d) => {
      const entry = d.collections[collection].find((i) => i.id === selected)!;
      (entry as Record<string, unknown>)[key] = value;
    });
  return (
    <div className="content-manager">
      <aside>
        <div className="panel-heading">
          <strong>Collections</strong>
          <button
            className="icon-button"
            aria-label="New collection"
            onClick={() => {
              const name = prompt('Collection name');
              if (name) {
                const key = uniqueSlug(name, Object.keys(doc.collections));
                change((d) => {
                  d.collections[key] = [];
                });
                setCollection(key);
                setSelected(null);
              }
            }}
          >
            <Plus size={15} />
          </button>
        </div>
        {Object.keys(doc.collections).map((key) => (
          <button
            className={'collection-button ' + (key === collection ? 'selected' : '')}
            key={key}
            onClick={() => {
              setCollection(key);
              setSelected(null);
            }}
          >
            <Database size={15} />
            {key}
            <small>{doc.collections[key].length}</small>
          </button>
        ))}
      </aside>
      <div className="content-main">
        {item ? (
          <>
            <button className="text-button" onClick={() => setSelected(null)}>
              <ArrowLeft size={14} />
              All {collection}
            </button>
            <div className="section-toolbar">
              <h3>{item.title}</h3>
              <div className="row">
                <button
                  className="icon-button"
                  aria-label="Duplicate entry"
                  onClick={() => {
                    const clone = {
                      ...structuredClone(item),
                      id: id(),
                      title: item.title + ' copy',
                      slug: uniqueSlug(
                        item.slug,
                        items.map((i) => i.slug),
                      ),
                    };
                    change((d) => d.collections[collection].push(clone));
                    setSelected(clone.id);
                  }}
                >
                  <Copy size={16} />
                </button>
                <button
                  className="icon-button danger-text"
                  aria-label="Delete entry"
                  onClick={() => {
                    if (confirm('Delete this entry from all linked sections?')) {
                      change((d) => {
                        d.collections[collection] = d.collections[collection].filter(
                          (i) => i.id !== item.id,
                        );
                      });
                      setSelected(null);
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="settings-form">
              <div className="field-grid">
                <label>
                  Title
                  <input value={item.title} onChange={(e) => update('title', e.target.value)} />
                </label>
                <label>
                  Slug
                  <input
                    key={item.id}
                    defaultValue={item.slug}
                    onBlur={(e) =>
                      update(
                        'slug',
                        uniqueSlug(
                          e.target.value,
                          items.filter((i) => i.id !== item.id).map((i) => i.slug),
                        ),
                      )
                    }
                  />
                </label>
              </div>
              <label>
                Summary
                <textarea
                  rows={3}
                  value={item.summary}
                  onChange={(e) => update('summary', e.target.value)}
                />
              </label>
              <label>
                Full story
                <textarea
                  rows={6}
                  value={item.body}
                  onChange={(e) => update('body', e.target.value)}
                />
              </label>
              <label>
                Cover image URL
                <input
                  value={item.image}
                  onChange={(e) => update('image', e.target.value)}
                  placeholder="https://… or an asset URL"
                />
              </label>
              <label>
                Website or repository URL
                <input value={item.url} onChange={(e) => update('url', e.target.value)} />
              </label>
              <label>
                Tags <span className="optional">comma-separated</span>
                <input
                  key={item.id + 'tags'}
                  defaultValue={item.tags.join(', ')}
                  onBlur={(e) =>
                    update(
                      'tags',
                      e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    )
                  }
                />
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={item.featured}
                  onChange={(e) => update('featured', e.target.checked)}
                />
                Featured project
              </label>
              <p className="binding-note">
                <Link size={15} />
                Changes update every section bound to this collection, plus the generated project
                detail page.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="section-toolbar">
              <div>
                <span className="eyebrow">CONTENT LIBRARY</span>
                <h2>{collection[0].toUpperCase() + collection.slice(1)}</h2>
              </div>
              <button
                className="primary"
                onClick={() => {
                  const entry: ContentItem = {
                    id: id(),
                    title: 'Untitled entry',
                    slug: uniqueSlug(
                      'new-project',
                      items.map((i) => i.slug),
                    ),
                    summary: '',
                    body: '',
                    image: '',
                    url: '',
                    tags: [],
                    featured: false,
                  };
                  change((d) => {
                    d.collections[collection] ??= [];
                    d.collections[collection].push(entry);
                  });
                  setSelected(entry.id);
                }}
              >
                <Plus size={15} />
                Add entry
              </button>
            </div>
            <SearchBox placeholder="Search content…" value={search} onChange={setSearch} />
            <div className="content-entries">
              {items
                .filter((i) => i.title.toLowerCase().includes(search.toLowerCase()))
                .map((i, index) => (
                  <button key={i.id} onClick={() => setSelected(i.id)}>
                    <span className={'content-entry-art art-' + (index % 3)}>{i.title[0]}</span>
                    <div>
                      <strong>{i.title}</strong>
                      <p>{i.summary || 'Add a description to tell the story.'}</p>
                      <small>{i.tags.join(' · ')}</small>
                    </div>
                    <span>↗</span>
                  </button>
                ))}
            </div>
            {!items.length && (
              <Empty
                title="A place for your stories."
                description="Create an entry and connect it to any collection component."
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
