/**
 * Chat Plus — генератор контента через Claude API
 * Запуск: node generate-content.js
 *
 * Что делает:
 * 1. Берёт список страниц (каналы, отрасли, интеграции)
 * 2. Отправляет в Claude API запрос на генерацию текста
 * 3. Заливает результат в Strapi через REST API
 */

import Anthropic from "@anthropic-ai/sdk";

const STRAPI_URL = "http://localhost:1337";
const STRAPI_TOKEN = process.env.STRAPI_TOKEN; // задать в .env
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY; // задать в .env

const client = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ============================================================
// Данные для генерации
// ============================================================

const pages = [
  // Каналы
  { type: "channel", slug: "whatsapp", name: "WhatsApp" },
  { type: "channel", slug: "telegram", name: "Telegram" },
  { type: "channel", slug: "viber", name: "Viber" },
  { type: "channel", slug: "instagram", name: "Instagram" },
  { type: "channel", slug: "sms", name: "SMS" },

  // Отрасли
  { type: "industry", slug: "beauty", name: "салонов красоты" },
  { type: "industry", slug: "med", name: "медицинских клиник" },
  { type: "industry", slug: "fitness", name: "фитнес-клубов" },
  { type: "industry", slug: "horeca", name: "ресторанов и отелей" },
  { type: "industry", slug: "real-estate", name: "агентств недвижимости" },

  // Интеграции
  { type: "integration", slug: "amocrm", name: "AmoCRM" },
  { type: "integration", slug: "bitrix24", name: "Bitrix24" },
  { type: "integration", slug: "altegio", name: "Altegio" },
  { type: "integration", slug: "google-calendar", name: "Google Calendar" },
];

// ============================================================
// Промпты для Claude
// ============================================================

function buildPrompt(page) {
  const prompts = {
    channel: `Ты SEO-копирайтер для SaaS-продукта Chat Plus — омниканальной платформы для бизнеса.
Напиши SEO-оптимизированный текст для страницы "Chat Plus ${page.name}".

Chat Plus — это платформа, которая объединяет все мессенджеры в одном окне, добавляет AI-агентов и автоматически создаёт записи в календаре из переписки.
Цена от $49/мес — в 2-5 раз дешевле Intercom и Zendesk.

Верни JSON строго в таком формате:
{
  "hero_title": "заголовок H1, около 8-10 слов, с ключевым словом",
  "hero_subtitle": "подзаголовок 2-3 предложения, объясняет ценность",
  "section1_title": "заголовок секции с проблемой",
  "section1_text": "2-3 абзаца о проблеме бизнеса, которую решает ${page.name} в связке с Chat Plus",
  "section2_title": "заголовок секции с решением",
  "section2_text": "2-3 абзаца о том как Chat Plus + ${page.name} решает проблему",
  "faq": [
    {"q": "вопрос 1", "a": "ответ 1"},
    {"q": "вопрос 2", "a": "ответ 2"},
    {"q": "вопрос 3", "a": "ответ 3"},
    {"q": "вопрос 4", "a": "ответ 4"},
    {"q": "вопрос 5", "a": "ответ 5"}
  ],
  "meta_title": "SEO title до 60 символов",
  "meta_description": "SEO description до 160 символов"
}`,

    industry: `Ты SEO-копирайтер для SaaS-продукта Chat Plus — омниканальной платформы для бизнеса.
Напиши SEO-оптимизированный текст для страницы "Chat Plus для ${page.name}".

Chat Plus — платформа которая: автоматически записывает клиентов из WhatsApp/Telegram в CRM/Altegio,
отправляет напоминания, AI отвечает на вопросы 24/7. Цена от $49/мес.

Верни JSON строго в таком формате:
{
  "hero_title": "заголовок H1 для ${page.name}, около 8-10 слов",
  "hero_subtitle": "подзаголовок 2-3 предложения с конкретной пользой для ${page.name}",
  "pain_title": "заголовок: Проблемы которые решает Chat Plus",
  "pain_text": "2-3 абзаца о болях ${page.name} без автоматизации",
  "solution_title": "заголовок: Как Chat Plus помогает ${page.name}",
  "solution_text": "2-3 абзаца конкретного решения с примерами",
  "roi_text": "1 абзац об экономии и ROI для ${page.name}",
  "faq": [
    {"q": "вопрос 1", "a": "ответ 1"},
    {"q": "вопрос 2", "a": "ответ 2"},
    {"q": "вопрос 3", "a": "ответ 3"},
    {"q": "вопрос 4", "a": "ответ 4"},
    {"q": "вопрос 5", "a": "ответ 5"}
  ],
  "meta_title": "SEO title до 60 символов",
  "meta_description": "SEO description до 160 символов"
}`,

    integration: `Ты SEO-копирайтер для SaaS-продукта Chat Plus — омниканальной платформы для бизнеса.
Напиши SEO-оптимизированный текст для страницы "Chat Plus + ${page.name}".

Chat Plus интегрируется с ${page.name}: все переписки из WhatsApp, Telegram, Instagram
автоматически попадают в ${page.name}. Лиды создаются сами, история сохраняется.

Верни JSON строго в таком формате:
{
  "hero_title": "заголовок H1 про интеграцию Chat Plus + ${page.name}",
  "hero_subtitle": "подзаголовок 2-3 предложения о пользе интеграции",
  "how_it_works": "2-3 абзаца как работает интеграция пошагово",
  "benefits": ["польза 1", "польза 2", "польза 3", "польза 4", "польза 5"],
  "faq": [
    {"q": "вопрос 1", "a": "ответ 1"},
    {"q": "вопрос 2", "a": "ответ 2"},
    {"q": "вопрос 3", "a": "ответ 3"},
    {"q": "вопрос 4", "a": "ответ 4"},
    {"q": "вопрос 5", "a": "ответ 5"}
  ],
  "meta_title": "SEO title до 60 символов",
  "meta_description": "SEO description до 160 символов"
}`,
  };

  return prompts[page.type];
}

