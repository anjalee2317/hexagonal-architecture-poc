/**
 * Interface for notification use cases
 */
export interface NotificationUseCase {
    /**
     * Send an email notification
     * @param params Email parameters
     */
    sendEmail(params: EmailParams): Promise<void>;
}
/**
 * Email parameters
 */
export interface EmailParams {
    /**
     * Recipient email address
     */
    to: string;
    /**
     * Email subject
     */
    subject: string;
    /**
     * Email body content
     */
    body: string;
    /**
     * Whether the body is HTML (true) or plain text (false)
     */
    isHtml?: boolean;
    /**
     * Optional CC recipients
     */
    cc?: string[];
    /**
     * Optional BCC recipients
     */
    bcc?: string[];
    /**
     * Optional sender email address (if different from default)
     */
    from?: string;
}
