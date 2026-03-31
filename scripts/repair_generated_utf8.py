import json
from pathlib import Path


BASE = Path("cms/seed/generated")


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def walk_replace(value):
    replacements = {
        "????????? ???????": "повторные касания",
        "AI ?? ?????? ?????": "AI на первой линии",
        "???????????": "Подключаете",
        "????????": "Контакты",
        "??????": "Покажем",
        "????": "Демо",
    }
    if isinstance(value, dict):
        return {key: walk_replace(item) for key, item in value.items()}
    if isinstance(value, list):
        return [walk_replace(item) for item in value]
    if isinstance(value, str):
        for old, new in replacements.items():
            value = value.replace(old, new)
        return value
    return value


def repair_channels():
    path = BASE / "channels.json"
    data = load_json(path)
    for item in data:
        name = item["name"]
        item["solution_title"] = f"Как Chat Plus делает {name} управляемым каналом"
        item["roi_title"] = f"Что получает бизнес от {name} в системе Chat Plus"
        item["sticky_cta_title"] = f"Хотите запустить {name} в Chat Plus?"
        item["sticky_cta_text"] = f"Покажем на демо, как команда будет работать с {name}, AI, CRM и автоматизацией в одном контуре."
        item["faq_title"] = f"Вопросы о запуске {name} в Chat Plus"

        if item["slug"] == "whatsapp":
            item["subtitle"] = "Продажи, поддержка и автоматизация в официальном канале WhatsApp без ручного хаоса."
            item["solution_intro"] = "Chat Plus превращает WhatsApp из потока входящих сообщений в управляемый канал продаж, сервиса и AI-автоматизации."
            item["features"][0]["text"] = "Подключаете официальный канал без серых схем, а команда работает в едином окне с прозрачной маршрутизацией и контролем."
            item["features"][3]["text"] = "Контакты, сделки, задачи и история диалога синхронизируются автоматически, без ручного копирования и потери контекста."

    save_json(path, walk_replace(data))


def repair_industries():
    path = BASE / "industries.json"
    data = load_json(path)
    for item in data:
        name = item["name"]
        item["solution_title"] = f"Как Chat Plus работает для отрасли «{name}»"
        item["roi_title"] = f"Что получает бизнес в отрасли «{name}»"
        item["sticky_cta_title"] = f"Хотите запустить Chat Plus для отрасли «{name}»?"
        item["sticky_cta_text"] = f"Покажем на демо, как Chat Plus снимает рутину и ускоряет продажи, запись или сервис в отрасли «{name}»."
        item["faq_title"] = f"Вопросы о запуске Chat Plus для отрасли «{name}»"

        if item["slug"] == "med":
            item["subtitle"] = "Запись, подтверждения и повторные визиты без перегруженного колл-центра и потерь пациентов."
            item["problem_intro"] = "Клиники теряют пациентов не из-за спроса, а из-за медленной реакции, неявок и разрыва между каналами, CRM и расписанием."
            item["problems"][0]["text"] = "Пациент пишет в мессенджер, но дальше его путь распадается: запись не доведена, ответ задержался, администратор переключился на другие каналы."
            item["solution_intro"] = "Chat Plus превращает мессенджеры в управляемый слой записи, подтверждений, повторных обращений и клиентского сервиса для клиник."
            item["features"][1]["text"] = "Пациент заполняет первичную информацию до разговора с администратором, а команда получает структурированный запрос вместо хаотичной переписки."
            item["features"][3]["text"] = "Онлайн-консультации, уточнения и повторные касания остаются в единой истории обращения, а не теряются между каналами."
            item["faqs"][0]["question"] = "Подходит ли Chat Plus для клиник и медицинских центров?"
            item["faqs"][0]["answer"] = "Да. Chat Plus адаптируется под запись, подтверждения, повторные визиты, напоминания и работу с пациентами в нескольких каналах одновременно."

    save_json(path, walk_replace(data))