// ============================================================
// Генерация через Claude API
// ============================================================

async function generateContent(page) {
  console.log(`📝 Генерирую: ${page.type}/${page.slug}...`);

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: buildPrompt(page),
      },
    ],
  });

  const text = message.content[0].text;

  // Извлекаем JSON из ответа
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Нет JSON в ответе для ${page.slug}`);

  return JSON.parse(jsonMatch[0]);
}

// ============================================================
// Загрузка в Strapi
// ============================================================

async function uploadToStrapi(page, content) {
  const endpoint = `${STRAPI_URL}/api/${page.type}s`;

  const body = {
    data: {
      slug: page.slug,
      name: page.name,
      content: JSON.stringify(content),
      meta_title: content.meta_title,
      meta_description: content.meta_description,
      publishedAt: new Date().toISOString(),
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Strapi error для ${page.slug}: ${err}`);
  }

  console.log(`✅ Загружено: ${page.type}/${page.slug}`);
}

// ============================================================
// Основной цикл
// ============================================================

async function main() {
  console.log(`🚀 Chat Plus Content Generator`);
  console.log(`📄 Страниц для генерации: ${pages.length}\n`);

  for (const page of pages) {
    try {
      const content = await generateContent(page);
      // await uploadToStrapi(page, content); // раскомментировать когда Strapi готов

      // Пока сохраняем локально
      const fs = await import("fs");
      const dir = `./generated/${page.type}`;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        `${dir}/${page.slug}.json`,
        JSON.stringify(content, null, 2),
        "utf-8"
      );

      // Пауза чтобы не превысить rate limit
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`❌ Ошибка ${page.slug}:`, err.message);
    }
  }

  console.log(`\n✨ Готово! Проверь папку ./generated/`);
}

main();
