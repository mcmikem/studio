// Simple logger to replace console statements
// Set process.env.DISABLE_LOGS=true to disable in prod
export const logger = {
  info: (...args: any[]) => {
    if (process.env.DISABLE_LOGS !== 'true') console.info(...args);
  },
  error: (...args: any[]) => {
    if (process.env.DISABLE_LOGS !== 'true') console.error(...args);
  },
  warn: (...args: any[]) => {
    if (process.env.DISABLE_LOGS !== 'true') console.warn(...args);
  },
  debug: (...args: any[]) => {
    if (process.env.DISABLE_LOGS !== 'true') console.debug(...args);
  },
};

export default logger;