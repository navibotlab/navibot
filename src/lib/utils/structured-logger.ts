/**
 * Classe para geração de logs estruturados
 * Permite manter um contexto de log consistente durante toda a execução de um fluxo
 */
export class StructuredLogger {
  private serviceName: string;
  private correlationId: string;

  /**
   * Cria uma instância do logger estruturado
   * @param serviceName Nome do serviço que está gerando os logs
   * @param correlationId ID de correlação para rastreamento do fluxo
   */
  constructor(serviceName: string, correlationId: string) {
    this.serviceName = serviceName;
    this.correlationId = correlationId || 'no-correlation-id';
  }

  /**
   * Gera um log de nível INFO
   * @param message Mensagem do log
   * @param data Dados adicionais para o log
   */
  public info(message: string, data?: Record<string, any>): void {
    this.log('info', message, data);
  }

  /**
   * Gera um log de nível WARN
   * @param message Mensagem do log
   * @param data Dados adicionais para o log
   */
  public warn(message: string, data?: Record<string, any>): void {
    this.log('warn', message, data);
  }

  /**
   * Gera um log de nível ERROR
   * @param message Mensagem do log
   * @param data Dados adicionais para o log
   */
  public error(message: string, data?: Record<string, any>): void {
    this.log('error', message, data);
  }

  /**
   * Método interno para formatação e exibição dos logs
   * @param level Nível do log (info, warn, error)
   * @param message Mensagem do log
   * @param data Dados adicionais para o log
   */
  private log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      correlationId: this.correlationId,
      message,
      ...(data || {})
    };

    switch (level) {
      case 'info':
        console.log(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
    }
  }
} 