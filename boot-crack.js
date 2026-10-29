/* ============================================================
 *  勇者奶蛙传 · 破解版 —— 跨平台启动脚本
 *
 *  只做"壳"层面的事，不碰游戏逻辑：
 *    1. 动态 import 游戏模块（模块只求值一次，不会和 <head> 里的
 *       <script type="module"> 重复加载 Phaser）
 *    2. 横屏锁定：安卓/鸿蒙/桌面走 Screen Orientation API，失败就靠 CSS 竖屏提示兜底
 *    3. iOS 上首次用户手势时补一次全屏请求（iOS 不允许非手势触发全屏）
 *    4. 双击缩放 / 长按菜单 / 右键菜单清理
 *    5. 暴露 window.__CRACK__ 给自测用
 * ============================================================ */
(function () {
  'use strict';

  var WM_TEXT = 'hacked by 猫祐今天吃盒蛋';

  var CRACK = {
    watermark: WM_TEXT,
    infiniteHp: true,
    damageMultiplier: 2.5,
    version: '1.0.0',
  };
  window.__CRACK__ = CRACK;

  /* ---------- 1. 加载顺序 ----------
     游戏模块由 index.html 里的内联 module 先 import，然后才加载本文件，
     所以这里不需要再 import 一次 —— 静态 + 动态混着来会让模块图
     有机会求值两遍（Phaser 建两次实例）。 */

  /* ---------- 2. 横屏锁定 ---------- */
  function tryLockLandscape() {
    var so = screen.orientation;
    if (so && typeof so.lock === 'function') {
      // 只能在全屏状态下成功；失败就静默放弃（CSS 竖屏提示会兜底）
      so.lock('landscape').catch(function () {});
    }
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) tryLockLandscape();
  });

  /* ---------- 3. 首次手势：补全屏 + 再试一次方向锁 ---------- */
  var gestureDone = false;
  function onFirstGesture() {
    if (gestureDone) return;
    gestureDone = true;
    var el = document.documentElement;
    var req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req && !document.fullscreenElement) {
      try {
        var p = req.call(el);
        if (p && p.catch) p.catch(function () {});
      } catch (e) { /* 忽略 */ }
    }
    tryLockLandscape();
  }
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (t) {
    window.addEventListener(t, onFirstGesture, { once: true, passive: true });
  });

  /* ---------- 4. 各种"别来抢操作"的清理 ---------- */
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', function (e) {
    // 只在游戏区域屏蔽右键菜单，输入框/调试场景不受影响
    if (e.target && e.target.closest && e.target.closest('#app')) e.preventDefault();
  });

  /* iOS Safari：视觉视口变化（地址栏收起/键盘）时通知一次尺寸更新 */
  if (window.visualViewport) {
    var lastW = 0, lastH = 0;
    window.visualViewport.addEventListener('resize', function () {
      var w = Math.round(window.visualViewport.width);
      var h = Math.round(window.visualViewport.height);
      if (w === lastW && h === lastH) return;
      lastW = w; lastH = h;
      window.dispatchEvent(new Event('resize'));
    });
  }
})();
