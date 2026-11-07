// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState } from 'react';
import {
  Globe,
  ArrowUpRight,
  Download,
  History,
  Check,
  Shield,
  ExternalLink,
  Trash2,
  Mail,
  Search,
  RotateCcw,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Workspace, api } from '../storage';
import type { SiteDocument, Website } from '../../shared/schema';
import { Modal, ErrorBox, Empty } from './ui';
interface Deployment {
  id: string;
  version: number;
  status: string;
  log: string;
  created_at: string;
}
interface Domain {
  id: string;
  hostname: string;
  token: string;
  target: string;
  verified_at: string | null;
  routing: number;
}
interface Submission {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}
export function SiteTools({
  workspace,
  getSite,
  save,
  doc,
  onChange,
  onClose,
  onExport,
}: {
  workspace: Workspace;
  getSite: () => Website;
  save: () => Promise<Website>;
  doc: SiteDocument;
  onChange: (d: SiteDocument) => void;
  onClose: () => void;
  onExport: (project: boolean) => Promise<void>;
}) {
  const [tab, setTab] = useState('publish'),
    [deployments, setDeployments] = useState<Deployment[]>([]),
    [domains, setDomains] = useState<Domain[]>([]),
    [submissions, setSubmissions] = useState<Submission[]>([]),
    [domain, setDomain] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [site, setSite] = useState(getSite());
  const refresh = async () => {
    if (!workspace.user) return;
    const current = await workspace.get(getSite().id);
    setSite(current);
    setDeployments(await api(`/websites/${current.id}/deployments`));
    setDomains(await api(`/websites/${current.id}/domains`));
    setSubmissions(await api(`/websites/${current.id}/submissions`));
  };
  useEffect(() => {
    void refresh().catch((e) => setError(e.message));
  }, [tab]);
  useEffect(() => {
    if (!deployments.some((d) => ['queued', 'building'].includes(d.status))) return;
    const t = setInterval(() => void refresh().catch((e) => setError(e.message)), 1200);
    return () => clearInterval(t);
  }, [deployments]);
  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const [publicOrigin, setPublicOrigin] = useState('http://localhost:3101');
  useEffect(() => {
    void api<{ publicOrigin: string }>('/config')
      .then((c) => setPublicOrigin(c.publicOrigin))
      .catch(() => {});
  }, []);
  const publicURL = `${publicOrigin}/sites/${site.id}/`;
  return (
    <Modal title="Your website, out in the world" wide onClose={onClose}>
      <div className="tools-layout">
        <nav aria-label="Website tools">
          {[
            { id: 'publish', label: 'Publishing', icon: Globe },
            { id: 'domains', label: 'Domains', icon: Shield },
            { id: 'seo', label: 'Search & social', icon: Search },
            { id: 'inbox', label: 'Messages', icon: Mail },
            { id: 'export', label: 'Export & own', icon: Download },
          ].map((t) => (
            <button
              className={tab === t.id ? 'selected' : ''}
              onClick={() => setTab(t.id)}
              key={t.id}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="tools-content">
          <ErrorBox error={error} />
          {message && (
            <p role="status" className="success-box">
              {message}
            </p>
          )}
          {tab === 'publish' ? (
            <>
              <span className="eyebrow">A LITTLE CORNER OF THE INTERNET</span>
              <h2>Ready when you are.</h2>
              <p className="modal-intro">
                Publish a snapshot of your saved draft. Keep creating while your live website stays
                exactly as you left it.
              </p>
              {!workspace.user ? (
                <div className="notice">
                  <Info size={18} />
                  <div>
                    <strong>Your local workspace stays private.</strong>
                    <p>
                      Create an account from the dashboard, then export and import this project to
                      publish it. You can export an independent website right now.
                    </p>
                    <button className="secondary" onClick={() => void onExport(false)}>
                      Export static website
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="publication-card">
                    <div className="publication-icon">
                      <Globe size={24} />
                    </div>
                    <div>
                      <strong>
                        {site.deploymentId ? 'Your website is live.' : 'A new home for your work.'}
                      </strong>
                      <p>
                        {site.deploymentId ? (
                          <a href={publicURL} target="_blank" rel="noopener noreferrer">
                            {publicURL}
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          'Your first published version is one click away.'
                        )}
                      </p>
                      <small>
                        Draft revision {site.version}
                        {site.publishedVersion
                          ? ` · Published revision ${site.publishedVersion}`
                          : ''}
                      </small>
                    </div>
                    <button
                      className="primary"
                      disabled={
                        busy || deployments.some((d) => ['queued', 'building'].includes(d.status))
                      }
                      onClick={() =>
                        void act(async () => {
                          const saved = await save();
                          await api(`/websites/${site.id}/publish`, 'POST', {
                            version: saved.version,
                          });
                          setMessage(
                            'Publication queued. The previous live version remains available until this one is ready.',
                          );
                        })
                      }
                    >
                      {deployments.some((d) => ['queued', 'building'].includes(d.status))
                        ? 'Publishing…'
                        : site.deploymentId
                          ? 'Publish changes'
                          : 'Publish website'}
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {site.deploymentId && (
                    <button
                      className="text-button danger-text"
                      disabled={busy}
                      onClick={() => {
                        if (
                          confirm(
                            'Take this website offline? Your drafts and publication history will be kept.',
                          )
                        )
                          void act(() => api(`/websites/${site.id}/unpublish`, 'POST', {}));
                      }}
                    >
                      Unpublish website
                    </button>
                  )}
                  <div className="section-toolbar">
                    <h3>Deployment history</h3>
                    <button className="text-button" onClick={() => void refresh()}>
                      <RefreshCw size={13} />
                      Refresh
                    </button>
                  </div>
                  {!deployments.length && (
                    <p className="muted">Your first chapter hasn’t been published yet.</p>
                  )}
                  {deployments.map((d) => (
                    <div className="deployment-row" key={d.id}>
                      <span className={'deployment-state ' + d.status}>
                        {d.status === 'ready' ? <Check size={17} /> : <History size={17} />}
                      </span>
                      <div>
                        <strong>
                          Revision {d.version} <span className="tiny-badge">{d.status}</span>
                          {site.deploymentId === d.id && <span className="live-badge">LIVE</span>}
                        </strong>
                        <small>{new Date(d.created_at).toLocaleString()}</small>
                        <details>
                          <summary>Build details</summary>
                          <p>{d.log}</p>
                          <code>{d.id}</code>
                        </details>
                      </div>
                      {d.status === 'ready' && site.deploymentId !== d.id && (
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() => {
                            if (
                              confirm(
                                `Make revision ${d.version} the live website? Your current draft will be preserved.`,
                              )
                            )
                              void act(() =>
                                api(
                                  `/websites/${site.id}/deployments/${d.id}/rollback`,
                                  'POST',
                                  {},
                                ),
                              );
                          }}
                        >
                          <RotateCcw size={13} />
                          Roll back
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </>
          ) : tab === 'domains' ? (
            <>
              <span className="eyebrow">MAKE IT YOUR ADDRESS</span>
              <h2>A domain of your own.</h2>
              <p className="modal-intro">
                Verify ownership with DNS, then point your hostname to this installation. HTTPS is
                handled by the configured Caddy proxy.
              </p>
              {workspace.user ? (
                <>
                  <form
                    className="row"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void act(async () => {
                        await api(`/websites/${site.id}/domains`, 'POST', { hostname: domain });
                        setDomain('');
                      });
                    }}
                  >
                    <input
                      required
                      aria-label="Custom domain"
                      placeholder="portfolio.example.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                    />
                    <button className="primary" disabled={busy}>
                      Add domain
                    </button>
                  </form>
                  {domains.map((d) => (
                    <div className="domain-card" key={d.id}>
                      <div className="row between">
                        <strong>{d.hostname}</strong>
                        <span className="tiny-badge">
                          {d.verified_at ? 'Ownership verified' : 'Awaiting verification'}
                        </span>
                      </div>
                      <label>
                        TXT record name<code>_persona.{d.hostname}</code>
                      </label>
                      <label>
                        TXT record value<code>{d.token}</code>
                      </label>
                      <label>
                        CNAME target <span className="optional">subdomains</span>
                        <code>{d.target}</code>
                      </label>
                      <p className="muted">
                        Routing: {d.routing ? 'CNAME confirmed' : 'not confirmed'}. TLS: issuance
                        and renewal are managed by the instance proxy; no certificate result is
                        measured here.
                      </p>
                      <div className="row">
                        <button
                          className="secondary"
                          disabled={busy}
                          onClick={() =>
                            void act(async () => {
                              const result = await api<{ verified: boolean; routing: boolean }>(
                                `/websites/${site.id}/domains/${d.id}/verify`,
                                'POST',
                                {},
                              );
                              setMessage(
                                result.verified
                                  ? 'Ownership confirmed. ' +
                                      (result.routing
                                        ? 'Routing confirmed.'
                                        : 'Set the CNAME record, then verify again.')
                                  : 'TXT challenge not found. DNS propagation may take time.',
                              );
                            })
                          }
                        >
                          <Shield size={14} />
                          Verify DNS
                        </button>
                        <button
                          className="text-button danger-text"
                          onClick={() => {
                            if (
                              confirm('Remove this domain assignment? Remove its DNS records too.')
                            )
                              void act(() => api(`/websites/${site.id}/domains/${d.id}`, 'DELETE'));
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="notice">Domain assignments require a connected workspace.</p>
              )}
              <details className="help-details">
                <summary>Apex domains, HTTPS and revalidation</summary>
                <p>
                  Subdomains use CNAME. Apex domains require your DNS provider’s ALIAS/ANAME
                  flattening to DOMAIN_TARGET, or instance-specific A/AAAA records. Automatic
                  routing verification currently checks CNAME; apex routing needs proxy/operator
                  setup. Domain ownership expires after seven days and must be reverified. Do not
                  point domains at an untrusted installation.
                </p>
              </details>
            </>
          ) : tab === 'seo' ? (
            <>
              <span className="eyebrow">HELP PEOPLE FIND YOUR WORK</span>
              <h2>A good first impression.</h2>
              <div className="settings-form">
                <label>
                  Website description
                  <textarea
                    maxLength={1000}
                    rows={3}
                    value={doc.description}
                    onChange={(e) => onChange({ ...doc, description: e.target.value })}
                  />
                </label>
                <label>
                  Canonical base URL
                  <input
                    value={doc.seo.canonical}
                    placeholder="https://portfolio.example.com"
                    onChange={(e) =>
                      onChange({ ...doc, seo: { ...doc.seo, canonical: e.target.value } })
                    }
                  />
                </label>
                <label>
                  Social preview image
                  <input
                    value={doc.seo.image}
                    onChange={(e) =>
                      onChange({ ...doc, seo: { ...doc.seo, image: e.target.value } })
                    }
                  />
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={doc.seo.indexable}
                    onChange={(e) =>
                      onChange({ ...doc, seo: { ...doc.seo, indexable: e.target.checked } })
                    }
                  />
                  Allow search engines to index published pages
                </label>
                <div className="search-preview">
                  <small>{doc.seo.canonical || 'your-website.example.com'}</small>
                  <h3>Home — {doc.name}</h3>
                  <p>
                    {doc.description ||
                      'Add a description to introduce your work in search results.'}
                  </p>
                </div>
                <p className="muted">
                  Page-specific descriptions live in Pages → Page settings. Changes take effect in
                  your next publication.
                </p>
              </div>
            </>
          ) : tab === 'inbox' ? (
            <>
              <span className="eyebrow">GOOD THINGS START WITH HELLO</span>
              <h2>Notes from your visitors.</h2>
              <p className="modal-intro">
                Published contact forms deliver messages here. No third-party email service is
                required.
              </p>
              {!submissions.length ? (
                <Empty
                  title="A quiet inbox."
                  description="Messages from your published contact forms will appear here."
                />
              ) : (
                submissions.map((s) => (
                  <article className="submission" key={s.id}>
                    <div className="row between">
                      <strong>{s.name}</strong>
                      <button
                        className="icon-button danger-text"
                        aria-label="Delete message"
                        onClick={() => {
                          if (confirm('Permanently delete this message?'))
                            void act(() =>
                              api(`/websites/${site.id}/submissions/${s.id}`, 'DELETE'),
                            );
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <a href={`mailto:${s.email}`}>{s.email}</a>
                    <time>{new Date(s.created_at).toLocaleString()}</time>
                    <p>{s.message}</p>
                  </article>
                ))
              )}
            </>
          ) : (
            <>
              <span className="eyebrow">NO LOCK-IN. EVER.</span>
              <h2>Your website goes with you.</h2>
              <p className="modal-intro">
                Keep an editable project for another Persona installation, or take a static website
                to any hosting provider.
              </p>
              <div className="export-card">
                <Download size={24} />
                <div>
                  <h3>Static website</h3>
                  <p>
                    HTML, styles, images, responsive pages, icons and offline support. No Persona
                    account required to run it.
                  </p>
                </div>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => void act(() => onExport(false))}
                >
                  Export ZIP
                </button>
              </div>
              <div className="export-card">
                <FolderIcon />
                <div>
                  <h3>Editable project</h3>
                  <p>
                    A versioned Persona document with attached assets and checksums. Import it into
                    a connected workspace to continue editing.
                  </p>
                </div>
                <button
                  className="secondary"
                  disabled={busy}
                  onClick={() => void act(() => onExport(true))}
                >
                  Export project
                </button>
              </div>
              <div className="notice">
                <Info size={18} />
                <p>
                  Static exports use the contact email configured on each contact component. Without
                  one, they show an explicit unconfigured message. Instance inboxes and analytics
                  are not bundled into independent exports.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
function FolderIcon() {
  return <Download size={24} />;
}
