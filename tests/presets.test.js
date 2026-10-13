/**
 * Тесты пресетов: 4 встроенных и регистрация своих.
 * Пресет — это набор дефолтов для одного вызова (style, position, effect, duration и т.д.).
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initDom, resetDom } = require('./helpers');

initDom();
const FlashAlerts = require('../index.js');

test('встроенные пресеты доступны как методы инстанса', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    ['success', 'error', 'warning', 'info'].forEach(function (name) {
        assert.equal(typeof a[name], 'function', 'метод ' + name + ' должен существовать');
    });
});

test('success красит фон в зелёный', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.success('ok');
    assert.ok(/40, *167, *69/.test(h.element.style.background), 'фон должен быть зелёным (40,167,69)');
});

test('error красит фон в красный', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.error('err');
    assert.ok(/220, *53, *69/.test(h.element.style.background));
});

test('warning красит фон в жёлтый с тёмным текстом', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.warning('!');
    assert.ok(/255, *193, *7/.test(h.element.style.background));
    // #1a1a1a нормализуется jsdom к rgb — проверим что это тёмный цвет
    const c = h.element.style.color;
    assert.ok(c === '#1a1a1a' || /26, *26, *26/.test(c), 'цвет текста должен быть тёмным, получено: ' + c);
});

test('info красит фон в синий', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.info('i');
    assert.ok(/23, *162, *184/.test(h.element.style.background));
});

test('show({preset: name}) эквивалентно alerts.name()', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.show('ok', { preset: 'success' });
    assert.ok(/40, *167, *69/.test(h.element.style.background));
});

test('addPreset регистрирует пресет и создаёт метод-ярлык', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    a.addPreset('promo', {
        style: { 'background': 'rgb(255, 0, 255)' },
        duration: 20
    });
    assert.equal(typeof a.promo, 'function');
    const h = a.promo('hi');
    assert.ok(/255, *0, *255/.test(h.element.style.background));
});

test('addPreset без имени — ошибка', function () {
    resetDom();
    const a = new FlashAlerts();
    assert.throws(function () { a.addPreset('', {}); }, /name required/);
});

test('addPreset не затирает одноимённый метод класса (show)', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const originalShow = a.show;
    a.addPreset('show', { style: { 'background': 'red' } });
    // Доступ через show.name — метод остался. Но доступ через show(text, {preset:'show'}) тоже сработает.
    assert.strictEqual(a.show, originalShow, 'show() должен остаться оригинальным');
    const h = a.show('x', { preset: 'show' });
    assert.ok(/red|255, *0, *0/.test(h.element.style.background));
});

test('пресет c собственной position/effect применяется', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5 });
    a.addPreset('corner', { position: 'bottom-left', effect: 'instant' });
    a.corner('x');
    assert.ok(document.querySelector('[data-flash-alerts-container="bottom-left"]'));
});

test('локальные opts перекрывают пресет', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.success('x', { style: { 'background': 'rgb(1, 2, 3)' } });
    assert.ok(/1, *2, *3/.test(h.element.style.background), 'opts.style должен выигрывать у пресета');
});
