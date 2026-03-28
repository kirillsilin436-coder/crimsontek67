/**
 * Озвучка в стиле «голосового ядра»: приоритет мужских голосов (RU / EN).
 */
function ghostRefreshVoices() {
  try {
    window.speechSynthesis.getVoices();
  } catch (e) {}
}

function ghostPickMaleVoice(lang) {
  ghostRefreshVoices();
  var voices = window.speechSynthesis.getVoices();
  if (!voices || !voices.length) return null;

  var wantRu = lang && lang.indexOf('ru') === 0;
  var pool = voices.filter(function (v) {
    if (!v.lang) return false;
    if (wantRu) return v.lang.indexOf('ru') === 0;
    return v.lang.indexOf('en') === 0;
  });
  if (!pool.length) pool = voices.slice();

  function score(v) {
    var n = (v.name || '').toLowerCase();
    var s = 0;
    if (/male|муж|david|george|daniel|mark|fred|thomas|james|john|dmitry|дмитрий|pavel|павел|filipp|yuri|иван|aaron|oliver|microsoft.*mark|google uk english male|en-gb.*male/i.test(
      n
    ))
      s += 12;
    if (!wantRu && (n.indexOf('uk english') >= 0 || n.indexOf('british') >= 0)) s += 8;
    if (wantRu && (n.indexOf('dmitry') >= 0 || n.indexOf('pavel') >= 0)) s += 6;
    return s;
  }

  pool.sort(function (a, b) {
    return score(b) - score(a);
  });
  return pool[0] || null;
}

/**
 * Озвучить текст мужским голосом (ниже тембр / скорость — ближе к «бортовому»).
 */
function ghostSpeak(text, opts) {
  if (!window.speechSynthesis) return;
  opts = opts || {};
  var vo = document.getElementById('voice-on');
  if (!opts.force && vo && !vo.checked) return;

  var lang = opts.lang;
  if (!lang) {
    lang = /[а-яёА-ЯЁ]/.test(String(text)) ? 'ru-RU' : 'en-GB';
  }

  window.speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(String(text));
  u.lang = lang;
  u.rate = opts.rate != null ? opts.rate : 0.9;
  u.pitch = opts.pitch != null ? opts.pitch : 0.82;

  var v = ghostPickMaleVoice(lang);
  if (v) u.voice = v;

  window.speechSynthesis.speak(u);
}

if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = function () {
    ghostRefreshVoices();
  };
}
