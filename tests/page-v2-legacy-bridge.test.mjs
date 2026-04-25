import assert from 'node:assert/strict';
import test from 'node:test';

import { mapPageV2ToLegacyPage } from '../portal/src/lib/page-v2-legacy-bridge.ts';

test('page_v2 legacy bridge maps campaign page to legacy campaign props', () => {
  const result = mapPageV2ToLegacyPage({
    title: 'Промо Chat Plus',
    seo_title: 'Промо Chat Plus | Chat Plus',
    seo_description: 'Спецстраница промо-оффера.',
    canonical: 'https://chatplus.ru/promo',
    sections: [
      {
        block_type: 'hero',
        eyebrow: 'Спецпроект',
        title: 'Промо Chat Plus',
        subtitle: 'Быстрый запуск нового оффера.',
        primary_label: 'Запросить демо',
        primary_url: '/demo',
        secondary_label: 'Смотреть цены',
        secondary_url: '/pricing',
        trust_facts: ['Запуск за 14 дней'],
        context_title: 'Что внутри',
        context_text: 'Шаблон и rollout под маркетинг и продажи.',
      },
      {
        block_type: 'cards-grid',
        title: 'Что входит',
        items: [
          { title: 'Готовые сценарии', text: 'Шаблоны под канал и сегмент.' },
          { title: 'Сборка под команду', text: 'Контур под продажи и маркетинг.' },
        ],
      },
      {
        block_type: 'steps',
        title: 'Как запускаем',
        intro: 'Понятный production flow.',
        items: [
          { title: 'Снимаем контур', text: 'Понимаем route и CTA path.' },
        ],
      },
      {
        block_type: 'faq',
        title: 'Вопросы',
        items: [{ question: 'Можно быстро?', answer: 'Да.' }],
      },
      {
        block_type: 'internal-links',
        title: 'Что дальше',
        intro: 'Полезные маршруты',
        links: [{ label: 'Pricing', href: '/pricing', description: 'Тарифы' }],
      },
      {
        block_type: 'final-cta',
        title: 'Готовы обсудить запуск?',
        text: 'Покажем rollout plan.',
        primary_label: 'Назначить звонок',
        primary_url: '/demo',
      },
    ],
  }, 'campaign');

  assert.equal(result.meta_title, 'Промо Chat Plus | Chat Plus');
  assert.equal(result.h1, 'Промо Chat Plus');
  assert.equal(result.hero_eyebrow, 'Спецпроект');
  assert.equal(result.features_title, 'Что входит');
  assert.equal(result.features[0].title, 'Готовые сценарии');
  assert.equal(result.solution_title, 'Как запускаем');
  assert.equal(result.faqs[0].question, 'Можно быстро?');
  assert.equal(result.internal_links_title, 'Что дальше');
  assert.equal(result.internal_links_context.preserveTitle, true);
  assert.equal(result.internal_links[0].href, '/pricing');
  assert.equal(result.sticky_cta_primary_url, '/demo');
  assert.equal(result.quote_title, 'Что внутри');
});

test('page_v2 legacy bridge keeps brand problem cards separate from feature cards', () => {
  const result = mapPageV2ToLegacyPage({
    title: 'Video Chat Plus',
    sections: [
      {
        block_type: 'hero',
        title: 'Video Chat Plus',
        subtitle: 'Video content for product scenarios.',
      },
      {
        block_type: 'cards-grid',
        variant: 'problems',
        title: 'What blocks client work',
        intro: 'Problems must render in the left split column.',
        items: [
          { title: 'Requests are split by channel', text: 'Teams miss leads.' },
          { title: 'Slow answers', text: 'Customers leave.' },
        ],
      },
      {
        block_type: 'cards-grid',
        variant: 'editorial',
        title: 'Product proof',
        items: [{ title: 'Video demos', text: 'Show product scenarios.' }],
      },
      {
        block_type: 'steps',
        title: 'How Chat Plus solves it',
        items: [{ title: 'Unified inbox', text: 'Messages are collected in one place.' }],
      },
    ],
  }, 'brand');

  assert.equal(result.problem_title, 'What blocks client work');
  assert.equal(result.problems[0].title, 'Requests are split by channel');
  assert.equal(result.features_title, 'Product proof');
  assert.equal(result.features[0].title, 'Video demos');
  assert.equal(result.solution_title, 'How Chat Plus solves it');
});

