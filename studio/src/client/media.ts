// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useEffect, useState } from 'react';
import { read, write, Workspace } from './storage';
import { id, type SiteDocument } from '../shared/schema';
export interface LocalAsset {
  id: string;
  name: string;
  mime: string;
  size: number;
  alt: string;
  data: Blob;
  original: Blob;
  createdAt: string;
}
export async function localAssets() {
  return (await read<LocalAsset[]>('local-assets')) || [];
}
export async function addLocalAsset(file: Blob, name: string): Promise<LocalAsset> {
  if (file.size > 12 * 1024 * 1024) throw Error('Maximum asset size is 12 MB.');
  let data: Blob;
  if (file.type === 'application/pdf') {
    if ((await file.slice(0, 5).text()) !== '%PDF-') throw Error('Invalid PDF.');
    data = file;
  } else {
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'].includes(file.type))
      throw Error('Only raster images and PDFs are accepted.');
    const image = await createImageBitmap(file);
    if (image.width * image.height > 40000000) {
      image.close();
      throw Error('Image exceeds 40 megapixels.');
    }
    const scale = Math.min(1, 2400 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
    data = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(Error('Image processing failed.'))),
        'image/webp',
        0.88,
      ),
    );
  }
  const asset = {
    id: id(),
    name,
    mime: data.type,
    size: data.size,
    alt: '',
    data,
    original: file,
    createdAt: new Date().toISOString(),
  };
  await write('local-assets', [asset, ...(await localAssets())]);
  return asset;
}
export function documentAssetIds(doc: SiteDocument) {
  return [
    ...new Set(
      [...JSON.stringify(doc).matchAll(/\/api\/assets\/([\w-]+)\/file/g)].map((m) => m[1]),
    ),
  ];
}
export function blobData(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
export function useAssetUrls(doc: SiteDocument) {
  const key = documentAssetIds(doc).sort().join(','),
    [mapping, setMapping] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!key) return;
    let live = true;
    const load = async () => {
      const local = await localAssets();
      const pairs = await Promise.all(
        key
          .split(',')
          .filter(Boolean)
          .map(async (assetId) => {
            const url = `/api/assets/${assetId}/file`;
            const stored = local.find((a) => a.id === assetId);
            try {
              let blob = stored?.data;
              if (!blob) {
                const r = await fetch(url);
                if (!r.ok) return [url, ''] as const;
                blob = await r.blob();
              }
              return [url, await blobData(blob)] as const;
            } catch {
              return [url, ''] as const;
            }
          }),
      );
      if (live) setMapping(Object.fromEntries(pairs));
    };
    void load();
    return () => {
      live = false;
    };
  }, [key]);
  return useCallback((url: string) => mapping[url] || url, [mapping]);
}
