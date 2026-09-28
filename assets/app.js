/* 三分化 线性计划 — 打卡与离线
   打卡状态只存在这台设备的浏览器里，不上传任何地方。 */

(function () {
  'use strict';

  var KEY = 'sflc.sets.v1';
  var state = {};

  try {
    state = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
  } catch (e) {
    state = {};                       // 隐私模式 / 存储被禁用时按空白处理
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---- 组装每组的打卡方块 ---- */
  document.querySelectorAll('.sets').forEach(function (box) {
    var key = box.getAttribute('data-key');
    var n = parseInt(box.getAttribute('data-n'), 10) || 3;
    var row = box.closest('.ex');
    var nameEl = row && row.querySelector('.ex-name');
    var name = nameEl ? nameEl.textContent.trim() : key;

    for (var i = 1; i <= n; i++) {
      var id = 'set-' + key + '-' + i;
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.id = id;
      input.setAttribute('aria-label', name + ' 第 ' + i + ' 组');
      if (state[id]) input.checked = true;
      input.addEventListener('change', function (e) {
        var t = e.currentTarget;
        if (t.checked) { state[t.id] = 1; } else { delete state[t.id]; }
        save();
        refreshTally(t.closest('.day'));
      });
      box.appendChild(input);
    }
  });

  /* ---- 当天进度 ---- */
  function refreshTally(day) {
    if (!day) return;
    var out = day.querySelector('.tally');
    if (!out) return;
    var all = day.querySelectorAll('.sets input');
    var done = day.querySelectorAll('.sets input:checked').length;
    out.textContent = done + ' / ' + all.length + ' 组';
    if (done === all.length && all.length > 0) {
      out.setAttribute('data-done', '1');
      out.textContent = '今天完成 · ' + all.length + ' 组';
    } else {
      out.removeAttribute('data-done');
    }
  }

  document.querySelectorAll('.day').forEach(refreshTally);

  /* ---- 清空当天 ---- */
  document.querySelectorAll('.btn[data-reset]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var day = btn.closest('.day');
      day.querySelectorAll('.sets input').forEach(function (input) {
        input.checked = false;
        delete state[input.id];
      });
      save();
      refreshTally(day);
      var old = btn.textContent;
      btn.textContent = '已清空';
      setTimeout(function () { btn.textContent = old; }, 1400);
    });
  });

  /* ---- 离线缓存（仅在 https / localhost 下生效）---- */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