test('page_v2 legacy bridge maps pricing page to legacy pricing props', () => {
  const result = mapPageV2ToLegacyPage({
    title: 'Цены Chat Plus',
    seo_title: 'Цены Chat Plus',
    seo_description: 'Тарифы и модель оплаты.',
    sections: [
      {
        block_type: 'hero',
        eyebrow: 'Pricing',
        title: 'Цены Chat Plus',
        subtitle: 'Прозрачная модель оплаты.',
        primary_label: 'Обсудить тариф',
        primary_url: '/demo',
        panel_items: [
          { title: 'Pilot', eyebrow: 'Запуск', secondary_text: '14 дней', text: 'Быстрый старт', icon: 'lucide:rocket' },
        ],
      },
      {
        block_type: 'pricing-plans',
        title: 'Тарифы',
        intro: 'Планы для роста.',
        items: [
          {
            title: 'Growth',
            label: 'Growth',
            price: '49 000 ₽',
            period: '/ мес',
            note: 'Для активной команды',
            text: 'Подходит для production rollout.',
            cta_label: 'Выбрать план',
            icon: 'lucide:rocket',
            kicker: 'Best fit',
            accent: true,
            features: ['Inbox', 'Routing'],
          },
        ],
      },
      {
        block_type: 'proof-stats',
        items: [{ label: 'Без переписывания сайта', value: 'Bridge', description: '' }],
      },
      {
        block_type: 'comparison-table',
        title: 'Что входит',
        option_one_label: 'До',
        option_two_label: 'После',
        option_highlight_label: 'Chat Plus',
        rows: [{ parameter: 'CMS workflow', option_one: 'Базовый', option_two: 'Средний', option_highlight: 'Page-first' }],
      },
      {
        block_type: 'before-after',
        title: 'До и после',
        intro: 'Как меняется команда',
        before_title: 'До',
        after_title: 'После',
        before_items: ['Ручные релизы'],
        after_items: ['Page-first CMS'],
        quote: 'Команда двигается быстрее.',
        quote_author: 'Operations lead',
      },
      {
        block_type: 'faq',
        title: 'Вопросы',
        items: [{ question: 'Можно с пилота?', answer: 'Да.' }],
      },
      {
        block_type: 'final-cta',
        title: 'Нужна помощь с выбором?',
        text: 'Поможем подобрать rollout.',
        primary_label: 'Обсудить тариф',
        primary_url: '/demo',
      },
    ],
  }, 'pricing');

  assert.equal(result.h1, 'Цены Chat Plus');
  assert.equal(result.hero_panel_items[0].value, '14 дней');
  assert.equal(result.pricing_tiers[0].name, 'Growth');
  assert.equal(result.proof_cards[0].title, 'Без переписывания сайта');
  assert.equal(result.proof_cards[0].text, 'Bridge');
  assert.equal(result.comparison_rows[0].chat_plus, 'Page-first');
  assert.equal(result.roi_without_items[0], 'Ручные релизы');
  assert.equal(result.faqs[0].answer, 'Да.');
  assert.equal(result.section_labels.pricing_title, 'Тарифы');
});

test('page_v2 legacy bridge preserves proof values while stripping placeholder labels', () => {
  const result = mapPageV2ToLegacyPage({
    title: 'Home',
    sections: [
      {
        block_type: 'proof-stats',
        variant: 'cards',
        title: 'Page proof',
        items: [
          { label: 'Proof point', value: '15 минут', description: 'Подключение без разработчика' },
          { label: 'Home page proof', value: '24/7', description: 'AI отвечает клиентам' },
        ],
      },
    ],
  }, 'home');

  assert.equal(result.proof_facts.length, 2);
  assert.equal(result.proof_facts[0].value, '15 минут');
  assert.equal(result.proof_facts[0].label, '');
  assert.equal(result.proof_facts[0].text, 'Подключение без разработчика');
  assert.equal(result.proof_facts[1].value, '24/7');
  assert.equal(result.proof_facts[1].label, '');
});

