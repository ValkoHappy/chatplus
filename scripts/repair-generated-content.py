import json
from pathlib import Path

try:
    from ftfy import fix_text
except ImportError as exc:
    raise SystemExit(
        "ftfy is required for this repair script. Install it with `python -m pip install ftfy`."
    ) from exc


ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    ROOT / "cms" / "seed" / "generated" / "landingPages.json",
    ROOT / "cms" / "seed" / "generated" / "siteSetting.json",
]
LANDING_PAGE_SCHEMA = ROOT / "cms" / "src" / "api" / "landing-page" / "content-types" / "landing-page" / "schema.json"

LEGACY_TITLE_REPLACEMENTS = {
    "Смежные страницы": "Что еще посмотреть",
    "Готовые страницы и сценарии": "Что еще посмотреть",
    "Related pages": "What else to explore",
}


def repair_string(value: str) -> str:
    fixed = value
    for _ in range(3):
        candidate = fix_text(fixed)
        if candidate == fixed:
            break
        fixed = candidate

    fixed = LEGACY_TITLE_REPLACEMENTS.get(fixed, fixed)
    return fixed


def repair_node(node):
    if isinstance(node, dict):
        return {key: repair_node(value) for key, value in node.items()}
    if isinstance(node, list):
        return [repair_node(item) for item in node]
    if isinstance(node, str):
        return repair_string(node)
    return node


