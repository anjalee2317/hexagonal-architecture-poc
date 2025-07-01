/**
 * User entity representing a confirmed user in the system
 */
export interface UserPreferences {
    notifications: boolean;
    theme: 'light' | 'dark';
}
export declare class User {
    private _userId;
    private _email;
    private _phoneNumber?;
    private _createdAt;
    private _updatedAt?;
    private _preferences;
    constructor(userId: string, email: string, createdAt: string, preferences: UserPreferences, phoneNumber?: string, updatedAt?: string);
    get userId(): string;
    get email(): string;
    get phoneNumber(): string | undefined;
    get createdAt(): string;
    get updatedAt(): string | undefined;
    get preferences(): UserPreferences;
    /**
     * Update user preferences
     * @param preferences New preferences to set
     */
    updatePreferences(preferences: Partial<UserPreferences>): void;
    /**
     * Update user email
     * @param email New email address
     */
    updateEmail(email: string): void;
    /**
     * Update user phone number
     * @param phoneNumber New phone number
     */
    updatePhoneNumber(phoneNumber: string): void;
    /**
     * Convert User entity to a plain object for storage
     */
    toObject(): Record<string, any>;
    /**
     * Create a User entity from a plain object
     * @param data User data from storage
     */
    static fromObject(data: Record<string, any>): User;
}