test('page_v2 legacy bridge does not render home hero trust facts twice', () => {
  const result = mapPageV2ToLegacyPage({
    title: 'Home',
    sections: [
      {
        block_type: 'hero',
        title: 'Home',
        trust_facts: [
          'Launch in 15 minutes without a developer',
          'All channels in one inbox',
          'AI answers customers 24/7',
        ],
      },
      {
        block_type: 'proof-stats',
        variant: 'band',
        items: [
          { label: 'Proof point', value: 'Launch in 15 minutes without a developer' },
          { label: 'Proof point', value: 'All channels in one inbox' },
          { label: 'Proof point', value: 'AI answers customers 24/7' },
        ],
      },
    ],
  }, 'home');

  assert.deepEqual(result.hero_trust_facts, [
    'Launch in 15 minutes without a developer',
    'All channels in one inbox',
    'AI answers customers 24/7',
  ]);
  assert.equal(result.proof_facts, undefined);
});

test('page_v2 legacy bridge keeps distinct home proof stats', () => {
  const result = mapPageV2ToLegacyPage({
    title: 'Home',
    sections: [
      {
        block_type: 'hero',
        title: 'Home',
        trust_facts: ['Launch in 15 minutes without a developer'],
      },
      {
        block_type: 'proof-stats',
        variant: 'band',
        items: [{ label: 'ROI', value: '+35%', description: 'More qualified leads' }],
      },
    ],
  }, 'home');

  assert.equal(result.proof_facts.length, 1);
  assert.equal(result.proof_facts[0].value, '+35%');
});

test('page_v2 legacy bridge maps structured page to legacy structured props', () => {
  const result = mapPageV2ToLegacyPage({
    title: 'WhatsApp для beauty',
    seo_title: 'WhatsApp для beauty',
    seo_description: 'Structured detail page.',
    breadcrumbs: [
      { label: 'Главная', href: '/' },
      { label: 'Channels', href: '/channels' },
    ],
    sections: [
      {
        block_type: 'hero',
        eyebrow: 'Channels',
        title: 'WhatsApp для beauty',
        subtitle: 'Коммуникации и автоматизация.',
        primary_label: 'Запросить демо',
        primary_url: '/demo',
        trust_facts: ['Один inbox'],
        panel_items: [
          { title: 'Сценарии', secondary_text: '5', text: 'Под beauty flow', icon: 'lucide:message-circle' },
        ],
      },
      {
        block_type: 'cards-grid',
        title: 'Где болит',
        intro: 'Основные узкие места.',
        items: [{ title: 'Потери заявок', text: 'Нет единого окна.' }],
      },
      {
        block_type: 'feature-list',
        title: 'Что собираем',
        items: [{ title: 'Единый inbox', text: 'Все сообщения вместе.' }],
      },
      {
        block_type: 'steps',
        title: 'Как внедряем',
        intro: 'Пошаговый путь.',
        items: [{ title: 'Подключаем канал', text: 'Ставим контур.' }],
      },
      {
        block_type: 'comparison-table',
        title: 'До и после',
        rows: [{ parameter: 'Скорость', option_one: 'Низкая', option_two: 'Средняя', option_highlight: 'Высокая' }],
      },
      {
        block_type: 'before-after',
        title: 'ROI',
        before_title: 'Без системы',
        after_title: 'С системой',
        before_items: ['Хаос'],
        after_items: ['Порядок'],
      },
      {
        block_type: 'internal-links',
        title: 'Дальше',
        links: [{ label: 'Pricing', href: '/pricing', description: 'Тарифы' }],
      },
      {
        block_type: 'faq',
        title: 'FAQ',
        items: [{ question: 'Можно быстро?', answer: 'Да.' }],
      },
      {
        block_type: 'final-cta',
        title: 'Готовы стартовать?',
        primary_label: 'Обсудить',
        primary_url: '/demo',
      },
    ],
  }, 'structured');

  assert.equal(result.h1, 'WhatsApp для beauty');
  assert.equal(result.problem_title, 'Где болит');
  assert.equal(result.problems[0].text, 'Нет единого окна.');
  assert.equal(result.features_title, 'Что собираем');
  assert.equal(result.solution_title, 'Как внедряем');
  assert.equal(result.comparison_rows[0].chat_plus, 'Высокая');
  assert.equal(result.roi_with_items[0], 'Порядок');
  assert.equal(result.internal_links[0].href, '/pricing');
  assert.equal(result.breadcrumbs[1].href, '/channels');
});

