/**
 * Тесты конструктора FlashAlerts и метода configure().
 * Проверяется, что дефолты применяются, пользовательские опции перекрывают их,
 * style сливается с базовым, вызов без new работает.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initDom, resetDom } = require('./helpers');

initDom();
const FlashAlerts = require('../index.js');

test('вызов без new возвращает инстанс', function () {
    resetDom();
    const a = FlashAlerts();
    assert.ok(a instanceof FlashAlerts, 'без new должен возвращаться инстанс');
});

test('дефолтные параметры применяются', function () {
    resetDom();
    const a = new FlashAlerts();
    assert.equal(a.defaults.position, 'top-right');
    assert.equal(a.defaults.effect, 'fade');
    assert.equal(a.defaults.duration, 4000);
    assert.equal(a.defaults.animation, 300);
    assert.equal(a.defaults.typingSpeed, 30);
    assert.equal(a.defaults.gap, 10);
    assert.equal(a.defaults.margin, 20);
    assert.equal(a.defaults.zIndex, 9999);
});

test('пользовательские опции перекрывают дефолты', function () {
    resetDom();
    const a = new FlashAlerts({
        position: 'bottom-left',
        effect: 'slide',
        duration: 1000,
        animation: 150,
        typingSpeed: 10,
        gap: 5,
        margin: 8,
        zIndex: 12345
    });
    assert.equal(a.defaults.position, 'bottom-left');
    assert.equal(a.defaults.effect, 'slide');
    assert.equal(a.defaults.duration, 1000);
    assert.equal(a.defaults.animation, 150);
    assert.equal(a.defaults.typingSpeed, 10);
    assert.equal(a.defaults.gap, 5);
    assert.equal(a.defaults.margin, 8);
    assert.equal(a.defaults.zIndex, 12345);
});

test('style сливается с DEFAULT_STYLE: переданное выигрывает, остальное остаётся', function () {
    resetDom();
    const a = new FlashAlerts({
        style: {
            'background': 'red',
            'font-size': '20px'
        }
    });
    assert.equal(a.defaults.style['background'], 'red', 'переданный background должен выиграть');
    assert.equal(a.defaults.style['font-size'], '20px', 'переданный font-size должен выиграть');
    assert.equal(a.defaults.style['color'], '#ffffff', 'не переданный color сохраняется из дефолта');
    assert.equal(a.defaults.style['border-radius'], '6px', 'не переданный border-radius сохраняется');
});

test('configure() обновляет дефолты и возвращает this', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 100 });
    const ret = a.configure({ duration: 500, position: 'top-left' });
    assert.strictEqual(ret, a, 'configure должен возвращать this для цепочки');
    assert.equal(a.defaults.duration, 500);
    assert.equal(a.defaults.position, 'top-left');
});

test('configure() сливает style, не заменяет его целиком', function () {
    resetDom();
    const a = new FlashAlerts();
    a.configure({ style: { 'background': 'green' } });
    assert.equal(a.defaults.style['background'], 'green');
    assert.equal(a.defaults.style['color'], '#ffffff', 'color из дефолта не должен исчезнуть');
});

test('изменения на одном инстансе не влияют на другой инстанс', function () {
    resetDom();
    const a = new FlashAlerts();
    const b = new FlashAlerts();
    a.configure({ duration: 999 });
    a.addEffect('weird', { in: function () {} });
    a.addPreset('weird-preset', { style: { background: 'pink' } });
    assert.notEqual(b.defaults.duration, 999);
    assert.equal(typeof b.effects.weird, 'undefined');
    assert.equal(typeof b.presets['weird-preset'], 'undefined');
});
