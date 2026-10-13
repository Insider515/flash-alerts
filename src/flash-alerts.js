/**
 * flash-alerts
 * Браузерные алерты без зависимостей.
 * Умеет: 9 фиксированных позиций экрана + вставка в произвольный DOM-элемент,
 * 6 встроенных эффектов + регистрация своих, пресеты (success/error/warning/info)
 * + регистрация своих, настраиваемые стили через API.
 *
 * UMD-обёртка: работает как глобал window.FlashAlerts, как CommonJS и как AMD.
 */
(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.FlashAlerts = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Девять фиксированных позиций экрана. Используются как ключ контейнера.
    var POSITIONS = [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'middle-center', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right'
    ];

    // Приводит объект стилей {camelCase или kebab-case: value} к inline-style строке.
    // Используется и для корневого алерта, и для контейнера.
    function applyStyle(el, style) {
        if (!style) return;
        for (var key in style) {
            if (!Object.prototype.hasOwnProperty.call(style, key)) continue;
            var cssKey = key.indexOf('-') >= 0
                ? key
                : key.replace(/([A-Z])/g, '-$1').toLowerCase();
            el.style.setProperty(cssKey, style[key]);
        }
    }

    // Слияние двух объектов стилей без мутации исходного.
    function mergeStyle(a, b) {
        var out = {};
        if (a) for (var k1 in a) if (Object.prototype.hasOwnProperty.call(a, k1)) out[k1] = a[k1];
        if (b) for (var k2 in b) if (Object.prototype.hasOwnProperty.call(b, k2)) out[k2] = b[k2];
        return out;
    }

    // Дефолтные inline-стили алерта. Задаются как объект, чтобы перекрывать точечно.
    var DEFAULT_STYLE = {
        'background': 'rgba(0, 0, 0, 0.82)',
        'color': '#ffffff',
        'padding': '12px 18px',
        'border-radius': '6px',
        'border': 'none',
        'font-family': 'inherit',
        'font-size': '14px',
        'font-weight': '400',
        'box-shadow': '0 6px 20px rgba(0, 0, 0, 0.18)',
        'max-width': '420px',
        'word-wrap': 'break-word',
        'pointer-events': 'auto',
        'box-sizing': 'border-box'
    };

    // Встроенные пресеты. Переопределяют только те поля стиля, что типичны для роли.
    // error по умолчанию прерывает речь скринридера (aria-live=assertive, role=alert).
    var DEFAULT_PRESETS = {
        success: { style: { 'background': 'rgba(40, 167, 69, 0.92)', 'color': '#ffffff' } },
        error:   {
            style: { 'background': 'rgba(220, 53, 69, 0.92)', 'color': '#ffffff' },
            role: 'alert',
            ariaLive: 'assertive'
        },
        warning: { style: { 'background': 'rgba(255, 193, 7, 0.95)', 'color': '#1a1a1a' } },
        info:    { style: { 'background': 'rgba(23, 162, 184, 0.92)', 'color': '#ffffff' } }
    };

    // Проверяет медиа-запрос prefers-reduced-motion.
    // Пользователь мог включить в ОС режим «уменьшенная анимация» (эпилепсия, укачивание).
    // В таком случае все переходы и typing-эффект отключаются.
    function isReducedMotion() {
        try {
            return typeof window !== 'undefined'
                && typeof window.matchMedia === 'function'
                && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (e) {
            return false;
        }
    }

    /**
     * Реестр встроенных эффектов.
     * Эффект — объект с методами:
     *   prepare(el, ctx): задать стартовое состояние ДО вставки/анимации входа
     *   in(el, ctx):      запустить анимацию входа (вернуть Promise или undefined)
     *   out(el, ctx):     запустить анимацию выхода (вернуть Promise или undefined)
     * ctx содержит: { animation, position, typingSpeed, text }
     */
    var DEFAULT_EFFECTS = {

        // fade: плавное появление/исчезновение через opacity
        fade: {
            prepare: function (el, ctx) {
                el.style.opacity = '0';
                el.style.transition = 'opacity ' + ctx.animation + 'ms ease';
            },
            in: function (el) {
                return new Promise(function (resolve) {
                    requestAnimationFrame(function () {
                        requestAnimationFrame(function () {
                            el.style.opacity = '1';
                            resolve();
                        });
                    });
                });
            },
            out: function (el) {
                el.style.opacity = '0';
            }
        },

        // slide: выезд с ближайшего края экрана по оси позиции
        slide: {
            prepare: function (el, ctx) {
                var pos = ctx.position || 'top-right';
                var tx = '0', ty = '0';
                if (pos.indexOf('right') >= 0) tx = '120%';
                else if (pos.indexOf('left') >= 0) tx = '-120%';
                else if (pos.indexOf('top') >= 0) ty = '-120%';
                else if (pos.indexOf('bottom') >= 0) ty = '120%';
                else ty = '-120%';
                el.style.opacity = '0';
                el.style.transform = 'translate(' + tx + ', ' + ty + ')';
                el.style.transition = 'transform ' + ctx.animation + 'ms ease, opacity ' + ctx.animation + 'ms ease';
            },
            in: function (el) {
                return new Promise(function (resolve) {
                    requestAnimationFrame(function () {
                        requestAnimationFrame(function () {
                            el.style.transform = 'translate(0, 0)';
                            el.style.opacity = '1';
                            resolve();
                        });
                    });
                });
            },
            out: function (el, ctx) {
                var pos = ctx.position || 'top-right';
                var tx = '0', ty = '0';
                if (pos.indexOf('right') >= 0) tx = '120%';
                else if (pos.indexOf('left') >= 0) tx = '-120%';
                else if (pos.indexOf('top') >= 0) ty = '-120%';
                else if (pos.indexOf('bottom') >= 0) ty = '120%';
                else ty = '-120%';
                el.style.transform = 'translate(' + tx + ', ' + ty + ')';
                el.style.opacity = '0';
            }
        },

        // scale: уменьшение/увеличение с лёгким fade
        scale: {
            prepare: function (el, ctx) {
                el.style.opacity = '0';
                el.style.transform = 'scale(0.8)';
                el.style.transition = 'transform ' + ctx.animation + 'ms ease, opacity ' + ctx.animation + 'ms ease';
            },
            in: function (el) {
                return new Promise(function (resolve) {
                    requestAnimationFrame(function () {
                        requestAnimationFrame(function () {
                            el.style.transform = 'scale(1)';
                            el.style.opacity = '1';
                            resolve();
                        });
                    });
                });
            },
            out: function (el) {
                el.style.transform = 'scale(0.8)';
                el.style.opacity = '0';
            }
        },

        // bounce: пружинная анимация появления через cubic-bezier
        bounce: {
            prepare: function (el, ctx) {
                el.style.opacity = '0';
                el.style.transform = 'scale(0.3)';
                el.style.transition = 'transform ' + ctx.animation + 'ms cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity ' + ctx.animation + 'ms ease';
            },
            in: function (el) {
                return new Promise(function (resolve) {
                    requestAnimationFrame(function () {
                        requestAnimationFrame(function () {
                            el.style.transform = 'scale(1)';
                            el.style.opacity = '1';
                            resolve();
                        });
                    });
                });
            },
            out: function (el) {
                el.style.transform = 'scale(0.3)';
                el.style.opacity = '0';
            }
        },

        // typing: мгновенное появление блока, текст печатается по буквам
        typing: {
            prepare: function (el, ctx) {
                el.setAttribute('data-full-text', ctx.text || '');
                el.textContent = '';
                el.style.opacity = '1';
                el.style.transition = 'opacity ' + ctx.animation + 'ms ease';
            },
            in: function (el, ctx) {
                return new Promise(function (resolve) {
                    var full = el.getAttribute('data-full-text') || '';
                    var i = 0;
                    var speed = ctx.typingSpeed || 30;
                    var timer = setInterval(function () {
                        if (i < full.length) {
                            el.textContent += full.charAt(i);
                            i++;
                        } else {
                            clearInterval(timer);
                            resolve();
                        }
                    }, speed);
                });
            },
            out: function (el) {
                el.style.opacity = '0';
            }
        },

        // instant: показ и скрытие без переходов
        instant: {
            prepare: function (el) {
                el.style.opacity = '1';
                el.style.transition = 'none';
            },
            in: function () { /* ничего */ },
            out: function (el) {
                el.style.opacity = '0';
            }
        }
    };

    // Применить inline-стили контейнера для одной из 9 фиксированных позиций.
    function stylePositionContainer(el, position, margin, gap, zIndex) {
        el.style.position = 'fixed';
        el.style.zIndex = String(zIndex);
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.gap = gap + 'px';
        el.style.pointerEvents = 'none';
        el.style.maxWidth = '100%';
        el.style.boxSizing = 'border-box';
        el.style.padding = margin + 'px';

        // горизонталь
        if (position.indexOf('left') >= 0) {
            el.style.left = '0';
            el.style.right = 'auto';
            el.style.alignItems = 'flex-start';
        } else if (position.indexOf('right') >= 0) {
            el.style.right = '0';
            el.style.left = 'auto';
            el.style.alignItems = 'flex-end';
        } else {
            el.style.left = '50%';
            el.style.right = 'auto';
            el.style.transform = 'translateX(-50%)';
            el.style.alignItems = 'center';
        }
        // вертикаль
        if (position.indexOf('top') >= 0) {
            el.style.top = '0';
            el.style.bottom = 'auto';
        } else if (position.indexOf('bottom') >= 0) {
            el.style.bottom = '0';
            el.style.top = 'auto';
            el.style.flexDirection = 'column-reverse';
        } else {
            // middle: центрируем по вертикали
            el.style.top = '50%';
            el.style.bottom = 'auto';
            var tx = position.indexOf('center') >= 0 ? '-50%' : '0';
            el.style.transform = 'translate(' + tx + ', -50%)';
        }
    }

    // Применить inline-стили контейнера, встроенного внутрь произвольного DOM-элемента.
    function styleTargetContainer(el, gap) {
        el.style.position = 'relative';
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.gap = gap + 'px';
        el.style.pointerEvents = 'none';
        el.style.width = '100%';
        el.style.boxSizing = 'border-box';
        el.style.alignItems = 'stretch';
    }

    /**
     * FlashAlerts
     * @param {Object} [options] дефолтные настройки инстанса
     *   position             — позиция по умолчанию (one of POSITIONS)
     *   effect               — эффект по умолчанию (имя из реестра эффектов)
     *   duration             — время показа алерта (мс)
     *   animation            — длительность анимации входа/выхода (мс)
     *   typingSpeed          — для эффекта typing (мс/символ)
     *   gap                  — промежуток между соседними алертами в контейнере (px)
     *   margin               — отступ контейнера от края экрана (px)
     *   zIndex               — z-index контейнера
     *   style                — объект inline-стилей алерта (перекрывает DEFAULT_STYLE)
     *   role                 — ARIA-роль алерта (по умолчанию 'status')
     *   ariaLive             — ARIA-live регион ('off' | 'polite' | 'assertive', по умолчанию 'polite')
     *   respectReducedMotion — учитывать prefers-reduced-motion (по умолчанию true)
     */
    function FlashAlerts(options) {
        if (!(this instanceof FlashAlerts)) return new FlashAlerts(options);
        options = options || {};

        this.defaults = {
            position: options.position || 'top-right',
            effect: options.effect || 'fade',
            duration: typeof options.duration === 'number' ? options.duration : 4000,
            animation: typeof options.animation === 'number' ? options.animation : 300,
            typingSpeed: typeof options.typingSpeed === 'number' ? options.typingSpeed : 30,
            gap: typeof options.gap === 'number' ? options.gap : 10,
            margin: typeof options.margin === 'number' ? options.margin : 20,
            zIndex: typeof options.zIndex === 'number' ? options.zIndex : 9999,
            style: mergeStyle(DEFAULT_STYLE, options.style),
            role: options.role || 'status',
            ariaLive: options.ariaLive || 'polite',
            respectReducedMotion: options.respectReducedMotion !== false
        };

        // Реестр эффектов и пресетов инстанса — копия дефолтов (чтобы изменения на инстансе не текли в глобал).
        this.effects = {};
        for (var ekey in DEFAULT_EFFECTS) if (Object.prototype.hasOwnProperty.call(DEFAULT_EFFECTS, ekey)) {
            this.effects[ekey] = DEFAULT_EFFECTS[ekey];
        }
        this.presets = {};
        for (var pkey in DEFAULT_PRESETS) if (Object.prototype.hasOwnProperty.call(DEFAULT_PRESETS, pkey)) {
            this.presets[pkey] = DEFAULT_PRESETS[pkey];
            this._bindPreset(pkey);
        }

        // Карта контейнеров: ключ "fixed:<position>" или "target:<node-uid>".
        this._containers = {};
        this._targetUid = 0;
    }

    // Создать или вернуть контейнер для фиксированной позиции экрана.
    FlashAlerts.prototype._getFixedContainer = function (position) {
        var key = 'fixed:' + position;
        if (this._containers[key] && document.body.contains(this._containers[key])) {
            return this._containers[key];
        }
        var el = document.createElement('div');
        el.setAttribute('data-flash-alerts-container', position);
        stylePositionContainer(el, position, this.defaults.margin, this.defaults.gap, this.defaults.zIndex);
        document.body.appendChild(el);
        this._containers[key] = el;
        return el;
    };

    // Создать или вернуть контейнер внутри произвольного DOM-элемента (target).
    FlashAlerts.prototype._getTargetContainer = function (targetNode) {
        // Ищем уже созданный контейнер среди прямых детей.
        var existing = targetNode.querySelector(':scope > [data-flash-alerts-target]');
        if (existing) return existing;
        var el = document.createElement('div');
        el.setAttribute('data-flash-alerts-target', String(++this._targetUid));
        styleTargetContainer(el, this.defaults.gap);
        targetNode.appendChild(el);
        return el;
    };

    // Разрешить target: HTMLElement | строка-селектор | null.
    FlashAlerts.prototype._resolveTarget = function (target) {
        if (!target) return null;
        if (typeof target === 'string') {
            return document.querySelector(target);
        }
        if (target && target.nodeType === 1) return target;
        return null;
    };

    /**
     * Показать алерт.
     * @param {string} text
     * @param {Object} [opts] локальные настройки, перекрывают дефолты инстанса
     *   position, effect, duration, animation, typingSpeed, style
     *   target: HTMLElement | селектор — если задан, игнорирует position
     *   preset: имя пресета — применяется ПЕРЕД локальным style
     *   html: true — вставлять text как innerHTML (по умолчанию textContent, безопасно)
     *   role: ARIA-роль, по умолчанию 'status' ('alert' для error-пресета)
     *   ariaLive: 'off' | 'polite' | 'assertive' — ARIA-live регион
     *   respectReducedMotion: учитывать prefers-reduced-motion (по умолчанию true)
     *   onShow(el), onHide(el) — колбэки
     * @returns {Object} { close(): void } — ручное закрытие
     */
    FlashAlerts.prototype.show = function (text, opts) {
        opts = opts || {};
        var preset = opts.preset ? this.presets[opts.preset] : null;

        var position = opts.position || (preset && preset.position) || this.defaults.position;
        var effectName = opts.effect || (preset && preset.effect) || this.defaults.effect;
        var duration = (typeof opts.duration === 'number')
            ? opts.duration
            : (preset && typeof preset.duration === 'number' ? preset.duration : this.defaults.duration);
        var animation = (typeof opts.animation === 'number')
            ? opts.animation
            : (preset && typeof preset.animation === 'number' ? preset.animation : this.defaults.animation);
        var typingSpeed = (typeof opts.typingSpeed === 'number')
            ? opts.typingSpeed
            : (preset && typeof preset.typingSpeed === 'number' ? preset.typingSpeed : this.defaults.typingSpeed);
        var role = opts.role || (preset && preset.role) || this.defaults.role;
        var ariaLive = opts.ariaLive || (preset && preset.ariaLive) || this.defaults.ariaLive;
        var respectRM = (opts.respectReducedMotion !== undefined)
            ? opts.respectReducedMotion
            : this.defaults.respectReducedMotion;

        // Учёт prefers-reduced-motion: отключаем переходы и typing.
        if (respectRM && isReducedMotion()) {
            effectName = 'instant';
            animation = 0;
            typingSpeed = 1;
        }

        var style = mergeStyle(this.defaults.style, preset && preset.style);
        style = mergeStyle(style, opts.style);

        var effect = this.effects[effectName];
        if (!effect) effect = this.effects.fade;

        // Выбор контейнера: target важнее position
        var container;
        var targetNode = this._resolveTarget(opts.target);
        if (targetNode) {
            container = this._getTargetContainer(targetNode);
        } else {
            container = this._getFixedContainer(position);
        }

        // Создание элемента алерта
        var el = document.createElement('div');
        el.setAttribute('data-flash-alert', '');
        el.setAttribute('role', role);
        el.setAttribute('aria-live', ariaLive);
        el.setAttribute('aria-atomic', 'true');
        applyStyle(el, style);

        // Текст
        if (opts.html) {
            el.innerHTML = String(text);
        } else {
            el.textContent = String(text);
        }

        var ctx = {
            animation: animation,
            position: position,
            typingSpeed: typingSpeed,
            text: String(text)
        };

        // prepare — выставить стартовое состояние ДО вставки в DOM
        if (typeof effect.prepare === 'function') effect.prepare(el, ctx);
        // Для typing очистим content ещё раз на всякий случай (prepare уже это сделал)
        container.appendChild(el);

        var self = this;
        var hidden = false;
        var hideTimer = null;

        function doHide() {
            if (hidden) return;
            hidden = true;
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
            if (typeof effect.out === 'function') effect.out(el, ctx);
            // Снять элемент после анимации выхода
            setTimeout(function () {
                if (el.parentNode) el.parentNode.removeChild(el);
                if (typeof opts.onHide === 'function') opts.onHide(el);
            }, animation);
        }

        // in — запуск анимации входа; поддерживает Promise для typing
        var inResult = (typeof effect.in === 'function') ? effect.in(el, ctx) : undefined;
        var afterIn = function () {
            if (typeof opts.onShow === 'function') opts.onShow(el);
            hideTimer = setTimeout(doHide, duration);
        };
        if (inResult && typeof inResult.then === 'function') {
            inResult.then(afterIn);
        } else {
            afterIn();
        }

        return { close: doHide, element: el };
    };

    // Привязать метод-ярлык для пресета: this.success(text, opts) и т.п.
    FlashAlerts.prototype._bindPreset = function (name) {
        var self = this;
        // Не затирать уже существующие имена методов пакета.
        if (typeof self[name] === 'function') return;
        self[name] = function (text, opts) {
            var merged = opts ? Object.assign({}, opts, { preset: name }) : { preset: name };
            return self.show(text, merged);
        };
    };

    /**
     * Зарегистрировать пресет. Пресет — набор дефолтов для show():
     *   { style, position, effect, duration, animation, typingSpeed }
     * После регистрации доступен через instance.<name>(text, opts) и show(text, { preset: name }).
     */
    FlashAlerts.prototype.addPreset = function (name, config) {
        if (!name || typeof name !== 'string') throw new Error('addPreset: name required');
        this.presets[name] = config || {};
        this._bindPreset(name);
        return this;
    };

    /**
     * Зарегистрировать эффект. Эффект — объект:
     *   { prepare?(el, ctx), in?(el, ctx), out?(el, ctx) }
     * ctx = { animation, position, typingSpeed, text }
     * in может вернуть Promise — тогда таймер скрытия стартует после его резолва.
     */
    FlashAlerts.prototype.addEffect = function (name, effect) {
        if (!name || typeof name !== 'string') throw new Error('addEffect: name required');
        if (!effect || typeof effect !== 'object') throw new Error('addEffect: effect object required');
        this.effects[name] = effect;
        return this;
    };

    // Обновить дефолты уже созданного инстанса. style сливается с текущим.
    FlashAlerts.prototype.configure = function (options) {
        options = options || {};
        for (var key in options) {
            if (!Object.prototype.hasOwnProperty.call(options, key)) continue;
            if (key === 'style') {
                this.defaults.style = mergeStyle(this.defaults.style, options.style);
            } else {
                this.defaults[key] = options[key];
            }
        }
        return this;
    };

    // Список доступных позиций — для подсказок/документации.
    FlashAlerts.POSITIONS = POSITIONS.slice();
    // Имена встроенных эффектов — для подсказок/документации.
    FlashAlerts.EFFECTS = Object.keys(DEFAULT_EFFECTS);
    // Имена встроенных пресетов — для подсказок/документации.
    FlashAlerts.PRESETS = Object.keys(DEFAULT_PRESETS);

    return FlashAlerts;
}));
