"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
/**
 * Implementation of the AuthUseCase interface
 * This service handles authentication operations using AWS Cognito
 */
class AuthService {
    /**
     * Constructor for AuthService
     * @param userPoolId Cognito User Pool ID
     * @param userPoolClientId Cognito User Pool Client ID
     * @param region AWS Region
     * @param eventPublisher Optional event publisher for auth events
     */
    constructor(userPoolId, userPoolClientId, region, eventPublisher) {
        this.userPoolId = userPoolId;
        this.userPoolClientId = userPoolClientId;
        this.region = region;
        this.eventPublisher = eventPublisher;
    }
    /**
     * Sign up a new user
     * @param username Username
     * @param password Password
     * @param email Email address
     * @param phoneNumber Phone number with country code (e.g., +12065551234)
     */
    async signUp(username, password, email, phoneNumber) {
        try {
            // Validate inputs
            if (!username || !password || !email || !phoneNumber) {
                throw new Error('Username, password, email, and phone number are required');
            }
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Invalid email format');
            }
            // Validate phone format (should start with + and country code)
            const phoneRegex = /^\+[1-9]\d{1,14}$/;
            if (!phoneRegex.test(phoneNumber)) {
                throw new Error('Invalid phone number format. Must include country code (e.g., +12065551234)');
            }
            // This is where we would call Cognito's signUp API
            // For now, we'll simulate the response
            console.log(`Signing up user: ${username} with email: ${email} and phone: ${phoneNumber}`);
            // In a real implementation, we would use AWS SDK to call Cognito
            // const cognito = new CognitoIdentityServiceProvider({ region: this.region });
            // const result = await cognito.signUp({
            //   ClientId: this.userPoolClientId,
            //   Username: username,
            //   Password: password,
            //   UserAttributes: [
            //     { Name: 'email', Value: email },
            //     { Name: 'phone_number', Value: phoneNumber }
            //   ]
            // }).promise();
            // Simulate response
            const userSub = `simulated-user-sub-${Date.now()}`;
            // Publish user registration event if event publisher is available
            if (this.eventPublisher) {
                try {
                    await this.eventPublisher.publishEvent('com.taskapp.auth', 'UserRegistration', {
                        username,
                        email,
                        phoneNumber,
                        userSub
                    });
                    console.log(`Published UserRegistration event for user ${username}`);
                }
                catch (error) {
                    // Log error but don't fail the operation
                    console.error('Failed to publish UserRegistration event:', error);
                }
            }
            // Return simulated response
            return {
                userSub
            };
        }
        catch (error) {
            console.error('Error in signUp:', error);
            throw error;
        }
    }
    /**
     * Confirm user registration with verification code
     * @param username Username
     * @param confirmationCode Code sent to user's email or phone
     */
    async confirmSignUp(username, confirmationCode) {
        try {
            // Validate inputs
            if (!username || !confirmationCode) {
                throw new Error('Username and confirmation code are required');
            }
            // This is where we would call Cognito's confirmSignUp API
            console.log(`Confirming sign up for user: ${username} with code: ${confirmationCode}`);
            // In a real implementation, we would use AWS SDK to call Cognito
            // const cognito = new CognitoIdentityServiceProvider({ region: this.region });
            // await cognito.confirmSignUp({
            //   ClientId: this.userPoolClientId,
            //   Username: username,
            //   ConfirmationCode: confirmationCode
            // }).promise();
        }
        catch (error) {
            console.error('Error in confirmSignUp:', error);
            throw error;
        }
    }
    /**
     * Resend confirmation code
     * @param username Username
     */
    async resendConfirmationCode(username) {
        try {
            // Validate inputs
            if (!username) {
                throw new Error('Username is required');
            }
            // This is where we would call Cognito's resendConfirmationCode API
            console.log(`Resending confirmation code for user: ${username}`);
            // In a real implementation, we would use AWS SDK to call Cognito
            // const cognito = new CognitoIdentityServiceProvider({ region: this.region });
            // await cognito.resendConfirmationCode({
            //   ClientId: this.userPoolClientId,
            //   Username: username
            // }).promise();
        }
        catch (error) {
            console.error('Error in resendConfirmationCode:', error);
            throw error;
        }
    }
    /**
     * Sign in a user
     * @param username Username
     * @param password Password
     */
    async signIn(username, password) {
        try {
            // Validate inputs
            if (!username || !password) {
                throw new Error('Username and password are required');
            }
            // This is where we would call Cognito's initiateAuth API
            console.log(`Signing in user: ${username}`);
            // In a real implementation, we would use AWS SDK to call Cognito
            // const cognito = new CognitoIdentityServiceProvider({ region: this.region });
            // const result = await cognito.initiateAuth({
            //   ClientId: this.userPoolClientId,
            //   AuthFlow: 'USER_PASSWORD_AUTH',
            //   AuthParameters: {
            //     USERNAME: username,
            //     PASSWORD: password
            //   }
            // }).promise();
            // For now, return a simulated response
            // In a real scenario, this would likely return a challenge for MFA
            return {
                idToken: `simulated-id-token-${Date.now()}`,
                accessToken: `simulated-access-token-${Date.now()}`,
                refreshToken: `simulated-refresh-token-${Date.now()}`,
                challengeName: 'SMS_MFA',
                challengeParameters: {
                    CODE_DELIVERY_DELIVERY_MEDIUM: 'SMS',
                    CODE_DELIVERY_DESTINATION: '+*******1234'
                }
            };
        }
        catch (error) {
            console.error('Error in signIn:', error);
            throw error;
        }
    }
    /**
     * Respond to MFA challenge
     * @param username Username
     * @param session Session from sign in response
     * @param mfaCode MFA code from SMS or TOTP
     */
    async respondToMfaChallenge(username, session, mfaCode) {
        try {
            // Validate inputs
            if (!username || !session || !mfaCode) {
                throw new Error('Username, session, and MFA code are required');
            }
            // Validate MFA code format (should be 6 digits)
            const mfaCodeRegex = /^\d{6}$/;
            if (!mfaCodeRegex.test(mfaCode)) {
                throw new Error('Invalid MFA code format. Must be 6 digits');
            }
            // This is where we would call Cognito's respondToAuthChallenge API
            console.log(`Responding to MFA challenge for user: ${username} with code: ${mfaCode}`);
            // In a real implementation, we would use AWS SDK to call Cognito
            // const cognito = new CognitoIdentityServiceProvider({ region: this.region });
            // const result = await cognito.respondToAuthChallenge({
            //   ClientId: this.userPoolClientId,
            //   ChallengeName: 'SMS_MFA',
            //   ChallengeResponses: {
            //     USERNAME: username,
            //     SMS_MFA_CODE: mfaCode
            //   },
            //   Session: session
            // }).promise();
            // For now, return a simulated response
            return {
                idToken: `simulated-id-token-${Date.now()}`,
                accessToken: `simulated-access-token-${Date.now()}`,
                refreshToken: `simulated-refresh-token-${Date.now()}`
            };
        }
        catch (error) {
            console.error('Error in respondToMfaChallenge:', error);
            throw error;
        }
    }
    /**
     * Forgot password flow - initiate
     * @param username Username
     */
    async forgotPassword(username) {
        try {
            // Validate inputs
            if (!username) {
                throw new Error('Username is required');
            }
            // This is where we would call Cognito's forgotPassword API
            console.log(`Initiating forgot password flow for user: ${username}`);
            // In a real implementation, we would use AWS SDK to call Cognito
            // const cognito = new CognitoIdentityServiceProvider({ region: this.region });
            // await cognito.forgotPassword({
            //   ClientId: this.userPoolClientId,
            //   Username: username
            // }).promise();
        }
        catch (error) {
            console.error('Error in forgotPassword:', error);
            throw error;
        }
    }
    /**
     * Forgot password flow - confirm with code
     * @param username Username
     * @param confirmationCode Code sent to user's email or phone
     * @param newPassword New password
     */
    async confirmForgotPassword(username, confirmationCode, newPassword) {
        try {
            // Validate inputs
            if (!username || !confirmationCode || !newPassword) {
                throw new Error('Username, confirmation code, and new password are required');
            }
            // This is where we would call Cognito's confirmForgotPassword API
            console.log(`Confirming forgot password for user: ${username} with code: ${confirmationCode}`);
            // In a real implementation, we would use AWS SDK to call Cognito
            // const cognito = new CognitoIdentityServiceProvider({ region: this.region });
            // await cognito.confirmForgotPassword({
            //   ClientId: this.userPoolClientId,
            //   Username: username,
            //   ConfirmationCode: confirmationCode,
            //   Password: newPassword
            // }).promise();
        }
        catch (error) {
            console.error('Error in confirmForgotPassword:', error);
            throw error;
        }
    }
    /**
     * Change password for authenticated user
     * @param accessToken User's access token
     * @param oldPassword Old password
     * @param newPassword New password
     */
    async changePassword(accessToken, oldPassword, newPassword) {
        try {
            // Validate inputs
            if (!accessToken || !oldPassword || !newPassword) {
                throw new Error('Access token, old password, and new password are required');
            }
            // This is where we would call Cognito's changePassword API
            console.log(`Changing password for user with access token: ${accessToken.substring(0, 10)}...`);
            // In a real implementation, we would use AWS SDK to call Cognito
            // const cognito = new CognitoIdentityServiceProvider({ region: this.region });
            // await cognito.changePassword({
            //   AccessToken: accessToken,
            //   PreviousPassword: oldPassword,
            //   ProposedPassword: newPassword
            // }).promise();
        }
        catch (error) {
            console.error('Error in changePassword:', error);
            throw error;
        }
    }
    /**
     * Get current user information
     * @param accessToken User's access token
     */
    async getCurrentUser(accessToken) {
        try {
            // Validate inputs
            if (!accessToken) {
                throw new Error('Access token is required');
            }
            // This is where we would call Cognito's getUser API
            console.log(`Getting user info with access token: ${accessToken.substring(0, 10)}...`);
            // In a real implementation, we would use AWS SDK to call Cognito
            // const cognito = new CognitoIdentityServiceProvider({ region: this.region });
            // const result = await cognito.getUser({
            //   AccessToken: accessToken
            // }).promise();
            // For now, return a simulated response
            return {
                username: 'simulated-user',
                attributes: {
                    'sub': `simulated-sub-${Date.now()}`,
                    'email': 'user@example.com',
                    'phone_number': '+12065551234',
                    'email_verified': 'true',
                    'phone_number_verified': 'true'
                }
            };
        }
        catch (error) {
            console.error('Error in getCurrentUser:', error);
            throw error;
        }
    }
    /**
     * Sign out a user
     * @param accessToken User's access token
     */
    async signOut(accessToken) {
        try {
            // Validate inputs
            if (!accessToken) {
                throw new Error('Access token is required');
            }
            // This is where we would call Cognito's signOut API
            console.log(`Signing out user with access token: ${accessToken.substring(0, 10)}...`);
            // In a real implementation, we would use AWS SDK to call Cognito
            // const cognito = new CognitoIdentityServiceProvider({ region: this.region });
            // await cognito.signOut({
            //   AccessToken: accessToken
            // }).promise();
        }
        catch (error) {
            console.error('Error in signOut:', error);
            throw error;
        }
    }
    /**
     * Refresh tokens using a refresh token
     * @param refreshToken User's refresh token
     */
    async refreshTokens(refreshToken) {
        try {
            // Validate inputs
            if (!refreshToken) {
                throw new Error('Refresh token is required');
            }
            // This is where we would call Cognito's initiateAuth API with REFRESH_TOKEN_AUTH flow
            console.log(`Refreshing tokens with refresh token: ${refreshToken.substring(0, 10)}...`);
            // In a real implementation, we would use AWS SDK to call Cognito
            // const cognito = new CognitoIdentityServiceProvider({ region: this.region });
            // const result = await cognito.initiateAuth({
            //   ClientId: this.userPoolClientId,
            //   AuthFlow: 'REFRESH_TOKEN_AUTH',
            //   AuthParameters: {
            //     REFRESH_TOKEN: refreshToken
            //   }
            // }).promise();
            // For now, return a simulated response
            return {
                idToken: `simulated-id-token-${Date.now()}`,
                accessToken: `simulated-access-token-${Date.now()}`,
                refreshToken: refreshToken // Usually the refresh token doesn't change
            };
        }
        catch (error) {
            console.error('Error in refreshTokens:', error);
            throw error;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXV0aFNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBwbGljYXRpb24vc2VydmljZXMvQXV0aFNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0E7OztHQUdHO0FBQ0gsTUFBYSxXQUFXO0lBTXRCOzs7Ozs7T0FNRztJQUNILFlBQ0UsVUFBa0IsRUFDbEIsZ0JBQXdCLEVBQ3hCLE1BQWMsRUFDZCxjQUFtQztRQUVuQyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUM3QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsZ0JBQWdCLENBQUM7UUFDekMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7SUFDdkMsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBZ0IsRUFBRSxRQUFnQixFQUFFLEtBQWEsRUFBRSxXQUFtQjtRQUNqRixJQUFJLENBQUM7WUFDSCxrQkFBa0I7WUFDbEIsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNyRCxNQUFNLElBQUksS0FBSyxDQUFDLDBEQUEwRCxDQUFDLENBQUM7WUFDOUUsQ0FBQztZQUVELHdCQUF3QjtZQUN4QixNQUFNLFVBQVUsR0FBRyw0QkFBNEIsQ0FBQztZQUNoRCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDMUMsQ0FBQztZQUVELCtEQUErRDtZQUMvRCxNQUFNLFVBQVUsR0FBRyxtQkFBbUIsQ0FBQztZQUN2QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO2dCQUNsQyxN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QUFDLHlDQUF5QyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFekYsaUVBQWlFO1lBQ2pFLCtFQUErRTtZQUMvRSw4Q0FBOEM7WUFDOUMscUNBQXFDO1lBQ3JDLG9DQUFvQztZQUNwQyxzQkFBc0I7WUFDdEIsa0NBQWtDO1lBQ2xDLE1BQU07WUFDTixnQkFBZ0I7WUFFaEIsdUNBQXVDO1lBQ3ZDLE9BQU87Z0JBQ0wsT0FBTyxFQUFFLHNCQUFzQixJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQzNDLFdBQVcsRUFBRSwwQkFBMEIsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO2dCQUNuRCxZQUFZLEVBQUUsWUFBWSxDQUFDLDJDQUEyQzthQUN2RSxDQUFDO1FBQ0osQ0FBQztRQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hELE1BQU0sS0FBSyxDQUFDO1FBQ2QsQ0FBQztJQUNILENBQUM7Q0FDRjtBQTNiRCxrQ0EyYkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBdXRoVXNlQ2FzZSB9IGZyb20gJy4uL3BvcnRzL2luL0F1dGhVc2VDYXNlJztcbmltcG9ydCB7IEV2ZW50UHVibGlzaGVyUG9ydCB9IGZyb20gJy4uL3BvcnRzL291dC9FdmVudFB1Ymxpc2hlclBvcnQnO1xuXG4vKipcbiAqIEltcGxlbWVudGF0aW9uIG9mIHRoZSBBdXRoVXNlQ2FzZSBpbnRlcmZhY2VcbiAqIFRoaXMgc2VydmljZSBoYW5kbGVzIGF1dGhlbnRpY2F0aW9uIG9wZXJhdGlvbnMgdXNpbmcgQVdTIENvZ25pdG9cbiAqL1xuZXhwb3J0IGNsYXNzIEF1dGhTZXJ2aWNlIGltcGxlbWVudHMgQXV0aFVzZUNhc2Uge1xuICBwcml2YXRlIHJlYWRvbmx5IHVzZXJQb29sSWQ6IHN0cmluZztcbiAgcHJpdmF0ZSByZWFkb25seSB1c2VyUG9vbENsaWVudElkOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVhZG9ubHkgcmVnaW9uOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVhZG9ubHkgZXZlbnRQdWJsaXNoZXI/OiBFdmVudFB1Ymxpc2hlclBvcnQ7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIGZvciBBdXRoU2VydmljZVxuICAgKiBAcGFyYW0gdXNlclBvb2xJZCBDb2duaXRvIFVzZXIgUG9vbCBJRFxuICAgKiBAcGFyYW0gdXNlclBvb2xDbGllbnRJZCBDb2duaXRvIFVzZXIgUG9vbCBDbGllbnQgSURcbiAgICogQHBhcmFtIHJlZ2lvbiBBV1MgUmVnaW9uXG4gICAqIEBwYXJhbSBldmVudFB1Ymxpc2hlciBPcHRpb25hbCBldmVudCBwdWJsaXNoZXIgZm9yIGF1dGggZXZlbnRzXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICB1c2VyUG9vbElkOiBzdHJpbmcsIFxuICAgIHVzZXJQb29sQ2xpZW50SWQ6IHN0cmluZywgXG4gICAgcmVnaW9uOiBzdHJpbmcsXG4gICAgZXZlbnRQdWJsaXNoZXI/OiBFdmVudFB1Ymxpc2hlclBvcnRcbiAgKSB7XG4gICAgdGhpcy51c2VyUG9vbElkID0gdXNlclBvb2xJZDtcbiAgICB0aGlzLnVzZXJQb29sQ2xpZW50SWQgPSB1c2VyUG9vbENsaWVudElkO1xuICAgIHRoaXMucmVnaW9uID0gcmVnaW9uO1xuICAgIHRoaXMuZXZlbnRQdWJsaXNoZXIgPSBldmVudFB1Ymxpc2hlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIHVwIGEgbmV3IHVzZXJcbiAgICogQHBhcmFtIHVzZXJuYW1lIFVzZXJuYW1lXG4gICAqIEBwYXJhbSBwYXNzd29yZCBQYXNzd29yZFxuICAgKiBAcGFyYW0gZW1haWwgRW1haWwgYWRkcmVzc1xuICAgKiBAcGFyYW0gcGhvbmVOdW1iZXIgUGhvbmUgbnVtYmVyIHdpdGggY291bnRyeSBjb2RlIChlLmcuLCArMTIwNjU1NTEyMzQpXG4gICAqL1xuICBhc3luYyBzaWduVXAodXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZywgZW1haWw6IHN0cmluZywgcGhvbmVOdW1iZXI6IHN0cmluZyk6IFByb21pc2U8eyB1c2VyU3ViOiBzdHJpbmcgfT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBWYWxpZGF0ZSBpbnB1dHNcbiAgICAgIGlmICghdXNlcm5hbWUgfHwgIXBhc3N3b3JkIHx8ICFlbWFpbCB8fCAhcGhvbmVOdW1iZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVc2VybmFtZSwgcGFzc3dvcmQsIGVtYWlsLCBhbmQgcGhvbmUgbnVtYmVyIGFyZSByZXF1aXJlZCcpO1xuICAgICAgfVxuXG4gICAgICAvLyBWYWxpZGF0ZSBlbWFpbCBmb3JtYXRcbiAgICAgIGNvbnN0IGVtYWlsUmVnZXggPSAvXlteXFxzQF0rQFteXFxzQF0rXFwuW15cXHNAXSskLztcbiAgICAgIGlmICghZW1haWxSZWdleC50ZXN0KGVtYWlsKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZW1haWwgZm9ybWF0Jyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFZhbGlkYXRlIHBob25lIGZvcm1hdCAoc2hvdWxkIHN0YXJ0IHdpdGggKyBhbmQgY291bnRyeSBjb2RlKVxuICAgICAgY29uc3QgcGhvbmVSZWdleCA9IC9eXFwrWzEtOV1cXGR7MSwxNH0kLztcbiAgICAgIGlmICghcGhvbmVSZWdleC50ZXN0KHBob25lTnVtYmVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgcGhvbmUgbnVtYmVyIGZvcm1hdC4gTXVzdCBpbmNsdWRlIGNvdW50cnkgY29kZSAoZS5nLiwgKzEyMDY1NTUxMjM0KScpO1xuICAgICAgfVxuXG4gICAgICAvLyBUaGlzIGlzIHdoZXJlIHdlIHdvdWxkIGNhbGwgQ29nbml0bydzIHNpZ25VcCBBUElcbiAgICAgIC8vIEZvciBub3csIHdlJ2xsIHNpbXVsYXRlIHRoZSByZXNwb25zZVxuICAgICAgY29uc29sZS5sb2coYFNpZ25pbmcgdXAgdXNlcjogJHt1c2VybmFtZX0gd2l0aCBlbWFpbDogJHtlbWFpbH0gYW5kIHBob25lOiAke3Bob25lTnVtYmVyfWApO1xuICAgICAgXG4gICAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHdlIHdvdWxkIHVzZSBBV1MgU0RLIHRvIGNhbGwgQ29nbml0b1xuICAgICAgLy8gY29uc3QgY29nbml0byA9IG5ldyBDb2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIoeyByZWdpb246IHRoaXMucmVnaW9uIH0pO1xuICAgICAgLy8gY29uc3QgcmVzdWx0ID0gYXdhaXQgY29nbml0by5zaWduVXAoe1xuICAgICAgLy8gICBDbGllbnRJZDogdGhpcy51c2VyUG9vbENsaWVudElkLFxuICAgICAgLy8gICBVc2VybmFtZTogdXNlcm5hbWUsXG4gICAgICAvLyAgIFBhc3N3b3JkOiBwYXNzd29yZCxcbiAgICAgIC8vICAgVXNlckF0dHJpYnV0ZXM6IFtcbiAgICAgIC8vICAgICB7IE5hbWU6ICdlbWFpbCcsIFZhbHVlOiBlbWFpbCB9LFxuICAgICAgLy8gICAgIHsgTmFtZTogJ3Bob25lX251bWJlcicsIFZhbHVlOiBwaG9uZU51bWJlciB9XG4gICAgICAvLyAgIF1cbiAgICAgIC8vIH0pLnByb21pc2UoKTtcbiAgICAgIFxuICAgICAgLy8gU2ltdWxhdGUgcmVzcG9uc2VcbiAgICAgIGNvbnN0IHVzZXJTdWIgPSBgc2ltdWxhdGVkLXVzZXItc3ViLSR7RGF0ZS5ub3coKX1gO1xuICAgICAgXG4gICAgICAvLyBQdWJsaXNoIHVzZXIgcmVnaXN0cmF0aW9uIGV2ZW50IGlmIGV2ZW50IHB1Ymxpc2hlciBpcyBhdmFpbGFibGVcbiAgICAgIGlmICh0aGlzLmV2ZW50UHVibGlzaGVyKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5ldmVudFB1Ymxpc2hlci5wdWJsaXNoRXZlbnQoXG4gICAgICAgICAgICAnY29tLnRhc2thcHAuYXV0aCcsXG4gICAgICAgICAgICAnVXNlclJlZ2lzdHJhdGlvbicsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHVzZXJuYW1lLFxuICAgICAgICAgICAgICBlbWFpbCxcbiAgICAgICAgICAgICAgcGhvbmVOdW1iZXIsXG4gICAgICAgICAgICAgIHVzZXJTdWJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBQdWJsaXNoZWQgVXNlclJlZ2lzdHJhdGlvbiBldmVudCBmb3IgdXNlciAke3VzZXJuYW1lfWApO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIC8vIExvZyBlcnJvciBidXQgZG9uJ3QgZmFpbCB0aGUgb3BlcmF0aW9uXG4gICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHB1Ymxpc2ggVXNlclJlZ2lzdHJhdGlvbiBldmVudDonLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gUmV0dXJuIHNpbXVsYXRlZCByZXNwb25zZVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXNlclN1YlxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gc2lnblVwOicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maXJtIHVzZXIgcmVnaXN0cmF0aW9uIHdpdGggdmVyaWZpY2F0aW9uIGNvZGVcbiAgICogQHBhcmFtIHVzZXJuYW1lIFVzZXJuYW1lXG4gICAqIEBwYXJhbSBjb25maXJtYXRpb25Db2RlIENvZGUgc2VudCB0byB1c2VyJ3MgZW1haWwgb3IgcGhvbmVcbiAgICovXG4gIGFzeW5jIGNvbmZpcm1TaWduVXAodXNlcm5hbWU6IHN0cmluZywgY29uZmlybWF0aW9uQ29kZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFZhbGlkYXRlIGlucHV0c1xuICAgICAgaWYgKCF1c2VybmFtZSB8fCAhY29uZmlybWF0aW9uQ29kZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VzZXJuYW1lIGFuZCBjb25maXJtYXRpb24gY29kZSBhcmUgcmVxdWlyZWQnKTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhpcyBpcyB3aGVyZSB3ZSB3b3VsZCBjYWxsIENvZ25pdG8ncyBjb25maXJtU2lnblVwIEFQSVxuICAgICAgY29uc29sZS5sb2coYENvbmZpcm1pbmcgc2lnbiB1cCBmb3IgdXNlcjogJHt1c2VybmFtZX0gd2l0aCBjb2RlOiAke2NvbmZpcm1hdGlvbkNvZGV9YCk7XG4gICAgICBcbiAgICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgd2Ugd291bGQgdXNlIEFXUyBTREsgdG8gY2FsbCBDb2duaXRvXG4gICAgICAvLyBjb25zdCBjb2duaXRvID0gbmV3IENvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlcih7IHJlZ2lvbjogdGhpcy5yZWdpb24gfSk7XG4gICAgICAvLyBhd2FpdCBjb2duaXRvLmNvbmZpcm1TaWduVXAoe1xuICAgICAgLy8gICBDbGllbnRJZDogdGhpcy51c2VyUG9vbENsaWVudElkLFxuICAgICAgLy8gICBVc2VybmFtZTogdXNlcm5hbWUsXG4gICAgICAvLyAgIENvbmZpcm1hdGlvbkNvZGU6IGNvbmZpcm1hdGlvbkNvZGVcbiAgICAgIC8vIH0pLnByb21pc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gY29uZmlybVNpZ25VcDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVzZW5kIGNvbmZpcm1hdGlvbiBjb2RlXG4gICAqIEBwYXJhbSB1c2VybmFtZSBVc2VybmFtZVxuICAgKi9cbiAgYXN5bmMgcmVzZW5kQ29uZmlybWF0aW9uQ29kZSh1c2VybmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFZhbGlkYXRlIGlucHV0c1xuICAgICAgaWYgKCF1c2VybmFtZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VzZXJuYW1lIGlzIHJlcXVpcmVkJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoaXMgaXMgd2hlcmUgd2Ugd291bGQgY2FsbCBDb2duaXRvJ3MgcmVzZW5kQ29uZmlybWF0aW9uQ29kZSBBUElcbiAgICAgIGNvbnNvbGUubG9nKGBSZXNlbmRpbmcgY29uZmlybWF0aW9uIGNvZGUgZm9yIHVzZXI6ICR7dXNlcm5hbWV9YCk7XG4gICAgICBcbiAgICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgd2Ugd291bGQgdXNlIEFXUyBTREsgdG8gY2FsbCBDb2duaXRvXG4gICAgICAvLyBjb25zdCBjb2duaXRvID0gbmV3IENvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlcih7IHJlZ2lvbjogdGhpcy5yZWdpb24gfSk7XG4gICAgICAvLyBhd2FpdCBjb2duaXRvLnJlc2VuZENvbmZpcm1hdGlvbkNvZGUoe1xuICAgICAgLy8gICBDbGllbnRJZDogdGhpcy51c2VyUG9vbENsaWVudElkLFxuICAgICAgLy8gICBVc2VybmFtZTogdXNlcm5hbWVcbiAgICAgIC8vIH0pLnByb21pc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gcmVzZW5kQ29uZmlybWF0aW9uQ29kZTonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBpbiBhIHVzZXJcbiAgICogQHBhcmFtIHVzZXJuYW1lIFVzZXJuYW1lXG4gICAqIEBwYXJhbSBwYXNzd29yZCBQYXNzd29yZFxuICAgKi9cbiAgYXN5bmMgc2lnbkluKHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHsgXG4gICAgaWRUb2tlbjogc3RyaW5nOyBcbiAgICBhY2Nlc3NUb2tlbjogc3RyaW5nOyBcbiAgICByZWZyZXNoVG9rZW46IHN0cmluZztcbiAgICBjaGFsbGVuZ2VOYW1lPzogc3RyaW5nO1xuICAgIGNoYWxsZW5nZVBhcmFtZXRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICB9PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFZhbGlkYXRlIGlucHV0c1xuICAgICAgaWYgKCF1c2VybmFtZSB8fCAhcGFzc3dvcmQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVc2VybmFtZSBhbmQgcGFzc3dvcmQgYXJlIHJlcXVpcmVkJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoaXMgaXMgd2hlcmUgd2Ugd291bGQgY2FsbCBDb2duaXRvJ3MgaW5pdGlhdGVBdXRoIEFQSVxuICAgICAgY29uc29sZS5sb2coYFNpZ25pbmcgaW4gdXNlcjogJHt1c2VybmFtZX1gKTtcbiAgICAgIFxuICAgICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB3ZSB3b3VsZCB1c2UgQVdTIFNESyB0byBjYWxsIENvZ25pdG9cbiAgICAgIC8vIGNvbnN0IGNvZ25pdG8gPSBuZXcgQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyKHsgcmVnaW9uOiB0aGlzLnJlZ2lvbiB9KTtcbiAgICAgIC8vIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNvZ25pdG8uaW5pdGlhdGVBdXRoKHtcbiAgICAgIC8vICAgQ2xpZW50SWQ6IHRoaXMudXNlclBvb2xDbGllbnRJZCxcbiAgICAgIC8vICAgQXV0aEZsb3c6ICdVU0VSX1BBU1NXT1JEX0FVVEgnLFxuICAgICAgLy8gICBBdXRoUGFyYW1ldGVyczoge1xuICAgICAgLy8gICAgIFVTRVJOQU1FOiB1c2VybmFtZSxcbiAgICAgIC8vICAgICBQQVNTV09SRDogcGFzc3dvcmRcbiAgICAgIC8vICAgfVxuICAgICAgLy8gfSkucHJvbWlzZSgpO1xuICAgICAgXG4gICAgICAvLyBGb3Igbm93LCByZXR1cm4gYSBzaW11bGF0ZWQgcmVzcG9uc2VcbiAgICAgIC8vIEluIGEgcmVhbCBzY2VuYXJpbywgdGhpcyB3b3VsZCBsaWtlbHkgcmV0dXJuIGEgY2hhbGxlbmdlIGZvciBNRkFcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGlkVG9rZW46IGBzaW11bGF0ZWQtaWQtdG9rZW4tJHtEYXRlLm5vdygpfWAsXG4gICAgICAgIGFjY2Vzc1Rva2VuOiBgc2ltdWxhdGVkLWFjY2Vzcy10b2tlbi0ke0RhdGUubm93KCl9YCxcbiAgICAgICAgcmVmcmVzaFRva2VuOiBgc2ltdWxhdGVkLXJlZnJlc2gtdG9rZW4tJHtEYXRlLm5vdygpfWAsXG4gICAgICAgIGNoYWxsZW5nZU5hbWU6ICdTTVNfTUZBJyxcbiAgICAgICAgY2hhbGxlbmdlUGFyYW1ldGVyczoge1xuICAgICAgICAgIENPREVfREVMSVZFUllfREVMSVZFUllfTUVESVVNOiAnU01TJyxcbiAgICAgICAgICBDT0RFX0RFTElWRVJZX0RFU1RJTkFUSU9OOiAnKyoqKioqKioxMjM0J1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBzaWduSW46JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc3BvbmQgdG8gTUZBIGNoYWxsZW5nZVxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVXNlcm5hbWVcbiAgICogQHBhcmFtIHNlc3Npb24gU2Vzc2lvbiBmcm9tIHNpZ24gaW4gcmVzcG9uc2VcbiAgICogQHBhcmFtIG1mYUNvZGUgTUZBIGNvZGUgZnJvbSBTTVMgb3IgVE9UUFxuICAgKi9cbiAgYXN5bmMgcmVzcG9uZFRvTWZhQ2hhbGxlbmdlKHVzZXJuYW1lOiBzdHJpbmcsIHNlc3Npb246IHN0cmluZywgbWZhQ29kZTogc3RyaW5nKTogUHJvbWlzZTx7XG4gICAgaWRUb2tlbjogc3RyaW5nO1xuICAgIGFjY2Vzc1Rva2VuOiBzdHJpbmc7XG4gICAgcmVmcmVzaFRva2VuOiBzdHJpbmc7XG4gIH0+IHtcbiAgICB0cnkge1xuICAgICAgLy8gVmFsaWRhdGUgaW5wdXRzXG4gICAgICBpZiAoIXVzZXJuYW1lIHx8ICFzZXNzaW9uIHx8ICFtZmFDb2RlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVXNlcm5hbWUsIHNlc3Npb24sIGFuZCBNRkEgY29kZSBhcmUgcmVxdWlyZWQnKTtcbiAgICAgIH1cblxuICAgICAgLy8gVmFsaWRhdGUgTUZBIGNvZGUgZm9ybWF0IChzaG91bGQgYmUgNiBkaWdpdHMpXG4gICAgICBjb25zdCBtZmFDb2RlUmVnZXggPSAvXlxcZHs2fSQvO1xuICAgICAgaWYgKCFtZmFDb2RlUmVnZXgudGVzdChtZmFDb2RlKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgTUZBIGNvZGUgZm9ybWF0LiBNdXN0IGJlIDYgZGlnaXRzJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoaXMgaXMgd2hlcmUgd2Ugd291bGQgY2FsbCBDb2duaXRvJ3MgcmVzcG9uZFRvQXV0aENoYWxsZW5nZSBBUElcbiAgICAgIGNvbnNvbGUubG9nKGBSZXNwb25kaW5nIHRvIE1GQSBjaGFsbGVuZ2UgZm9yIHVzZXI6ICR7dXNlcm5hbWV9IHdpdGggY29kZTogJHttZmFDb2RlfWApO1xuICAgICAgXG4gICAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHdlIHdvdWxkIHVzZSBBV1MgU0RLIHRvIGNhbGwgQ29nbml0b1xuICAgICAgLy8gY29uc3QgY29nbml0byA9IG5ldyBDb2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIoeyByZWdpb246IHRoaXMucmVnaW9uIH0pO1xuICAgICAgLy8gY29uc3QgcmVzdWx0ID0gYXdhaXQgY29nbml0by5yZXNwb25kVG9BdXRoQ2hhbGxlbmdlKHtcbiAgICAgIC8vICAgQ2xpZW50SWQ6IHRoaXMudXNlclBvb2xDbGllbnRJZCxcbiAgICAgIC8vICAgQ2hhbGxlbmdlTmFtZTogJ1NNU19NRkEnLFxuICAgICAgLy8gICBDaGFsbGVuZ2VSZXNwb25zZXM6IHtcbiAgICAgIC8vICAgICBVU0VSTkFNRTogdXNlcm5hbWUsXG4gICAgICAvLyAgICAgU01TX01GQV9DT0RFOiBtZmFDb2RlXG4gICAgICAvLyAgIH0sXG4gICAgICAvLyAgIFNlc3Npb246IHNlc3Npb25cbiAgICAgIC8vIH0pLnByb21pc2UoKTtcbiAgICAgIFxuICAgICAgLy8gRm9yIG5vdywgcmV0dXJuIGEgc2ltdWxhdGVkIHJlc3BvbnNlXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZFRva2VuOiBgc2ltdWxhdGVkLWlkLXRva2VuLSR7RGF0ZS5ub3coKX1gLFxuICAgICAgICBhY2Nlc3NUb2tlbjogYHNpbXVsYXRlZC1hY2Nlc3MtdG9rZW4tJHtEYXRlLm5vdygpfWAsXG4gICAgICAgIHJlZnJlc2hUb2tlbjogYHNpbXVsYXRlZC1yZWZyZXNoLXRva2VuLSR7RGF0ZS5ub3coKX1gXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiByZXNwb25kVG9NZmFDaGFsbGVuZ2U6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZvcmdvdCBwYXNzd29yZCBmbG93IC0gaW5pdGlhdGVcbiAgICogQHBhcmFtIHVzZXJuYW1lIFVzZXJuYW1lXG4gICAqL1xuICBhc3luYyBmb3Jnb3RQYXNzd29yZCh1c2VybmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFZhbGlkYXRlIGlucHV0c1xuICAgICAgaWYgKCF1c2VybmFtZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VzZXJuYW1lIGlzIHJlcXVpcmVkJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoaXMgaXMgd2hlcmUgd2Ugd291bGQgY2FsbCBDb2duaXRvJ3MgZm9yZ290UGFzc3dvcmQgQVBJXG4gICAgICBjb25zb2xlLmxvZyhgSW5pdGlhdGluZyBmb3Jnb3QgcGFzc3dvcmQgZmxvdyBmb3IgdXNlcjogJHt1c2VybmFtZX1gKTtcbiAgICAgIFxuICAgICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB3ZSB3b3VsZCB1c2UgQVdTIFNESyB0byBjYWxsIENvZ25pdG9cbiAgICAgIC8vIGNvbnN0IGNvZ25pdG8gPSBuZXcgQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyKHsgcmVnaW9uOiB0aGlzLnJlZ2lvbiB9KTtcbiAgICAgIC8vIGF3YWl0IGNvZ25pdG8uZm9yZ290UGFzc3dvcmQoe1xuICAgICAgLy8gICBDbGllbnRJZDogdGhpcy51c2VyUG9vbENsaWVudElkLFxuICAgICAgLy8gICBVc2VybmFtZTogdXNlcm5hbWVcbiAgICAgIC8vIH0pLnByb21pc2UoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gZm9yZ290UGFzc3dvcmQ6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEZvcmdvdCBwYXNzd29yZCBmbG93IC0gY29uZmlybSB3aXRoIGNvZGVcbiAgICogQHBhcmFtIHVzZXJuYW1lIFVzZXJuYW1lXG4gICAqIEBwYXJhbSBjb25maXJtYXRpb25Db2RlIENvZGUgc2VudCB0byB1c2VyJ3MgZW1haWwgb3IgcGhvbmVcbiAgICogQHBhcmFtIG5ld1Bhc3N3b3JkIE5ldyBwYXNzd29yZFxuICAgKi9cbiAgYXN5bmMgY29uZmlybUZvcmdvdFBhc3N3b3JkKHVzZXJuYW1lOiBzdHJpbmcsIGNvbmZpcm1hdGlvbkNvZGU6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBWYWxpZGF0ZSBpbnB1dHNcbiAgICAgIGlmICghdXNlcm5hbWUgfHwgIWNvbmZpcm1hdGlvbkNvZGUgfHwgIW5ld1Bhc3N3b3JkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVXNlcm5hbWUsIGNvbmZpcm1hdGlvbiBjb2RlLCBhbmQgbmV3IHBhc3N3b3JkIGFyZSByZXF1aXJlZCcpO1xuICAgICAgfVxuXG4gICAgICAvLyBUaGlzIGlzIHdoZXJlIHdlIHdvdWxkIGNhbGwgQ29nbml0bydzIGNvbmZpcm1Gb3Jnb3RQYXNzd29yZCBBUElcbiAgICAgIGNvbnNvbGUubG9nKGBDb25maXJtaW5nIGZvcmdvdCBwYXNzd29yZCBmb3IgdXNlcjogJHt1c2VybmFtZX0gd2l0aCBjb2RlOiAke2NvbmZpcm1hdGlvbkNvZGV9YCk7XG4gICAgICBcbiAgICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgd2Ugd291bGQgdXNlIEFXUyBTREsgdG8gY2FsbCBDb2duaXRvXG4gICAgICAvLyBjb25zdCBjb2duaXRvID0gbmV3IENvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlcih7IHJlZ2lvbjogdGhpcy5yZWdpb24gfSk7XG4gICAgICAvLyBhd2FpdCBjb2duaXRvLmNvbmZpcm1Gb3Jnb3RQYXNzd29yZCh7XG4gICAgICAvLyAgIENsaWVudElkOiB0aGlzLnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICAvLyAgIFVzZXJuYW1lOiB1c2VybmFtZSxcbiAgICAgIC8vICAgQ29uZmlybWF0aW9uQ29kZTogY29uZmlybWF0aW9uQ29kZSxcbiAgICAgIC8vICAgUGFzc3dvcmQ6IG5ld1Bhc3N3b3JkXG4gICAgICAvLyB9KS5wcm9taXNlKCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIGNvbmZpcm1Gb3Jnb3RQYXNzd29yZDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlIHBhc3N3b3JkIGZvciBhdXRoZW50aWNhdGVkIHVzZXJcbiAgICogQHBhcmFtIGFjY2Vzc1Rva2VuIFVzZXIncyBhY2Nlc3MgdG9rZW5cbiAgICogQHBhcmFtIG9sZFBhc3N3b3JkIE9sZCBwYXNzd29yZFxuICAgKiBAcGFyYW0gbmV3UGFzc3dvcmQgTmV3IHBhc3N3b3JkXG4gICAqL1xuICBhc3luYyBjaGFuZ2VQYXNzd29yZChhY2Nlc3NUb2tlbjogc3RyaW5nLCBvbGRQYXNzd29yZDogc3RyaW5nLCBuZXdQYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFZhbGlkYXRlIGlucHV0c1xuICAgICAgaWYgKCFhY2Nlc3NUb2tlbiB8fCAhb2xkUGFzc3dvcmQgfHwgIW5ld1Bhc3N3b3JkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQWNjZXNzIHRva2VuLCBvbGQgcGFzc3dvcmQsIGFuZCBuZXcgcGFzc3dvcmQgYXJlIHJlcXVpcmVkJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoaXMgaXMgd2hlcmUgd2Ugd291bGQgY2FsbCBDb2duaXRvJ3MgY2hhbmdlUGFzc3dvcmQgQVBJXG4gICAgICBjb25zb2xlLmxvZyhgQ2hhbmdpbmcgcGFzc3dvcmQgZm9yIHVzZXIgd2l0aCBhY2Nlc3MgdG9rZW46ICR7YWNjZXNzVG9rZW4uc3Vic3RyaW5nKDAsIDEwKX0uLi5gKTtcbiAgICAgIFxuICAgICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB3ZSB3b3VsZCB1c2UgQVdTIFNESyB0byBjYWxsIENvZ25pdG9cbiAgICAgIC8vIGNvbnN0IGNvZ25pdG8gPSBuZXcgQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyKHsgcmVnaW9uOiB0aGlzLnJlZ2lvbiB9KTtcbiAgICAgIC8vIGF3YWl0IGNvZ25pdG8uY2hhbmdlUGFzc3dvcmQoe1xuICAgICAgLy8gICBBY2Nlc3NUb2tlbjogYWNjZXNzVG9rZW4sXG4gICAgICAvLyAgIFByZXZpb3VzUGFzc3dvcmQ6IG9sZFBhc3N3b3JkLFxuICAgICAgLy8gICBQcm9wb3NlZFBhc3N3b3JkOiBuZXdQYXNzd29yZFxuICAgICAgLy8gfSkucHJvbWlzZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBjaGFuZ2VQYXNzd29yZDonLCBlcnJvcik7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGN1cnJlbnQgdXNlciBpbmZvcm1hdGlvblxuICAgKiBAcGFyYW0gYWNjZXNzVG9rZW4gVXNlcidzIGFjY2VzcyB0b2tlblxuICAgKi9cbiAgYXN5bmMgZ2V0Q3VycmVudFVzZXIoYWNjZXNzVG9rZW46IHN0cmluZyk6IFByb21pc2U8e1xuICAgIHVzZXJuYW1lOiBzdHJpbmc7XG4gICAgYXR0cmlidXRlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgfT4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBWYWxpZGF0ZSBpbnB1dHNcbiAgICAgIGlmICghYWNjZXNzVG9rZW4pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBY2Nlc3MgdG9rZW4gaXMgcmVxdWlyZWQnKTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhpcyBpcyB3aGVyZSB3ZSB3b3VsZCBjYWxsIENvZ25pdG8ncyBnZXRVc2VyIEFQSVxuICAgICAgY29uc29sZS5sb2coYEdldHRpbmcgdXNlciBpbmZvIHdpdGggYWNjZXNzIHRva2VuOiAke2FjY2Vzc1Rva2VuLnN1YnN0cmluZygwLCAxMCl9Li4uYCk7XG4gICAgICBcbiAgICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgd2Ugd291bGQgdXNlIEFXUyBTREsgdG8gY2FsbCBDb2duaXRvXG4gICAgICAvLyBjb25zdCBjb2duaXRvID0gbmV3IENvZ25pdG9JZGVudGl0eVNlcnZpY2VQcm92aWRlcih7IHJlZ2lvbjogdGhpcy5yZWdpb24gfSk7XG4gICAgICAvLyBjb25zdCByZXN1bHQgPSBhd2FpdCBjb2duaXRvLmdldFVzZXIoe1xuICAgICAgLy8gICBBY2Nlc3NUb2tlbjogYWNjZXNzVG9rZW5cbiAgICAgIC8vIH0pLnByb21pc2UoKTtcbiAgICAgIFxuICAgICAgLy8gRm9yIG5vdywgcmV0dXJuIGEgc2ltdWxhdGVkIHJlc3BvbnNlXG4gICAgICByZXR1cm4ge1xuICAgICAgICB1c2VybmFtZTogJ3NpbXVsYXRlZC11c2VyJyxcbiAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICdzdWInOiBgc2ltdWxhdGVkLXN1Yi0ke0RhdGUubm93KCl9YCxcbiAgICAgICAgICAnZW1haWwnOiAndXNlckBleGFtcGxlLmNvbScsXG4gICAgICAgICAgJ3Bob25lX251bWJlcic6ICcrMTIwNjU1NTEyMzQnLFxuICAgICAgICAgICdlbWFpbF92ZXJpZmllZCc6ICd0cnVlJyxcbiAgICAgICAgICAncGhvbmVfbnVtYmVyX3ZlcmlmaWVkJzogJ3RydWUnXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIGdldEN1cnJlbnRVc2VyOicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIG91dCBhIHVzZXJcbiAgICogQHBhcmFtIGFjY2Vzc1Rva2VuIFVzZXIncyBhY2Nlc3MgdG9rZW5cbiAgICovXG4gIGFzeW5jIHNpZ25PdXQoYWNjZXNzVG9rZW46IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBWYWxpZGF0ZSBpbnB1dHNcbiAgICAgIGlmICghYWNjZXNzVG9rZW4pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBY2Nlc3MgdG9rZW4gaXMgcmVxdWlyZWQnKTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhpcyBpcyB3aGVyZSB3ZSB3b3VsZCBjYWxsIENvZ25pdG8ncyBzaWduT3V0IEFQSVxuICAgICAgY29uc29sZS5sb2coYFNpZ25pbmcgb3V0IHVzZXIgd2l0aCBhY2Nlc3MgdG9rZW46ICR7YWNjZXNzVG9rZW4uc3Vic3RyaW5nKDAsIDEwKX0uLi5gKTtcbiAgICAgIFxuICAgICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB3ZSB3b3VsZCB1c2UgQVdTIFNESyB0byBjYWxsIENvZ25pdG9cbiAgICAgIC8vIGNvbnN0IGNvZ25pdG8gPSBuZXcgQ29nbml0b0lkZW50aXR5U2VydmljZVByb3ZpZGVyKHsgcmVnaW9uOiB0aGlzLnJlZ2lvbiB9KTtcbiAgICAgIC8vIGF3YWl0IGNvZ25pdG8uc2lnbk91dCh7XG4gICAgICAvLyAgIEFjY2Vzc1Rva2VuOiBhY2Nlc3NUb2tlblxuICAgICAgLy8gfSkucHJvbWlzZSgpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbiBzaWduT3V0OicsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWZyZXNoIHRva2VucyB1c2luZyBhIHJlZnJlc2ggdG9rZW5cbiAgICogQHBhcmFtIHJlZnJlc2hUb2tlbiBVc2VyJ3MgcmVmcmVzaCB0b2tlblxuICAgKi9cbiAgYXN5bmMgcmVmcmVzaFRva2VucyhyZWZyZXNoVG9rZW46IHN0cmluZyk6IFByb21pc2U8e1xuICAgIGlkVG9rZW46IHN0cmluZztcbiAgICBhY2Nlc3NUb2tlbjogc3RyaW5nO1xuICAgIHJlZnJlc2hUb2tlbjogc3RyaW5nO1xuICB9PiB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIFZhbGlkYXRlIGlucHV0c1xuICAgICAgaWYgKCFyZWZyZXNoVG9rZW4pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZWZyZXNoIHRva2VuIGlzIHJlcXVpcmVkJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoaXMgaXMgd2hlcmUgd2Ugd291bGQgY2FsbCBDb2duaXRvJ3MgaW5pdGlhdGVBdXRoIEFQSSB3aXRoIFJFRlJFU0hfVE9LRU5fQVVUSCBmbG93XG4gICAgICBjb25zb2xlLmxvZyhgUmVmcmVzaGluZyB0b2tlbnMgd2l0aCByZWZyZXNoIHRva2VuOiAke3JlZnJlc2hUb2tlbi5zdWJzdHJpbmcoMCwgMTApfS4uLmApO1xuICAgICAgXG4gICAgICAvLyBJbiBhIHJlYWwgaW1wbGVtZW50YXRpb24sIHdlIHdvdWxkIHVzZSBBV1MgU0RLIHRvIGNhbGwgQ29nbml0b1xuICAgICAgLy8gY29uc3QgY29nbml0byA9IG5ldyBDb2duaXRvSWRlbnRpdHlTZXJ2aWNlUHJvdmlkZXIoeyByZWdpb246IHRoaXMucmVnaW9uIH0pO1xuICAgICAgLy8gY29uc3QgcmVzdWx0ID0gYXdhaXQgY29nbml0by5pbml0aWF0ZUF1dGgoe1xuICAgICAgLy8gICBDbGllbnRJZDogdGhpcy51c2VyUG9vbENsaWVudElkLFxuICAgICAgLy8gICBBdXRoRmxvdzogJ1JFRlJFU0hfVE9LRU5fQVVUSCcsXG4gICAgICAvLyAgIEF1dGhQYXJhbWV0ZXJzOiB7XG4gICAgICAvLyAgICAgUkVGUkVTSF9UT0tFTjogcmVmcmVzaFRva2VuXG4gICAgICAvLyAgIH1cbiAgICAgIC8vIH0pLnByb21pc2UoKTtcbiAgICAgIFxuICAgICAgLy8gRm9yIG5vdywgcmV0dXJuIGEgc2ltdWxhdGVkIHJlc3BvbnNlXG4gICAgICByZXR1cm4ge1xuICAgICAgICBpZFRva2VuOiBgc2ltdWxhdGVkLWlkLXRva2VuLSR7RGF0ZS5ub3coKX1gLFxuICAgICAgICBhY2Nlc3NUb2tlbjogYHNpbXVsYXRlZC1hY2Nlc3MtdG9rZW4tJHtEYXRlLm5vdygpfWAsXG4gICAgICAgIHJlZnJlc2hUb2tlbjogcmVmcmVzaFRva2VuIC8vIFVzdWFsbHkgdGhlIHJlZnJlc2ggdG9rZW4gZG9lc24ndCBjaGFuZ2VcbiAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluIHJlZnJlc2hUb2tlbnM6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG59XG4iXX0=