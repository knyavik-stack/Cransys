# Архитектурный план внедрения реальной аналитики «Воронка и конверсии» (Шаг 9.0)

**Дата создания:** 2026-09-17  
**Статус:** Запланировано к поэтапной реализации  
**Назначение:** Полный технический регламент сбора сквозной продуктовой телеметрии и построения точной воронки конверсий в Панели администратора Cransys.

---

## 1. Концепция и этапы воронки Cransys

Воронка конверсий Cransys строится на **событийно-ориентированной модели (Event-Driven Product Telemetry)** без передачи персональных данных сторонним сервисам (сохранение приватности и соблюдение 152-ФЗ РФ).

### Ключевые шаги воронки:
1. `VISIT` (`page_view`) — Пользователь зашел на платформу (главная или лендинг).
2. `AUDIT_INIT` (`audit_upload` / `demo_run`) — Пользователь загрузил отчет XLSX/CSV или запустил ДЕМО-аудит.
3. `AUDIT_RESULT` (`audit_completed`) — Движок аудита рассчитал сумму сливов бюджета и отобразил экран результатов.
4. `PRICING_VIEW` (`pricing_modal_opened` / `pricing_tier_clicked`) — Пользователь проявил коммерческий интерес, открыв тарифную сетку.
5. `SIGNUP_SUCCESS` (`auth_registered`) — Пользователь создал защищенный аккаунт и подтвердил Email.
6. `PAYMENT_SUCCESS` (`payment_completed`) — Зафиксирована успешная оплата тарифа через платежный шлюз (ЮKassa/Robokassa).

---

## 2. Схема базы данных (PostgreSQL / Neon)

В схему базы данных `db/schema.ts` добавляется выделенная таблица телеметрии:

```sql
-- Таблица сквозных аналитических событий
CREATE TABLE telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id VARCHAR(64) NOT NULL,              -- Анонимный хэш посетителя (из secure cookie)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- ID пользователя (если авторизован)
  event_name VARCHAR(64) NOT NULL,             -- 'page_view', 'audit_init', 'audit_complete', 'pricing_open', 'signup', 'payment'
  page_path VARCHAR(255) NOT NULL,             -- '/', '/dashboard', '/admin', etc.
  utm_source VARCHAR(64),                      -- Источник трафика (yandex, direct, vk, telegram)
  utm_medium VARCHAR(64),                      -- cpc, organic, referral
  utm_campaign VARCHAR(128),                   -- Название кампании
  metadata JSONB DEFAULT '{}'::jsonb,          -- Дополнительные параметры ({ tier: 'PRO', wasteSum: 145000, fileRows: 1200 })
  user_agent VARCHAR(255),                     -- Браузер/ОС (обезличенно)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Быстрые индексы для моментального построения отчетов
CREATE INDEX idx_telemetry_event_time ON telemetry_events(event_name, created_at);
CREATE INDEX idx_telemetry_visitor ON telemetry_events(visitor_id);
CREATE INDEX idx_telemetry_created_at ON telemetry_events(created_at);
```

---

## 3. Серверные API-эндпоинты

### 3.1. Эндпоинт регистрации событий: `POST /api/telemetry/event`
- **Метод:** `POST`
- **Протокол:** Быстрый неблокирующий прием через `navigator.sendBeacon` или `fetch(..., { keepalive: true })`.
- **Payload:**
  ```json
  {
    "eventName": "pricing_tier_clicked",
    "pagePath": "/",
    "metadata": { "tier": "PRO", "price": 4900 }
  }
  ```
- **Обработка:** Извлечение `visitor_id` из подписанной cookie (или генерация `crypto.randomUUID()`), привязка к сессии авторизованного пользователя и асинхронная вставка в БД.

### 3.2. Эндпоинт аналитики для Админки: `GET /api/admin/funnel`
- **Авторизация:** Только `ADMIN` (проверка JWT/сессии).
- **Параметры:** `?period=today|7d|30d|all`
- **Логика SQL:** Расчет уникальных `visitor_id` на каждом шаге и конверсий между смежными этапами:
  ```sql
  WITH step_counts AS (
    SELECT
      COUNT(DISTINCT CASE WHEN event_name = 'page_view' THEN visitor_id END) AS step_1_visits,
      COUNT(DISTINCT CASE WHEN event_name = 'audit_completed' THEN visitor_id END) AS step_2_audits,
      COUNT(DISTINCT CASE WHEN event_name = 'pricing_open' THEN visitor_id END) AS step_3_pricing,
      COUNT(DISTINCT CASE WHEN event_name = 'auth_registered' THEN visitor_id END) AS step_4_signups,
      COUNT(DISTINCT CASE WHEN event_name = 'payment_completed' THEN visitor_id END) AS step_5_payments
    FROM telemetry_events
    WHERE created_at >= NOW() - INTERVAL '30 days'
  )
  SELECT * FROM step_counts;
  ```

---

## 4. Клиентский трекер (`lib/telemetry/tracker.ts`)

- Легковесный модуль (< 2 КБ) без внешних зависимостей.
- Автоматический захват UTM-меток из URL при первом визите.
- Методы:
  - `trackPageView(path)`
  - `trackAuditStarted(mode: 'demo' | 'upload')`
  - `trackAuditFinished(wasteAmount: number)`
  - `trackPricingOpened(source: string)`
  - `trackTierSelected(tierId: string)`
  - `trackPaymentInitiated(tierId: string, amount: number)`

---

## 5. План реализации по шагам (Roadmap)

1. **Этап 1 (БД и Модели):** Добавление таблицы `telemetry_events` в `db/schema.ts`, выполнение миграций.
2. **Этап 2 (Сборщик телеметрии):** Создание `/api/telemetry/event` и клиентского синглтона `lib/telemetry/tracker.ts`.
3. **Этап 3 (Инструментирование):** Интеграция вызовов трекера в ключевые действия UI (кнопки аудита, селектор тарифов, формы авторизации, webhook платежей).
4. **Этап 4 (Интерфейс Админки):** Подключение реальных данных к компоненту воронки в `/app/admin/page.tsx` с графиками конверсий, фильтрацией по датам и UTM-источникам.
