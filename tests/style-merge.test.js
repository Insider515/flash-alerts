/**
 * Тесты слияния стилей.
 * Приоритет: defaults.style < preset.style < opts.style.
 * Также проверяем, что все девять настраиваемых свойств применяются к инлайн-стилю алерта.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initDom, resetDom } = require('./helpers');

initDom();
const FlashAlerts = require('../index.js');

test('опции show.style выигрывают у пресета, пресет — у дефолта', function () {
    resetDom();
    const a = new FlashAlerts({
        duration: 10, animation: 5, effect: 'instant',
        style: { 'background': 'rgb(1,1,1)', 'color': 'rgb(2,2,2)', 'padding': '10px' }
    });
    a.addPreset('p', { style: { 'color': 'rgb(5,5,5)', 'padding': '20px' } });
    const h = a.show('x', { preset: 'p', style: { 'padding': '30px' } });
    assert.ok(/1, *1, *1/.test(h.element.style.background), 'background из defaults');
    assert.ok(/5, *5, *5/.test(h.element.style.color), 'color из пресета (переопределил defaults)');
    assert.equal(h.element.style.padding, '30px', 'padding из opts (переопределил пресет)');
});

test('все заявленные настраиваемые свойства применяются', function () {
    resetDom();
    const a = new FlashAlerts({
        duration: 10, animation: 5, effect: 'instant',
        style: {
            'background': 'rgb(10, 20, 30)',
            'color': 'rgb(200, 200, 200)',
            'padding': '14px 22px',
            'border-radius': '12px',
            'border': '2px solid rgb(50, 50, 50)',
            'font-family': 'Arial, sans-serif',
            'font-size': '16px',
            'font-weight': '700',
            'box-shadow': '0 2px 8px rgba(0, 0, 0, 0.3)'
        }
    });
    const h = a.show('x', { position: 'top-right' });
    const s = h.element.style;
    assert.ok(/10, *20, *30/.test(s.background));
    assert.ok(/200, *200, *200/.test(s.color));
    assert.equal(s.padding, '14px 22px');
    assert.equal(s.borderRadius, '12px');
    assert.ok(/2px solid/.test(s.border));
    assert.equal(s.fontFamily, 'Arial, sans-serif');
    assert.equal(s.fontSize, '16px');
    assert.equal(s.fontWeight, '700');
    assert.ok(/0(px)? 2px 8px/.test(s.boxShadow), 'boxShadow=' + s.boxShadow);
});

test('camelCase-ключи стиля также работают (например backgroundColor)', function () {
    resetDom();
    const a = new FlashAlerts({
        duration: 10, animation: 5, effect: 'instant',
        style: { 'borderRadius': '20px', 'fontSize': '18px' }
    });
    const h = a.show('x', { position: 'top-right' });
    assert.equal(h.element.style.borderRadius, '20px');
    assert.equal(h.element.style.fontSize, '18px');
});

test('пустой style в опциях не ломает дефолты', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
    const h = a.show('x', { position: 'top-right', style: {} });
    // Дефолтный background — rgba(0,0,0,0.82)
    assert.ok(/rgba\(0, *0, *0, *0\.82\)/.test(h.element.style.background));
});
