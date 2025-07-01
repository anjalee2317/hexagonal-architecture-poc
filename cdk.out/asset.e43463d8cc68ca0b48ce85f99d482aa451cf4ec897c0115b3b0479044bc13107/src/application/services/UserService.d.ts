import { User, UserPreferences } from '../../domain/User';
import { EventPublisherPort } from '../ports/out/EventPublisherPort';
import { UserRepository } from '../ports/UserRepository';
/**
 * Interface for user profile creation
 */
export interface UserProfileData {
    userId: string;
    email: string;
    phoneNumber?: string;
    createdAt: string;
    preferences: UserPreferences;
}
/**
 * Service for user-related operations
 * Implements application logic for user management
 */
export declare class UserService {
    private userRepository;
    private eventPublisher?;
    constructor(userRepository: UserRepository, eventPublisher?: EventPublisherPort);
    /**
     * Create a user profile after confirmation
     * @param userData User data from confirmation event
     */
    createUserProfile(userData: UserProfileData): Promise<User>;
    /**
     * Get a user by ID
     * @param userId User ID to look up
     */
    getUserById(userId: string): Promise<User | null>;
    /**
     * Update user preferences
     * @param userId User ID to update
     * @param preferences New preferences
     */
    updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User>;
}
