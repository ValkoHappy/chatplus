import assert from 'node:assert/strict';
import test from 'node:test';

import { adaptCompetitorPage, adaptDirectoryPage } from '../portal/src/lib/page-adapters.ts';

test('adaptDirectoryPage returns the expected card shape through the public facade', () => {
  const page = adaptDirectoryPage(
    'channels',
    {
      page_templates: {
        directories: {
          channels: {
            meta_title: 'Channels',
            meta_description: 'Channels description',
            h1: 'Channels',
            subtitle: 'Choose a channel',
            hero_cta_primary_label: 'Book demo',
            hero_cta_primary_url: '/demo',
            base_path: '/channels',
            card_cta_label: '',
            sticky_cta_title: 'Need help?',
            sticky_cta_text: 'We will help you choose a channel.',
            sticky_cta_primary_label: 'Talk to us',
            sticky_cta_primary_url: '/demo',
          },
        },
      },
    },
    [
      {
        name: 'WhatsApp',
        slug: 'whatsapp',
        description: 'Main messaging channel for inbound sales.',
        icon: 'simple-icons:whatsapp',
      },
    ],
  );

  assert.equal(page.title, 'Channels');
  assert.equal(page.items[0].href, '/channels/whatsapp');
  assert.equal(page.items[0].ctaLabel, 'Подключить WhatsApp');
  assert.equal(page.stickyPrimaryUrl, '/demo');
});

test('adaptCompetitorPage preserves generated comparison fields and CTA payload', () => {
  const page = adaptCompetitorPage(
    {
      slug: 'respond-io',
      name: 'Respond.io',
      hero_eyebrow: 'Comparison',
      hero_description: 'Compare Chat Plus with Respond.io.',
      compare_summary: 'Chat Plus launches faster and costs less.',
      compare_points: ['Lower total cost', 'Better AI workflows'],
      strengths_title: 'Why teams move to Chat Plus',
      advantages_title: 'Why teams move to Chat Plus',
      advantages_intro: 'The switch is usually about speed and control.',
      weaknesses_title: 'Where Respond.io is weaker',
      final_cta_title: 'Switch from Respond.io',
      final_cta_text: 'We will migrate your workflows.',
      final_cta_label: 'Book migration demo',
      sticky_cta_title: 'Switch from Respond.io',
      sticky_cta_text: 'We will migrate your workflows.',
      price: '$79',
      our_price: '$39',
      competitor_price_caption: 'Starts from $79',
      pricing_title: 'Pricing comparison',
      section_labels: {
        compare_badge: 'Comparison',
        comparison_parameter: 'Parameter',
        comparison_option_one: 'Respond.io',
        comparison_option_two: 'Typical setup',
        comparison_chat_plus: 'Chat Plus',
      },
      our_strengths: ['Single inbox', 'Lower cost'],
      weaknesses: ['Higher setup cost'],
      faq_title: 'FAQ',
    },
    {
      settings: {
        page_templates: {
          details: {
            compare: {
              meta_title: 'Chat Plus vs {name}',
              h1: 'Chat Plus vs {name}',
              hero_eyebrow: 'Comparison',
              problem_title: 'Weak spots',
              solution_title: 'Why Chat Plus',
              faq_title: 'FAQ',
              comparison_title: 'Pricing',
              price_parameter_label: 'Price',
              model_parameter_label: 'Model',
              model_option_one: 'Vendor tooling',
              model_option_two: 'Typical stack',
              model_chat_plus: 'Unified platform',
              internal_links_title: 'Other comparisons',
            },
          },
        },
      },
      competitors: [
        { slug: 'respond-io', name: 'Respond.io', hero_description: 'Current page' },
        { slug: 'intercom', name: 'Intercom', hero_description: 'Intercom comparison' },
      ],
    },
    'compare',
  );

  assert.equal(page.meta_title, 'Chat Plus vs Respond.io');
  assert.equal(page.problem_intro, 'Chat Plus launches faster and costs less.');
  assert.deepEqual(page.compare_points, ['Lower total cost', 'Better AI workflows']);
  assert.equal(page.sticky_cta_primary_label, 'Book migration demo');
  assert.equal(page.internal_links[0].href, '/compare/intercom');
});
