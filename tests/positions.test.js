/**
 * Тесты позиционирования контейнеров.
 * Для каждой из 9 фиксированных позиций проверяется:
 *   - корректные inline-стили (left/right/top/bottom + transform/alignItems)
 *   - направление раскладки элементов (bottom-* — reverse)
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initDom, resetDom } = require('./helpers');

initDom();
const FlashAlerts = require('../index.js');

// Создать контейнер для позиции через show и вернуть его стили.
function containerFor(position) {
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    a.show('x', { position: position });
    return document.querySelector('[data-flash-alerts-container="' + position + '"]');
}

test('top-left: left=0, top=0, align-items: flex-start', function () {
    resetDom();
    const el = containerFor('top-left');
    assert.equal(el.style.left, '0px');
    assert.equal(el.style.top, '0px');
    assert.equal(el.style.right, 'auto');
    assert.equal(el.style.bottom, 'auto');
    assert.equal(el.style.alignItems, 'flex-start');
});

test('top-center: left=50%, top=0, transform: translateX(-50%)', function () {
    resetDom();
    const el = containerFor('top-center');
    assert.equal(el.style.left, '50%');
    assert.equal(el.style.top, '0px');
    assert.ok(/translateX\(-50%\)/.test(el.style.transform), 'transform должен содержать translateX(-50%)');
    assert.equal(el.style.alignItems, 'center');
});

test('top-right: right=0, top=0, align-items: flex-end', function () {
    resetDom();
    const el = containerFor('top-right');
    assert.equal(el.style.right, '0px');
    assert.equal(el.style.top, '0px');
    assert.equal(el.style.alignItems, 'flex-end');
});

test('middle-left: left=0, top=50%, transform: translate(0, -50%)', function () {
    resetDom();
    const el = containerFor('middle-left');
    assert.equal(el.style.left, '0px');
    assert.equal(el.style.top, '50%');
    assert.ok(/translate\(0, *-50%\)/.test(el.style.transform));
});

test('middle-center: top=50%, transform: translate(-50%, -50%)', function () {
    resetDom();
    const el = containerFor('middle-center');
    assert.equal(el.style.top, '50%');
    assert.ok(/translate\(-50%, *-50%\)/.test(el.style.transform));
});

test('middle-right: right=0, top=50%, transform: translate(0, -50%)', function () {
    resetDom();
    const el = containerFor('middle-right');
    assert.equal(el.style.right, '0px');
    assert.equal(el.style.top, '50%');
    assert.ok(/translate\(0, *-50%\)/.test(el.style.transform));
});

test('bottom-left: left=0, bottom=0, flex-direction: column-reverse', function () {
    resetDom();
    const el = containerFor('bottom-left');
    assert.equal(el.style.left, '0px');
    assert.equal(el.style.bottom, '0px');
    assert.equal(el.style.flexDirection, 'column-reverse');
});

test('bottom-center: left=50%, bottom=0, transform: translateX(-50%), reverse', function () {
    resetDom();
    const el = containerFor('bottom-center');
    assert.equal(el.style.left, '50%');
    assert.equal(el.style.bottom, '0px');
    assert.ok(/translateX\(-50%\)/.test(el.style.transform));
    assert.equal(el.style.flexDirection, 'column-reverse');
});

test('bottom-right: right=0, bottom=0, flex-direction: column-reverse', function () {
    resetDom();
    const el = containerFor('bottom-right');
    assert.equal(el.style.right, '0px');
    assert.equal(el.style.bottom, '0px');
    assert.equal(el.style.flexDirection, 'column-reverse');
    assert.equal(el.style.alignItems, 'flex-end');
});

test('все позиции: position: fixed и правильный padding (margin из опций)', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant', margin: 42 });
    FlashAlerts.POSITIONS.forEach(function (p) {
        a.show('x', { position: p });
        const el = document.querySelector('[data-flash-alerts-container="' + p + '"]');
        assert.equal(el.style.position, 'fixed', p + ': position должен быть fixed');
        assert.equal(el.style.padding, '42px', p + ': padding должен быть равен margin из опций');
    });
});

test('zIndex из опций применяется к контейнеру', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant', zIndex: 11111 });
    a.show('x', { position: 'top-right' });
    const el = document.querySelector('[data-flash-alerts-container="top-right"]');
    assert.equal(el.style.zIndex, '11111');
});