test('page_v2 legacy bridge maps directory page to legacy directory props', () => {
  const result = mapPageV2ToLegacyPage({
    title: 'Solutions',
    seo_title: 'Solutions | Chat Plus',
    seo_description: 'Каталог решений.',
    sections: [
      {
        block_type: 'hero',
        title: 'Solutions',
        subtitle: 'Каталог решений под разные сценарии.',
        primary_label: 'Запросить демо',
        primary_url: '/demo',
      },
      {
        block_type: 'cards-grid',
        items: [
          {
            href: '/solutions/tenders',
            title: 'Tenders',
            text: 'Автоматизация заявок и тендеров.',
            icon: 'lucide:briefcase',
            cta_label: 'Смотреть решение',
          },
        ],
      },
      {
        block_type: 'final-cta',
        title: 'Нужен подбор решения?',
        text: 'Поможем собрать контур.',
        primary_label: 'Связаться',
        primary_url: '/demo',
      },
    ],
  }, 'directory');

  assert.equal(result.metaTitle, 'Solutions | Chat Plus');
  assert.equal(result.title, 'Solutions');
  assert.equal(result.items[0].href, '/solutions/tenders');
  assert.equal(result.items[0].ctaLabel, 'Смотреть решение');
  assert.equal(result.stickyPrimaryUrl, '/demo');
});

test('page_v2 legacy bridge maps comparison page to legacy comparison props', () => {
  const result = mapPageV2ToLegacyPage({
    title: 'amoCRM vs Chat Plus',
    seo_title: 'amoCRM vs Chat Plus',
    seo_description: 'Сравнение amoCRM и Chat Plus.',
    sections: [
      {
        block_type: 'hero',
        eyebrow: 'Vs',
        title: 'amoCRM vs Chat Plus',
        subtitle: 'Разбираем отличия по внедрению и ownership.',
        primary_label: 'Запросить демо',
        primary_url: '/demo',
        context_title: 'Executive summary',
        context_text: 'Chat Plus быстрее доводится до production.',
      },
      {
        block_type: 'cards-grid',
        items: [
          { title: 'Быстрее rollout', text: 'Route-level approval без big-bang cutover.' },
          { title: 'Page ownership', text: 'Страница живёт в Strapi, а макет сохраняется.' },
        ],
      },
      {
        block_type: 'steps',
        title: 'Как сравнивать',
        items: [{ title: 'Снять baseline', text: 'Сначала parity на старом макете.' }],
      },
      {
        block_type: 'comparison-table',
        title: 'Матрица',
        option_one_label: 'Старый контур',
        option_two_label: 'Промежуточный',
        option_highlight_label: 'Chat Plus',
        rows: [{ parameter: 'Ownership', option_one: 'Шаблон', option_two: 'Смешанно', option_highlight: 'Page-first' }],
      },
      {
        block_type: 'faq',
        items: [{ question: 'Можно без поломки?', answer: 'Да, через legacy bridge.' }],
      },
      {
        block_type: 'internal-links',
        links: [{ label: 'Compare', href: '/compare', description: 'Все сравнения' }],
      },
      {
        block_type: 'final-cta',
        title: 'Готовы обсудить?',
        primary_label: 'Поговорить',
        primary_url: '/demo',
      },
    ],
  }, 'comparison');

  assert.equal(result.h1, 'amoCRM vs Chat Plus');
  assert.equal(result.compare_summary, 'Chat Plus быстрее доводится до production.');
  assert.equal(result.compare_points[0], 'Быстрее rollout');
  assert.equal(result.comparison_rows[0].chat_plus, 'Page-first');
  assert.equal(result.section_labels.comparison_option_one, 'Старый контур');
  assert.equal(result.internal_links[0].href, '/compare');
});

