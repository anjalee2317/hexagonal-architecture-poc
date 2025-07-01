import { User } from '../../domain/User';

/**
 * Interface for user data persistence operations
 * This is an output port in the hexagonal architecture
 */
export interface UserRepository {
  /**
   * Save a user to the repository
   * @param user User entity to save
   */
  saveUser(user: User): Promise<void>;
  
  /**
   * Get a user by ID
   * @param userId ID of the user to retrieve
   */
  getUserById(userId: string): Promise<User | null>;
  
  /**
   * Get a user by email
   * @param email Email of the user to retrieve
   */
  getUserByEmail(email: string): Promise<User | null>;
  
  /**
   * Delete a user
   * @param userId ID of the user to delete
   */
  deleteUser(userId: string): Promise<void>;
}
