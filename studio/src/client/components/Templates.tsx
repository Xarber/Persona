// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, ArrowLeft, LayoutTemplate, Sparkles, File } from 'lucide-react';
import { templates, createDocument } from '../../shared/templates';
import { useAssetUrls } from '../media';
import { renderPage } from '../../shared/renderer';
import type { SiteDocument } from '../../shared/schema';
import { Modal, ErrorBox } from './ui';
export function Thumbnail({ template, doc }: { template: string; doc?: SiteDocument }) {
  const fallback = useMemo(() => doc || createDocument(template), [template, doc]);
  const assetUrl = useAssetUrls(fallback);
  const html = useMemo(() => renderPage(fallback, { asset: assetUrl }), [fallback, assetUrl]);
  return (
    <div className={'template-thumb thumb-' + template} aria-hidden="true">
      <iframe title="Template thumbnail" tabIndex={-1} sandbox="" srcDoc={html} loading="lazy" />
    </div>
  );
}
export function TemplateGallery({ onSelect }: { onSelect: (t: string) => void }) {
  return (
    <div className="template-gallery">
      {templates.map((t) => (
        <button className="template-tile" onClick={() => onSelect(t.id)} key={t.id}>
          <Thumbnail template={t.id} />
          <div className="template-caption">
            <div>
              <strong>{t.name}</strong>
              <span>{t.category}</span>
            </div>
            <ArrowUpRight size={17} />
          </div>
          <p>{t.description}</p>
        </button>
      ))}
    </div>
  );
}
export function CreateSite({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, template: string, person: string) => Promise<void>;
}) {
  const [step, setStep] = useState(0),
    [template, setTemplate] = useState('minimal'),
    [mode, setMode] = useState('template'),
    [name, setName] = useState('My portfolio'),
    [person, setPerson] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <Modal
      title={step ? 'Make it yours' : 'A fresh start for your next chapter'}
      onClose={onClose}
      wide
    >
      {!step ? (
        <>
          <p className="modal-intro">Start with a little inspiration. Make it entirely your own.</p>
          <div className="segmented creation-modes">
            {[
              { id: 'template', name: 'Start with a template', icon: LayoutTemplate },
              { id: 'blank', name: 'Blank canvas', icon: File },
              { id: 'guided', name: 'Guided setup', icon: Sparkles },
            ].map((m) => (
              <button
                key={m.id}
                className={mode === m.id ? 'active' : ''}
                onClick={() => setMode(m.id)}
              >
                <m.icon size={15} />
                {m.name}
              </button>
            ))}
          </div>
          {mode === 'blank' ? (
            <div className="blank-start">
              <File size={32} />
              <h3>Room for your own ideas.</h3>
              <p>A navigation bar, a heading, and endless possibilities.</p>
              <button
                className="primary"
                onClick={() => {
                  setTemplate('blank');
                  setStep(1);
                }}
              >
                Use a blank canvas <ArrowUpRight size={15} />
              </button>
            </div>
          ) : (
            <TemplateGallery
              onSelect={(t) => {
                setTemplate(t);
                setStep(1);
              }}
            />
          )}
        </>
      ) : (
        <div className="create-details">
          <Thumbnail template={template} />
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              try {
                await onCreate(name, template, person || 'Your name');
              } catch (err) {
                setError((err as Error).message);
                setBusy(false);
              }
            }}
          >
            <span className="eyebrow">YOUR OWN LITTLE CORNER OF THE INTERNET</span>
            <h3>What shall we call it?</h3>
            <label>
              Website name
              <input
                autoFocus
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Your name <span className="optional">optional</span>
              <input
                maxLength={100}
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                placeholder="How you’d like to introduce yourself"
              />
            </label>
            {mode === 'guided' && (
              <p className="muted">
                We’ll organize your starter with sample work and a short introduction. You can
                change every detail in the editor.
              </p>
            )}
            <ErrorBox error={error} />
            <div className="row">
              <button type="button" className="secondary" onClick={() => setStep(0)}>
                <ArrowLeft size={15} />
                Back
              </button>
              <button className="primary" disabled={busy}>
                {busy ? 'Creating…' : 'Open the editor'}
                <Check size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
