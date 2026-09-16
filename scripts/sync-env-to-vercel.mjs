import https from 'https';

/**
 * Скрипт для автоматической синхронизации переменных окружения
 * из текущего окружения (AI Studio / Local) в проект Vercel через официальный Vercel API v10.
 */

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID_OR_NAME = process.env.VERCEL_PROJECT_ID || 'cransys';
const TEAM_ID = process.env.VERCEL_TEAM_ID;

const KEYS_TO_SYNC = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'YANDEX_CLIENT_ID',
  'YANDEX_CLIENT_SECRET',
  'YANDEX_REDIRECT_URI',
  'DATABASE_URL',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'TEST_USER_EMAIL',
  'TEST_USER_PASSWORD',
];

async function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://api.vercel.com${path}`);
    if (TEAM_ID) {
      url.searchParams.set('teamId', TEAM_ID);
    }

    const options = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function sync() {
  if (!VERCEL_TOKEN) {
    console.log('\n[SYNC VERCEL] Внимание: VERCEL_TOKEN не задан в переменных окружения.');
    console.log('Чтобы я мог отправить переменные в Vercel автоматически без ручного ввода,');
    console.log('создай токен на https://vercel.com/account/tokens и добавь VERCEL_TOKEN в секреты AI Studio.');
    return;
  }

  console.log(`\n[SYNC VERCEL] Начинаем синхронизацию переменных в проект Vercel "${PROJECT_ID_OR_NAME}"...`);

  // Получаем существующие переменные
  const existingRes = await apiRequest('GET', `/v9/projects/${PROJECT_ID_OR_NAME}/env`);
  const existingKeys = new Map();
  if (existingRes.status === 200 && Array.isArray(existingRes.data?.envs)) {
    for (const env of existingRes.data.envs) {
      existingKeys.set(env.key, env.id);
    }
  }

  for (const key of KEYS_TO_SYNC) {
    const val = process.env[key];
    if (!val) {
      console.log(`- Пропуск ${key} (нет значения в текущем окружении)`);
      continue;
    }

    if (existingKeys.has(key)) {
      const envId = existingKeys.get(key);
      const updateRes = await apiRequest('PATCH', `/v9/projects/${PROJECT_ID_OR_NAME}/env/${envId}`, {
        value: val,
        target: ['production', 'preview', 'development'],
      });
      console.log(`✓ Обновлен ${key} в Vercel (статус: ${updateRes.status})`);
    } else {
      const createRes = await apiRequest('POST', `/v10/projects/${PROJECT_ID_OR_NAME}/env`, {
        key,
        value: val,
        type: 'encrypted',
        target: ['production', 'preview', 'development'],
      });
      console.log(`+ Создан ${key} в Vercel (статус: ${createRes.status})`);
    }
  }

  console.log('\n[SYNC VERCEL] Синхронизация завершена успешно!');
}

sync().catch(console.error);
