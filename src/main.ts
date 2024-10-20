import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { MetricsService, register } from "./metrics.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Rota para as métricas
  app.getHttpAdapter().get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    try {
      const metrics = await MetricsService.getInstance().getMetrics();
      res.end(metrics);
    } catch (error) {
      console.error("Error retrieving metrics:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  await app.listen(3000);
}

bootstrap();
