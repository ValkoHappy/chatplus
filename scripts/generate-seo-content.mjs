import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error("\n❌ ОШИБКА: Не найден ключ OPENAI_API_KEY!");
  console.error("1. Создайте файл .env в корне проекта");
  console.error("2. Добавьте строку: OPENAI_API_KEY=sk-xxxxxx");
  console.error("3. Запустите скрипт через: node --env-file=.env scripts/generate-seo-content.mjs\n");
  process.exit(1);
}

// Убедимся, что папка для сгенерированных данных существует
mkdirSync(resolve('cms/seed/generated'), { recursive: true });

async function callOpenAI(systemPrompt, userPrompt) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Используем быструю и дешевую модель для 100+ страниц
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`OpenAI API Error: ${JSON.stringify(data)}`);
  }
  return JSON.parse(data.choices[0].message.content);
}

const BASE_PROMPT = `
Ты профессиональный B2B маркетолог и копирайтер для 'Chat Plus' (SaaS платформа омниканальных мессенджеров и AI-автоматизации). 
Мы позиционируемся дорого, современно, через "Ценность" (Chat + Value).
Сгенерируй мощный, высококонверсионный SEO текст посадочной страницы.
Формат ответа СТРОГО валидный JSON-объект:
{
  "h1": "Chat Plus для [Тема]",
  "subtitle": "Сильный подзаголовок (до 15 слов)",
  "problem_title": "Почему [Тема] теряет клиентов в мессенджерах",
  "problem_intro": "Короткая подводка",
  "problems": [{ "title": "Проблема 1", "text": "Описание" }, { "title": "Проблема 2", "text": "Описание" }, { "title": "Проблема 3", "text": "Описание" }],
  "solution_title": "Решение с Chat Plus",
  "solution_intro": "Короткая подводка",
  "solution_steps": [{ "title": "Решение 1", "text": "Описание" }, { "title": "Решение 2", "text": "Описание" }, { "title": "Решение 3", "text": "Описание" }],
  "features_title": "Инструменты для [Тема]",
  "features": [{ "title": "", "text": "" }, ... от 4 до 6 фичей мастхэв],
  "roi_title": "Честный результат",
  "roi_without_items": ["Хаос в заявках", "...", "..."],
  "roi_with_items": ["Система и порядок", "...", "..."],
  "roi_quote": "Мощная цитата от лица директора",
  "faqs": [{ "question": "...", "answer": "..." }, ... 3 пункта FAQ],
  "sticky_cta_title": "Готовы запустить Chat Plus?",
  "sticky_cta_text": "Оставьте заявку на бесплатное демо, и мы настроим процессы за 2 часа."
}
`;

async function processCollection(filename, collectionName) {
  console.log(`\n🚀 Начинаем генерацию для: ${collectionName}`);
  const items = JSON.parse(readFileSync(resolve(`cms/seed/${filename}`), 'utf-8'));
  const generatedItems = [];
  
  for (const item of items) {
    console.log(`⏳ Генерируем SEO для: ${item.name}...`);
    try {
      const userPrompt = `Создай лендинг для: ${collectionName} -> ${item.name}`;
      const content = await callOpenAI(BASE_PROMPT, userPrompt);
      
      const enhanced = { ...item, ...content };
      generatedItems.push(enhanced);
      
      // Сохраняем после каждой успешной генерации, чтобы не потерять прогресс
      writeFileSync(resolve(`cms/seed/generated/${filename}`), JSON.stringify(generatedItems, null, 2));
      console.log(`✅ Успешно сохранено: ${item.name}`);
    } catch (e) {
      console.error(`❌ Ошибка генерации ${item.name}:`, e.message);
    }
  }
}

async function main() {
  // Список коллекций для генерации
  await processCollection('industries.json', 'Отрасль (Industry)');
  // Позже мы можем раскомментировать остальные коллекции для массовой генерации:
  // await processCollection('channels.json', 'Канал мессенджеров (Channel)');
  // await processCollection('businessTypes.json', 'Тип бизнеса (B2B/B2C/E-commerce)');
  // await processCollection('solutions.json', 'Жизненный сценарий (Решение)');
  
  console.log('\n🎉 Генерация завершена! Тексты лежат в cms/seed/generated/.');
  console.log('Теперь достаточно запустить: node scripts/seed-runtime-content.mjs');
}

main().catch(console.error);
