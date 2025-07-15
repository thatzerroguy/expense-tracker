import * as process from 'node:process';

export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: process.env.DATABASE_URL,
});
