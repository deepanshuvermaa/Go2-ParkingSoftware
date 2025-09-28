type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const shouldLog = __DEV__;

const log = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
  if (!shouldLog && level === 'debug') {
    return;
  }

  const payload = context ? `${message} ${JSON.stringify(context)}` : message;

  switch (level) {
    case 'debug':
      console.log(`🛠️ [DEBUG] ${payload}`);
      break;
    case 'info':
      console.info(`ℹ️ [INFO] ${payload}`);
      break;
    case 'warn':
      console.warn(`⚠️ [WARN] ${payload}`);
      break;
    case 'error':
      console.error(`🚨 [ERROR] ${payload}`);
      break;
  }
};

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context)
};
