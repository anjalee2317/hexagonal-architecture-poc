"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const client_ses_1 = require("@aws-sdk/client-ses");
/**
 * Implementation of the NotificationUseCase interface
 * This service handles sending notifications via email using AWS SES
 */
class NotificationService {
    /**
     * Constructor for NotificationService
     * @param defaultSender Default sender email address
     * @param region AWS Region
     */
    constructor(defaultSender = 'noreply@taskapp.com', region = process.env.REGION || 'us-east-1') {
        this.defaultSender = defaultSender;
        this.region = region;
        this.sesClient = new client_ses_1.SESClient({ region: this.region });
    }
    /**
     * Send an email notification
     * @param params Email parameters
     */
    async sendEmail(params) {
        try {
            // Validate email parameters
            this.validateEmailParams(params);
            console.log(`Preparing to send email to ${params.to} with subject "${params.subject}"`);
            // Create the SendEmailCommand
            const command = new client_ses_1.SendEmailCommand({
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
        }
        catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
    /**
     * Validate email parameters
     * @param params Email parameters
     */
    validateEmailParams(params) {
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
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTm90aWZpY2F0aW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hcHBsaWNhdGlvbi9zZXJ2aWNlcy9Ob3RpZmljYXRpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG9EQUFrRTtBQUVsRTs7O0dBR0c7QUFDSCxNQUFhLG1CQUFtQjtJQUs5Qjs7OztPQUlHO0lBQ0gsWUFBWSxnQkFBd0IscUJBQXFCLEVBQUUsU0FBaUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksV0FBVztRQUMzRyxJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUNuQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksc0JBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUMxRCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFtQjtRQUNqQyxJQUFJLENBQUM7WUFDSCw0QkFBNEI7WUFDNUIsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBRWpDLE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCLE1BQU0sQ0FBQyxFQUFFLGtCQUFrQixNQUFNLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztZQUV4Riw4QkFBOEI7WUFDOUIsTUFBTSxPQUFPLEdBQUcsSUFBSSw2QkFBZ0IsQ0FBQztnQkFDbkMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLGFBQWE7Z0JBQ3pDLFdBQVcsRUFBRTtvQkFDWCxXQUFXLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO29CQUN4QixXQUFXLEVBQUUsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFO29CQUM1QixZQUFZLEVBQUUsTUFBTSxDQUFDLEdBQUcsSUFBSSxFQUFF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LENBQUM7SUFDaEMsQ0FBQztDQUNGO0FBbkhELGtEQW1IQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5vdGlmaWNhdGlvblVzZUNhc2UsIEVtYWlsUGFyYW1zIH0gZnJvbSAnLi4vcG9ydHMvaW4vTm90aWZpY2F0aW9uVXNlQ2FzZSc7XG5pbXBvcnQgeyBTRVNDbGllbnQsIFNlbmRFbWFpbENvbW1hbmQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtc2VzJztcblxuLyoqXG4gKiBJbXBsZW1lbnRhdGlvbiBvZiB0aGUgTm90aWZpY2F0aW9uVXNlQ2FzZSBpbnRlcmZhY2VcbiAqIFRoaXMgc2VydmljZSBoYW5kbGVzIHNlbmRpbmcgbm90aWZpY2F0aW9ucyB2aWEgZW1haWwgdXNpbmcgQVdTIFNFU1xuICovXG5leHBvcnQgY2xhc3MgTm90aWZpY2F0aW9uU2VydmljZSBpbXBsZW1lbnRzIE5vdGlmaWNhdGlvblVzZUNhc2Uge1xuICBwcml2YXRlIHJlYWRvbmx5IGRlZmF1bHRTZW5kZXI6IHN0cmluZztcbiAgcHJpdmF0ZSByZWFkb25seSByZWdpb246IHN0cmluZztcbiAgcHJpdmF0ZSByZWFkb25seSBzZXNDbGllbnQ6IFNFU0NsaWVudDtcblxuICAvKipcbiAgICogQ29uc3RydWN0b3IgZm9yIE5vdGlmaWNhdGlvblNlcnZpY2VcbiAgICogQHBhcmFtIGRlZmF1bHRTZW5kZXIgRGVmYXVsdCBzZW5kZXIgZW1haWwgYWRkcmVzc1xuICAgKiBAcGFyYW0gcmVnaW9uIEFXUyBSZWdpb25cbiAgICovXG4gIGNvbnN0cnVjdG9yKGRlZmF1bHRTZW5kZXI6IHN0cmluZyA9ICdub3JlcGx5QHRhc2thcHAuY29tJywgcmVnaW9uOiBzdHJpbmcgPSBwcm9jZXNzLmVudi5SRUdJT04gfHwgJ3VzLWVhc3QtMScpIHtcbiAgICB0aGlzLmRlZmF1bHRTZW5kZXIgPSBkZWZhdWx0U2VuZGVyO1xuICAgIHRoaXMucmVnaW9uID0gcmVnaW9uO1xuICAgIHRoaXMuc2VzQ2xpZW50ID0gbmV3IFNFU0NsaWVudCh7IHJlZ2lvbjogdGhpcy5yZWdpb24gfSk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBhbiBlbWFpbCBub3RpZmljYXRpb25cbiAgICogQHBhcmFtIHBhcmFtcyBFbWFpbCBwYXJhbWV0ZXJzXG4gICAqL1xuICBhc3luYyBzZW5kRW1haWwocGFyYW1zOiBFbWFpbFBhcmFtcyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBWYWxpZGF0ZSBlbWFpbCBwYXJhbWV0ZXJzXG4gICAgICB0aGlzLnZhbGlkYXRlRW1haWxQYXJhbXMocGFyYW1zKTtcblxuICAgICAgY29uc29sZS5sb2coYFByZXBhcmluZyB0byBzZW5kIGVtYWlsIHRvICR7cGFyYW1zLnRvfSB3aXRoIHN1YmplY3QgXCIke3BhcmFtcy5zdWJqZWN0fVwiYCk7XG5cbiAgICAgIC8vIENyZWF0ZSB0aGUgU2VuZEVtYWlsQ29tbWFuZFxuICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBTZW5kRW1haWxDb21tYW5kKHtcbiAgICAgICAgU291cmNlOiBwYXJhbXMuZnJvbSB8fCB0aGlzLmRlZmF1bHRTZW5kZXIsXG4gICAgICAgIERlc3RpbmF0aW9uOiB7XG4gICAgICAgICAgVG9BZGRyZXNzZXM6IFtwYXJhbXMudG9dLFxuICAgICAgICAgIENjQWRkcmVzc2VzOiBwYXJhbXMuY2MgfHwgW10sXG4gICAgICAgICAgQmNjQWRkcmVzc2VzOiBwYXJhbXMuYmNjIHx8IFtdLFxuICAgICAgICB9LFxuICAgICAgICBNZXNzYWdlOiB7XG4gICAgICAgICAgU3ViamVjdDoge1xuICAgICAgICAgICAgRGF0YTogcGFyYW1zLnN1YmplY3QsXG4gICAgICAgICAgICBDaGFyc2V0OiAnVVRGLTgnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgQm9keTogcGFyYW1zLmlzSHRtbCBcbiAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgIEh0bWw6IHtcbiAgICAgICAgICAgICAgICAgIERhdGE6IHBhcmFtcy5ib2R5LFxuICAgICAgICAgICAgICAgICAgQ2hhcnNldDogJ1VURi04JyxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgIFRleHQ6IHtcbiAgICAgICAgICAgICAgICAgIERhdGE6IHBhcmFtcy5ib2R5LFxuICAgICAgICAgICAgICAgICAgQ2hhcnNldDogJ1VURi04JyxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBTZW5kIHRoZSBlbWFpbFxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLnNlc0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuICAgICAgY29uc29sZS5sb2coJ0VtYWlsIHNlbnQgc3VjY2Vzc2Z1bGx5OicsIHJlc3BvbnNlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc2VuZGluZyBlbWFpbDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgZW1haWwgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0gcGFyYW1zIEVtYWlsIHBhcmFtZXRlcnNcbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVFbWFpbFBhcmFtcyhwYXJhbXM6IEVtYWlsUGFyYW1zKTogdm9pZCB7XG4gICAgaWYgKCFwYXJhbXMudG8pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUmVjaXBpZW50IGVtYWlsIGFkZHJlc3MgaXMgcmVxdWlyZWQnKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuaXNWYWxpZEVtYWlsKHBhcmFtcy50bykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCByZWNpcGllbnQgZW1haWwgYWRkcmVzczogJHtwYXJhbXMudG99YCk7XG4gICAgfVxuXG4gICAgaWYgKCFwYXJhbXMuc3ViamVjdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFbWFpbCBzdWJqZWN0IGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgaWYgKCFwYXJhbXMuYm9keSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdFbWFpbCBib2R5IGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgaWYgKHBhcmFtcy5mcm9tICYmICF0aGlzLmlzVmFsaWRFbWFpbChwYXJhbXMuZnJvbSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBzZW5kZXIgZW1haWwgYWRkcmVzczogJHtwYXJhbXMuZnJvbX1gKTtcbiAgICB9XG5cbiAgICBpZiAocGFyYW1zLmNjKSB7XG4gICAgICBmb3IgKGNvbnN0IGNjIG9mIHBhcmFtcy5jYykge1xuICAgICAgICBpZiAoIXRoaXMuaXNWYWxpZEVtYWlsKGNjKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBDQyBlbWFpbCBhZGRyZXNzOiAke2NjfWApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBhcmFtcy5iY2MpIHtcbiAgICAgIGZvciAoY29uc3QgYmNjIG9mIHBhcmFtcy5iY2MpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWRFbWFpbChiY2MpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIEJDQyBlbWFpbCBhZGRyZXNzOiAke2JjY31gKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhbiBlbWFpbCBhZGRyZXNzIGlzIHZhbGlkXG4gICAqIEBwYXJhbSBlbWFpbCBFbWFpbCBhZGRyZXNzIHRvIHZhbGlkYXRlXG4gICAqL1xuICBwcml2YXRlIGlzVmFsaWRFbWFpbChlbWFpbDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZW1haWxSZWdleCA9IC9eW15cXHNAXStAW15cXHNAXStcXC5bXlxcc0BdKyQvO1xuICAgIHJldHVybiBlbWFpbFJlZ2V4LnRlc3QoZW1haWwpO1xuICB9XG59XG4iXX0=