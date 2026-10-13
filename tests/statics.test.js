/**
 * Проверка статических полей класса FlashAlerts.
 * Эти поля — часть публичного контракта и используются как подсказка,
 * какие позиции/эффекты/пресеты доступны из коробки.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initDom } = require('./helpers');

initDom();
const FlashAlerts = require('../index.js');

test('POSITIONS содержит ровно 9 фиксированных позиций', function () {
    const expected = [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'middle-center', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right'
    ];
    assert.deepEqual(FlashAlerts.POSITIONS, expected);
});

test('EFFECTS содержит минимум 6 встроенных эффектов', function () {
    const effects = FlashAlerts.EFFECTS;
    assert.ok(Array.isArray(effects));
    assert.ok(effects.length >= 6, 'ожидается минимум 6 эффектов, получено ' + effects.length);
    ['fade', 'slide', 'scale', 'bounce', 'typing', 'instant'].forEach(function (name) {
        assert.ok(effects.indexOf(name) >= 0, 'нет встроенного эффекта: ' + name);
    });
});

test('PRESETS содержит success, error, warning, info', function () {
    assert.deepEqual(
        FlashAlerts.PRESETS.sort(),
        ['error', 'info', 'success', 'warning']
    );
});

test('мутация FlashAlerts.POSITIONS не ломает работу show()', function () {
    const snapshot = FlashAlerts.POSITIONS.slice();
    FlashAlerts.POSITIONS.push('fake-position');
    try {
        const a = new FlashAlerts({ duration: 10, animation: 5, effect: 'instant' });
        a.show('ok', { position: 'top-right' });
        const container = document.querySelector('[data-flash-alerts-container="top-right"]');
        assert.ok(container, 'контейнер top-right должен быть создан, несмотря на мутацию статики');
    } finally {
        // Восстанавливаем — мутируем ту же ссылку обратно к исходному состоянию.
        FlashAlerts.POSITIONS.length = 0;
        snapshot.forEach(function (p) { FlashAlerts.POSITIONS.push(p); });
        document.body.innerHTML = '';
    }
});
