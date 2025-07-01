import { NotificationUseCase, EmailParams } from '../ports/in/NotificationUseCase';
/**
 * Implementation of the NotificationUseCase interface
 * This service handles sending notifications via email using AWS SES
 */
export declare class NotificationService implements NotificationUseCase {
    private readonly defaultSender;
    private readonly region;
    private readonly sesClient;
    /**
     * Constructor for NotificationService
     * @param defaultSender Default sender email address
     * @param region AWS Region
     */
    constructor(defaultSender?: string, region?: string);
    /**
     * Send an email notification
     * @param params Email parameters
     */
    sendEmail(params: EmailParams): Promise<void>;
    /**
     * Validate email parameters
     * @param params Email parameters
     */
    private validateEmailParams;
    /**
     * Check if an email address is valid
     * @param email Email address to validate
     */
    private isValidEmail;
}