test('page_v2 legacy bridge deduplicates related links and removes current comparison page', () => {
  const result = mapPageV2ToLegacyPage({
    route_path: '/compare/respond-io',
    title: 'Respond.io',
    sections: [
      {
        block_type: 'hero',
        title: 'Chat Plus vs Respond.io',
      },
      {
        block_type: 'related-links',
        title: 'Соседние сравнения',
        links: [
          { label: 'Сравнения', href: '/compare' },
          { label: 'Respond.io vs Chat Plus', href: '/compare/respond-io', description: 'Текущая страница' },
        ],
      },
      {
        block_type: 'internal-links',
        title: 'Соседние сравнения',
        links: [
          { label: 'Все сравнения', href: '/compare' },
          { label: 'Respond.io vs Chat Plus', href: '/compare/respond-io', description: 'Текущая страница' },
          { label: 'Intercom vs Chat Plus', href: '/compare/intercom', description: 'Соседнее сравнение' },
        ],
      },
    ],
  }, 'comparison');

  assert.deepEqual(
    result.internal_links.map((item) => [item.label, item.href]),
    [
      ['Все сравнения', '/compare'],
      ['Intercom vs Chat Plus', '/compare/intercom'],
    ],
  );
});

test('page_v2 legacy bridge removes alternate vs route for current comparison page', () => {
  const result = mapPageV2ToLegacyPage({
    route_path: '/compare/respond-io',
    title: 'Respond.io',
    sections: [
      {
        block_type: 'internal-links',
        links: [
          { label: 'Respond.io vs Chat Plus', href: '/vs/respond-io', description: 'Та же страница в коротком формате' },
          { label: 'Intercom vs Chat Plus', href: '/compare/intercom', description: 'Соседнее сравнение' },
        ],
      },
    ],
  }, 'comparison');

  assert.deepEqual(result.internal_links.map((item) => item.href), ['/compare/intercom']);
});
test('page_v2 legacy bridge maps comparison directory page to legacy compare index props', () => {
  const result = mapPageV2ToLegacyPage({
    title: 'РЎСЂР°РІРЅРµРЅРёСЏ Chat Plus',
    seo_title: 'РЎСЂР°РІРЅРµРЅРёСЏ Chat Plus',
    seo_description: 'Р’СЃРµ compare Рё vs РјР°СЂС€СЂСѓС‚С‹.',
    sections: [
      {
        block_type: 'hero',
        eyebrow: 'РЎСЂР°РІРЅРµРЅРёСЏ',
        title: 'РЎСЂР°РІРЅРµРЅРёСЏ Chat Plus',
        subtitle: 'Р”РІР° С„РѕСЂРјР°С‚Р° comparison pages.',
      },
      {
        block_type: 'cards-grid',
        title: 'РџРѕРґСЂРѕР±РЅС‹Рµ СЃСЂР°РІРЅРµРЅРёСЏ',
        intro: 'Р Р°Р·РІРµСЂРЅСѓС‚С‹Рµ compare pages.',
        items: [
          { title: 'Chat Plus vs Intercom', href: '/compare/intercom', text: 'РџРѕРґСЂРѕР±РЅРѕРµ СЃСЂР°РІРЅРµРЅРёРµ', cta_label: 'РЎРјРѕС‚СЂРµС‚СЊ compare' },
        ],
      },
      {
        block_type: 'internal-links',
        title: 'Р¤РѕСЂРјР°С‚ vs',
        intro: 'РљРѕСЂРѕС‚РєРёРµ vs pages.',
        links: [
          { label: 'Intercom РёР»Рё Chat Plus', href: '/vs/intercom', description: 'РљРѕСЂРѕС‚РєРёР№ vs РјР°СЂС€СЂСѓС‚' },
          { label: 'Zendesk РёР»Рё Chat Plus', href: '/vs/zendesk', description: 'Р•С‰С‘ РѕРґРёРЅ vs РјР°СЂС€СЂСѓС‚' },
        ],
      },
    ],
  }, 'comparison_directory');

  assert.equal(result.metaTitle, 'РЎСЂР°РІРЅРµРЅРёСЏ Chat Plus');
  assert.equal(result.title, 'РЎСЂР°РІРЅРµРЅРёСЏ Chat Plus');
  assert.equal(result.compareSectionTitle, 'РџРѕРґСЂРѕР±РЅС‹Рµ СЃСЂР°РІРЅРµРЅРёСЏ');
  assert.equal(result.compareCards[0].href, '/compare/intercom');
  assert.equal(result.vsSectionTitle, 'Р¤РѕСЂРјР°С‚ vs');
  assert.equal(result.vsCards[0].href, '/vs/intercom');
});

