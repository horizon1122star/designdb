import fs from 'fs/promises';
import path from 'path';

export class Logger {
  private logDir: string;

  constructor() {
    this.logDir = path.resolve(process.cwd(), '.tmp', 'logs');
  }

  private async ensureDir() {
    try {
      await fs.access(this.logDir);
    } catch {
      await fs.mkdir(this.logDir, { recursive: true });
    }
  }

  async logInfo(context: string, message: string, data?: any) {
    await this.writeLog('INFO', context, message, data);
  }

  async logError(context: string, message: string, error?: any) {
    await this.writeLog('ERROR', context, message, error);
  }

  async logWarning(context: string, message: string, data?: any) {
    await this.writeLog('WARN', context, message, data);
  }

  private async writeLog(level: string, context: string, message: string, data?: any) {
    await this.ensureDir();
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context,
      message,
      data
    };
    
    console.log(`[${level}] ${context}: ${message}`);
    if (level === 'ERROR' && data) {
        console.error(data);
    }

    const logFile = path.join(this.logDir, `execution_log_${timestamp.split('T')[0]}.jsonl`);
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n', 'utf-8');
  }
}

export const logger = new Logger();
