import { AuthUseCase } from '../ports/in/AuthUseCase';
import { EventPublisherPort } from '../ports/out/EventPublisherPort';
/**
 * Implementation of the AuthUseCase interface
 * This service handles authentication operations using AWS Cognito
 */
export declare class AuthService implements AuthUseCase {
    private readonly userPoolId;
    private readonly userPoolClientId;
    private readonly region;
    private readonly eventPublisher?;
    /**
     * Constructor for AuthService
     * @param userPoolId Cognito User Pool ID
     * @param userPoolClientId Cognito User Pool Client ID
     * @param region AWS Region
     * @param eventPublisher Optional event publisher for auth events
     */
    constructor(userPoolId: string, userPoolClientId: string, region: string, eventPublisher?: EventPublisherPort);
    /**
     * Sign up a new user
     * @param username Username
     * @param password Password
     * @param email Email address
     * @param phoneNumber Phone number with country code (e.g., +12065551234)
     */
    signUp(username: string, password: string, email: string, phoneNumber: string): Promise<{
        userSub: string;
    }>;
    /**
     * Confirm user registration with verification code
     * @param username Username
     * @param confirmationCode Code sent to user's email or phone
     */
    confirmSignUp(username: string, confirmationCode: string): Promise<void>;
    /**
     * Resend confirmation code
     * @param username Username
     */
    resendConfirmationCode(username: string): Promise<void>;
    /**
     * Sign in a user
     * @param username Username
     * @param password Password
     */
    signIn(username: string, password: string): Promise<{
        idToken: string;
        accessToken: string;
        refreshToken: string;
        challengeName?: string;
        challengeParameters?: Record<string, string>;
    }>;
    /**
     * Respond to MFA challenge
     * @param username Username
     * @param session Session from sign in response
     * @param mfaCode MFA code from SMS or TOTP
     */
    respondToMfaChallenge(username: string, session: string, mfaCode: string): Promise<{
        idToken: string;
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * Forgot password flow - initiate
     * @param username Username
     */
    forgotPassword(username: string): Promise<void>;
    /**
     * Forgot password flow - confirm with code
     * @param username Username
     * @param confirmationCode Code sent to user's email or phone
     * @param newPassword New password
     */
    confirmForgotPassword(username: string, confirmationCode: string, newPassword: string): Promise<void>;
    /**
     * Change password for authenticated user
     * @param accessToken User's access token
     * @param oldPassword Old password
     * @param newPassword New password
     */
    changePassword(accessToken: string, oldPassword: string, newPassword: string): Promise<void>;
    /**
     * Get current user information
     * @param accessToken User's access token
     */
    getCurrentUser(accessToken: string): Promise<{
        username: string;
        attributes: Record<string, string>;
    }>;
    /**
     * Sign out a user
     * @param accessToken User's access token
     */
    signOut(accessToken: string): Promise<void>;
    /**
     * Refresh tokens using a refresh token
     * @param refreshToken User's refresh token
     */
    refreshTokens(refreshToken: string): Promise<{
        idToken: string;
        accessToken: string;
        refreshToken: string;
    }>;
}
