// ESM entry: подключает UMD-ядро через createRequire и реэкспортирует.
// UMD-файл при загрузке через CommonJS отдаёт конструктор FlashAlerts как module.exports.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const FlashAlerts = require('./src/flash-alerts.js');
export default FlashAlerts;
export { FlashAlerts };
