import { preferences } from '../preferences';
// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Landing } from './Landing';

const preference = 'persona-app-opened';
type View = 'landing' | 'app';
function initialView(): View {
  if (location.pathname === '/about' || location.pathname === '/about/') return 'landing';
  if (/^#(?:features|install|privacy|main)$/.test(location.hash)) return 'landing';
  if (/^#(?:site\/|verify\/|reset\/|app$)/.test(location.hash) || location.pathname !== '/')
    return 'app';
  if (history.state?.personaView) return history.state.personaView;
  try {
    return preferences.getItem(preference) === 'true' ? 'app' : 'landing';
  } catch {
    return 'landing';
  }
}

/** Browser-only entry shell; never imported by the preserved native Expo application. */
export function WebEntry({ children }: { children: (showLanding: () => void) => ReactNode }) {
  const [view, setView] = useState<View>(initialView);
  const [opened, setOpened] = useState(view === 'app');
  const appURL = useRef(view === 'app' ? location.href : '/');
  const container = useRef<HTMLDivElement>(null);
  const select = (next: View) => {
    document.documentElement.dataset.entryView = next;
    if (next === 'app') setOpened(true);
    setView(next);
  };
  const openApp = () => {
    try {
      preferences.setItem(preference, 'true');
    } catch {
      /* Session navigation still works. */
    }
    history.pushState({ ...history.state, personaView: 'app' }, '', appURL.current);
    select('app');
  };
  const showLanding = () => {
    appURL.current = location.href;
    history.pushState({ ...history.state, personaView: 'landing' }, '', '/');
    select('landing');
  };
  useLayoutEffect(() => {
    document.documentElement.dataset.entryView = view;
  }, [view]);
  useEffect(() => {
    history.replaceState(
      { ...history.state, personaView: view },
      '',
      location.pathname.startsWith('/about') ? '/' : location.href,
    );
    const pop = () => select(initialView());
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    document.title =
      view === 'landing'
        ? 'Persona — Your work. Your identity. Your web.'
        : 'Persona — Portfolio studio';
    container.current
      ?.querySelector<HTMLElement>(`[data-web-view="${view}"]`)
      ?.focus({ preventScroll: true });
  }, [view]);
  return (
    <div ref={container}>
      {view === 'landing' && (
        <div className="web-entry-view" data-web-view="landing" tabIndex={-1}>
          <Landing onOpen={openApp} />
        </div>
      )}
      {opened && (
        <div
          className="web-entry-view"
          data-web-view="app"
          tabIndex={-1}
          hidden={view !== 'app'}
          inert={view !== 'app'}
        >
          {children(showLanding)}
        </div>
      )}
    </div>
  );
}
