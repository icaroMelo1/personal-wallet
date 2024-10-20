import { collectDefaultMetrics, register } from "prom-client";

class MetricsService {
  private static instance: MetricsService;

  private constructor() {
    collectDefaultMetrics(); // Coleta métricas padrão
  }

  public static getInstance(): MetricsService {
    if (!this.instance) {
      this.instance = new MetricsService();
    }
    return this.instance;
  }

  public async getMetrics() {
    return register.metrics(); // Retorna as métricas
  }
}

export { MetricsService, register }; // Certifique-se de exportar register
