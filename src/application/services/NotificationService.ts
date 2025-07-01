import { NotificationUseCase, EmailParams } from '../ports/in/NotificationUseCase';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

/**
 * Implementation of the NotificationUseCase interface
 * This service handles sending notifications via email using AWS SES
 */
export class NotificationService implements NotificationUseCase {
  private readonly defaultSender: string;
  private readonly region: string;
  private readonly sesClient: SESClient;

  /**
   * Constructor for NotificationService
   * @param defaultSender Default sender email address
   * @param region AWS Region
   */
  constructor(defaultSender: string = 'noreply@taskapp.com', region: string = process.env.REGION || 'us-east-1') {
    this.defaultSender = defaultSender;
    this.region = region;
    this.sesClient = new SESClient({ region: this.region });
  }

  /**
   * Send an email notification
   * @param params Email parameters
   */
  async sendEmail(params: EmailParams): Promise<void> {
    try {
      // Validate email parameters
      this.validateEmailParams(params);

      console.log(`Preparing to send email to ${params.to} with subject "${params.subject}"`);

      // Create the SendEmailCommand
      const command = new SendEmailCommand({
        Source: params.from || this.defaultSender,
        Destination: {
          ToAddresses: [params.to],
          CcAddresses: params.cc || [],
          BccAddresses: params.bcc || [],
        },
        Message: {
          Subject: {
            Data: params.subject,
            Charset: 'UTF-8',
          },
          Body: params.isHtml 
            ? {
                Html: {
                  Data: params.body,
                  Charset: 'UTF-8',
                }
              }
            : {
                Text: {
                  Data: params.body,
                  Charset: 'UTF-8',
                }
              }
        },
      });

      // Send the email
      const response = await this.sesClient.send(command);
      console.log('Email sent successfully:', response);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Validate email parameters
   * @param params Email parameters
   */
  private validateEmailParams(params: EmailParams): void {
    if (!params.to) {
      throw new Error('Recipient email address is required');
    }

    if (!this.isValidEmail(params.to)) {
      throw new Error(`Invalid recipient email address: ${params.to}`);
    }

    if (!params.subject) {
      throw new Error('Email subject is required');
    }

    if (!params.body) {
      throw new Error('Email body is required');
    }

    if (params.from && !this.isValidEmail(params.from)) {
      throw new Error(`Invalid sender email address: ${params.from}`);
    }

    if (params.cc) {
      for (const cc of params.cc) {
        if (!this.isValidEmail(cc)) {
          throw new Error(`Invalid CC email address: ${cc}`);
        }
      }
    }

    if (params.bcc) {
      for (const bcc of params.bcc) {
        if (!this.isValidEmail(bcc)) {
          throw new Error(`Invalid BCC email address: ${bcc}`);
        }
      }
    }
  }

  /**
   * Check if an email address is valid
   * @param email Email address to validate
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
