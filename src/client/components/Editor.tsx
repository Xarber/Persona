// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  Globe,
  Plus,
  Layers as LayersIcon,
  LayoutTemplate,
  Palette,
  FolderOpen,
  Database,
  Settings,
  History as HistoryIcon,
  Check,
  Cloud,
  Download,
  Copy,
  Trash2,
  PanelLeftClose,
  Maximize2,
  ExternalLink,
  ChevronRight,
  FilePlus2,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import {
  Workspace,
  api,
  read,
  write,
  remove,
  download,
  RequestError,
  localExport,
} from '../storage';
import { useAssetUrls } from '../media';
import { History } from '../../shared/history';
import {
  allNodes,
  findNode,
  locate,
  moveNode,
  makeNode,
  cloneNode,
  parseDocument,
  id,
  uniqueSlug,
  registry,
  containers,
  type SiteNode,
  type SiteDocument,
  type Website,
  type Device,
  type Kind,
} from '../../shared/schema';
import { renderPage, previewBundle } from '../../shared/renderer';
import { Layers } from './Layers';
import { Inspector } from './Inspector';
import { SiteTools } from './SiteTools';
import { ContentManager } from './Content';
import { Assets } from './Assets';
import { Modal, ErrorBox } from './ui';
export function Editor({
  initial,
  workspace,
  onBack,
  onExport,
}: {
  initial: Website;
  workspace: Workspace;
  onBack: () => void;
  onExport: (site: Website, project?: boolean) => Promise<void>;
}) {
  const history = useRef(new History(initial.document)),
    siteRef = useRef(initial),
    docRef = useRef(initial.document),
    saved = useRef(JSON.stringify(initial.document)),
    frame = useRef<HTMLIFrameElement>(null),
    previewFrame = useRef<HTMLIFrameElement>(null),
    clipboard = useRef<SiteNode[]>([]),
    channel = useRef(id());
  const [doc, setDoc] = useState(initial.document),
    [selected, setSelected] = useState<string[]>([]),
    [pageId, setPageId] = useState(initial.document.pages[0].id),
    [device, setDevice] = useState<Device>('desktop'),
    [zoom, setZoom] = useState(70),
    [leftTab, setLeftTab] = useState('layers'),
    [showLeft, setShowLeft] = useState(true),
    [preview, setPreview] = useState(false),
    [tools, setTools] = useState(false),
    [content, setContent] = useState(false),
    [assets, setAssets] = useState(false),
    [revisions, setRevisions] = useState(false),
    [status, setStatus] = useState('Saved'),
    [error, setError] = useState(''),
    [conflict, setConflict] = useState(false),
    [ready, setReady] = useState(false),
    [pageSettings, setPageSettings] = useState(false),
    [context, setContext] = useState(false),
    [previewProject, setPreviewProject] = useState<string | undefined>();
  const saving = useRef<Promise<Website> | null>(null),
    conflictRef = useRef(false);
  const page = doc.pages.find((p) => p.id === pageId) || doc.pages[0];
  const selectedNode = selected.length ? findNode(page.nodes, selected[0]) : undefined;
  function apply(next: SiteDocument) {
    try {
      history.current.commit(next);
      docRef.current = history.current.current;
      setDoc(history.current.current);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const mutate = (fn: (d: SiteDocument) => void) => {
    const next = structuredClone(docRef.current);
    fn(next);
    apply(next);
  };
  const recoveryKey = `recovery:${workspace.key}:${initial.id}`;
  useEffect(() => {
    let live = true;
    read<{ document: SiteDocument; version: number }>(recoveryKey)
      .then((recovery) => {
        if (!live) return;
        if (
          recovery &&
          JSON.stringify(recovery.document) !== saved.current &&
          confirm('A recovery draft is available. Restore your unsaved edits?')
        ) {
          if (recovery.version !== siteRef.current.version) {
            setConflict(true);
            conflictRef.current = true;
            setError(
              'The server also changed. Export your recovery draft before loading the server version.',
            );
          }
          apply(parseDocument(recovery.document));
        }
        setReady(true);
      })
      .catch((e) => {
        setError('Recovery storage could not be opened: ' + e.message);
        setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);
  const save = useCallback(async (): Promise<Website> => {
    if (saving.current) {
      await saving.current;
      if (JSON.stringify(docRef.current) === saved.current) return siteRef.current;
    }
    if (conflictRef.current) throw Error('Resolve the conflicting draft before saving.');
    const snapshot = docRef.current;
    if (JSON.stringify(snapshot) === saved.current) return siteRef.current;
    const work = (async () => {
      setStatus('Saving…');
      await write(recoveryKey, { document: snapshot, version: siteRef.current.version });
      try {
        const next = await workspace.save(siteRef.current, snapshot);
        siteRef.current = next;
        saved.current = JSON.stringify(snapshot);
        if (JSON.stringify(docRef.current) === saved.current) {
          await remove(recoveryKey);
          setStatus('Saved');
        } else setStatus('Unsaved changes');
        setError('');
        return next;
      } catch (e) {
        setStatus('Saved on device · retry needed');
        if (e instanceof RequestError && e.status === 409) {
          conflictRef.current = true;
          setConflict(true);
        }
        setError((e as Error).message);
        throw e;
      }
    })();
    saving.current = work;
    try {
      return await work;
    } finally {
      saving.current = null;
    }
  }, [workspace]);
  useEffect(() => {
    if (!ready || JSON.stringify(doc) === saved.current) return;
    setStatus('Unsaved changes');
    void write(recoveryKey, { document: doc, version: siteRef.current.version }).catch(() =>
      setError('Device storage is full or unavailable. Export your project now.'),
    );
    const t = setTimeout(() => void save().catch(() => {}), 650);
    return () => clearTimeout(t);
  }, [doc, ready, save]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(docRef.current) !== saved.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const online = () => void save().catch(() => {});
    window.addEventListener('beforeunload', before);
    window.addEventListener('online', online);
    return () => {
      window.removeEventListener('beforeunload', before);
      window.removeEventListener('online', online);
    };
  }, [save]);
  const select = (nodeId: string, multi = false) => {
    setSelected((s) =>
      multi ? (s.includes(nodeId) ? s.filter((i) => i !== nodeId) : [...s, nodeId]) : [nodeId],
    );
  };
  const undo = () => {
    const next = history.current.undo();
    docRef.current = next;
    setDoc(next);
    setSelected([]);
  };
  const redo = () => {
    const next = history.current.redo();
    docRef.current = next;
    setDoc(next);
    setSelected([]);
  };
  const deleteSelected = () => {
    mutate((d) => {
      for (const nodeId of selected) {
        const l = locate(d, nodeId);
        l?.siblings.splice(l.index, 1);
      }
    });
    setSelected([]);
    setContext(false);
  };
  const copy = () => {
    clipboard.current = selected
      .map((nodeId) => allNodes(docRef.current).find((n) => n.id === nodeId))
      .filter(Boolean)
      .map((n) => structuredClone(n!));
  };
  const paste = () => {
    const clones = clipboard.current.map(cloneNode);
    mutate((d) => {
      const p = d.pages.find((p) => p.id === page.id)!;
      const l = selected[0] ? locate(d, selected[0]) : undefined;
      if (l) l.siblings.splice(l.index + 1, 0, ...clones);
      else p.nodes.push(...clones);
    });
    setSelected(clones.map((n) => n.id));
  };
  const duplicate = () => {
    copy();
    paste();
    setContext(false);
  };
  const shortcut = (key: string, shift = false) => {
    if (key === 'z') shift ? redo() : undo();
    if (key === 'c') copy();
    if (key === 'v') paste();
    if (key === 'd') duplicate();
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        el.closest('input,textarea,select,[contenteditable=true]') ||
        document.querySelector('dialog[open]')
      )
        return;
      if (e.key === 'Escape') {
        setSelected([]);
        setContext(false);
      }
      if (['Delete', 'Backspace'].includes(e.key) && selected.length) {
        e.preventDefault();
        deleteSelected();
      }
      if ((e.metaKey || e.ctrlKey) && ['z', 'c', 'v', 'd', 's'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 's') void save().catch(() => {});
        else shortcut(e.key, e.shiftKey);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (
        e.source === previewFrame.current?.contentWindow &&
        e.data?.channel === channel.current &&
        e.data.type === 'navigate'
      ) {
        if (e.data.project) setPreviewProject(e.data.project);
        else {
          const p = docRef.current.pages.find((p) => p.slug === e.data.page);
          if (p) {
            setPageId(p.id);
            setPreviewProject(undefined);
          }
        }
        return;
      }
      if (e.source !== frame.current?.contentWindow || e.data?.channel !== channel.current) return;
      const m = e.data;
      if (m.type === 'select') select(m.id);
      if (m.type === 'context') {
        select(m.id);
        setContext(true);
      }
      if (
        m.type === 'text' &&
        ['text', 'subtitle', 'eyebrow', 'label'].includes(m.field) &&
        typeof m.text === 'string'
      )
        mutate((d) => {
          const n = allNodes(d).find((n) => n.id === m.id);
          if (n) (n.props as Record<string, unknown>)[m.field] = m.text;
        });
      if (m.type === 'delete') deleteSelected();
      if (m.type === 'shortcut') shortcut(m.key, m.shift);
      if (m.type === 'ready')
        frame.current?.contentWindow?.postMessage(
          { channel: channel.current, type: 'select', id: selected[0] },
          '*',
        );
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  });
  useEffect(() => {
    frame.current?.contentWindow?.postMessage(
      { channel: channel.current, type: 'select', id: selected[0] },
      '*',
    );
  }, [selected]);
  const assetUrl = useAssetUrls(doc);
  const html = useMemo(
    () =>
      renderPage(doc, { page: page.slug, editor: true, channel: channel.current, asset: assetUrl }),
    [doc, page.slug, assetUrl],
  );
  const width = device === 'desktop' ? 1200 : device === 'tablet' ? 820 : 390;
  const add = (type: Kind) => {
    const n = makeNode(type);
    mutate((d) => {
      const p = d.pages.find((p) => p.id === page.id)!;
      const l = selected[0] ? locate(d, selected[0]) : undefined;
      if (l && containers.includes(l.siblings[l.index].type)) l.siblings[l.index].children.push(n);
      else if (l) l.siblings.splice(l.index + 1, 0, n);
      else p.nodes.push(n);
    });
    setSelected([n.id]);
    setLeftTab('layers');
  };
  const move = (delta: number) =>
    mutate((d) => {
      const l = selected[0] ? locate(d, selected[0]) : undefined;
      if (!l) return;
      const to = l.index + delta;
      if (to >= 0 && to < l.siblings.length) {
        const [n] = l.siblings.splice(l.index, 1);
        l.siblings.splice(to, 0, n);
      }
    });
  const goBack = async () => {
    try {
      await save();
      onBack();
    } catch {
      if (confirm('Your recovery draft is stored on this device. Leave the editor?')) onBack();
    }
  };
  return (
    <div className="editor-shell">
      <header className="editor-toolbar">
        <div className="editor-brand">
          <button
            className="icon-button"
            aria-label="Back to websites"
            onClick={() => void goBack()}
          >
            <ArrowLeft size={18} />
          </button>
          <img src="/branding/icon.svg" alt="Persona" />
          <button
            className="editor-site-title"
            onClick={() => {
              const name = prompt('Website name', doc.name);
              if (name)
                mutate((d) => {
                  d.name = name;
                });
            }}
          >
            {doc.name}
            <ChevronDown size={13} />
          </button>
          <span className="save-status">
            <span className={status === 'Saved' ? 'status-dot' : 'status-dot pending'} />
            {status}
          </span>
        </div>
        <div className="editor-devices">
          <button
            aria-label="Undo"
            title="Undo ⌘Z"
            disabled={!history.current.past.length}
            onClick={undo}
          >
            <Undo2 size={17} />
          </button>
          <button aria-label="Redo" disabled={!history.current.future.length} onClick={redo}>
            <Redo2 size={17} />
          </button>
          <span className="toolbar-divider" />
          {[
            { id: 'desktop', icon: Monitor },
            { id: 'tablet', icon: Tablet },
            { id: 'mobile', icon: Smartphone },
          ].map((item) => (
            <button
              aria-label={`${item.id} preview`}
              key={item.id}
              className={device === item.id ? 'active' : ''}
              onClick={() => setDevice(item.id as Device)}
            >
              <item.icon size={17} />
            </button>
          ))}
          <select
            aria-label="Canvas zoom"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          >
            {[40, 50, 60, 70, 80, 100].map((v) => (
              <option key={v} value={v}>
                {v}%
              </option>
            ))}
          </select>
        </div>
        <div className="editor-actions">
          <button className="secondary" onClick={() => setPreview(true)}>
            <Eye size={15} />
            Preview
          </button>
          <button
            className="primary"
            onClick={async () => {
              try {
                await save();
                setTools(true);
              } catch {}
            }}
          >
            <Globe size={15} />
            Publish
            <ChevronDown size={13} />
          </button>
        </div>
      </header>
      {error && (
        <div className="editor-error" role="alert">
          <span>{error}</span>
          {conflict ? (
            <>
              <button onClick={() => void localExport(docRef.current, true)}>
                Export recovery
              </button>
              <button
                onClick={async () => {
                  if (
                    !confirm(
                      'Discard your open draft and load the server version? Export recovery first.',
                    )
                  )
                    return;
                  const remote = await workspace.get(initial.id);
                  siteRef.current = remote;
                  saved.current = JSON.stringify(remote.document);
                  history.current = new History(remote.document);
                  docRef.current = remote.document;
                  setDoc(remote.document);
                  setConflict(false);
                  conflictRef.current = false;
                  setError('');
                  await remove(recoveryKey);
                }}
              >
                Load server version
              </button>
            </>
          ) : (
            <button onClick={() => void save().catch(() => {})}>Retry save</button>
          )}
        </div>
      )}
      <div className="editor-workspace">
        {showLeft && (
          <aside className="editor-left">
            <div className="editor-left-tabs">
              {[
                { id: 'layers', icon: LayersIcon, label: 'Layers' },
                { id: 'add', icon: Plus, label: 'Insert' },
                { id: 'pages', icon: LayoutTemplate, label: 'Pages' },
              ].map((t) => (
                <button
                  key={t.id}
                  className={leftTab === t.id ? 'active' : ''}
                  onClick={() => setLeftTab(t.id)}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              ))}
            </div>
            {leftTab === 'layers' ? (
              <>
                <div className="panel-heading">
                  <strong>{page.name}</strong>
                  <button
                    className="icon-button"
                    aria-label="Add component"
                    onClick={() => setLeftTab('add')}
                  >
                    <Plus size={15} />
                  </button>
                </div>
                <Layers
                  nodes={page.nodes}
                  selected={selected}
                  onSelect={(nodeId, multi) => {
                    select(nodeId, multi);
                    frame.current?.contentWindow?.postMessage(
                      { channel: channel.current, type: 'scroll', id: nodeId },
                      '*',
                    );
                  }}
                  onMove={(nodeId, target) => apply(moveNode(docRef.current, nodeId, target))}
                />
                <p className="layers-help">
                  Drag a handle to reorder.
                  <br />
                  Double-click canvas text to write.
                  <br />⌘ / Ctrl + click to select several.
                </p>
              </>
            ) : leftTab === 'add' ? (
              <>
                <div className="panel-heading">
                  <strong>Make room for more</strong>
                </div>
                {['Basic', 'Layout', 'Portfolio', 'Media', 'Interactive'].map((category) => (
                  <div className="component-category" key={category}>
                    <h3>{category}</h3>
                    <div className="component-buttons">
                      {(Object.entries(registry) as [Kind, (typeof registry)[Kind]][])
                        .filter(([, r]) => r.category === category)
                        .map(([type, r]) => (
                          <button key={type} onClick={() => add(type)}>
                            <span>{r.label[0]}</span>
                            {r.label}
                            <Plus size={12} />
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="panel-heading">
                  <strong>Pages</strong>
                  <button
                    className="icon-button"
                    aria-label="Add page"
                    onClick={() => {
                      const name = prompt('Page name');
                      if (name) {
                        const newId = id();
                        mutate((d) => {
                          d.pages.push({
                            id: newId,
                            name,
                            slug: uniqueSlug(
                              name,
                              d.pages.map((p) => p.slug),
                            ),
                            description: '',
                            visible: true,
                            nodes: [
                              makeNode('navigation', { text: d.name }),
                              makeNode('heading', { text: name }),
                              makeNode('footer'),
                            ],
                          });
                        });
                        setPageId(newId);
                      }
                    }}
                  >
                    <Plus size={15} />
                  </button>
                </div>
                {doc.pages.map((p) => (
                  <button
                    className={'page-row ' + (p.id === page.id ? 'selected' : '')}
                    key={p.id}
                    onClick={() => {
                      setPageId(p.id);
                      setSelected([]);
                    }}
                  >
                    <LayoutTemplate size={14} />
                    {p.name}
                    <small>{p.slug === '' ? 'Home' : '/' + p.slug}</small>
                  </button>
                ))}
                <button
                  className="text-button page-settings-link"
                  onClick={() => setPageSettings(true)}
                >
                  <Settings size={14} />
                  Page settings
                </button>
              </>
            )}
            <div className="editor-left-bottom">
              <button
                onClick={() => {
                  setSelected([]);
                }}
              >
                <Palette size={16} />
                Site styles
              </button>
              <button onClick={() => setContent(true)}>
                <Database size={16} />
                Content
              </button>
              <button onClick={() => setAssets(true)}>
                <FolderOpen size={16} />
                Assets
              </button>
              <button onClick={() => setRevisions(true)}>
                <HistoryIcon size={16} />
                Revision history
              </button>
              <button onClick={() => setTools(true)}>
                <Settings size={16} />
                Site settings
              </button>
            </div>
          </aside>
        )}
        <div className="canvas-area">
          <div className="canvas-ruler">
            <button
              className="icon-button"
              aria-label="Toggle layers panel"
              onClick={() => setShowLeft(!showLeft)}
            >
              <PanelLeftClose size={15} />
            </button>
            <span>
              {page.name} <ChevronRight size={11} />
              {device} · {width} px
            </span>
            <button
              className="text-button"
              onClick={() => {
                const available = Math.floor(
                  ((window.innerWidth - (showLeft ? 540 : 300)) / width) * 100,
                );
                setZoom(
                  [40, 50, 60, 70, 80, 100].filter((value) => value <= available).at(-1) || 40,
                );
              }}
            >
              <Maximize2 size={13} />
              Fit
            </button>
          </div>
          <div className="canvas-scroll" onClick={() => setContext(false)}>
            <div
              className="canvas-sheet"
              style={{ width: (width * zoom) / 100, height: (Math.max(800, 1000) * zoom) / 100 }}
            >
              <iframe
                ref={frame}
                title="Portfolio canvas"
                sandbox="allow-scripts"
                srcDoc={html}
                style={{
                  width,
                  height: Math.max(1100, (window.innerHeight * 100) / zoom - 120),
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top left',
                }}
              />
            </div>
          </div>
          <div className="canvas-footer">
            <span>PERSONA CANVAS</span>
            <span>
              {selected.length ? `${selected.length} selected` : 'Select something. Make it yours.'}
            </span>
            <button
              onClick={() =>
                void save()
                  .then((s) => onExport(s, true))
                  .catch((e) => setError(e.message))
              }
            >
              <Download size={12} />
              Export project
            </button>
          </div>
          {context && (
            <div className="canvas-context">
              <button onClick={duplicate}>
                <Copy size={14} />
                Duplicate
              </button>
              <button onClick={copy}>Copy</button>
              <button onClick={paste}>Paste</button>
              <button className="danger-text" onClick={deleteSelected}>
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
        <Inspector
          doc={doc}
          node={selectedNode}
          device={device}
          onChange={(fn) =>
            mutate((d) => {
              const n = allNodes(d).find((n) => n.id === selected[0]);
              if (n) fn(n);
            })
          }
          onTheme={apply}
          onDuplicate={duplicate}
          onDelete={deleteSelected}
          onMove={move}
          onNest={(target) => apply(moveNode(docRef.current, selected[0], target, true))}
          onAsset={() => setAssets(true)}
        />
      </div>
      {preview && (
        <Modal title={`Preview · ${page.name}`} wide onClose={() => setPreview(false)}>
          <div className="preview-toolbar">
            <span>
              {device} · {width} px
            </span>
            <select
              aria-label="Preview page"
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
            >
              {doc.pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              className="text-button"
              onClick={() => {
                const blob = new Blob([previewBundle(doc, assetUrl)], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank', 'noopener');
                setTimeout(() => URL.revokeObjectURL(url), 60000);
              }}
            >
              Separate tab <ExternalLink size={14} />
            </button>
          </div>
          <iframe
            ref={previewFrame}
            className="fullscreen-preview"
            title="Website preview"
            sandbox="allow-scripts allow-popups"
            srcDoc={renderPage(doc, {
              page: page.slug,
              asset: assetUrl,
              previewChannel: channel.current,
              project: previewProject,
            })}
            style={{ maxWidth: width }}
          />
        </Modal>
      )}
      {tools && (
        <SiteTools
          workspace={workspace}
          getSite={() => siteRef.current}
          save={save}
          doc={doc}
          onChange={apply}
          onClose={() => setTools(false)}
          onExport={async (project) => {
            const site = await save();
            await onExport(site, project);
          }}
        />
      )}
      {content && (
        <Modal title="Your content, in one place" wide onClose={() => setContent(false)}>
          <ContentManager doc={doc} onChange={apply} />
        </Modal>
      )}
      {assets && (
        <Modal title="Asset library" wide onClose={() => setAssets(false)}>
          <Assets
            workspace={workspace}
            onChoose={(url) => {
              if (selectedNode)
                mutate((d) => {
                  const n = allNodes(d).find((n) => n.id === selected[0]);
                  if (n) n.props.src = url;
                });
              setAssets(false);
            }}
          />
        </Modal>
      )}
      {revisions && (
        <RevisionHistory
          workspace={workspace}
          siteId={initial.id}
          onClose={() => setRevisions(false)}
          onRestore={(next) => {
            apply(next);
            setRevisions(false);
          }}
        />
      )}
      {pageSettings && (
        <Modal title="Page settings" onClose={() => setPageSettings(false)}>
          <form
            className="settings-form"
            onSubmit={(e) => {
              e.preventDefault();
              setPageSettings(false);
            }}
          >
            <label>
              Page name
              <input
                value={page.name}
                onChange={(e) =>
                  mutate((d) => {
                    d.pages.find((p) => p.id === page.id)!.name = e.target.value;
                  })
                }
              />
            </label>
            {page.slug !== '' && (
              <label>
                Page slug
                <input
                  defaultValue={page.slug}
                  onBlur={(e) => {
                    const value = uniqueSlug(
                      e.target.value,
                      doc.pages.filter((p) => p.id !== page.id).map((p) => p.slug),
                    );
                    mutate((d) => {
                      d.pages.find((p) => p.id === page.id)!.slug = value;
                    });
                  }}
                />
              </label>
            )}
            <label>
              Search description
              <textarea
                value={page.description}
                onChange={(e) =>
                  mutate((d) => {
                    d.pages.find((p) => p.id === page.id)!.description = e.target.value;
                  })
                }
              />
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={page.visible}
                onChange={(e) =>
                  mutate((d) => {
                    d.pages.find((p) => p.id === page.id)!.visible = e.target.checked;
                  })
                }
              />
              Show in navigation
            </label>
            <div className="row">
              <button
                className="secondary"
                type="button"
                onClick={() =>
                  mutate((d) => {
                    d.pages.push({
                      ...structuredClone(page),
                      id: id(),
                      name: page.name + ' copy',
                      slug: uniqueSlug(
                        page.name + ' copy',
                        d.pages.map((p) => p.slug),
                      ),
                      nodes: page.nodes.map(cloneNode),
                    });
                  })
                }
              >
                Duplicate page
              </button>
              {page.slug !== '' && (
                <button
                  className="secondary"
                  type="button"
                  onClick={() =>
                    mutate((d) => {
                      const home = d.pages.find((p) => p.slug === '')!;
                      home.slug = uniqueSlug(
                        home.name,
                        d.pages.map((p) => p.slug),
                      );
                      d.pages.find((p) => p.id === page.id)!.slug = '';
                    })
                  }
                >
                  Set as home
                </button>
              )}
            </div>
            {page.slug !== '' && (
              <button
                className="danger-text text-button"
                type="button"
                onClick={() => {
                  if (confirm('Delete this page? Undo can restore it.')) {
                    mutate((d) => {
                      d.pages = d.pages.filter((p) => p.id !== page.id);
                    });
                    setPageId(doc.pages.find((p) => p.slug === '')!.id);
                    setPageSettings(false);
                  }
                }}
              >
                Delete page
              </button>
            )}
            <button className="primary">Done</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
function RevisionHistory({
  workspace,
  siteId,
  onClose,
  onRestore,
}: {
  workspace: Workspace;
  siteId: string;
  onClose: () => void;
  onRestore: (d: SiteDocument) => void;
}) {
  const [items, setItems] = useState<
      { id?: string; version: number; created_at: string; document?: SiteDocument }[]
    >([]),
    [error, setError] = useState('');
  useEffect(() => {
    (workspace.user
      ? api<typeof items>(`/websites/${siteId}/revisions`)
      : read<typeof items>('revisions:' + siteId).then((v) => v || [])
    )
      .then(setItems)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <Modal title="Your work has a history" onClose={onClose}>
      <p className="modal-intro">
        Restoring creates a new draft. Your published website stays as it is.
      </p>
      <ErrorBox error={error} />
      <div className="revision-list">
        {items.map((item) => (
          <div className="revision-row" key={item.version}>
            <HistoryIcon size={17} />
            <div>
              <strong>Revision {item.version}</strong>
              <small>{new Date(item.created_at).toLocaleString()}</small>
            </div>
            <button
              className="secondary"
              onClick={async () => {
                try {
                  const d =
                    item.document ||
                    (await api<SiteDocument>(`/websites/${siteId}/revisions/${item.id}`));
                  if (confirm(`Restore revision ${item.version} as your draft?`)) onRestore(d);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              Restore
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
