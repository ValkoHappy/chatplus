import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getFooterColumns,
  getHeaderLinks,
  getSiteMapGroups,
  type PageV2NavRecord,
} from '../portal/src/lib/navigation.ts';

test('getHeaderLinks appends page_v2 links without replacing legacy navigation', () => {
  const dynamicPages: PageV2NavRecord[] = [
    {
      route_path: '/campaigns/spring-launch',
      title: 'Весенний запуск',
      nav_label: 'Весенний запуск',
      nav_order: 2,
      show_in_header: true,
    },
    {
      route_path: '/campaigns/hidden',
      title: 'Черновик',
      show_in_header: false,
    },
  ];

  const links = getHeaderLinks([], dynamicPages);

  assert.equal(links[0]?.href, '/channels');
  assert.ok(links.some((link) => link.href === '/campaigns/spring-launch'));
  assert.ok(!links.some((link) => link.href === '/campaigns/hidden'));
});

test('getHeaderLinks keeps legacy slot labels short for migrated routes', () => {
  const links = getHeaderLinks([], [
    {
      route_path: '/pricing',
      title: 'Commercial model',
      nav_label: 'Commercial model',
      nav_order: 1,
      show_in_header: true,
    },
  ]);

  const pricing = links.find((link) => link.href === '/pricing');
  assert.equal(pricing?.label, 'Цены');
});

test('getFooterColumns groups page_v2 links by nav_group and keeps legacy columns', () => {
  const dynamicPages: PageV2NavRecord[] = [
    {
      route_path: '/campaigns/spring-launch',
      title: 'Весенний запуск',
      nav_label: 'Весенний запуск',
      nav_group: 'special',
      nav_order: 3,
      show_in_footer: true,
    },
    {
      route_path: '/academy/ai-playbooks',
      title: 'AI Playbooks',
      nav_group: 'resources',
      nav_order: 1,
      show_in_footer: true,
    },
  ];

  const columns = getFooterColumns([], dynamicPages);
  const special = columns.find((column) => column.title === 'Спецразделы');
  const resources = columns.find((column) => column.title === 'Ресурсы');

  assert.ok(special);
  assert.ok(resources);
  assert.ok(special?.links.some((link) => link.href === '/campaigns/spring-launch'));
  assert.ok(resources?.links.some((link) => link.href === '/academy/ai-playbooks'));
  assert.ok(resources?.links.some((link) => link.href === '/docs'));
});

test('getFooterColumns keeps legacy catalog labels short when page_v2 has long SEO labels', () => {
  const columns = getFooterColumns([], [
    {
      route_path: '/channels',
      title: 'Все каналы коммуникации в одном окне',
      nav_label: 'Все каналы коммуникации в одном окне',
      nav_group: 'catalogs',
      nav_order: 1,
      show_in_footer: true,
    },
  ]);

  const catalogs = columns.find((column) => column.title === 'Каталоги');
  const channels = catalogs?.links.find((link) => link.href === '/channels');

  assert.equal(channels?.label, 'Каналы');
});

test('getFooterColumns does not duplicate dynamic footer pages already present in legacy columns', () => {
  const columns = getFooterColumns([], [
    {
      route_path: '/compare',
      title: 'Сравнения Chat Plus',
      nav_label: 'Все сравнения',
      nav_group: 'catalog',
      show_in_footer: true,
    },
  ]);
  const compareLinks = columns
    .flatMap((column) => column.links)
    .filter((link) => link.href === '/compare');

  assert.equal(compareLinks.length, 1);
});

test('getSiteMapGroups includes safe-approved page_v2 sitemap entries once', () => {
  const footerColumns = getFooterColumns([], [
    {
      route_path: '/academy/ai-playbooks',
      title: 'AI Playbooks',
      nav_group: 'resources',
      nav_order: 1,
      show_in_footer: true,
    },
  ]);

  const groups = getSiteMapGroups(footerColumns, [
    {
      route_path: '/academy/ai-playbooks',
      title: 'AI Playbooks',
      nav_group: 'resources',
      nav_order: 1,
      show_in_footer: true,
      show_in_sitemap: true,
    },
    {
      route_path: '/brand/press-kit',
      title: 'Press kit',
      nav_group: 'company',
      nav_order: 2,
      show_in_sitemap: true,
    },
  ]);

  const allLinks = groups.flatMap((group) => group.links);
  const resources = groups.flatMap((group) =>
    group.title === 'Ресурсы' ? group.links : [],
  );

  assert.ok(allLinks.some((link) => link.href === '/brand/press-kit'));
  assert.equal(
    resources.filter((link) => link.href === '/academy/ai-playbooks').length,
    1,
  );
});