test('page_v2 legacy bridge maps site map page hero metadata to legacy site-map props', () => {
  const result = mapPageV2ToLegacyPage({
    title: 'РљР°СЂС‚Р° СЃР°Р№С‚Р°',
    seo_title: 'РљР°СЂС‚Р° СЃР°Р№С‚Р°',
    seo_description: 'Р‘С‹СЃС‚СЂС‹Р№ РґРѕСЃС‚СѓРї РєРѕ РІСЃРµРј СЂР°Р·РґРµР»Р°Рј.',
    canonical: 'https://chatplus.ru/site-map',
    sections: [
      {
        block_type: 'hero',
        eyebrow: 'РЎС‚СЂСѓРєС‚СѓСЂР° СЃР°Р№С‚Р°',
        title: 'РљР°СЂС‚Р° СЃР°Р№С‚Р°',
        subtitle: 'Р’СЃРµ РєР»СЋС‡РµРІС‹Рµ СЂР°Р·РґРµР»С‹ РІ РѕРґРЅРѕРј РјРµСЃС‚Рµ.',
      },
    ],
  }, 'site_map');

  assert.equal(result.metaTitle, 'РљР°СЂС‚Р° СЃР°Р№С‚Р°');
  assert.equal(result.metaDescription, 'Р‘С‹СЃС‚СЂС‹Р№ РґРѕСЃС‚СѓРї РєРѕ РІСЃРµРј СЂР°Р·РґРµР»Р°Рј.');
  assert.equal(result.eyebrow, 'РЎС‚СЂСѓРєС‚СѓСЂР° СЃР°Р№С‚Р°');
  assert.equal(result.heading, 'РљР°СЂС‚Р° СЃР°Р№С‚Р°');
  assert.equal(result.subtitle, 'Р’СЃРµ РєР»СЋС‡РµРІС‹Рµ СЂР°Р·РґРµР»С‹ РІ РѕРґРЅРѕРј РјРµСЃС‚Рµ.');
});

