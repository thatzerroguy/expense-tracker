import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        transport: {
          service: config.get<string>('smtpService'),
          host: config.get<string>('smtpHost'),
          port: config.get<number>('smtpPort'),
          secure: true,
          tls: {
            rejectUnauthorized: false,
          },
          auth: {
            user: config.get<string>('gmailUser'),
            pass: config.get<string>('gmailPassword'),
          },
        },
        template: {
          dir: __dirname + '/templates',
          adapter: new PugAdapter({}),
          options: { strict: true },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
