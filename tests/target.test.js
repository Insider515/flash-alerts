/**
 * Тесты позиционирования внутри произвольного DOM-элемента (target).
 * target может быть селектором либо HTMLElement.
 * При задан target — fixed-контейнер НЕ создаётся.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initDom, resetDom } = require('./helpers');

initDom();
const FlashAlerts = require('../index.js');

test('target: селектор — алерт встраивается внутрь элемента', function () {
    resetDom();
    const host = document.createElement('div');
    host.id = 'inline';
    document.body.appendChild(host);

    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.show('x', { target: '#inline' });

    assert.ok(host.contains(h.element), 'алерт должен лежать внутри target');
    const container = host.querySelector('[data-flash-alerts-target]');
    assert.ok(container, 'внутри target должен быть контейнер алертов');
    assert.equal(container.style.position, 'relative');
});

test('target: HTMLElement — то же самое', function () {
    resetDom();
    const host = document.createElement('section');
    document.body.appendChild(host);

    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.show('x', { target: host });
    assert.ok(host.contains(h.element));
});

test('target: при наличии target fixed-контейнер не создаётся', function () {
    resetDom();
    const host = document.createElement('div');
    document.body.appendChild(host);

    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    a.show('x', { target: host, position: 'top-right' });

    const fixed = document.querySelector('[data-flash-alerts-container]');
    assert.equal(fixed, null, 'fixed-контейнер не должен быть создан, когда задан target');
});

test('target: повторный show на тот же target использует тот же контейнер', function () {
    resetDom();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    a.show('one', { target: host });
    a.show('two', { target: host });
    const containers = host.querySelectorAll('[data-flash-alerts-target]');
    assert.equal(containers.length, 1, 'в target должен быть ровно один контейнер');
    assert.equal(containers[0].children.length, 2, 'в нём — два алерта');
});

test('target: разные target — разные контейнеры', function () {
    resetDom();
    const host1 = document.createElement('div');
    const host2 = document.createElement('div');
    document.body.appendChild(host1);
    document.body.appendChild(host2);
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    a.show('a', { target: host1 });
    a.show('b', { target: host2 });
    assert.ok(host1.querySelector('[data-flash-alerts-target]'));
    assert.ok(host2.querySelector('[data-flash-alerts-target]'));
});

test('target: несуществующий селектор — fallback на fixed-позицию', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    a.show('x', { target: '#nope', position: 'bottom-left' });
    const fixed = document.querySelector('[data-flash-alerts-container="bottom-left"]');
    assert.ok(fixed, 'при отсутствии target должен быть создан fixed-контейнер');
});

test('target: null/undefined — обычное поведение (fixed)', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    a.show('x', { target: null, position: 'top-right' });
    assert.ok(document.querySelector('[data-flash-alerts-container="top-right"]'));
});
