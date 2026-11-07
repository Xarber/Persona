// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from 'react';
import { Upload, ImagePlus, FileText, Trash2, Copy, Check, FolderOpen } from 'lucide-react';
import { addLocalAsset, localAssets, blobData } from '../media';
import { read, write, Workspace, api, download } from '../storage';
import { Empty, ErrorBox, SearchBox } from './ui';
interface Asset {
  id: string;
  name: string;
  mime: string;
  size: number;
  alt: string;
  preview?: string;
}
export function Assets({
  workspace,
  onChoose,
}: {
  workspace: Workspace;
  onChoose?: (url: string) => void;
}) {
  const [assets, setAssets] = useState<Asset[]>([]),
    [search, setSearch] = useState(''),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [error, setError] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const refresh = () => {
    if (workspace.user)
      api<Asset[]>('/assets')
        .then(setAssets)
        .catch((e) => setError(e.message));
    else
      localAssets()
        .then(async (list) =>
          setAssets(
            await Promise.all(list.map(async (a) => ({ ...a, preview: await blobData(a.data) }))),
          ),
        )
        .catch((e) => setError(e.message));
  };
  useEffect(refresh, [workspace]);
  async function upload(f: File) {
    setBusy(true);
    setError('');
    setProgress(0);
    try {
      if (!workspace.user) {
        await addLocalAsset(f, f.name);
        setProgress(100);
        refresh();
        return;
      }
      const form = new FormData();
      form.set('file', f);
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/assets');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status < 300) resolve();
          else reject(Error(JSON.parse(xhr.responseText).error || 'Upload failed'));
        };
        xhr.onerror = () => reject(Error('Upload interrupted. Please retry.'));
        xhr.send(form);
      });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="assets-page">
      <div className="section-toolbar">
        <div>
          <span className="eyebrow">THE MATERIALS OF YOUR NEXT IDEA</span>
          <h2>Your asset library.</h2>
          <p className="muted">Images and documents, ready when inspiration strikes.</p>
        </div>
        <button className="primary" disabled={busy} onClick={() => file.current?.click()}>
          <Upload size={16} />
          Upload assets
        </button>
      </div>
      <input
        type="file"
        ref={file}
        hidden
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif,application/pdf"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = '';
        }}
      />
      <div
        className="upload-dropzone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) void upload(f);
        }}
      >
        <ImagePlus size={25} />
        <strong>{busy ? `Uploading… ${progress}%` : 'Drop something good here.'}</strong>
        <span>PNG, JPEG, WebP, GIF, AVIF or PDF · up to 12 MB</span>
        {busy && <progress max="100" value={progress} aria-label="Upload progress" />}
      </div>
      <ErrorBox error={error} />
      <SearchBox placeholder="Search assets…" value={search} onChange={setSearch} />
      <div className="asset-grid">
        {assets
          .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
          .map((a) => (
            <article className="asset-card" key={a.id}>
              <div className="asset-preview">
                {a.mime.startsWith('image/') ? (
                  <img src={a.preview || `/api/assets/${a.id}/file`} alt={a.alt || a.name} />
                ) : (
                  <FileText size={45} />
                )}
              </div>
              <strong>{a.name}</strong>
              <small>
                {(a.size / 1024).toFixed(0)} KB · {a.mime.split('/')[1]}
              </small>
              <div className="row">
                {onChoose && (
                  <button
                    className="secondary"
                    disabled={!a.mime.startsWith('image/')}
                    title={
                      !a.mime.startsWith('image/')
                        ? 'Copy this document URL to use it as a download link'
                        : undefined
                    }
                    onClick={() => onChoose(`/api/assets/${a.id}/file`)}
                  >
                    <Check size={13} />
                    Use asset
                  </button>
                )}
                <button
                  className="icon-button"
                  aria-label={`Copy URL for ${a.name}`}
                  onClick={() =>
                    void navigator.clipboard
                      .writeText(`/api/assets/${a.id}/file`)
                      .catch(() =>
                        setError('Clipboard unavailable. Copy the URL from your browser.'),
                      )
                  }
                >
                  <Copy size={14} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Edit metadata for ${a.name}`}
                  onClick={async () => {
                    const name = prompt('Asset name', a.name);
                    if (!name) return;
                    const alt = prompt('Image alt text', a.alt);
                    try {
                      if (workspace.user)
                        await api(`/assets/${a.id}`, 'PATCH', { name, alt: alt ?? a.alt });
                      else
                        await write(
                          'local-assets',
                          (await localAssets()).map((i) =>
                            i.id === a.id ? { ...i, name, alt: alt ?? a.alt } : i,
                          ),
                        );
                      refresh();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  ✎
                </button>
                <button
                  className="icon-button danger-text"
                  aria-label={`Delete ${a.name}`}
                  onClick={async () => {
                    if (
                      !confirm(
                        'Remove this unused asset from your library? Assets needed for revision recovery will be preserved.',
                      )
                    )
                      return;
                    try {
                      if (workspace.user) await api(`/assets/${a.id}`, 'DELETE');
                      else {
                        const sites = await workspace.list();
                        if (
                          sites.some((s) =>
                            JSON.stringify(s.document).includes(`/api/assets/${a.id}/file`),
                          )
                        )
                          throw Error(
                            'This asset is used by a website. Remove its references first.',
                          );
                        await write(
                          'local-assets',
                          (await localAssets()).filter((i) => i.id !== a.id),
                        );
                      }
                      refresh();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
      </div>
    </div>
  );
}
