// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react';
import {
  Type,
  Palette,
  SlidersHorizontal,
  Info,
  Link,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Eye,
  ImagePlus,
} from 'lucide-react';
import {
  registry,
  containers,
  allNodes,
  resolveStyle,
  type SiteNode,
  type SiteDocument,
  type Device,
  type Style,
} from '../../shared/schema';
export function Inspector({
  node,
  doc,
  device,
  onChange,
  onTheme,
  onDuplicate,
  onDelete,
  onMove,
  onNest,
  onAsset,
}: {
  node?: SiteNode;
  doc: SiteDocument;
  device: Device;
  onChange: (fn: (n: SiteNode) => void) => void;
  onTheme: (doc: SiteDocument) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (delta: number) => void;
  onNest: (target: string) => void;
  onAsset: () => void;
}) {
  const [tab, setTab] = useState('design');
  const setStyle = (key: keyof Style, value: unknown) =>
    onChange((n) => {
      if (device === 'desktop') n.style = { ...n.style, [key]: value };
      else n.responsive[device] = { ...n.responsive[device], [key]: value };
    });
  const current = node ? resolveStyle(node, device) : {};
  return (
    <aside className="editor-inspector">
      <div className="panel-heading">
        <strong>{node ? registry[node.type].label : 'Site styles'}</strong>
        <span className="tiny-badge">{node ? device : 'GLOBAL'}</span>
      </div>
      {!node ? (
        <>
          <div className="inspector-section">
            <h3>
              <Palette size={14} />
              Make it feel like you.
            </h3>
            <p className="muted">
              Your site’s shared design tokens. Individual elements can have their own overrides.
            </p>
            {(['background', 'surface', 'text', 'muted', 'accent', 'secondary'] as const).map(
              (key) => (
                <label className="color-row" key={key}>
                  <span>{key[0].toUpperCase() + key.slice(1)}</span>
                  <input
                    type="color"
                    aria-label={`Theme ${key}`}
                    value={doc.theme[key]}
                    onChange={(e) =>
                      onTheme({ ...doc, theme: { ...doc.theme, [key]: e.target.value } })
                    }
                  />
                  <code>{doc.theme[key]}</code>
                </label>
              ),
            )}
          </div>
          <div className="inspector-section">
            <h3>
              <Type size={14} />
              Typography & spacing
            </h3>
            <label>
              Font family
              <select
                value={doc.theme.font}
                onChange={(e) =>
                  onTheme({
                    ...doc,
                    theme: { ...doc.theme, font: e.target.value as 'sans' | 'serif' | 'mono' },
                  })
                }
              >
                <option value="sans">System sans · clean & modern</option>
                <option value="serif">Georgia · thoughtful & classic</option>
                <option value="mono">System mono · precise & technical</option>
              </select>
            </label>
            {(['radius', 'spacing', 'width'] as const).map((k) => (
              <label key={k}>
                {k === 'radius'
                  ? 'Corner radius'
                  : k === 'spacing'
                    ? 'Section spacing'
                    : 'Site max width'}
                <input
                  type="number"
                  value={doc.theme[k]}
                  min={k === 'width' ? 600 : k === 'spacing' ? 16 : 0}
                  max={k === 'width' ? 1800 : k === 'spacing' ? 160 : 64}
                  onChange={(e) =>
                    onTheme({ ...doc, theme: { ...doc.theme, [k]: Number(e.target.value) } })
                  }
                />
              </label>
            ))}
          </div>
          <p className="inspector-hint">
            <Info size={14} />
            Select an element on the canvas to edit its content and appearance.
          </p>
        </>
      ) : (
        <>
          <div className="inspector-tabs">
            <button className={tab === 'design' ? 'active' : ''} onClick={() => setTab('design')}>
              Design
            </button>
            <button className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>
              Content
            </button>
          </div>
          {tab === 'content' ? (
            <div className="inspector-section">
              <h3>Content</h3>
              {(
                [
                  'text',
                  'eyebrow',
                  'subtitle',
                  'label',
                  'alt',
                  'email',
                  'url',
                  'src',
                  'collection',
                ] as const
              )
                .filter(
                  (k) =>
                    node.props[k] !== undefined ||
                    (['image', 'video'].includes(node.type) && ['src', 'alt'].includes(k)) ||
                    (node.type === 'contact' && k === 'email'),
                )
                .map((k) => (
                  <label key={k}>
                    {k === 'text'
                      ? 'Text'
                      : k === 'src'
                        ? 'Media URL'
                        : k === 'url'
                          ? 'Link destination'
                          : k === 'collection'
                            ? 'Content collection'
                            : k[0].toUpperCase() + k.slice(1)}
                    {['text', 'subtitle'].includes(k) ? (
                      <textarea
                        rows={k === 'text' ? 4 : 3}
                        value={node.props[k] || ''}
                        onChange={(e) =>
                          onChange((n) => {
                            n.props[k] = e.target.value;
                          })
                        }
                      />
                    ) : (
                      <input
                        value={node.props[k] || ''}
                        onChange={(e) =>
                          onChange((n) => {
                            n.props[k] = e.target.value;
                          })
                        }
                      />
                    )}
                  </label>
                ))}
              {node.type === 'image' && (
                <button className="secondary" onClick={onAsset}>
                  <ImagePlus size={14} />
                  Choose from assets
                </button>
              )}
              {node.props.items && (
                <label>
                  Items{' '}
                  <span className="optional">Title | description | optional URL, one per line</span>
                  <textarea
                    key={node.id}
                    rows={8}
                    defaultValue={node.props.items
                      .map((i) => [i.title, i.text, i.url || ''].join(' | '))
                      .join('\n')}
                    onBlur={(e) =>
                      onChange((n) => {
                        n.props.items = e.target.value
                          .split('\n')
                          .filter(Boolean)
                          .map((line) => {
                            const [title = '', text = '', url = ''] = line
                              .split('|')
                              .map((v) => v.trim());
                            return { title, text, ...(url ? { url } : {}) };
                          });
                      })
                    }
                  />
                </label>
              )}
              {node.props.collection && (
                <p className="binding-note">
                  <Link size={14} />
                  Linked to <b>{node.props.collection}</b>. Edit shared entries in Content.
                </p>
              )}
              <label>
                Entrance animation
                <select
                  value={node.props.animation || 'none'}
                  onChange={(e) =>
                    onChange((n) => {
                      n.props.animation = e.target.value as 'none' | 'fade' | 'rise';
                    })
                  }
                >
                  <option value="none">None</option>
                  <option value="fade">Fade in</option>
                  <option value="rise">Gentle rise</option>
                </select>
              </label>
              <details className="help-details">
                <summary>About motion</summary>
                <p>
                  Entrance animations run on page load and respect reduced-motion preferences. They
                  don’t hide essential content.
                </p>
              </details>
            </div>
          ) : (
            <>
              <div className="inspector-section">
                <h3>
                  <SlidersHorizontal size={14} />
                  Layout{' '}
                  <small>{device === 'desktop' ? 'Base styles' : `${device} overrides`}</small>
                </h3>
                <div className="field-grid">
                  {(
                    [
                      'padding',
                      'margin',
                      'gap',
                      'maxWidth',
                      'minHeight',
                      'radius',
                      'columns',
                      'fontSize',
                      'fontWeight',
                      'lineHeight',
                      'letterSpacing',
                      'opacity',
                    ] as const
                  ).map((k) => (
                    <label key={k}>
                      {(
                        {
                          maxWidth: 'Max width',
                          minHeight: 'Min height',
                          fontSize: 'Text size',
                          fontWeight: 'Weight',
                          lineHeight: 'Line height',
                          letterSpacing: 'Tracking',
                        } as Record<string, string>
                      )[k] || k[0].toUpperCase() + k.slice(1)}
                      <input
                        type="number"
                        step={k === 'opacity' || k === 'lineHeight' ? 0.1 : 1}
                        min={
                          k === 'fontSize'
                            ? 8
                            : k === 'columns'
                              ? 1
                              : k === 'fontWeight'
                                ? 100
                                : k === 'lineHeight'
                                  ? 0.8
                                  : k === 'letterSpacing'
                                    ? -10
                                    : 0
                        }
                        max={
                          k === 'columns'
                            ? 6
                            : k === 'opacity'
                              ? 1
                              : k === 'lineHeight'
                                ? 3
                                : undefined
                        }
                        value={current[k] ?? ''}
                        placeholder="Auto"
                        onChange={(e) =>
                          setStyle(k, e.target.value === '' ? undefined : Number(e.target.value))
                        }
                      />
                    </label>
                  ))}
                </div>
                <label>
                  Text alignment
                  <select
                    value={current.align || 'left'}
                    onChange={(e) => setStyle('align', e.target.value)}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
                {containers.includes(node.type) && (
                  <label>
                    Direction
                    <select
                      value={current.direction || 'column'}
                      onChange={(e) => setStyle('direction', e.target.value)}
                    >
                      <option value="column">Vertical</option>
                      <option value="row">Horizontal</option>
                    </select>
                  </label>
                )}
                {node.type === 'image' && (
                  <>
                    <label>
                      Aspect ratio
                      <select
                        value={current.aspectRatio || 'auto'}
                        onChange={(e) => setStyle('aspectRatio', e.target.value)}
                      >
                        {['auto', '1/1', '4/3', '16/9', '3/4'].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Focal point
                      <select
                        value={current.objectPosition || 'center'}
                        onChange={(e) => setStyle('objectPosition', e.target.value)}
                      >
                        {['center', 'top', 'bottom', 'left', 'right'].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
              </div>
              <div className="inspector-section">
                <h3>
                  <Palette size={14} />
                  Appearance
                </h3>
                {(['color', 'background'] as const).map((k) => (
                  <label className="color-row" key={k}>
                    {k === 'color' ? 'Text color' : 'Background'}
                    <input
                      type="color"
                      value={current[k] || doc.theme[k === 'color' ? 'text' : 'background']}
                      onChange={(e) => setStyle(k, e.target.value)}
                    />
                    <button className="text-button" onClick={() => setStyle(k, undefined)}>
                      Reset
                    </button>
                  </label>
                ))}
                {(['hidden', 'border', 'shadow'] as const).map((k) => (
                  <label className="check-row" key={k}>
                    <input
                      type="checkbox"
                      checked={current[k] || false}
                      onChange={(e) => setStyle(k, e.target.checked)}
                    />
                    {k === 'hidden'
                      ? `Hide on ${device === 'desktop' ? 'all devices' : device}`
                      : k === 'border'
                        ? 'Border'
                        : 'Soft shadow'}
                  </label>
                ))}
                {device !== 'desktop' && (
                  <button
                    className="text-button"
                    onClick={() =>
                      onChange((n) => {
                        delete n.responsive[device];
                      })
                    }
                  >
                    Reset {device} overrides
                  </button>
                )}
              </div>
            </>
          )}
          <div className="inspector-section">
            <h3>Arrange</h3>
            <div className="row">
              <button className="secondary" aria-label="Move element up" onClick={() => onMove(-1)}>
                <ArrowUp size={15} />
              </button>
              <button
                className="secondary"
                aria-label="Move element down"
                onClick={() => onMove(1)}
              >
                <ArrowDown size={15} />
              </button>
              <button className="secondary" onClick={onDuplicate}>
                <Copy size={14} />
                Duplicate
              </button>
            </div>
            <label>
              Move into container
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) onNest(e.target.value);
                }}
              >
                <option value="">Choose container…</option>
                {allNodes(doc)
                  .filter((n) => n.id !== node.id && containers.includes(n.type))
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.props.text || registry[n.type].label} · {n.id.slice(0, 4)}
                    </option>
                  ))}
              </select>
            </label>
            <button className="danger-text text-button" onClick={onDelete}>
              <Trash2 size={14} />
              Delete element
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
