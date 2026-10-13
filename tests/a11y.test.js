/**
 * Тесты accessibility-поведения:
 *   - ARIA-атрибуты (role, aria-live, aria-atomic) выставлены по умолчанию
 *   - error-пресет использует assertive + role=alert
 *   - кастомные role/ariaLive переопределяют дефолты
 *   - prefers-reduced-motion: при включении форсируется мгновенный показ
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initDom, resetDom } = require('./helpers');

initDom();
const FlashAlerts = require('../index.js');

test('по умолчанию role=status, aria-live=polite, aria-atomic=true', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.show('x', { position: 'top-right' });
    assert.equal(h.element.getAttribute('role'), 'status');
    assert.equal(h.element.getAttribute('aria-live'), 'polite');
    assert.equal(h.element.getAttribute('aria-atomic'), 'true');
});

test('error-пресет: role=alert, aria-live=assertive', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.error('something broke');
    assert.equal(h.element.getAttribute('role'), 'alert');
    assert.equal(h.element.getAttribute('aria-live'), 'assertive');
});

test('остальные встроенные пресеты сохраняют дефолтные ARIA', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    ['success', 'warning', 'info'].forEach(function (name) {
        const h = a[name]('x');
        assert.equal(h.element.getAttribute('role'), 'status', name + ': role');
        assert.equal(h.element.getAttribute('aria-live'), 'polite', name + ': aria-live');
    });
});

test('опции show.role и show.ariaLive переопределяют всё', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.error('x', { role: 'log', ariaLive: 'off' });
    assert.equal(h.element.getAttribute('role'), 'log');
    assert.equal(h.element.getAttribute('aria-live'), 'off');
});

test('дефолты инстанса — role и ariaLive — применяются когда ничего не задано локально', function () {
    resetDom();
    const a = new FlashAlerts({
        duration: 10, animation: 5, effect: 'instant',
        role: 'log', ariaLive: 'off'
    });
    const h = a.show('x');
    assert.equal(h.element.getAttribute('role'), 'log');
    assert.equal(h.element.getAttribute('aria-live'), 'off');
});

test('пользовательский пресет может задать свои role/ariaLive', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    a.addPreset('critical', {
        style: { background: 'rgb(50,0,0)' },
        role: 'alert',
        ariaLive: 'assertive'
    });
    const h = a.critical('x');
    assert.equal(h.element.getAttribute('role'), 'alert');
    assert.equal(h.element.getAttribute('aria-live'), 'assertive');
});

test('prefers-reduced-motion: при reduce эффект принудительно instant, animation=0', function () {
    resetDom();
    // Подменяем matchMedia так, чтобы запрос reduce отвечал matches=true
    const originalMM = global.window.matchMedia;
    global.window.matchMedia = function (q) {
        return { matches: /prefers-reduced-motion.*reduce/.test(q), media: q, onchange: null,
                 addEventListener: function () {}, removeEventListener: function () {},
                 addListener: function () {}, removeListener: function () {}, dispatchEvent: function () {} };
    };
    try {
        const a = new FlashAlerts({ duration: 100, animation: 300, effect: 'fade' });
        const h = a.show('x', { position: 'top-right' });
        // instant-эффект ставит transition='none' и opacity='1' сразу
        assert.equal(h.element.style.transition, 'none', 'при reduced-motion transition=none');
        assert.equal(h.element.style.opacity, '1');
    } finally {
        global.window.matchMedia = originalMM;
    }
});

test('respectReducedMotion=false отключает учёт prefers-reduced-motion', function () {
    resetDom();
    const originalMM = global.window.matchMedia;
    global.window.matchMedia = function (q) {
        return { matches: /prefers-reduced-motion.*reduce/.test(q), media: q, onchange: null,
                 addEventListener: function () {}, removeEventListener: function () {},
                 addListener: function () {}, removeListener: function () {}, dispatchEvent: function () {} };
    };
    try {
        const a = new FlashAlerts({ duration: 100, animation: 300, effect: 'fade', respectReducedMotion: false });
        const h = a.show('x', { position: 'top-right' });
        // fade ставит opacity=0 → ...; transition должен содержать opacity (не 'none')
        assert.ok(/opacity/.test(h.element.style.transition),
            'без respectReducedMotion эффект fade должен сработать, transition=' + h.element.style.transition);
    } finally {
        global.window.matchMedia = originalMM;
    }
});

test('локальный respectReducedMotion=false перекрывает инстанс при включённом reduce', function () {
    resetDom();
    const originalMM = global.window.matchMedia;
    global.window.matchMedia = function (q) {
        return { matches: /prefers-reduced-motion.*reduce/.test(q), media: q, onchange: null,
                 addEventListener: function () {}, removeEventListener: function () {},
                 addListener: function () {}, removeListener: function () {}, dispatchEvent: function () {} };
    };
    try {
        const a = new FlashAlerts({ duration: 100, animation: 300, effect: 'fade' });
        const h = a.show('x', { position: 'top-right', respectReducedMotion: false });
        assert.ok(/opacity/.test(h.element.style.transition));
    } finally {
        global.window.matchMedia = originalMM;
    }
});

test('без matchMedia (старые окружения) ничего не ломается', function () {
    resetDom();
    const originalMM = global.window.matchMedia;
    delete global.window.matchMedia;
    try {
        const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'fade' });
        const h = a.show('x', { position: 'top-right' });
        // Эффект fade должен нормально отработать
        assert.ok(/opacity/.test(h.element.style.transition));
    } finally {
        global.window.matchMedia = originalMM;
    }
});
