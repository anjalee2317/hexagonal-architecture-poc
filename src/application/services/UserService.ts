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
export class UserService {
  private userRepository: UserRepository;
  private eventPublisher?: EventPublisherPort;

  constructor(userRepository: UserRepository, eventPublisher?: EventPublisherPort) {
    this.userRepository = userRepository;
    this.eventPublisher = eventPublisher;
  }

  /**
   * Create a user profile after confirmation
   * @param userData User data from confirmation event
   */
  async createUserProfile(userData: UserProfileData): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.getUserById(userData.userId);
    if (existingUser) {
      throw new Error(`User with ID ${userData.userId} already exists`);
    }

    // Create new user entity
    const user = new User(
      userData.userId,
      userData.email,
      userData.createdAt,
      userData.preferences,
      userData.phoneNumber
    );

    // Save user to repository
    await this.userRepository.saveUser(user);

    // Publish user created event
    if (this.eventPublisher) {
      await this.eventPublisher.publishEvent(
        'user-service',
        'UserCreated',
        {
          userId: user.userId,
          email: user.email,
          createdAt: user.createdAt
        }
      );
    }

    return user;
  }

  /**
   * Get a user by ID
   * @param userId User ID to look up
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.getUserById(userId);
  }

  /**
   * Update user preferences
   * @param userId User ID to update
   * @param preferences New preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User> {
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    user.updatePreferences(preferences);
    await this.userRepository.saveUser(user);

    // Publish user preferences updated event
    if (this.eventPublisher) {
      await this.eventPublisher.publishEvent(
        'user-service',
        'UserPreferencesUpdated',
        {
          userId: user.userId,
          preferences: user.preferences
        }
      );
    }

    return user;
  }
}