test('page_v2 legacy bridge maps ai calendar page to legacy ai-calendar props', () => {
  const result = mapPageV2ToLegacyPage({
    title: 'AI РљР°Р»РµРЅРґР°СЂСЊ',
    seo_title: 'AI РљР°Р»РµРЅРґР°СЂСЊ',
    seo_description: 'РЎРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ Р·Р°РїРёСЃРµР№ РёР· С‡Р°С‚Р°.',
    sections: [
      {
        block_type: 'hero',
        eyebrow: 'Р¤Р»Р°РіРјР°РЅСЃРєР°СЏ С„СѓРЅРєС†РёСЏ',
        title: 'AI РљР°Р»РµРЅРґР°СЂСЊ',
        subtitle: 'РЎРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ Р·Р°РїРёСЃРµР№ РёР· Р»СЋР±РѕРіРѕ С‡Р°С‚Р°.',
        primary_label: 'РџРѕРїСЂРѕР±РѕРІР°С‚СЊ Р±РµСЃРїР»Р°С‚РЅРѕ',
        primary_url: '/demo',
        secondary_label: 'РљР°Рє СЌС‚Рѕ СЂР°Р±РѕС‚Р°РµС‚',
        secondary_url: '#how-it-works',
      },
      {
        block_type: 'steps',
        title: 'РњР°РіРёСЏ Р°РІС‚РѕРјР°С‚РёР·Р°С†РёРё',
        intro: '6 С€Р°РіРѕРІ РѕС‚ СЃРѕРѕР±С‰РµРЅРёСЏ РґРѕ Р·Р°РїРёСЃРё.',
        items: [
          { title: 'РљР»РёРµРЅС‚ РїРёС€РµС‚', text: 'Р—Р°СЏРІРєР° РІ С‡Р°С‚Рµ.', icon: 'lucide:message-circle' },
        ],
      },
      {
        block_type: 'feature-list',
        title: 'Р Р°Р±РѕС‚Р°РµС‚ СЃ РІР°С€РёРј СЂР°СЃРїРёСЃР°РЅРёРµРј',
        intro: 'Google Calendar, Outlook Рё CRM.',
        items: [
          { title: 'Google Calendar', text: 'Р”РІСѓСЃС‚РѕСЂРѕРЅРЅСЏСЏ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ', icon: 'simple-icons:googlecalendar' },
        ],
      },
      {
        block_type: 'cards-grid',
        title: 'РРґРµР°Р»СЊРЅРѕ РґР»СЏ Р±РёР·РЅРµСЃР° СѓСЃР»СѓРі',
        items: [
          { title: 'РЎР°Р»РѕРЅС‹ РєСЂР°СЃРѕС‚С‹', text: 'РђРІС‚РѕРјР°С‚РёР·Р°С†РёСЏ Р·Р°РїРёСЃРё', icon: 'lucide:scissors' },
        ],
      },
      {
        block_type: 'final-cta',
        title: 'Р“РѕС‚РѕРІС‹ Р°РІС‚РѕРјР°С‚РёР·РёСЂРѕРІР°С‚СЊ Р·Р°РїРёСЃРё?',
        text: 'РџРѕСЃС‚СЂРѕР№С‚Рµ Р±РµСЃС€РѕРІРЅС‹Р№ РїСЂРѕС†РµСЃСЃ.',
        primary_label: 'Р—Р°РїРёСЃР°С‚СЊСЃСЏ РЅР° РґРµРјРѕ',
        primary_url: '/demo',
        secondary_label: 'РЎРјРѕС‚СЂРµС‚СЊ С†РµРЅС‹',
        secondary_url: '/pricing',
      },
    ],
  }, 'ai_calendar');

  assert.equal(result.title, 'AI РљР°Р»РµРЅРґР°СЂСЊ');
  assert.equal(result.description, 'РЎРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ Р·Р°РїРёСЃРµР№ РёР· С‡Р°С‚Р°.');
  assert.equal(result.primaryLabel, 'РџРѕРїСЂРѕР±РѕРІР°С‚СЊ Р±РµСЃРїР»Р°С‚РЅРѕ');
  assert.equal(result.steps[0].title, 'РљР»РёРµРЅС‚ РїРёС€РµС‚');
  assert.equal(result.integrations[0].title, 'Google Calendar');
  assert.equal(result.industries[0].name, 'РЎР°Р»РѕРЅС‹ РєСЂР°СЃРѕС‚С‹');
  assert.equal(result.finalPrimaryUrl, '/demo');
  assert.equal(result.finalSecondaryUrl, '/pricing');
});
