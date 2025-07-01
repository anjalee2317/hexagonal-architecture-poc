"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const AuthService_1 = require("../../application/services/AuthService");
const EventBridgePublisher_1 = require("../out/EventBridgePublisher");
/**
 * Environment variables expected to be set in the Lambda function
 */
const USER_POOL_ID = process.env.USER_POOL_ID || '';
const USER_POOL_CLIENT_ID = process.env.USER_POOL_CLIENT_ID || '';
const REGION = process.env.REGION || 'us-east-1';
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || '';
// Create event publisher if event bus name is provided
const eventPublisher = EVENT_BUS_NAME ? new EventBridgePublisher_1.EventBridgePublisher(EVENT_BUS_NAME, REGION) : undefined;
/**
 * Lambda handler for authentication operations
 * This adapter handles API Gateway events for authentication operations
 */
const handler = async (event) => {
    try {
        console.log('Authentication request received:', JSON.stringify(event));
        // Create auth service
        const authService = new AuthService_1.AuthService(USER_POOL_ID, USER_POOL_CLIENT_ID, REGION, eventPublisher);
        // Parse request body
        const body = event.body ? JSON.parse(event.body) : {};
        // Get operation from path or body
        const path = event.path;
        const operation = body.operation || getOperationFromPath(path);
        let response;
        // Route to appropriate operation
        switch (operation) {
            case 'signUp':
                response = await authService.signUp(body.username, body.password, body.email, body.phoneNumber);
                break;
            case 'confirmSignUp':
                await authService.confirmSignUp(body.username, body.confirmationCode);
                response = { message: 'User confirmed successfully' };
                break;
            case 'resendConfirmationCode':
                await authService.resendConfirmationCode(body.username);
                response = { message: 'Confirmation code resent successfully' };
                break;
            case 'signIn':
                response = await authService.signIn(body.username, body.password);
                break;
            case 'respondToMfaChallenge':
                response = await authService.respondToMfaChallenge(body.username, body.session, body.mfaCode);
                break;
            case 'forgotPassword':
                await authService.forgotPassword(body.username);
                response = { message: 'Password reset initiated successfully' };
                break;
            case 'confirmForgotPassword':
                await authService.confirmForgotPassword(body.username, body.confirmationCode, body.newPassword);
                response = { message: 'Password reset confirmed successfully' };
                break;
            case 'changePassword':
                await authService.changePassword(getAuthToken(event), body.oldPassword, body.newPassword);
                response = { message: 'Password changed successfully' };
                break;
            case 'getCurrentUser':
                response = await authService.getCurrentUser(getAuthToken(event));
                break;
            case 'signOut':
                await authService.signOut(getAuthToken(event));
                response = { message: 'Signed out successfully' };
                break;
            case 'refreshTokens':
                response = await authService.refreshTokens(body.refreshToken);
                break;
            default:
                return {
                    statusCode: 400,
                    headers: getCorsHeaders(),
                    body: JSON.stringify({ message: 'Invalid operation' })
                };
        }
        return {
            statusCode: 200,
            headers: getCorsHeaders(),
            body: JSON.stringify(response)
        };
    }
    catch (error) {
        console.error('Error in authentication handler:', error);
        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                message: 'Error processing authentication request',
                error: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
};
exports.handler = handler;
/**
 * Extract operation from path
 * @param path API path
 */
function getOperationFromPath(path) {
    const pathSegments = path.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    switch (lastSegment) {
        case 'signup':
            return 'signUp';
        case 'confirm':
            return 'confirmSignUp';
        case 'resend-code':
            return 'resendConfirmationCode';
        case 'signin':
            return 'signIn';
        case 'mfa-challenge':
            return 'respondToMfaChallenge';
        case 'forgot-password':
            return 'forgotPassword';
        case 'confirm-forgot-password':
            return 'confirmForgotPassword';
        case 'change-password':
            return 'changePassword';
        case 'user':
            return 'getCurrentUser';
        case 'signout':
            return 'signOut';
        case 'refresh-tokens':
            return 'refreshTokens';
        default:
            return '';
    }
}
/**
 * Extract authorization token from event
 * @param event API Gateway event
 */
function getAuthToken(event) {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
        throw new Error('Authorization header is missing');
    }
    // Format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new Error('Invalid authorization header format');
    }
    return parts[1];
}
/**
 * Get CORS headers
 */
function getCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE,PATCH',
        'Content-Type': 'application/json'
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aEZ1bmN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FkYXB0ZXJzL2luL2F1dGhGdW5jdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx3RUFBcUU7QUFDckUsc0VBQW1FO0FBRW5FOztHQUVHO0FBQ0gsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLElBQUksRUFBRSxDQUFDO0FBQ3BELE1BQU0sbUJBQW1CLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxFQUFFLENBQUM7QUFDbEUsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksV0FBVyxDQUFDO0FBQ2pELE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxJQUFJLEVBQUUsQ0FBQztBQUV4RCx1REFBdUQ7QUFDdkQsTUFBTSxjQUFjLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxJQUFJLDJDQUFvQixDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0FBRXJHOzs7R0FHRztBQUNJLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUEyQixFQUFrQyxFQUFFO0lBQzNGLElBQUksQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsa0NBQWtDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRXZFLHNCQUFzQjtRQUN0QixNQUFNLFdBQVcsR0FBRyxJQUFJLHlCQUFXLENBQUMsWUFBWSxFQUFFLG1CQUFtQixFQUFFLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQztRQUUvRixxQkFBcUI7UUFDckIsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FB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QUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBBdXRoU2VydmljZSB9IGZyb20gJy4uLy4uL2FwcGxpY2F0aW9uL3NlcnZpY2VzL0F1dGhTZXJ2aWNlJztcbmltcG9ydCB7IEV2ZW50QnJpZGdlUHVibGlzaGVyIH0gZnJvbSAnLi4vb3V0L0V2ZW50QnJpZGdlUHVibGlzaGVyJztcblxuLyoqXG4gKiBFbnZpcm9ubWVudCB2YXJpYWJsZXMgZXhwZWN0ZWQgdG8gYmUgc2V0IGluIHRoZSBMYW1iZGEgZnVuY3Rpb25cbiAqL1xuY29uc3QgVVNFUl9QT09MX0lEID0gcHJvY2Vzcy5lbnYuVVNFUl9QT09MX0lEIHx8ICcnO1xuY29uc3QgVVNFUl9QT09MX0NMSUVOVF9JRCA9IHByb2Nlc3MuZW52LlVTRVJfUE9PTF9DTElFTlRfSUQgfHwgJyc7XG5jb25zdCBSRUdJT04gPSBwcm9jZXNzLmVudi5SRUdJT04gfHwgJ3VzLWVhc3QtMSc7XG5jb25zdCBFVkVOVF9CVVNfTkFNRSA9IHByb2Nlc3MuZW52LkVWRU5UX0JVU19OQU1FIHx8ICcnO1xuXG4vLyBDcmVhdGUgZXZlbnQgcHVibGlzaGVyIGlmIGV2ZW50IGJ1cyBuYW1lIGlzIHByb3ZpZGVkXG5jb25zdCBldmVudFB1Ymxpc2hlciA9IEVWRU5UX0JVU19OQU1FID8gbmV3IEV2ZW50QnJpZGdlUHVibGlzaGVyKEVWRU5UX0JVU19OQU1FLCBSRUdJT04pIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBhdXRoZW50aWNhdGlvbiBvcGVyYXRpb25zXG4gKiBUaGlzIGFkYXB0ZXIgaGFuZGxlcyBBUEkgR2F0ZXdheSBldmVudHMgZm9yIGF1dGhlbnRpY2F0aW9uIG9wZXJhdGlvbnNcbiAqL1xuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+ID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZygnQXV0aGVudGljYXRpb24gcmVxdWVzdCByZWNlaXZlZDonLCBKU09OLnN0cmluZ2lmeShldmVudCkpO1xuICAgIFxuICAgIC8vIENyZWF0ZSBhdXRoIHNlcnZpY2VcbiAgICBjb25zdCBhdXRoU2VydmljZSA9IG5ldyBBdXRoU2VydmljZShVU0VSX1BPT0xfSUQsIFVTRVJfUE9PTF9DTElFTlRfSUQsIFJFR0lPTiwgZXZlbnRQdWJsaXNoZXIpO1xuICAgIFxuICAgIC8vIFBhcnNlIHJlcXVlc3QgYm9keVxuICAgIGNvbnN0IGJvZHkgPSBldmVudC5ib2R5ID8gSlNPTi5wYXJzZShldmVudC5ib2R5KSA6IHt9O1xuICAgIFxuICAgIC8vIEdldCBvcGVyYXRpb24gZnJvbSBwYXRoIG9yIGJvZHlcbiAgICBjb25zdCBwYXRoID0gZXZlbnQucGF0aDtcbiAgICBjb25zdCBvcGVyYXRpb24gPSBib2R5Lm9wZXJhdGlvbiB8fCBnZXRPcGVyYXRpb25Gcm9tUGF0aChwYXRoKTtcbiAgICBcbiAgICBsZXQgcmVzcG9uc2U7XG4gICAgXG4gICAgLy8gUm91dGUgdG8gYXBwcm9wcmlhdGUgb3BlcmF0aW9uXG4gICAgc3dpdGNoIChvcGVyYXRpb24pIHtcbiAgICAgIGNhc2UgJ3NpZ25VcCc6XG4gICAgICAgIHJlc3BvbnNlID0gYXdhaXQgYXV0aFNlcnZpY2Uuc2lnblVwKFxuICAgICAgICAgIGJvZHkudXNlcm5hbWUsXG4gICAgICAgICAgYm9keS5wYXNzd29yZCxcbiAgICAgICAgICBib2R5LmVtYWlsLFxuICAgICAgICAgIGJvZHkucGhvbmVOdW1iZXJcbiAgICAgICAgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgY2FzZSAnY29uZmlybVNpZ25VcCc6XG4gICAgICAgIGF3YWl0IGF1dGhTZXJ2aWNlLmNvbmZpcm1TaWduVXAoXG4gICAgICAgICAgYm9keS51c2VybmFtZSxcbiAgICAgICAgICBib2R5LmNvbmZpcm1hdGlvbkNvZGVcbiAgICAgICAgKTtcbiAgICAgICAgcmVzcG9uc2UgPSB7IG1lc3NhZ2U6ICdVc2VyIGNvbmZpcm1lZCBzdWNjZXNzZnVsbHknIH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgIGNhc2UgJ3Jlc2VuZENvbmZpcm1hdGlvbkNvZGUnOlxuICAgICAgICBhd2FpdCBhdXRoU2VydmljZS5yZXNlbmRDb25maXJtYXRpb25Db2RlKGJvZHkudXNlcm5hbWUpO1xuICAgICAgICByZXNwb25zZSA9IHsgbWVzc2FnZTogJ0NvbmZpcm1hdGlvbiBjb2RlIHJlc2VudCBzdWNjZXNzZnVsbHknIH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgIGNhc2UgJ3NpZ25Jbic6XG4gICAgICAgIHJlc3BvbnNlID0gYXdhaXQgYXV0aFNlcnZpY2Uuc2lnbkluKFxuICAgICAgICAgIGJvZHkudXNlcm5hbWUsXG4gICAgICAgICAgYm9keS5wYXNzd29yZFxuICAgICAgICApO1xuICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICBjYXNlICdyZXNwb25kVG9NZmFDaGFsbGVuZ2UnOlxuICAgICAgICByZXNwb25zZSA9IGF3YWl0IGF1dGhTZXJ2aWNlLnJlc3BvbmRUb01mYUNoYWxsZW5nZShcbiAgICAgICAgICBib2R5LnVzZXJuYW1lLFxuICAgICAgICAgIGJvZHkuc2Vzc2lvbixcbiAgICAgICAgICBib2R5Lm1mYUNvZGVcbiAgICAgICAgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgY2FzZSAnZm9yZ290UGFzc3dvcmQnOlxuICAgICAgICBhd2FpdCBhdXRoU2VydmljZS5mb3Jnb3RQYXNzd29yZChib2R5LnVzZXJuYW1lKTtcbiAgICAgICAgcmVzcG9uc2UgPSB7IG1lc3NhZ2U6ICdQYXNzd29yZCByZXNldCBpbml0aWF0ZWQgc3VjY2Vzc2Z1bGx5JyB9O1xuICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICBjYXNlICdjb25maXJtRm9yZ290UGFzc3dvcmQnOlxuICAgICAgICBhd2FpdCBhdXRoU2VydmljZS5jb25maXJtRm9yZ290UGFzc3dvcmQoXG4gICAgICAgICAgYm9keS51c2VybmFtZSxcbiAgICAgICAgICBib2R5LmNvbmZpcm1hdGlvbkNvZGUsXG4gICAgICAgICAgYm9keS5uZXdQYXNzd29yZFxuICAgICAgICApO1xuICAgICAgICByZXNwb25zZSA9IHsgbWVzc2FnZTogJ1Bhc3N3b3JkIHJlc2V0IGNvbmZpcm1lZCBzdWNjZXNzZnVsbHknIH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgIGNhc2UgJ2NoYW5nZVBhc3N3b3JkJzpcbiAgICAgICAgYXdhaXQgYXV0aFNlcnZpY2UuY2hhbmdlUGFzc3dvcmQoXG4gICAgICAgICAgZ2V0QXV0aFRva2VuKGV2ZW50KSxcbiAgICAgICAgICBib2R5Lm9sZFBhc3N3b3JkLFxuICAgICAgICAgIGJvZHkubmV3UGFzc3dvcmRcbiAgICAgICAgKTtcbiAgICAgICAgcmVzcG9uc2UgPSB7IG1lc3NhZ2U6ICdQYXNzd29yZCBjaGFuZ2VkIHN1Y2Nlc3NmdWxseScgfTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgY2FzZSAnZ2V0Q3VycmVudFVzZXInOlxuICAgICAgICByZXNwb25zZSA9IGF3YWl0IGF1dGhTZXJ2aWNlLmdldEN1cnJlbnRVc2VyKGdldEF1dGhUb2tlbihldmVudCkpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICBjYXNlICdzaWduT3V0JzpcbiAgICAgICAgYXdhaXQgYXV0aFNlcnZpY2Uuc2lnbk91dChnZXRBdXRoVG9rZW4oZXZlbnQpKTtcbiAgICAgICAgcmVzcG9uc2UgPSB7IG1lc3NhZ2U6ICdTaWduZWQgb3V0IHN1Y2Nlc3NmdWxseScgfTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgY2FzZSAncmVmcmVzaFRva2Vucyc6XG4gICAgICAgIHJlc3BvbnNlID0gYXdhaXQgYXV0aFNlcnZpY2UucmVmcmVzaFRva2Vucyhib2R5LnJlZnJlc2hUb2tlbik7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3RhdHVzQ29kZTogNDAwLFxuICAgICAgICAgIGhlYWRlcnM6IGdldENvcnNIZWFkZXJzKCksXG4gICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiAnSW52YWxpZCBvcGVyYXRpb24nIH0pXG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICBoZWFkZXJzOiBnZXRDb3JzSGVhZGVycygpLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpXG4gICAgfTtcbiAgICBcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBhdXRoZW50aWNhdGlvbiBoYW5kbGVyOicsIGVycm9yKTtcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzQ29kZTogNTAwLFxuICAgICAgaGVhZGVyczogZ2V0Q29yc0hlYWRlcnMoKSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgbWVzc2FnZTogJ0Vycm9yIHByb2Nlc3NpbmcgYXV0aGVudGljYXRpb24gcmVxdWVzdCcsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ1xuICAgICAgfSlcbiAgICB9O1xuICB9XG59O1xuXG4vKipcbiAqIEV4dHJhY3Qgb3BlcmF0aW9uIGZyb20gcGF0aFxuICogQHBhcmFtIHBhdGggQVBJIHBhdGhcbiAqL1xuZnVuY3Rpb24gZ2V0T3BlcmF0aW9uRnJvbVBhdGgocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgcGF0aFNlZ21lbnRzID0gcGF0aC5zcGxpdCgnLycpO1xuICBjb25zdCBsYXN0U2VnbWVudCA9IHBhdGhTZWdtZW50c1twYXRoU2VnbWVudHMubGVuZ3RoIC0gMV07XG4gIFxuICBzd2l0Y2ggKGxhc3RTZWdtZW50KSB7XG4gICAgY2FzZSAnc2lnbnVwJzpcbiAgICAgIHJldHVybiAnc2lnblVwJztcbiAgICBjYXNlICdjb25maXJtJzpcbiAgICAgIHJldHVybiAnY29uZmlybVNpZ25VcCc7XG4gICAgY2FzZSAncmVzZW5kLWNvZGUnOlxuICAgICAgcmV0dXJuICdyZXNlbmRDb25maXJtYXRpb25Db2RlJztcbiAgICBjYXNlICdzaWduaW4nOlxuICAgICAgcmV0dXJuICdzaWduSW4nO1xuICAgIGNhc2UgJ21mYS1jaGFsbGVuZ2UnOlxuICAgICAgcmV0dXJuICdyZXNwb25kVG9NZmFDaGFsbGVuZ2UnO1xuICAgIGNhc2UgJ2ZvcmdvdC1wYXNzd29yZCc6XG4gICAgICByZXR1cm4gJ2ZvcmdvdFBhc3N3b3JkJztcbiAgICBjYXNlICdjb25maXJtLWZvcmdvdC1wYXNzd29yZCc6XG4gICAgICByZXR1cm4gJ2NvbmZpcm1Gb3Jnb3RQYXNzd29yZCc7XG4gICAgY2FzZSAnY2hhbmdlLXBhc3N3b3JkJzpcbiAgICAgIHJldHVybiAnY2hhbmdlUGFzc3dvcmQnO1xuICAgIGNhc2UgJ3VzZXInOlxuICAgICAgcmV0dXJuICdnZXRDdXJyZW50VXNlcic7XG4gICAgY2FzZSAnc2lnbm91dCc6XG4gICAgICByZXR1cm4gJ3NpZ25PdXQnO1xuICAgIGNhc2UgJ3JlZnJlc2gtdG9rZW5zJzpcbiAgICAgIHJldHVybiAncmVmcmVzaFRva2Vucyc7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnJztcbiAgfVxufVxuXG4vKipcbiAqIEV4dHJhY3QgYXV0aG9yaXphdGlvbiB0b2tlbiBmcm9tIGV2ZW50XG4gKiBAcGFyYW0gZXZlbnQgQVBJIEdhdGV3YXkgZXZlbnRcbiAqL1xuZnVuY3Rpb24gZ2V0QXV0aFRva2VuKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IHN0cmluZyB7XG4gIGNvbnN0IGF1dGhIZWFkZXIgPSBldmVudC5oZWFkZXJzLkF1dGhvcml6YXRpb24gfHwgZXZlbnQuaGVhZGVycy5hdXRob3JpemF0aW9uO1xuICBpZiAoIWF1dGhIZWFkZXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0F1dGhvcml6YXRpb24gaGVhZGVyIGlzIG1pc3NpbmcnKTtcbiAgfVxuICBcbiAgLy8gRm9ybWF0OiBcIkJlYXJlciA8dG9rZW4+XCJcbiAgY29uc3QgcGFydHMgPSBhdXRoSGVhZGVyLnNwbGl0KCcgJyk7XG4gIGlmIChwYXJ0cy5sZW5ndGggIT09IDIgfHwgcGFydHNbMF0gIT09ICdCZWFyZXInKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGF1dGhvcml6YXRpb24gaGVhZGVyIGZvcm1hdCcpO1xuICB9XG4gIFxuICByZXR1cm4gcGFydHNbMV07XG59XG5cbi8qKlxuICogR2V0IENPUlMgaGVhZGVyc1xuICovXG5mdW5jdGlvbiBnZXRDb3JzSGVhZGVycygpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcbiAgcmV0dXJuIHtcbiAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZSxBdXRob3JpemF0aW9uJyxcbiAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6ICdPUFRJT05TLFBPU1QsR0VULFBVVCxERUxFVEUsUEFUQ0gnLFxuICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgfTtcbn1cbiJdfQ==