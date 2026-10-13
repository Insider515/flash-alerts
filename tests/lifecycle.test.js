/**
 * Тесты жизненного цикла алерта:
 *   - колбэки onShow и onHide
 *   - ручное закрытие через close()
 *   - двойной close() не ломает ничего
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initDom, resetDom, wait } = require('./helpers');

initDom();
const FlashAlerts = require('../index.js');

test('onShow вызывается после in-анимации', async function () {
    resetDom();
    const a = new FlashAlerts({ duration: 200, animation: 10, effect: 'instant' });
    let called = 0;
    let arg = null;
    a.show('x', {
        position: 'top-right',
        onShow: function (el) { called++; arg = el; }
    });
    await wait(30);
    assert.equal(called, 1);
    assert.ok(arg instanceof HTMLElement);
});

test('onHide вызывается после удаления', async function () {
    resetDom();
    const a = new FlashAlerts({ duration: 20, animation: 10, effect: 'instant' });
    let called = 0;
    const h = a.show('x', {
        position: 'top-right',
        onHide: function () { called++; }
    });
    await wait(80);
    assert.equal(called, 1);
    assert.equal(h.element.parentNode, null);
});

test('close() закрывает алерт немедленно', async function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10000, animation: 10, effect: 'instant' });
    const h = a.show('x', { position: 'top-right' });
    assert.ok(h.element.parentNode, 'сразу после show элемент в DOM');
    h.close();
    await wait(30);
    assert.equal(h.element.parentNode, null, 'после close + animation элемент удалён');
});

test('двойной close() не бросает ошибку и не вызывает onHide дважды', async function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10000, animation: 10, effect: 'instant' });
    let hideCount = 0;
    const h = a.show('x', {
        position: 'top-right',
        onHide: function () { hideCount++; }
    });
    assert.doesNotThrow(function () {
        h.close();
        h.close();
    });
    await wait(40);
    assert.equal(hideCount, 1);
});

test('duration из опций соблюдается', async function () {
    resetDom();
    const a = new FlashAlerts({ animation: 5, effect: 'instant' });
    const h = a.show('x', { position: 'top-right', duration: 40 });
    await wait(20);
    assert.ok(h.element.parentNode, 'через 20ms алерт ещё жив (duration=40)');
    await wait(60);
    assert.equal(h.element.parentNode, null, 'через 80ms алерта быть не должно');
});

test('пресет duration применяется, если не задан локально', async function () {
    resetDom();
    const a = new FlashAlerts({ animation: 5, effect: 'instant' });
    a.addPreset('short', { duration: 30 });
    const h = a.short('x', { position: 'top-right' });
    await wait(60);
    assert.equal(h.element.parentNode, null);
});