def apply_landing_page_overrides(pages: list[dict]) -> list[dict]:
    allowed_keys = None
    if LANDING_PAGE_SCHEMA.exists():
        schema = json.loads(LANDING_PAGE_SCHEMA.read_text(encoding="utf-8"))
        allowed_keys = set(schema.get("attributes", {}).keys()) | {"id"}

    for index, page in enumerate(pages):
        if allowed_keys is not None:
            page = {key: value for key, value in page.items() if key in allowed_keys}

        slug = page.get("slug")

        use_cases = page.get("use_cases")
        if isinstance(use_cases, list):
            normalized_use_cases = []
            for item in use_cases:
                if isinstance(item, dict):
                    normalized_item = dict(item)
                    if "title" in normalized_item and "audience" not in normalized_item:
                        normalized_item["audience"] = normalized_item.pop("title")
                    normalized_use_cases.append(normalized_item)
                else:
                    normalized_use_cases.append(item)
            page["use_cases"] = normalized_use_cases

        if slug == "blog":
            page.update(
                {
                    "problem_title": "Почему блог не должен превращаться в архив случайных публикаций",
                    "problem_intro": "Контентный раздел полезен только тогда, когда помогает быстрее понять продукт, увидеть рабочие кейсы и перейти к следующему осмысленному шагу.",
                    "solution_title": "Как блог Chat Plus работает на продукт и продажи",
                    "solution_intro": "Мы используем блог как рабочий слой для кейсов, гайдов и разборов, который помогает маркетингу, presale и клиентским командам говорить на одном языке.",
                    "features_title": "Что дает блог Chat Plus",
                    "integrations_title": "О каких каналах и инструментах пишем в блоге",
                    "roi_title": "Какую пользу блог приносит команде",
                    "roi_intro": "Хороший контентный раздел сокращает путь от интереса к доверию: читатель быстрее понимает, как Chat Plus решает реальные задачи бизнеса.",
                    "roi_without_items": [
                        "Статьи не связаны между собой и не формируют рабочий маршрут по продукту",
                        "Команда каждый раз заново объясняет одни и те же сценарии на созвонах",
                        "Читатель получает интерес, но не понимает, что делать дальше",
                    ],
                    "roi_with_items": [
                        "Блог ведет к реальным use case и связанным страницам продукта",
                        "Кейсы и гайды помогают presale и marketing говорить увереннее",
                        "После чтения статьи есть понятный переход к демо, pricing или документации",
                    ],
                    "roi_quote": "Блог полезен тогда, когда помогает не просто читать, а быстрее принимать решение и видеть рабочие сценарии Chat Plus.",
                    "faq_title": "Вопросы о блоге Chat Plus",
                    "internal_links_title": "Что еще посмотреть",
                    "problems": [
                        {
                            "title": "Слишком много шума вместо практики",
                            "text": "Если блог наполнен случайными публикациями, он перестает работать как продуктовый ресурс и не помогает пользователю быстро сориентироваться.",
                        },
                        {
                            "title": "Нет связи с реальными сценариями",
                            "text": "Читатель видит материалы, но не понимает, как они соотносятся с демо, интеграциями, ценами и запуском в своей команде.",
                        },
                        {
                            "title": "Контент не доводит до действия",
                            "text": "Когда после статьи нет ясного маршрута дальше, интерес гаснет и ценность контента теряется уже на следующем экране.",
                        },
                    ],
                    "solution_steps": [
                        {
                            "title": "Пишем о реальных задачах бизнеса",
                            "text": "В центре внимания не абстрактные советы, а кейсы, разборы и сценарии автоматизации, которые можно применить в продажах, поддержке и маркетинге.",
                        },
                        {
                            "title": "Связываем контент с продуктовым маршрутом",
                            "text": "Каждая статья должна логично вести к следующему шагу: демо, документации, отраслевому сценарию или нужной интеграции.",
                        },
                        {
                            "title": "Помогаем быстрее принять решение",
                            "text": "Блог работает как слой доверия: показывает практику, снимает вопросы и объясняет, как Chat Plus встраивается в рабочий процесс команды.",
                        },
                    ],
                    "features": [
                        {
                            "title": "Практические кейсы и разборы",
                            "text": "Материалы строятся вокруг реальных процессов: входящие обращения, CRM, AI-автоматизация, рассылки и омниканальные сценарии.",
                        },
                        {
                            "title": "Понятная связка с продуктом",
                            "text": "Читатель не теряется между статьями: блог связан с демо, документацией, страницами решений и сценариями для отраслей.",
                        },
                        {
                            "title": "Контент для presale и marketing",
                            "text": "Материалы можно использовать и как публичный контент, и как рабочий слой для прогрева, презентаций и объяснения продукта.",
                        },
                        {
                            "title": "Меньше ручных объяснений",
                            "text": "Часть вопросов снимается еще до звонка: пользователь приходит на демо уже с контекстом и более точным запросом.",
                        },
                    ],
                    "integration_blocks": [
                        {
                            "id": 1086,
                            "label": "WhatsApp Business API",
                            "text": "Материалы о подключении канала, стоимости сообщений и рабочей логике WhatsApp в продукте.",
                        },
                        {
                            "id": 1087,
                            "label": "AmoCRM и Bitrix24",
                            "text": "Разборы CRM-связки, передачи данных по лидам и типовых сценариев для продаж и поддержки.",
                        },
                        {
                            "id": 1088,
                            "label": "Zapier, n8n и automation-стек",
                            "text": "Практические заметки о no-code интеграциях, триггерах, маршрутизации и автоматизации без хаоса в процессах.",
                        },
                    ],
                    "faqs": [
                        {
                            "question": "Для кого полезен блог Chat Plus?",
                            "answer": "Для маркетинга, presale, владельцев бизнеса и команд, которые хотят быстрее понять рабочие сценарии Chat Plus и увидеть практические кейсы.",
                        },
                        {
                            "question": "Это просто контент-маркетинг или часть продукта?",
                            "answer": "Это часть продуктового слоя. Блог помогает объяснять платформу, связывает кейсы с демо и подводит пользователя к следующему осмысленному шагу.",
                        },
                        {
                            "question": "Что делать после чтения статьи?",
                            "answer": "Обычно следующий шаг — открыть связанный сценарий, перейти в документацию или записаться на демо, чтобы посмотреть логику Chat Plus на своей задаче.",
                        },
                    ],
                }
            )

            for link in page.get("internal_links", []):
                if link.get("title") == "Academy":
                    link["title"] = "Академия"
                if link.get("label") == "Academy":
                    link["label"] = "Академия"

        if slug == "dev":
            page["integrations_title"] = "Связанные разделы и интеграции"
            page["internal_links_title"] = "Что еще посмотреть"

            integration_blocks = page.get("integration_blocks") or []
            if len(integration_blocks) > 0:
                integration_blocks[0]["label"] = "Продукт"
                integration_blocks[0]["text"] = "Страница связана с реальными сценариями Chat Plus и объясняет, как технический слой поддерживает рабочие процессы."

        if slug == "pricing":
            for link in page.get("internal_links", []):
                if link.get("title") == "Каналы":
                    link["description"] = "WhatsApp, Telegram, Instagram и другие"
                if link.get("title") == "Интеграции":
                    link["description"] = "AmoCRM, Bitrix24, HubSpot и другие"

        if slug == "partnership":
            for row in page.get("comparison_rows", []):
                if row.get("parameter") == "РљРѕРјРёСЃСЃРёСЏ":
                    row["parameter"] = "Комиссия"

        if slug == "home":
            for link in page.get("internal_links", []):
                if link.get("title") == "Каналы":
                    link["description"] = "WhatsApp, Telegram, Instagram и другие"
                if link.get("title") == "Интеграции":
                    link["description"] = "AmoCRM, Bitrix24, HubSpot и другие"

        pages[index] = page

    return pages


def apply_site_setting_overrides(site_setting: dict) -> dict:
    shared = site_setting.get("page_templates", {}).get("shared", {}).get("structured_page", {})
    if shared:
        shared["roi_with_title"] = "С Chat Plus"
        shared["comparison_header_one"] = "Подход 1"
        shared["comparison_header_two"] = "Подход 2"

    return site_setting


def main():
    for target in TARGETS:
        data = json.loads(target.read_text(encoding="utf-8-sig"))
        repaired = repair_node(data)

        if target.name == "landingPages.json" and isinstance(repaired, list):
            repaired = apply_landing_page_overrides(repaired)
        if target.name == "siteSetting.json" and isinstance(repaired, dict):
            repaired = apply_site_setting_overrides(repaired)

        target.write_text(
            json.dumps(repaired, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"repaired {target.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
