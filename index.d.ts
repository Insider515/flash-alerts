/**
 * flash-alerts — browser alerts/toasts without dependencies.
 * TypeScript definitions.
 *
 * Пакет распространяется как UMD/CJS: module.exports = FlashAlerts.
 * Отсюда export = в этом файле. При esModuleInterop работает и import FlashAlerts from 'flash-alerts',
 * и import { FlashAlerts } from 'flash-alerts' (через default-interop).
 */

/** Девять фиксированных позиций экрана. */
type Position =
    | 'top-left' | 'top-center' | 'top-right'
    | 'middle-left' | 'middle-center' | 'middle-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';

/** Имена встроенных эффектов. Пользовательские эффекты регистрируются через addEffect. */
type BuiltinEffect = 'fade' | 'slide' | 'scale' | 'bounce' | 'typing' | 'instant';

/** Имена встроенных пресетов. Пользовательские пресеты регистрируются через addPreset. */
type BuiltinPreset = 'success' | 'error' | 'warning' | 'info';

/** Значения атрибута aria-live. */
type AriaLive = 'off' | 'polite' | 'assertive';

/** Карта inline-стилей алерта. Ключи — CSS-свойства в kebab-case или camelCase. */
interface StyleMap {
    [cssProperty: string]: string;
}

/** Контекст, который получает каждый метод эффекта. */
interface EffectContext {
    animation: number;
    position: Position;
    typingSpeed: number;
    text: string;
}

/**
 * Описание эффекта.
 * prepare — задаёт стартовое состояние ДО вставки в DOM.
 * in      — анимация появления; возврат Promise задерживает таймер скрытия.
 * out     — анимация исчезновения.
 */
interface Effect {
    prepare?: (el: HTMLElement, ctx: EffectContext) => void;
    in?: (el: HTMLElement, ctx: EffectContext) => void | Promise<void>;
    out?: (el: HTMLElement, ctx: EffectContext) => void;
}

/** Описание пресета. Любое поле опционально. */
interface Preset {
    style?: StyleMap;
    position?: Position;
    effect?: BuiltinEffect | string;
    duration?: number;
    animation?: number;
    typingSpeed?: number;
    role?: string;
    ariaLive?: AriaLive;
}

/** Настройки инстанса FlashAlerts. */
interface FlashAlertsOptions {
    position?: Position;
    effect?: BuiltinEffect | string;
    duration?: number;
    animation?: number;
    typingSpeed?: number;
    gap?: number;
    margin?: number;
    zIndex?: number;
    style?: StyleMap;
    role?: string;
    ariaLive?: AriaLive;
    respectReducedMotion?: boolean;
}

/** Опции одного вызова show(). Перекрывают пресет, пресет перекрывает дефолты. */
interface ShowOptions {
    position?: Position;
    effect?: BuiltinEffect | string;
    duration?: number;
    animation?: number;
    typingSpeed?: number;
    style?: StyleMap;
    target?: string | HTMLElement | null;
    preset?: BuiltinPreset | string;
    html?: boolean;
    role?: string;
    ariaLive?: AriaLive;
    respectReducedMotion?: boolean;
    onShow?: (el: HTMLElement) => void;
    onHide?: (el: HTMLElement) => void;
}

/** Возврат show() — ручка для управления алертом. */
interface ShowHandle {
    close(): void;
    element: HTMLElement;
}

/** Основной класс. */
declare class FlashAlerts {
    constructor(options?: FlashAlertsOptions);

    defaults: {
        position: Position;
        effect: string;
        duration: number;
        animation: number;
        typingSpeed: number;
        gap: number;
        margin: number;
        zIndex: number;
        style: StyleMap;
        role: string;
        ariaLive: AriaLive;
        respectReducedMotion: boolean;
    };
    effects: { [name: string]: Effect };
    presets: { [name: string]: Preset };

    show(text: string, opts?: ShowOptions): ShowHandle;
    success(text: string, opts?: ShowOptions): ShowHandle;
    error(text: string, opts?: ShowOptions): ShowHandle;
    warning(text: string, opts?: ShowOptions): ShowHandle;
    info(text: string, opts?: ShowOptions): ShowHandle;

    addPreset(name: string, config: Preset): this;
    addEffect(name: string, effect: Effect): this;
    configure(options: FlashAlertsOptions): this;
}

declare namespace FlashAlerts {
    const POSITIONS: Position[];
    const EFFECTS: string[];
    const PRESETS: string[];

    // Реэкспорт типов для import type { ... } from 'flash-alerts'.
    export {
        Position,
        BuiltinEffect,
        BuiltinPreset,
        AriaLive,
        StyleMap,
        EffectContext,
        Effect,
        Preset,
        FlashAlertsOptions,
        ShowOptions,
        ShowHandle
    };
}

export = FlashAlerts;
