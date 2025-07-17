import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendMail(
    subject: string,
    to: string,
    from: string,
    template: string,
    context: ISendMailOptions['context'],
  ) {
    try {
      const sendMailParams = {
        subject: subject,
        to: to,
        from: from,
        template: template,
        context: context,
      };
      await this.mailerService.sendMail(sendMailParams);

      return {
        message: 'Welcome email sent successfully',
        status: HttpStatus.OK,
        send: sendMailParams,
      };
    } catch (error) {
      this.logger.error('Failed to send welcome email', error);
      throw error;
    }
  }
}
