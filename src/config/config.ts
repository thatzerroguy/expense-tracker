import * as process from 'node:process';

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  gmailPassword: process.env.GMAIL_PASSWORD,
  gmailUser: process.env.GMAIL_USERNAME,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
  smtpService: process.env.SMTP_SERVICE,
});
