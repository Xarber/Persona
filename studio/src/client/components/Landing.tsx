// SPDX-License-Identifier: AGPL-3.0-only
import {
  ArrowUpRight,
  Layers,
  MonitorSmartphone,
  PackageOpen,
  ShieldCheck,
  WifiOff,
  Palette,
} from 'lucide-react';

const features = [
  {
    icon: Palette,
    title: 'Start with a point of view.',
    text: 'Six distinct templates, from quiet editorial to expressive creative. Make every section your own.',
  },
  {
    icon: Layers,
    title: 'Shape it as you see it.',
    text: 'Edit on the canvas, arrange layers and refine layouts for desktop, tablet and mobile.',
  },
  {
    icon: PackageOpen,
    title: 'Keep your independence.',
    text: 'Export a standalone website or a portable project. Your work stays yours to host and develop.',
  },
];

export function Landing({ onOpen }: { onOpen?: () => void }) {
  return (
    <div className="landing-page">
      <a className="landing-skip" href="#main">
        Skip to content
      </a>
      <header className="landing-nav">
        <a className="landing-brand" href="/" aria-label="Persona home">
          <img src="/branding/icon.svg" width="36" height="36" alt="" />
          persona<span>by OpenRecode</span>
        </a>
        <nav aria-label="Product">
          <a href="#features">Features</a>
          <a href="#install">Install</a>
          <a
            className="landing-button"
            href="/#app"
            onClick={
              onOpen
                ? (event) => {
                    event.preventDefault();
                    onOpen();
                  }
                : undefined
            }
          >
            Open App <ArrowUpRight size={17} />
          </a>
        </nav>
      </header>
      <main id="main">
        <section className="landing-hero">
          <p className="landing-eyebrow">
            <span aria-hidden="true">✳</span> An independent portfolio studio
          </p>
          <h1>
            Your work.
            <br />
            Your identity.
            <br />
            <em>Your web.</em>
          </h1>
          <div className="landing-hero-bottom">
            <p>
              A considered space to turn what you do into a website that feels like you. Build
              visually. Keep control. Put your work first.
            </p>
            <a
              className="landing-button"
              href="/#app"
              onClick={
                onOpen
                  ? (event) => {
                      event.preventDefault();
                      onOpen();
                    }
                  : undefined
              }
            >
              Make room for your work <ArrowUpRight size={19} />
            </a>
          </div>
          <figure className="landing-preview">
            <img
              src="/branding/studio-preview.png"
              alt="Persona’s working visual editor showing a portfolio canvas, layers and typography controls"
              width="1440"
              height="1000"
              fetchPriority="high"
            />
            <figcaption>Inside the web studio · actual application capture</figcaption>
          </figure>
        </section>
        <section id="features" className="landing-section">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">A little structure. A lot of possibility.</p>
            <h2>
              From a blank page
              <br />
              to something personal.
            </h2>
          </div>
          <div className="landing-features">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title}>
                <Icon size={27} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="landing-principles landing-section" aria-labelledby="independence">
          <div>
            <p className="landing-eyebrow">Made for the long run</p>
            <h2 id="independence">
              A website you can
              <br />
              take with you.
            </h2>
            <p>
              Start locally without an account. Connect to a self-hosted workspace when you need
              publishing, private media and revision history.
            </p>
          </div>
          <ul>
            <li>
              <WifiOff aria-hidden="true" />
              <div>
                <h3>Local first</h3>
                <p>
                  Create and edit local projects offline after the app has loaded. Connected
                  workspaces need a server for publishing.
                </p>
              </div>
            </li>
            <li>
              <ShieldCheck aria-hidden="true" />
              <div>
                <h3>Deliberately private</h3>
                <p>
                  Local drafts stay in this browser. Account workspaces live on the operator’s
                  server. Export a backup before clearing browser storage.
                </p>
              </div>
            </li>
            <li>
              <MonitorSmartphone aria-hidden="true" />
              <div>
                <h3>A web app, wherever you work</h3>
                <p>
                  Use a desktop browser for the full editor. Manage projects on smaller screens, or
                  install the PWA where your browser supports it.
                </p>
              </div>
            </li>
          </ul>
        </section>
        <section id="install" className="landing-section landing-install">
          <p className="landing-eyebrow">Your next chapter</p>
          <h2>Give your work a home.</h2>
          <p>Open the studio to start a local project. No account needed.</p>
          <a
            className="landing-button"
            href="/#app"
            onClick={
              onOpen
                ? (event) => {
                    event.preventDefault();
                    onOpen();
                  }
                : undefined
            }
          >
            Open Persona <ArrowUpRight size={19} />
          </a>
          <div className="landing-guides">
            <article>
              <h3>Install the web app</h3>
              <p>
                Open the studio first. On iPhone or iPad, use Safari’s Share menu → Add to Home
                Screen. In supported desktop and Android browsers, choose Install app from the
                browser menu. HTTPS is required outside localhost.
              </p>
            </article>
            <article>
              <h3>Host your own studio</h3>
              <p>
                The server runs on Node 24 with SQLite or PostgreSQL. Read the setup and backup
                guides before hosting.
              </p>
              <a href="https://github.com/Xarber/Persona/blob/testing/studio/docs/DEVELOPMENT.md">
                Setup documentation <ArrowUpRight size={15} />
              </a>
            </article>
          </div>
        </section>
        <section id="privacy" className="landing-section landing-privacy">
          <h2>Your data, clearly.</h2>
          <p>
            Persona stores local projects and preferences in your browser. Connected features send
            account and project data to the server you choose. Published portfolios are accessible
            to their intended audience; publish only content you intend to share. The studio does
            not need a third-party analytics service.
          </p>
          <p>
            Export your projects regularly. Self-hosting operators control access, backups and
            retention. See the{' '}
            <a href="https://github.com/Xarber/Persona/blob/testing/studio/docs/PRIVACY.md">
              privacy guide
            </a>{' '}
            for storage and deletion details.
          </p>
        </section>
      </main>
      <footer className="landing-footer">
        <a className="landing-brand" href="/">
          persona<span>Your work. Your rules.</span>
        </a>
        <nav aria-label="Resources">
          <a href="#privacy">Privacy</a>
          <a href="https://github.com/Xarber/Persona/tree/testing/studio">Source & documentation</a>
          <a href="/source.zip">AGPL-3.0 source archive</a>
          <a href="https://github.com/Xarber/Persona/blob/testing/studio/LICENSE">License</a>
        </nav>
        <small>Independent software, part of OpenRecode. Web studio 0.1.</small>
      </footer>
    </div>
  );
}
