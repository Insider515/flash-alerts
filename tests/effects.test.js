/**
 * Тесты встроенных эффектов и регистрации своих.
 * Для каждого встроенного эффекта проверяется, что prepare выставляет
 * ожидаемые стили перед показом, и что out() запускает обратное состояние.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initDom, resetDom, wait } = require('./helpers');

initDom();
const FlashAlerts = require('../index.js');

test('fade: prepare выставляет opacity: 0 и transition по opacity', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 100, animation: 20, effect: 'fade' });
    const h = a.show('x', { position: 'top-right' });
    assert.equal(h.element.style.opacity, '0', 'сразу после prepare opacity=0');
    assert.ok(/opacity/.test(h.element.style.transition));
});

test('fade: opacity становится 1 после кадра анимации', async function () {
    resetDom();
    const a = new FlashAlerts({ duration: 200, animation: 20, effect: 'fade' });
    const h = a.show('x', { position: 'top-right' });
    await wait(50);
    assert.equal(h.element.style.opacity, '1');
});

test('slide: transform для разных позиций указывает в сторону края', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 100, animation: 20, effect: 'slide' });
    const cases = [
        { position: 'top-right',    expect: /translate\(120%, *0\)/ },
        { position: 'top-left',     expect: /translate\(-120%, *0\)/ },
        { position: 'top-center',   expect: /translate\(0, *-120%\)/ },
        { position: 'bottom-center',expect: /translate\(0, *120%\)/ },
        { position: 'middle-right', expect: /translate\(120%, *0\)/ },
        { position: 'middle-left',  expect: /translate\(-120%, *0\)/ }
    ];
    cases.forEach(function (c) {
        resetDom();
        const h = a.show('x', { position: c.position });
        assert.ok(c.expect.test(h.element.style.transform),
            c.position + ': transform=' + h.element.style.transform + ' не соответствует ' + c.expect);
    });
});

test('scale: prepare — scale(0.8), opacity: 0', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 100, animation: 20, effect: 'scale' });
    const h = a.show('x', { position: 'top-right' });
    assert.equal(h.element.style.opacity, '0');
    assert.ok(/scale\(0\.8\)/.test(h.element.style.transform));
});

test('bounce: cubic-bezier в transition, scale(0.3) в prepare', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 100, animation: 20, effect: 'bounce' });
    const h = a.show('x', { position: 'top-right' });
    assert.ok(/cubic-bezier/.test(h.element.style.transition), 'transition должен включать cubic-bezier');
    assert.ok(/scale\(0\.3\)/.test(h.element.style.transform));
});

test('instant: transition: none, opacity: 1 сразу', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 100, animation: 20, effect: 'instant' });
    const h = a.show('x', { position: 'top-right' });
    assert.equal(h.element.style.transition, 'none');
    assert.equal(h.element.style.opacity, '1');
});

test('typing: text печатается по буквам', async function () {
    resetDom();
    const a = new FlashAlerts({ duration: 500, animation: 20, effect: 'typing', typingSpeed: 5 });
    const h = a.show('hello', { position: 'top-right' });
    // Сразу после show текст пустой, data-full-text содержит целевую строку
    assert.equal(h.element.getAttribute('data-full-text'), 'hello');
    assert.equal(h.element.textContent, '');
    // Через 5*len+запас всё должно быть напечатано
    await wait(80);
    assert.equal(h.element.textContent, 'hello');
});

test('addEffect регистрирует новый эффект, который можно вызвать через show', function () {
    resetDom();
    const a = new FlashAlerts({ duration: 100, animation: 20 });
    let prepareCalled = 0;
    let inCalled = 0;
    a.addEffect('custom-x', {
        prepare: function (el) { prepareCalled++; el.setAttribute('data-marker', 'yes'); },
        in:      function () { inCalled++; },
        out:     function (el) { el.style.opacity = '0'; }
    });
    const h = a.show('x', { position: 'top-right', effect: 'custom-x' });
    assert.equal(prepareCalled, 1);
    assert.equal(inCalled, 1);
    assert.equal(h.element.getAttribute('data-marker'), 'yes');
});

test('addEffect без имени — ошибка', function () {
    resetDom();
    const a = new FlashAlerts();
    assert.throws(function () { a.addEffect('', { in: function () {} }); }, /name required/);
});

test('addEffect без тела эффекта — ошибка', function () {
    resetDom();
    const a = new FlashAlerts();
    assert.throws(function () { a.addEffect('abc', null); }, /effect object required/);
});

test('эффект с async in: таймер скрытия ждёт разрешения Promise', async function () {
    resetDom();
    const a = new FlashAlerts({ duration: 50, animation: 20 });
    let resolveIn = null;
    a.addEffect('manual', {
        prepare: function () {},
        in: function () { return new Promise(function (r) { resolveIn = r; }); },
        out: function (el) { el.style.opacity = '0'; }
    });
    const h = a.show('x', { position: 'top-right', effect: 'manual' });

    // Пока in не разрешён — таймер скрытия не стартовал. Ждём с запасом duration+animation.
    await wait(100);
    assert.ok(h.element.parentNode, 'без разрешения in алерт не должен скрываться');

    // Разрешаем in — теперь должны отработать duration (50) и animation (20).
    resolveIn();
    await wait(40);
    assert.ok(h.element.parentNode, 'через 40мс после in — ещё жив (duration=50)');
    await wait(80);
    assert.equal(h.element.parentNode, null, 'после duration+animation удалён');
});
