// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { parseDocument, type SiteDocument, type SiteNode, type Style } from './schema';
export const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const e = escapeHtml;
const cssMap: Record<string, string> = {
  color: 'color',
  background: 'background',
  fontSize: 'font-size',
  fontWeight: 'font-weight',
  lineHeight: 'line-height',
  letterSpacing: 'letter-spacing',
  padding: 'padding',
  margin: 'margin',
  gap: 'gap',
  radius: 'border-radius',
  maxWidth: 'max-width',
  minHeight: 'min-height',
  opacity: 'opacity',
  align: 'text-align',
  justify: 'justify-content',
  direction: 'flex-direction',
  aspectRatio: 'aspect-ratio',
  objectPosition: 'object-position',
};
export function styleCSS(s: Style) {
  let out = '';
  for (const [key, v] of Object.entries(s)) {
    if (v === undefined) continue;
    if (key === 'columns') out += `grid-template-columns:repeat(${v},minmax(0,1fr));`;
    else if (key === 'hidden') out += v ? 'display:none;' : 'display:revert;';
    else if (key === 'border') out += v ? 'border:1px solid currentColor;' : '';
    else if (key === 'shadow') out += v ? 'box-shadow:0 12px 40px #0002;' : '';
    else if (cssMap[key])
      out += `${cssMap[key]}:${v}${typeof v === 'number' && !['fontWeight', 'lineHeight', 'opacity'].includes(key) ? 'px' : ''};`;
  }
  return out;
}
export interface RenderOptions {
  page?: string;
  base?: string;
  editor?: boolean;
  channel?: string;
  formEndpoint?: string;
  canonical?: string;
  asset?: (url: string) => string;
  project?: string;
  previewChannel?: string;
}
export function renderPage(input: SiteDocument, options: RenderOptions = {}): string {
  const doc = parseDocument(input),
    page = doc.pages.find((p) => p.slug === (options.page || '')) || doc.pages[0],
    base = options.base ?? './',
    nonce = options.channel || 'persona-public-v1';
  const href = (path: string) => `${base}${path ? `${path}/` : ''}`;
  const asset = (url: string) => options.asset?.(url) ?? url;
  const editable = (text: unknown, field = 'text') =>
    `<span ${options.editor ? `data-edit="${field}"` : ''}>${e(text)}</span>`;
  const itemDetail = options.project
    ? Object.values(doc.collections)
        .flat()
        .find((i) => i.slug === options.project)
    : undefined;
  const render = (n: SiteNode): string => {
    const p = n.props,
      attrs = `data-node="${n.id}" class="node n-${n.type}${p.animation && p.animation !== 'none' ? ` animation-${p.animation}` : ''}"`,
      kids = n.children.map(render).join('');
    const heading = `<h2>${editable(p.text)}</h2>`;
    switch (n.type) {
      case 'heading':
        return `<h2 ${attrs}>${editable(p.text)}</h2>`;
      case 'paragraph':
        return `<p ${attrs}>${editable(p.text)}</p>`;
      case 'navigation':
        return `<header ${attrs}><a class="site-wordmark" data-page="" href="${e(href(''))}">${editable(p.text)}</a><details class="mobile-nav"><summary>Menu</summary><nav>${doc.pages
          .filter((p) => p.visible)
          .map(
            (p) =>
              `<a data-page="${e(p.slug)}" href="${e(href(p.slug))}" ${p.id === page.id ? 'aria-current="page"' : ''}>${e(p.name)}</a>`,
          )
          .join('')}</nav></details><nav class="desktop-nav">${doc.pages
          .filter((p) => p.visible)
          .map(
            (p) =>
              `<a data-page="${e(p.slug)}" href="${e(href(p.slug))}" ${p.id === page.id ? 'aria-current="page"' : ''}>${e(p.name)}</a>`,
          )
          .join(
            '',
          )}<a href="#contact">Let’s talk <span aria-hidden="true">↗</span></a></nav></header>`;
      case 'hero':
        return `<section ${attrs}><div class="eyebrow">${editable(p.eyebrow, 'eyebrow')}</div><h1>${editable(p.text)}</h1><p class="hero-subtitle">${editable(p.subtitle, 'subtitle')}</p>${kids}<a class="text-link" href="#work">Explore my work <span aria-hidden="true">↘</span></a><span class="hero-mark" aria-hidden="true">✳</span></section>`;
      case 'container':
      case 'stack':
      case 'grid':
        return `<section ${attrs}>${kids || `<p class="empty-container">Add elements to this ${n.type}</p>`}</section>`;
      case 'button':
        return `<a ${attrs} href="${e(asset(p.url || '#'))}">${editable(p.text)} <span aria-hidden="true">↗</span></a>`;
      case 'image':
        return `<figure ${attrs}>${p.src ? `<img src="${e(asset(p.src))}" alt="${e(p.alt || '')}" loading="${options.editor ? 'eager' : 'lazy'}">` : '<div class="image-placeholder">Add an image from the asset library</div>'}${p.text ? `<figcaption>${editable(p.text)}</figcaption>` : ''}</figure>`;
      case 'video':
        return `<figure ${attrs}>${p.src ? `<video src="${e(asset(p.src))}" controls preload="metadata" aria-label="${e(p.alt || 'Video')}"></video>` : '<div class="image-placeholder">Set a direct video URL in the inspector</div>'}</figure>`;
      case 'divider':
        return `<hr ${attrs}>`;
      case 'spacer':
        return `<div ${attrs} aria-hidden="true"></div>`;
      case 'projects':
        return `<section ${attrs} id="work"><div class="section-heading"><div><div class="eyebrow">SELECTED WORK</div>${heading}</div><span class="small">${(doc.collections[p.collection || 'projects'] || []).length.toString().padStart(2, '0')} PROJECTS</span></div><div class="project-grid">${(
          doc.collections[p.collection || 'projects'] || []
        )
          .map(
            (item, i) =>
              `<article class="project-card"><a class="project-art art-${i % 4}" href="${e(href(`projects/${item.slug}`))}" data-project="${e(item.slug)}" aria-label="View ${e(item.title)}">${
                item.image
                  ? `<img src="${e(asset(item.image))}" alt="${e(item.title)}" loading="${options.editor ? 'eager' : 'lazy'}">`
                  : `<div class="art-shape shape-${i % 3}"><span>${e(
                      item.title
                        .split(' ')
                        .map((w) => w[0])
                        .join(''),
                    )}</span></div>`
              }<span class="art-arrow" aria-hidden="true">↗</span></a><div class="project-caption"><h3><a data-project="${e(item.slug)}" href="${e(href(`projects/${item.slug}`))}">${e(item.title)}</a></h3><span>${e(item.tags.join(' / '))}</span></div><p>${e(item.summary)}</p></article>`,
          )
          .join('')}</div></section>`;
      case 'skills':
        return `<section ${attrs}>${heading}<ul class="skill-list">${(p.items || []).map((i) => `<li>${e(i.title)}</li>`).join('')}</ul></section>`;
      case 'timeline':
        return `<section ${attrs}>${heading}<ol class="timeline">${(p.items || []).map((i) => `<li><h3>${e(i.title)}</h3><p>${e(i.text)}</p></li>`).join('')}</ol></section>`;
      case 'quote':
        return `<figure ${attrs}><blockquote>${editable(p.text)}</blockquote>${p.subtitle ? `<figcaption>${editable(p.subtitle, 'subtitle')}</figcaption>` : ''}</figure>`;
      case 'contact':
        return `<section ${attrs} id="contact"><div class="eyebrow">SAY HELLO</div>${heading}<p>${editable(p.subtitle, 'subtitle')}</p>${options.formEndpoint || options.editor || options.previewChannel ? `<form class="contact-form" action="${e(options.formEndpoint || '#')}" method="post"><label>Your name<input name="name" required maxlength="100" autocomplete="name"></label><label>Email address<input name="email" type="email" required maxlength="254" autocomplete="email"></label><label class="honeypot" aria-hidden="true">Leave empty<input name="website" tabindex="-1" autocomplete="off"></label><label>Your message<textarea name="message" required maxlength="5000" rows="4"></textarea></label><button type="submit">Send your note ↗</button><p role="status"></p></form>` : p.email ? `<a class="n-button" href="mailto:${e(p.email)}">Write to ${e(p.email)} ↗</a>` : '<p class="form-unconfigured">Contact delivery is not configured. Add a contact email in the editor, or publish on Persona to collect messages.</p>'}</section>`;
      case 'footer':
        return `<footer ${attrs}><p>${editable(p.text)}</p>${kids}<a href="#top">Back to top ↑</a></footer>`;
      case 'accordion':
        return `<section ${attrs}>${heading}${(p.items || []).map((i) => `<details><summary>${e(i.title)}</summary><p>${e(i.text)}</p></details>`).join('')}</section>`;
      case 'gallery':
        return `<section ${attrs}>${heading}<div class="project-grid">${(p.items || [])
          .filter((i) => i.url)
          .map(
            (i) =>
              `<figure><img src="${e(asset(i.url!))}" alt="${e(i.title)}" loading="${options.editor ? 'eager' : 'lazy'}"><figcaption>${e(i.text)}</figcaption></figure>`,
          )
          .join('')}</div></section>`;
      case 'statistics':
        return `<section ${attrs}>${(p.items || []).map((i) => `<div><strong>${e(i.title)}</strong><p>${e(i.text)}</p></div>`).join('')}</section>`;
    }
  };
  const targeted = (n: SiteNode, s: Style) => {
    let result = '';
    if (n.type === 'projects' && s.columns !== undefined)
      result += `[data-node="${n.id}"] .project-grid{grid-template-columns:repeat(${s.columns},minmax(0,1fr))}[data-node="${n.id}"] .project-card{grid-column:auto}`;
    if (n.type === 'hero')
      result += `[data-node="${n.id}"] h1{${styleCSS(Object.fromEntries(Object.entries(s).filter(([k]) => ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'].includes(k))) as Style)}}`;
    if (n.type === 'image')
      result += `[data-node="${n.id}"] img{${styleCSS({ aspectRatio: s.aspectRatio, objectPosition: s.objectPosition })}}`;
    return result;
  };
  let styles = '';
  const walk = (nodes: SiteNode[]) =>
    nodes.forEach((n) => {
      styles += `[data-node="${n.id}"]{${styleCSS(n.style)}}${targeted(n, n.style)}`;
      if (n.responsive.tablet)
        styles += `@media(max-width:900px){[data-node="${n.id}"]{${styleCSS(n.responsive.tablet)}}${targeted(n, n.responsive.tablet)}}`;
      if (n.responsive.mobile)
        styles += `@media(max-width:600px){[data-node="${n.id}"]{${styleCSS(n.responsive.mobile)}}${targeted(n, n.responsive.mobile)}}`;
      walk(n.children);
    });
  walk(page.nodes);
  const fonts = {
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'ui-monospace, SFMono-Regular, Consolas, monospace',
  };
  const canonical = options.canonical || doc.seo.canonical;
  const description = page.description || doc.description;
  const detail = itemDetail
    ? `<article class="project-detail"><a class="text-link" data-page="" href="${e(href(''))}">← Back to work</a><div class="eyebrow">${e(itemDetail.tags.join(' · '))}</div><h1>${e(itemDetail.title)}</h1><p class="hero-subtitle">${e(itemDetail.summary)}</p>${itemDetail.image ? `<img src="${e(asset(itemDetail.image))}" alt="${e(itemDetail.title)}">` : ''}<p>${e(itemDetail.body)}</p>${itemDetail.url ? `<a class="n-button" href="${e(asset(itemDetail.url))}" rel="noopener noreferrer">Visit project ↗</a>` : ''}</article>`
    : '';
  return `<!doctype html><html lang="en" data-template="${e(doc.template)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="${doc.theme.background}"><title>${e(itemDetail?.title || `${page.name} — ${doc.name}`)}</title><meta name="description" content="${e(description)}"><meta property="og:title" content="${e(doc.name)}"><meta property="og:description" content="${e(description)}">${doc.seo.image ? `<meta property="og:image" content="${e(asset(doc.seo.image))}">` : ''}${canonical ? `<link rel="canonical" href="${e(canonical.replace(/\/$/, '') + '/' + (options.project ? `projects/${options.project}/` : page.slug ? `${page.slug}/` : ''))}">` : ''}<meta name="robots" content="${options.editor || !doc.seo.indexable ? 'noindex,nofollow' : 'index,follow'}"><link rel="apple-touch-icon" href="${e(base)}apple-touch-icon.png"><link rel="manifest" href="${e(base)}manifest.webmanifest"><link rel="icon" href="${e(base)}icon.svg" type="image/svg+xml"><style>
 :root{--bg:${doc.theme.background};--surface:${doc.theme.surface};--ink:${doc.theme.text};--muted:${doc.theme.muted};--accent:${doc.theme.accent};--secondary:${doc.theme.secondary};--radius:${doc.theme.radius}px;--space:${doc.theme.spacing}px;--width:${doc.theme.width}px;font-family:${fonts[doc.theme.font]};color:var(--ink);background:var(--bg);color-scheme:${doc.theme.background === '#151c24' ? 'dark' : 'light'}}
 *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0}a{color:inherit;text-decoration:none}a:hover{text-decoration:underline;text-underline-offset:5px}a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,summary:focus-visible{outline:3px solid var(--accent);outline-offset:5px}button,input,textarea{font:inherit}img,video{max-width:100%;height:auto;display:block}button,.n-button{cursor:pointer;background:var(--accent);color:var(--bg);border:0;border-radius:var(--radius);padding:15px 24px;display:inline-flex;gap:24px;font-weight:600}main{max-width:var(--width);margin:auto;padding:0 48px}.node{position:relative}.node:not(.n-navigation):not(.n-button):not(.n-spacer):not(.n-divider){margin-top:var(--space);margin-bottom:var(--space)}h1,h2,h3,p,figure{margin:0}h1{font-size:clamp(44px,6.7vw,88px);font-weight:500;line-height:1.06;letter-spacing:-.06em;white-space:pre-line}h2{font-size:clamp(25px,3vw,40px);font-weight:500;line-height:1.16;letter-spacing:-.035em}h3{font-size:19px;font-weight:550;letter-spacing:-.02em}p{font-size:16px;line-height:1.75;color:var(--muted);white-space:pre-line}p+p{margin-top:16px}.eyebrow{font:500 10px/1.6 ui-monospace,monospace;letter-spacing:.14em;margin-bottom:28px}.small{font:10px ui-monospace,monospace;letter-spacing:.08em;white-space:nowrap}.n-navigation{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:30px 0;border-bottom:1px solid color-mix(in srgb,var(--ink) 18%,transparent)}.site-wordmark{font-size:20px;font-weight:650;letter-spacing:-.05em}.desktop-nav{display:flex;gap:30px;font-size:12px}.mobile-nav{display:none}.n-hero{padding:30px 0 60px;border-bottom:1px solid color-mix(in srgb,var(--ink) 18%,transparent);overflow:hidden}.hero-subtitle{max-width:440px;margin-top:30px;font-size:16px}.text-link{font-size:12px;display:inline-flex;gap:30px;margin-top:30px;border-bottom:1px solid;padding-bottom:7px}.hero-mark{position:absolute;right:20px;bottom:30px;font-size:150px;line-height:1;color:var(--accent);transform:rotate(-12deg);font-family:Georgia,serif}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:32px}.section-heading .eyebrow{margin-bottom:12px}.section-heading h2{max-width:440px}.project-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:42px 26px}.project-card p{font-size:13px;margin-top:10px;max-width:440px}.project-card:nth-child(3){grid-column:1/-1}.project-card:nth-child(3) .project-art{aspect-ratio:2.4}.project-art{aspect-ratio:1.25;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:var(--radius)}.art-0{background:#c8d3bd}.art-1{background:#d5bdaa}.art-2{background:#a7b4bf}.art-3{background:#ccbea4}.project-art img{width:100%;height:100%;object-fit:cover}.art-shape{display:flex;align-items:center;justify-content:center;transition:transform .22s ease;width:48%;height:65%;color:#eae5d9;background:#384738;box-shadow:10px 18px 40px #0002;transform:rotate(-8deg)}.art-shape span{font:italic 64px Georgia,serif;letter-spacing:-.08em}.shape-1{background:#eee7d6;color:#7a4c37;transform:rotate(8deg);border-radius:50% 50% 2px 2px;width:46%}.shape-2{background:#24435a;border-radius:120px;width:60%;height:52%;transform:rotate(-8deg)}.project-art:hover .art-shape{transform:rotate(0deg) scale(1.04)}.art-arrow{position:absolute;right:14px;bottom:14px;background:#ffffffb8;border-radius:50%;height:30px;width:30px;display:grid;place-items:center;color:#283d32}.project-caption{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:20px}.project-caption>span{font-size:10px;color:var(--muted)}.n-container,.n-stack{display:flex;flex-direction:column;gap:22px}.n-container>.node,.n-stack>.node,.n-grid>.node{margin:0!important}.n-container{max-width:760px}.n-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.n-spacer{height:48px}.n-divider{border:0;border-top:1px solid color-mix(in srgb,var(--ink) 20%,transparent)}.n-image img{width:100%;object-fit:cover;border-radius:var(--radius)}figcaption{font-size:12px;color:var(--muted);margin-top:12px}.image-placeholder,.empty-container{padding:40px;background:var(--secondary);border:1px dashed var(--muted);text-align:center;border-radius:var(--radius)}.skill-list{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}.skill-list li{border:1px solid color-mix(in srgb,var(--ink) 25%,transparent);border-radius:100px;padding:10px 22px;font-size:14px}.timeline{list-style:none;padding:0;margin-top:30px}.timeline li{display:grid;grid-template-columns:1fr 2fr;gap:24px;border-top:1px solid color-mix(in srgb,var(--ink) 20%,transparent);padding:25px 0}blockquote{font-size:clamp(32px,5vw,64px);line-height:1.15;letter-spacing:-.04em;white-space:pre-line;margin:0}.n-quote{border-left:2px solid var(--accent);padding-left:32px}.n-contact{padding:50px;background:var(--secondary);border-radius:var(--radius)}.n-contact h2{max-width:600px}.n-contact>p{margin-top:20px}.contact-form{max-width:600px;display:grid;gap:18px;margin-top:30px}.contact-form label{display:grid;gap:8px;font-size:12px}.contact-form input,.contact-form textarea{padding:12px;border:1px solid var(--muted);border-radius:5px;background:var(--bg);color:var(--ink)}.honeypot{position:absolute!important;left:-9999px}.n-footer{display:flex;justify-content:space-between;align-items:center;border-top:1px solid color-mix(in srgb,var(--ink) 20%,transparent);padding-top:24px;font-size:11px}.n-footer p{font-size:11px}.n-accordion details{border-bottom:1px solid var(--muted);padding:22px 0}.n-accordion summary{cursor:pointer}.n-accordion details p{padding-top:16px}.n-statistics{display:flex;flex-wrap:wrap;gap:50px}.n-statistics strong{font-size:60px}.project-detail{padding:50px 0;display:grid;gap:32px}.project-detail .eyebrow{margin:0}.project-detail img{width:100%;max-height:600px;object-fit:cover}
 [data-template=developer] .n-hero{border:1px solid #526371;border-radius:8px;padding:40px}[data-template=developer] h1{font-size:clamp(34px,5vw,65px);letter-spacing:-.05em}[data-template=developer] .project-grid{grid-template-columns:repeat(3,minmax(0,1fr))}[data-template=developer] .project-card:nth-child(3){grid-column:auto}[data-template=developer] .project-card:nth-child(3) .project-art{aspect-ratio:1.25}[data-template=developer] .project-caption{display:block}[data-template=developer] .project-caption>span{display:block;margin-top:8px}[data-template=creative] h1{font-size:clamp(50px,8vw,110px);font-weight:800}[data-template=creative] .n-quote{max-width:60%;border:0;transform:rotate(-3deg)}[data-template=creative] .project-card:nth-child(even){padding-top:70px}[data-template=student] .n-hero{padding:45px;background:var(--secondary);border-radius:32px}[data-template=student] .n-timeline{background:var(--surface);padding:32px;border-radius:24px}[data-template=professional] .n-hero{display:grid;grid-template-columns:2fr 1fr;column-gap:50px}[data-template=professional] .n-hero h1{grid-column:1}[data-template=professional] .hero-subtitle{grid-column:2;grid-row:2}[data-template=professional] .hero-mark{display:none}[data-template=editorial] .n-hero{text-align:center}[data-template=editorial] .hero-subtitle{margin:30px auto}[data-template=editorial] .hero-mark{display:none}[data-template=editorial] .project-grid{grid-template-columns:1fr}[data-template=editorial] .project-card{display:grid;grid-template-columns:1fr 1fr;gap:20px}[data-template=editorial] .project-art{grid-row:1/3}[data-template=editorial] .project-caption{display:block}[data-template=editorial] .project-card:nth-child(3) .project-art{aspect-ratio:1.25}
 @media(max-width:900px){main{padding:0 32px}.project-grid,[data-template=developer] .project-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hero-mark{font-size:100px;opacity:.55}.n-hero{padding-bottom:60px}.project-caption{display:block}.project-caption>span{display:block;margin-top:8px}}
 @media(max-width:600px){:root{--space:44px}main{padding:0 22px}h1{font-size:46px;letter-spacing:-.05em}.desktop-nav{display:none}.mobile-nav{display:block;font-size:13px}.mobile-nav nav{position:absolute;right:0;top:60px;z-index:5;padding:20px;background:var(--bg);border:1px solid var(--muted);display:grid;gap:20px;min-width:160px}.hero-mark{display:none}.n-hero{padding:10px 0 35px}.hero-subtitle{font-size:15px}.project-grid,.n-grid,[data-template=developer] .project-grid{grid-template-columns:1fr}.project-card:nth-child(3){grid-column:auto}.project-card:nth-child(3) .project-art{aspect-ratio:1.25}.section-heading{align-items:start}.section-heading .small{display:none}.n-contact{padding:28px}.n-footer{align-items:start;gap:20px}.timeline li{grid-template-columns:1fr;gap:10px}[data-template=professional] .n-hero{display:block}[data-template=creative] .n-quote{max-width:100%}[data-template=creative] .project-card:nth-child(even){padding-top:0}[data-template=editorial] .project-card{display:block}[data-template=student] .n-hero{padding:28px}}
 @media(prefers-reduced-motion:no-preference){.animation-fade{animation:appear .5s ease both}.animation-rise{animation:rise .5s ease both}@keyframes appear{from{opacity:0}to{opacity:1}}@keyframes rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
 ${styles}
 ${options.editor ? '[data-node]{cursor:pointer}[data-node]:hover{outline:1px dashed #2786b7;outline-offset:3px}[data-selected]{outline:2px solid #2786b7!important;outline-offset:3px}[contenteditable=true]{cursor:text;outline:2px solid #2786b7!important;min-width:1em;white-space:pre-wrap}[data-drop]{box-shadow:0 -4px #2786b7!important}' : ''}
 </style></head><body id="top"><a href="#main-content" style="position:absolute;left:-10000px" onfocus="this.style.left='8px'" onblur="this.style.left='-10000px'">Skip to content</a><main id="main-content">${
   itemDetail
     ? `${page.nodes
         .filter((n) => n.type === 'navigation')
         .map(render)
         .join('')}${detail}${page.nodes
         .filter((n) => n.type === 'footer')
         .map(render)
         .join('')}`
     : page.nodes.map(render).join('')
 }</main>
 <script>${options.editor ? editorBridge(nonce) : options.previewChannel ? previewBridge(options.previewChannel) : publicScript(base)}</script></body></html>`;
}
function editorBridge(channel: string) {
  return `(()=>{const channel=${JSON.stringify(channel)};const send=(type,data)=>parent.postMessage({channel,type,...data},'*');let editing=false;document.addEventListener('click',e=>{if(editing)return;e.preventDefault();const n=e.target.closest('[data-node]');if(n)send('select',{id:n.dataset.node})});document.addEventListener('dblclick',e=>{const text=e.target.closest('[data-edit]'),node=e.target.closest('[data-node]');if(!text||!node)return;e.preventDefault();editing=true;text.contentEditable='true';text.focus();send('editing',{active:true});const selection=getSelection(),range=document.createRange();range.selectNodeContents(text);selection.removeAllRanges();selection.addRange(range);text.addEventListener('blur',()=>{text.contentEditable='false';editing=false;send('text',{id:node.dataset.node,field:text.dataset.edit,text:text.innerText});send('editing',{active:false})},{once:true});});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&editing)document.activeElement.blur();if(!editing&&['Delete','Backspace'].includes(e.key)){e.preventDefault();send('delete',{});}if(!editing&&(e.metaKey||e.ctrlKey)){if(['z','c','v','d'].includes(e.key)){e.preventDefault();send('shortcut',{key:e.key,shift:e.shiftKey});}}});document.addEventListener('contextmenu',e=>{const n=e.target.closest('[data-node]');if(n){e.preventDefault();send('context',{id:n.dataset.node,x:e.clientX,y:e.clientY});}});window.addEventListener('message',e=>{if(e.source!==parent||e.data.channel!==channel)return;if(e.data.type==='select'){document.querySelectorAll('[data-selected]').forEach(n=>n.removeAttribute('data-selected'));const n=document.querySelector('[data-node="'+e.data.id+'"]');if(n)n.setAttribute('data-selected','');}if(e.data.type==='scroll'){document.querySelector('[data-node="'+e.data.id+'"]')?.scrollIntoView({behavior:'smooth',block:'center'});}});send('ready',{});})();`;
}
function publicScript(base: string) {
  return `document.querySelectorAll('.contact-form').forEach(form=>form.addEventListener('submit',async e=>{e.preventDefault();const status=form.querySelector('[role=status]'),button=form.querySelector('button');button.disabled=true;status.textContent='Sending…';try{const r=await fetch(form.action,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});if(!r.ok)throw Error('Unable to send. Please try again later.');status.textContent='Thank you. Your note has been received.';form.reset()}catch(err){status.textContent=err.message}finally{button.disabled=false}}));try{if('serviceWorker' in navigator)navigator.serviceWorker.register(${JSON.stringify(base + 'sw.js')}).catch(()=>{});}catch{}`;
}
export function siteIconFor(doc: SiteDocument) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192"><g id="background"><rect width="192" height="192" rx="40" fill="${doc.theme.background}"/></g><g id="identity"><text x="96" y="128" text-anchor="middle" font-family="sans-serif" font-size="96" font-weight="600" fill="${doc.theme.text}">${e(doc.name.trim().slice(0, 1).toUpperCase())}</text></g></svg>`;
}
export function portfolioWorker(doc: SiteDocument, paths: string[]) {
  const version = hash(JSON.stringify(doc));
  return `const PREFIX='persona-site-'+encodeURIComponent(self.registration.scope)+'-';const CACHE=PREFIX+'${version}';const URLS=${JSON.stringify(paths.map((p) => './' + p))};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS))));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k))))));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(fetch(e.request).catch(async()=>{const cache=await caches.open(CACHE);let url=new URL(e.request.url);if(e.request.mode==='navigate'&&url.pathname.endsWith('/'))url.pathname+='index.html';return await cache.match(url.href)||await cache.match(e.request)||(e.request.mode==='navigate'?await cache.match(new URL('./index.html',self.registration.scope).href):Response.error());}));});`;
}
export function siteFiles(doc: SiteDocument, options: RenderOptions = {}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of doc.pages) {
    const depth = p.slug ? 1 : 0;
    out[p.slug ? `${p.slug}/index.html` : 'index.html'] = renderPage(doc, {
      ...options,
      page: p.slug,
      base: depth ? '../' : './',
    });
  }
  for (const list of Object.values(doc.collections))
    for (const item of list) {
      out[`projects/${item.slug}/index.html`] = renderPage(doc, {
        ...options,
        project: item.slug,
        base: '../../',
      });
    }
  out['icon.svg'] = siteIconFor(doc);
  out['manifest.webmanifest'] = JSON.stringify({
    id: './',
    name: doc.name,
    description: doc.description,
    short_name: doc.name.slice(0, 20),
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: doc.theme.background,
    theme_color: doc.theme.background,
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  });
  const paths = Object.keys(out).filter((k) => k.endsWith('.html'));
  out['sw.js'] = portfolioWorker(doc, Object.keys(out));
  out['robots.txt'] =
    `User-agent: *\n${doc.seo.indexable ? 'Allow: /' : 'Disallow: /'}\n${options.canonical ? `Sitemap: ${options.canonical.replace(/\/$/, '')}/sitemap.xml` : ''}`;
  out['sitemap.xml'] =
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${options.canonical ? paths.map((p) => `<url><loc>${e(options.canonical!.replace(/\/$/, '') + '/' + p.replace(/index.html$/, ''))}</loc></url>`).join('') : ''}</urlset>`;
  return out;
}
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

function previewBridge(channel: string) {
  return `document.addEventListener('submit',e=>{e.preventDefault();const status=e.target.querySelector('[role=status]');if(status)status.textContent='Preview only. Messages are collected after publishing.';});document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a)return;if(a.hasAttribute('data-page')||a.hasAttribute('data-project')){e.preventDefault();parent.postMessage({channel:${JSON.stringify(channel)},type:'navigate',page:a.dataset.page,project:a.dataset.project},'*');}else if(!a.getAttribute('href')?.startsWith('#')){a.target='_blank';a.rel='noopener noreferrer';}});`;
}
export function previewBundle(doc: SiteDocument, asset: (u: string) => string = (u) => u) {
  const channel = 'persona-preview';
  const pages: Record<string, string> = {};
  for (const p of doc.pages)
    pages[p.slug] = renderPage(doc, { page: p.slug, previewChannel: channel, asset });
  for (const items of Object.values(doc.collections))
    for (const item of items)
      pages['projects/' + item.slug] = renderPage(doc, {
        project: item.slug,
        previewChannel: channel,
        asset,
      });
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview — ${e(doc.name)}</title><style>html,body,iframe{border:0;width:100%;height:100%;margin:0;display:block}</style></head><body><iframe title="Portfolio preview" sandbox="allow-scripts allow-popups"></iframe><script>const pages=${JSON.stringify(pages).replaceAll('<', '\\u003c')};const frame=document.querySelector('iframe');frame.srcdoc=pages[''];addEventListener('message',e=>{if(e.source!==frame.contentWindow||e.data?.channel!=='persona-preview'||e.data.type!=='navigate')return;const key=e.data.project?'projects/'+e.data.project:e.data.page;if(pages[key])frame.srcdoc=pages[key];});</script></body></html>`;
}
