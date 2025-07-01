import { User } from '../../domain/User';
import { UserRepository } from '../../application/ports/UserRepository';
/**
 * DynamoDB implementation of the UserRepository interface
 * This is an output adapter in the hexagonal architecture
 */
export declare class DynamoDBUserRepository implements UserRepository {
    private client;
    private tableName;
    constructor(tableName: string, region?: string);
    /**
     * Save a user to DynamoDB
     * @param user User entity to save
     */
    saveUser(user: User): Promise<void>;
    /**
     * Get a user by ID from DynamoDB
     * @param userId ID of the user to retrieve
     */
    getUserById(userId: string): Promise<User | null>;
    /**
     * Get a user by email from DynamoDB
     * Uses a secondary index on the email field
     * @param email Email of the user to retrieve
     */
    getUserByEmail(email: string): Promise<User | null>;
    /**
     * Delete a user from DynamoDB
     * @param userId ID of the user to delete
     */
    deleteUser(userId: string): Promise<void>;
}