def repair_integrations():
    path = BASE / "integrations.json"
    data = load_json(path)
    for item in data:
        name = item["name"]
        item["solution_title"] = f"Как Chat Plus усиливает связку с {name}"
        item["roi_title"] = f"Что получает бизнес от интеграции с {name}"
        item["sticky_cta_title"] = f"Хотите увидеть Chat Plus + {name} в работе?"
        item["sticky_cta_text"] = f"Покажем на демо, как Chat Plus связывает {name} с мессенджерами, AI и следующими действиями команды."
        item["faq_title"] = f"Вопросы об интеграции с {name}"

        if item["slug"] == "amocrm":
            item["subtitle"] = "AmoCRM получает полный контекст диалога, а не обрывки сообщений и ручной перенос."
            item["solution_intro"] = "Chat Plus связывает мессенджеры, AI и AmoCRM в единый процесс, где каждое обращение сразу попадает в правильную воронку и следующий шаг."
            item["features"][0]["text"] = "Новые обращения сразу создают сделку или лид в нужной воронке, без ручного создания карточек и задержек на первой линии."
            item["features"][1]["text"] = "Контакты и история переписки обновляются автоматически, поэтому у менеджера всегда перед глазами актуальный контекст клиента."
            item["features"][2]["text"] = "Задачи формируются прямо из диалога: повторные касания, звонок, встреча или передача на следующего ответственного."
            item["features"][3]["text"] = "Руководитель видит путь клиента от первого сообщения до сделки и понимает, где канал реально влияет на выручку."

    save_json(path, walk_replace(data))


def repair_features():
    path = BASE / "features.json"
    data = load_json(path)
    for item in data:
        name = item["name"]
        item["solution_title"] = f"Как функция «{name}» работает в Chat Plus"
        item["roi_title"] = f"Что даёт бизнесу функция «{name}»"
        item["sticky_cta_title"] = f"Хотите увидеть функцию «{name}» в работе?"
        item["sticky_cta_text"] = f"Покажем на демо, как функция «{name}» работает вместе с каналами, AI, CRM и аналитикой Chat Plus."
        item["faq_title"] = f"Вопросы о функции «{name}»"

        if item["slug"] == "ai":
            item["subtitle"] = "AI берёт первую линию, квалифицирует лидов и ускоряет сделки без роста штата."
            item["problem_intro"] = "Отдельный AI-бот не решает задачу бизнеса, если он не связан с каналами, CRM, маршрутизацией и следующими действиями команды."
            item["solution_intro"] = "В Chat Plus AI-агенты встроены в омниканальный процесс: отвечают, квалифицируют, записывают и передают клиента дальше по воронке."
            item["features"][0]["text"] = "AI отвечает в нерабочее время, снимает типовые вопросы и не заставляет команду дежурить в мессенджерах 24/7."
            item["features"][1]["text"] = "До менеджера доходят уже подготовленные обращения: с контекстом, намерением клиента и следующей рекомендуемой стадией."
            item["features"][2]["text"] = "Если клиент готов к встрече или записи, Chat Plus согласует слот и фиксирует событие в календаре без ручной координации."
            item["features"][3]["text"] = "Сценарии запускаются по этапу сделки, типу запроса или источнику, чтобы AI работал как часть процесса, а не отдельный чат-бот."

    save_json(path, walk_replace(data))


def repair_solutions():
    path = BASE / "solutions.json"
    data = load_json(path)
    for item in data:
        name = item["name"]
        item["solution_title"] = f"Как Chat Plus решает задачи направления «{name}»"
        item["roi_title"] = f"Что получает команда в направлении «{name}»"
        item["sticky_cta_title"] = f"Хотите запустить Chat Plus для направления «{name}»?"
        item["sticky_cta_text"] = f"Покажем на демо, как Chat Plus закрывает задачи направления «{name}» через каналы, AI и автоматизацию."
        item["faq_title"] = f"Вопросы о решении «{name}»"
    save_json(path, walk_replace(data))


