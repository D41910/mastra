import { Mastra } from '@mastra/core/mastra';
import { ConsoleLogger } from '@mastra/core/logger';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';
import { CloudflareDeployer } from '@mastra/deployer-cloudflare';
import { testRoute } from './api/route/test';
import { jsonSchemaValidationRoute } from './api/route/json-schema-validation';
import { PostgresStore } from '@mastra/pg';

const storage = new PostgresStore({
  id: 'e2e-postgres-storage',
  connectionString: 'test-connection-string',
});

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent },
  bundler: {
    externals: ['@mastra/pg'],
  },
  logger: new ConsoleLogger({ level: 'info' }),
  deployer: new CloudflareDeployer({
    name: 'hello-mastra',
    env: {
      NODE_ENV: 'production',
      API_KEY: 'test-api-key',
    },
  }),
  server: {
    apiRoutes: [testRoute, jsonSchemaValidationRoute],
  },
  storage,
});
