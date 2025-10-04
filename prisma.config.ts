import { defineConfig } from '@prisma/client/generator-build';

export default defineConfig({
  schema: './prisma/schema.prisma',
  client: {
    provider: 'prisma-client-js',
    engineType: 'binary'
  },
  datasource: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL
  }
});