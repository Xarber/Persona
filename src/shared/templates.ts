// Copyright (c) 2026 Persona contributors
// SPDX-License-Identifier: AGPL-3.0-only
import { id, makeNode, parseDocument, type SiteDocument, type SiteNode } from './schema';
export const templates = [
  {
    id: 'minimal',
    name: 'Still',
    category: 'Minimal',
    description: 'A quiet, confident canvas. Big ideas, room to breathe.',
    color: '#e9e8df',
    ink: '#283d32',
    layout: 'minimal',
  },
  {
    id: 'developer',
    name: 'Terminal',
    category: 'Developer',
    description: 'Technical craft, open-source work and a little personality.',
    color: '#151c24',
    ink: '#a8e8bb',
    layout: 'developer',
  },
  {
    id: 'creative',
    name: 'Offbeat',
    category: 'Creative',
    description: 'Bold typography and unexpected compositions for original thinkers.',
    color: '#e7a792',
    ink: '#722d30',
    layout: 'creative',
  },
  {
    id: 'student',
    name: 'Fieldnotes',
    category: 'Student',
    description: 'A bright starting point for everything you’re becoming.',
    color: '#e0e8bf',
    ink: '#384b33',
    layout: 'student',
  },
  {
    id: 'professional',
    name: 'Forma',
    category: 'Professional',
    description: 'A considered profile built on experience and expertise.',
    color: '#dfe6ec',
    ink: '#233f58',
    layout: 'professional',
  },
  {
    id: 'editorial',
    name: 'Chapter',
    category: 'Editorial',
    description: 'For stories worth telling, and work worth reading.',
    color: '#eee5d4',
    ink: '#463d32',
    layout: 'editorial',
  },
];
export function createDocument(
  template = 'minimal',
  name = 'Untitled portfolio',
  person = 'Alex Morgan',
): SiteDocument {
  const t = templates.find((t) => t.id === template) || templates[0];
  const node = (type: SiteNode['type'], props: SiteNode['props'] = {}) => makeNode(type, props);
  const nav = node('navigation', { text: person });
  const hero = node('hero', {
    eyebrow: 'INDEPENDENT DESIGNER & CREATIVE THINKER',
    text: 'Good work.\nA little curiosity.\nA lot of heart.',
    subtitle: `I’m ${person}, a designer and maker turning complex ideas into clear, thoughtful experiences.`,
  });
  const projects = node('projects', {
    text: 'A selection of things I’ve made',
    collection: 'projects',
  });
  const about = node('container');
  about.children = [
    node('heading', { text: 'The person behind the pixels.' }),
    node('paragraph', {
      text: 'I believe the best work happens at the intersection of care and curiosity. I work with people and teams to turn thoughtful ideas into useful, lasting things.',
    }),
  ];
  const journey = node('timeline');
  const skills = node('skills');
  const contact = node('contact');
  const footer = node('footer', {
    text: `© ${new Date().getFullYear()} ${person}. All good things take care.`,
  });
  let nodes = [nav, hero, projects, about, contact, footer];
  if (template === 'developer') {
    hero.props = {
      eyebrow: 'SOFTWARE ENGINEER · OPEN SOURCE',
      text: `Hello, I’m ${person.split(' ')[0]}.\nI build for the web.`,
      subtitle:
        'Thoughtful systems. Useful tools. Readable code. A few things I’ve shipped along the way.',
    };
    nodes = [nav, hero, skills, projects, journey, contact, footer];
  }
  if (template === 'creative') {
    hero.props = {
      eyebrow: 'A SMALL COLLECTION OF BIG IDEAS',
      text: 'A different\npoint of view.',
      subtitle: 'Design, experiments and happy accidents. Welcome to my corner of the internet.',
    };
    hero.style = { align: 'right', fontSize: 88 };
    const quote = node('quote', { text: 'Stay curious.\nMake something unexpected.' });
    nodes = [nav, hero, quote, projects, about, footer];
  }
  if (template === 'student') {
    hero.props = {
      eyebrow: 'LEARNING BY MAKING',
      text: 'Hello, world.\nThis is just\nthe beginning.',
      subtitle: 'Student, explorer, and a work in progress. Here’s what I’m learning and making.',
    };
    nodes = [nav, hero, journey, projects, skills, contact, footer];
  }
  if (template === 'professional') {
    hero.props = {
      eyebrow: 'STRATEGY · RESEARCH · COLLABORATION',
      text: 'Clarity for\nwhat comes next.',
      subtitle:
        'An independent perspective on complex challenges. Partnering with ambitious teams to create lasting value.',
    };
    nodes = [
      nav,
      hero,
      about,
      journey,
      node('quote', { text: 'The most useful answers begin with better questions.' }),
      contact,
      footer,
    ];
  }
  if (template === 'editorial') {
    hero.props = {
      eyebrow: 'WORDS, OBSERVATIONS & OTHER THINGS',
      text: 'Notes from\na curious life.',
      subtitle: 'Stories about places, people, and the small things that make a difference.',
    };
    nodes = [
      nav,
      hero,
      node('quote', { text: 'Pay attention.\nThere is a story everywhere.' }),
      about,
      projects,
      footer,
    ];
  }
  if (template === 'blank')
    nodes = [nav, node('heading', { text: 'Your story starts here.' }), footer];
  const theme = {
    background: t.color,
    surface: template === 'developer' ? '#202b37' : '#ffffff',
    text: t.ink,
    muted: template === 'developer' ? '#b0bac7' : '#62665e',
    accent: template === 'creative' ? '#722d30' : template === 'developer' ? '#a8e8bb' : '#1d4b3e',
    secondary: template === 'developer' ? '#35465a' : '#d8dfcf',
    font: (template === 'developer'
      ? 'mono'
      : template === 'editorial' || template === 'professional'
        ? 'serif'
        : 'sans') as 'sans' | 'serif' | 'mono',
    radius: template === 'creative' ? 0 : template === 'student' ? 24 : 10,
    spacing: 72,
    width: 1120,
  };
  return parseDocument({
    schemaVersion: 1,
    name,
    template,
    description: `The work and ideas of ${person}.`,
    theme,
    pages: [{ id: id(), name: 'Home', slug: '', description: '', visible: true, nodes }],
    collections: {
      projects: [
        {
          id: id(),
          title: 'Common Ground',
          slug: 'common-ground',
          summary:
            'A digital home for a community-led idea. Strategy, identity, and a thoughtful web experience.',
          body: 'A demonstration project to help you explore Persona. Replace this story with your own work before publishing.',
          image: '',
          url: '',
          tags: ['Brand strategy', 'Web design'],
          featured: true,
        },
        {
          id: id(),
          title: 'Everyday Objects',
          slug: 'everyday-objects',
          summary: 'Finding something extraordinary in the things we use every day.',
          body: 'Sample portfolio content. Edit this entry in the content library to make it your own.',
          image: '',
          url: '',
          tags: ['Art direction', 'Product design'],
          featured: true,
        },
        {
          id: id(),
          title: 'A Different Pace',
          slug: 'a-different-pace',
          summary: 'A considered approach to a slower, more intentional kind of living.',
          body: 'Sample project. Share your process, what you learned, and what happened next.',
          image: '',
          url: '',
          tags: ['Editorial', 'Photography'],
          featured: false,
        },
      ],
    },
    seo: { indexable: true, canonical: '', image: '' },
  });
}
