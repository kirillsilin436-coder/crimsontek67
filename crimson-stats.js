/**
 * Локальная статистика CRIMSONTEK (графики GHOST-LINK // PR).
 * Поле jarvisVisits = открытия экрана GHOST-LINK (имя сохранено для совместимости).
 */
var CRIMSON_STATS_KEY = 'crimson_stats_v1';

function crimsonStatsDefault() {
  return {
    hubVisits: 0,
    jarvisVisits: 0,
    aiQueries: 0,
    modules: {},
    byDay: {}
  };
}

function crimsonStatsLoad() {
  try {
    var j = localStorage.getItem(CRIMSON_STATS_KEY);
    if (!j) return crimsonStatsDefault();
    var o = JSON.parse(j);
    if (!o.byDay) o.byDay = {};
    if (!o.modules) o.modules = {};
    return o;
  } catch (e) {
    return crimsonStatsDefault();
  }
}

function crimsonStatsSave(s) {
  localStorage.setItem(CRIMSON_STATS_KEY, JSON.stringify(s));
}

function crimsonStatsToday() {
  return new Date().toISOString().slice(0, 10);
}

function crimsonStatsBumpDay(s, field) {
  var d = crimsonStatsToday();
  if (!s.byDay[d]) s.byDay[d] = { hub: 0, jarvis: 0, ai: 0, mod: 0 };
  if (s.byDay[d][field] !== undefined) s.byDay[d][field]++;
}

/** Вызов при открытии HUB */
function crimsonTrackHub() {
  var s = crimsonStatsLoad();
  s.hubVisits++;
  crimsonStatsBumpDay(s, 'hub');
  crimsonStatsSave(s);
}

/** Вызов при открытии экрана GHOST-LINK // PR */
function crimsonTrackJarvis() {
  var s = crimsonStatsLoad();
  s.jarvisVisits++;
  crimsonStatsBumpDay(s, 'jarvis');
  crimsonStatsSave(s);
}

function crimsonTrackGhostLink() {
  crimsonTrackJarvis();
}

/** Успешный запрос к ИИ */
function crimsonTrackAi() {
  var s = crimsonStatsLoad();
  s.aiQueries++;
  crimsonStatsBumpDay(s, 'ai');
  crimsonStatsSave(s);
}

/** Переход в модуль с хаба */
function crimsonTrackModule(id) {
  var s = crimsonStatsLoad();
  s.modules[id] = (s.modules[id] || 0) + 1;
  crimsonStatsBumpDay(s, 'mod');
  crimsonStatsSave(s);
}

/** Данные для Chart.js: последние 7 дней — суммарная активность */
function crimsonStatsSeries7d() {
  var s = crimsonStatsLoad();
  var labels = [];
  var data = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var key = d.toISOString().slice(0, 10);
    labels.push(key.slice(5));
    var day = s.byDay[key];
    var sum = 0;
    if (day) {
      sum = (day.hub || 0) + (day.jarvis || 0) + (day.ai || 0) + (day.mod || 0);
    }
    data.push(sum);
  }
  return { labels: labels, data: data, raw: s };
}
