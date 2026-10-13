/**
 * Тесты базовой работы метода show():
 *  - создаёт контейнер нужной позиции в document.body
 *  - вставляет текст безопасно (textContent) по умолчанию
 *  - innerHTML — только при html: true
 *  - повторный show на той же позиции использует тот же контейнер
 *  - разные позиции — разные контейнеры
 *  - возвращает { close, element }
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initDom, resetDom, wait } = require('./helpers');

initDom();
const FlashAlerts = require('../index.js');

test('show() создаёт контейнер фиксированной позиции в document.body', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    a.show('hello', { position: 'top-right' });
    const container = document.querySelector('[data-flash-alerts-container="top-right"]');
    assert.ok(container, 'контейнер должен быть создан');
    assert.equal(container.parentNode, document.body, 'контейнер должен лежать прямо в body');
});

test('show() возвращает объект с close и element', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.show('hi', { position: 'top-right' });
    assert.equal(typeof h.close, 'function');
    assert.ok(h.element instanceof HTMLElement);
    assert.equal(h.element.getAttribute('data-flash-alert'), '');
});

test('по умолчанию текст вставляется безопасно (textContent)', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.show('<img src=x onerror=alert(1)>', { position: 'top-right' });
    assert.equal(h.element.children.length, 0, 'не должно появиться дочерних элементов (строка как текст)');
    assert.equal(h.element.textContent, '<img src=x onerror=alert(1)>');
});

test('html: true вставляет через innerHTML', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.show('<b>bold</b>', { position: 'top-right', html: true });
    const bold = h.element.querySelector('b');
    assert.ok(bold, 'должен появиться <b>');
    assert.equal(bold.textContent, 'bold');
});

test('повторный show на той же позиции переиспользует контейнер', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    a.show('one', { position: 'top-right' });
    a.show('two', { position: 'top-right' });
    const containers = document.querySelectorAll('[data-flash-alerts-container="top-right"]');
    assert.equal(containers.length, 1, 'должен быть ровно один контейнер top-right');
    assert.equal(containers[0].children.length, 2, 'в нём должно быть два алерта');
});

test('разные позиции создают разные контейнеры', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    a.show('one', { position: 'top-right' });
    a.show('two', { position: 'bottom-left' });
    const containers = document.querySelectorAll('[data-flash-alerts-container]');
    assert.equal(containers.length, 2);
});

test('после duration+animation элемент удалён из DOM', async function () {
    resetDom();
    const a = new FlashAlerts({ duration: 20, animation: 10, effect: 'instant' });
    const h = a.show('bye', { position: 'top-right' });
    assert.ok(h.element.parentNode, 'сразу после show элемент в DOM');
    await wait(60);
    assert.equal(h.element.parentNode, null, 'после duration+animation элемент удалён');
});

test('контейнер пересоздаётся, если был удалён извне', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    a.show('one', { position: 'top-right' });
    const first = document.querySelector('[data-flash-alerts-container="top-right"]');
    first.remove();
    a.show('two', { position: 'top-right' });
    const second = document.querySelector('[data-flash-alerts-container="top-right"]');
    assert.ok(second, 'после удаления контейнер должен быть создан заново');
    assert.notStrictEqual(second, first, 'новый контейнер — другой узел');
});

test('show() использует дефолтную позицию, если не указана', function () {
    resetDom();
    const a = new FlashAlerts({ position: 'bottom-center', duration: 10, animation: 5, effect: 'instant' });
    a.show('x');
    assert.ok(
        document.querySelector('[data-flash-alerts-container="bottom-center"]'),
        'должен быть создан контейнер дефолтной позиции'
    );
});

test('show() с несуществующим эффектом откатывается к fade', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5 });
    const h = a.show('x', { position: 'top-right', effect: 'does-not-exist' });
    // fade кладёт transition по opacity
    assert.ok(/opacity/.test(h.element.style.transition), 'должен включиться fallback-эффект fade');
});
