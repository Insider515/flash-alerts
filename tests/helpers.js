/**
 * Подготовка тестового DOM-окружения на базе jsdom.
 * Пакет flash-alerts использует глобалы: window, document, requestAnimationFrame.
 * UMD-обёртка смотрит на self/this — подставляем self как ссылку на global.
 */
const { JSDOM } = require('jsdom');

// Инициализирует глобалы для jsdom-окружения один раз на процесс тестов.
// Повторный вызов пересоздаёт document, чтобы изолировать тесты друг от друга.
function initDom() {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.Node = dom.window.Node;
    global.self = global;
    // Jsdom с pretendToBeVisual включает requestAnimationFrame.
    global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
    global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
    return dom;
}

// Удалить все контейнеры и пользовательские узлы между тестами,
// чтобы один тест не влиял на другой.
function resetDom() {
    document.body.innerHTML = '';
}

// Простое ожидание реального времени — используется чтобы дождаться
// завершения анимаций/таймеров внутри show().
function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

module.exports = { initDom, resetDom, wait };