def repair_business_types():
    path = BASE / "businessTypes.json"
    data = load_json(path)
    for item in data:
        name = item["name"]
        item["solution_title"] = f"Как Chat Plus работает для сегмента «{name}»"
        item["roi_title"] = f"Что получает сегмент «{name}» с Chat Plus"
        item["sticky_cta_title"] = f"Хотите увидеть Chat Plus для сегмента «{name}»?"
        item["sticky_cta_text"] = f"Покажем на демо, как Chat Plus закрывает задачи сегмента «{name}» через омниканал, AI и CRM."
        item["faq_title"] = f"Вопросы о Chat Plus для сегмента «{name}»"
    save_json(path, walk_replace(data))


def repair_competitors():
    path = BASE / "competitors.json"
    data = load_json(path)
    for item in data:
        if item["slug"] == "intercom":
            item["hero_description"] = "Intercom силён как enterprise helpdesk, но быстро становится дорогим и тяжёлым для B2B-команд, которым нужен омниканал, CRM-связка и AI без постоянных доплат."
            item["our_strengths"] = [
                "В 5–8 раз дешевле при сопоставимом сценарии",
                "AI включён в тариф без оплаты за каждую резолюцию",
                "WhatsApp API без наценок посредника",
                "AI-запись в календарь и повторные касания из коробки",
                "Быстрый запуск без тяжёлого enterprise-внедрения",
            ]
            item["weaknesses"] = [
                "Высокий порог входа уже на базовом тарифе",
                "AI тарифицируется отдельно и раздувает стоимость",
                "WhatsApp обычно требует отдельной партнёрской связки",
                "Внедрение и настройка занимают больше времени",
                "Экономика хуже для команд, которым нужен омниканал и CRM в одном контуре",
            ]
    save_json(path, walk_replace(data))


def repair_landing_pages():
    path = BASE / "landingPages.json"
    data = load_json(path)
    by_slug = {item["slug"]: item for item in data}

    home = by_slug["home"]
    home["subtitle"] = "Chat Plus собирает сообщения из всех мессенджеров, ускоряет первый ответ с AI и синхронизирует данные с CRM без потери заявок."
    home["sticky_cta_text"] = "Покажем на демо, как собрать каналы, AI и CRM в один рабочий контур без долгого внедрения."
    home["use_cases"][1]["text"] = "Собирает все каналы в одном окне, включает AI на первой линии и снижает нагрузку на команду."

    pricing = by_slug["pricing"]
    pricing["internal_links"][1]["title"] = "Демо"
    pricing["internal_links"][1]["description"] = "Записаться на демонстрацию и обсудить модель запуска"

    demo = by_slug["demo"]
    demo["subtitle"] = "За 30 минут покажем ваш сценарий: каналы, AI, автоматизация и CRM в одном процессе."
    demo["solution_intro"] = "На демо мы показываем не набор функций, а рабочий контур под ваш процесс: от входящего сообщения до следующего действия в CRM."
    demo["use_cases"][1]["text"] = "Разберём очереди, SLA, шаблоны, AI на первой линии и маршрутизацию на операторов."

    partnership = by_slug["partnership"]
    partnership["solution_intro"] = "Chat Plus даёт партнёрам повторяемый продукт: комиссия, совместные продажи и понятный путь запуска для клиентов."

    save_json(path, walk_replace(data))


def repair_tenders():
    path = BASE / "tendersPage.json"
    data = load_json(path)
    data["features_title"] = "Ключевые возможности Chat Plus Tenders"
    data["faq_title"] = "Вопросы о Chat Plus Tenders"
    data["sticky_cta_text"] = "Пока команда работает с текущими закупками, новые тендеры уже выходят на площадках. Подключите Chat Plus Tenders и получайте сигнал первыми."
    save_json(path, walk_replace(data))


def main():
    repair_channels()
    repair_industries()
    repair_integrations()
    repair_features()
    repair_solutions()
    repair_business_types()
    repair_competitors()
    repair_landing_pages()
    repair_tenders()


if __name__ == "__main__":
    main()
