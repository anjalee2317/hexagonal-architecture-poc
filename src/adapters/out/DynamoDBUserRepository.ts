import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  DeleteCommand, 
  QueryCommand 
} from '@aws-sdk/lib-dynamodb';
import { User } from '../../domain/User';
import { UserRepository } from '../../application/ports/UserRepository';

/**
 * DynamoDB implementation of the UserRepository interface
 * This is an output adapter in the hexagonal architecture
 */
export class DynamoDBUserRepository implements UserRepository {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor(tableName: string, region: string = 'us-east-1') {
    const dynamoClient = new DynamoDBClient({ region });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = tableName;
  }

  /**
   * Save a user to DynamoDB
   * @param user User entity to save
   */
  async saveUser(user: User): Promise<void> {
    const userItem = user.toObject();
    
    try {
      await this.client.send(new PutCommand({
        TableName: this.tableName,
        Item: userItem
      }));
    } catch (error) {
      console.error('Error saving user to DynamoDB:', error);
      throw new Error(`Failed to save user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a user by ID from DynamoDB
   * @param userId ID of the user to retrieve
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const response = await this.client.send(new GetCommand({
        TableName: this.tableName,
        Key: { userId }
      }));

      if (!response.Item) {
        return null;
      }

      return User.fromObject(response.Item);
    } catch (error) {
      console.error('Error getting user from DynamoDB:', error);
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a user by email from DynamoDB
   * Uses a secondary index on the email field
   * @param email Email of the user to retrieve
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const response = await this.client.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email
        }
      }));

      if (!response.Items || response.Items.length === 0) {
        return null;
      }

      return User.fromObject(response.Items[0]);
    } catch (error) {
      console.error('Error querying user by email from DynamoDB:', error);
      throw new Error(`Failed to get user by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a user from DynamoDB
   * @param userId ID of the user to delete
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.client.send(new DeleteCommand({
        TableName: this.tableName,
        Key: { userId }
      }));
    } catch (error) {
      console.error('Error deleting user from DynamoDB:', error);
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
