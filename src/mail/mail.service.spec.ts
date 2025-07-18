import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';

describe('MailService', () => {
  let service: MailService;
  const mockMailerService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMail', () => {
    it('should send mail and return success response', async () => {
      const mailParams = {
        subject: 'Welcome!',
        to: 'user@example.com',
        from: 'no-reply@example.com',
        template: 'welcome',
        context: { name: 'Test User' },
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      mockMailerService.sendMail.mockResolvedValue(undefined); // simulating success

      const result = await service.sendMail(
        mailParams.subject,
        mailParams.to,
        mailParams.from,
        mailParams.template,
        mailParams.context,
      );

      expect(result).toEqual({
        message: 'Email sent successfully',
        status: 200,
        send: mailParams,
      });

      expect(mockMailerService.sendMail).toHaveBeenCalledWith(mailParams);
    });
  });
});
