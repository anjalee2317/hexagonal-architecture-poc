"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBUserRepository = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const User_1 = require("../../domain/User");
/**
 * DynamoDB implementation of the UserRepository interface
 * This is an output adapter in the hexagonal architecture
 */
class DynamoDBUserRepository {
    constructor(tableName, region = 'us-east-1') {
        const dynamoClient = new client_dynamodb_1.DynamoDBClient({ region });
        this.client = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
        this.tableName = tableName;
    }
    /**
     * Save a user to DynamoDB
     * @param user User entity to save
     */
    async saveUser(user) {
        const userItem = user.toObject();
        try {
            await this.client.send(new lib_dynamodb_1.PutCommand({
                TableName: this.tableName,
                Item: userItem
            }));
        }
        catch (error) {
            console.error('Error saving user to DynamoDB:', error);
            throw new Error(`Failed to save user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get a user by ID from DynamoDB
     * @param userId ID of the user to retrieve
     */
    async getUserById(userId) {
        try {
            const response = await this.client.send(new lib_dynamodb_1.GetCommand({
                TableName: this.tableName,
                Key: { userId }
            }));
            if (!response.Item) {
                return null;
            }
            return User_1.User.fromObject(response.Item);
        }
        catch (error) {
            console.error('Error getting user from DynamoDB:', error);
            throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get a user by email from DynamoDB
     * Uses a secondary index on the email field
     * @param email Email of the user to retrieve
     */
    async getUserByEmail(email) {
        try {
            const response = await this.client.send(new lib_dynamodb_1.QueryCommand({
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
            return User_1.User.fromObject(response.Items[0]);
        }
        catch (error) {
            console.error('Error querying user by email from DynamoDB:', error);
            throw new Error(`Failed to get user by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Delete a user from DynamoDB
     * @param userId ID of the user to delete
     */
    async deleteUser(userId) {
        try {
            await this.client.send(new lib_dynamodb_1.DeleteCommand({
                TableName: this.tableName,
                Key: { userId }
            }));
        }
        catch (error) {
            console.error('Error deleting user from DynamoDB:', error);
            throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.DynamoDBUserRepository = DynamoDBUserRepository;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRHluYW1vREJVc2VyUmVwb3NpdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9hZGFwdGVycy9vdXQvRHluYW1vREJVc2VyUmVwb3NpdG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw4REFBMEQ7QUFDMUQsd0RBTStCO0FBQy9CLDRDQUF5QztBQUd6Qzs7O0dBR0c7QUFDSCxNQUFhLHNCQUFzQjtJQUlqQyxZQUFZLFNBQWlCLEVBQUUsU0FBaUIsV0FBVztRQUN6RCxNQUFNLFlBQVksR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxNQUFNLEdBQUcscUNBQXNCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3hELElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBQzdCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsUUFBUSxDQUFDLElBQVU7UUFDdkIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBRWpDLElBQUksQ0FBQztZQUNILE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSx5QkFBVSxDQUFDO2dCQUNwQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7Z0JBQ3pCLElBQUksRUFBRSxRQUFRO2FBQ2YsQ0FBQyxDQUFDLENBQUM7UUFDTixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkQsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztRQUN0RyxDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBYztRQUM5QixJQUFJLENBQUM7WUFDSCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUkseUJBQVUsQ0FBQztnQkFDckQsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO2dCQUN6QixHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUU7YUFDaEIsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNuQixPQUFPLElBQUksQ0FBQztZQUNkLENBQUM7WUFFRCxPQUFPLFdBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxtQ0FBbUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxRCxNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1FBQ3JHLENBQUM7SUFDSCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBYTtRQUNoQyxJQUFJLENBQUM7WUFDSCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksMkJBQVksQ0FBQztnQkFDdkQsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO2dCQUN6QixTQUFTLEVBQUUsWUFBWTtnQkFDdkIsc0JBQXNCLEVBQUUsZ0JBQWdCO2dCQUN4Qyx5QkFBeUIsRUFBRTtvQkFDekIsUUFBUSxFQUFFLEtBQUs7aUJBQ2hCO2FBQ0YsQ0FBQyxDQUFDLENBQUM7WUFFSixJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztnQkFDbkQsT0FBTyxJQUFJLENBQUM7WUFDZCxDQUFDO1lBRUQsT0FBTyxXQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QyxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsNkNBQTZDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDcEUsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztRQUM5RyxDQUFDO0lBQ0gsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBYztRQUM3QixJQUFJLENBQUM7WUFDSCxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksNEJBQWEsQ0FBQztnQkFDdkMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO2dCQUN6QixHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUU7YUFDaEIsQ0FBQyxDQUFDLENBQUM7UUFDTixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0NBQW9DLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDM0QsTUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztRQUN4RyxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBNUZELHdEQTRGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcbmltcG9ydCB7IFxuICBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LCBcbiAgUHV0Q29tbWFuZCwgXG4gIEdldENvbW1hbmQsIFxuICBEZWxldGVDb21tYW5kLCBcbiAgUXVlcnlDb21tYW5kIFxufSBmcm9tICdAYXdzLXNkay9saWItZHluYW1vZGInO1xuaW1wb3J0IHsgVXNlciB9IGZyb20gJy4uLy4uL2RvbWFpbi9Vc2VyJztcbmltcG9ydCB7IFVzZXJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vYXBwbGljYXRpb24vcG9ydHMvVXNlclJlcG9zaXRvcnknO1xuXG4vKipcbiAqIER5bmFtb0RCIGltcGxlbWVudGF0aW9uIG9mIHRoZSBVc2VyUmVwb3NpdG9yeSBpbnRlcmZhY2VcbiAqIFRoaXMgaXMgYW4gb3V0cHV0IGFkYXB0ZXIgaW4gdGhlIGhleGFnb25hbCBhcmNoaXRlY3R1cmVcbiAqL1xuZXhwb3J0IGNsYXNzIER5bmFtb0RCVXNlclJlcG9zaXRvcnkgaW1wbGVtZW50cyBVc2VyUmVwb3NpdG9yeSB7XG4gIHByaXZhdGUgY2xpZW50OiBEeW5hbW9EQkRvY3VtZW50Q2xpZW50O1xuICBwcml2YXRlIHRhYmxlTmFtZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHRhYmxlTmFtZTogc3RyaW5nLCByZWdpb246IHN0cmluZyA9ICd1cy1lYXN0LTEnKSB7XG4gICAgY29uc3QgZHluYW1vQ2xpZW50ID0gbmV3IER5bmFtb0RCQ2xpZW50KHsgcmVnaW9uIH0pO1xuICAgIHRoaXMuY2xpZW50ID0gRHluYW1vREJEb2N1bWVudENsaWVudC5mcm9tKGR5bmFtb0NsaWVudCk7XG4gICAgdGhpcy50YWJsZU5hbWUgPSB0YWJsZU5hbWU7XG4gIH1cblxuICAvKipcbiAgICogU2F2ZSBhIHVzZXIgdG8gRHluYW1vREJcbiAgICogQHBhcmFtIHVzZXIgVXNlciBlbnRpdHkgdG8gc2F2ZVxuICAgKi9cbiAgYXN5bmMgc2F2ZVVzZXIodXNlcjogVXNlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHVzZXJJdGVtID0gdXNlci50b09iamVjdCgpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNsaWVudC5zZW5kKG5ldyBQdXRDb21tYW5kKHtcbiAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgSXRlbTogdXNlckl0ZW1cbiAgICAgIH0pKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc2F2aW5nIHVzZXIgdG8gRHluYW1vREI6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gc2F2ZSB1c2VyOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSB1c2VyIGJ5IElEIGZyb20gRHluYW1vREJcbiAgICogQHBhcmFtIHVzZXJJZCBJRCBvZiB0aGUgdXNlciB0byByZXRyaWV2ZVxuICAgKi9cbiAgYXN5bmMgZ2V0VXNlckJ5SWQodXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPFVzZXIgfCBudWxsPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy5jbGllbnQuc2VuZChuZXcgR2V0Q29tbWFuZCh7XG4gICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgIEtleTogeyB1c2VySWQgfVxuICAgICAgfSkpO1xuXG4gICAgICBpZiAoIXJlc3BvbnNlLkl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBVc2VyLmZyb21PYmplY3QocmVzcG9uc2UuSXRlbSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdldHRpbmcgdXNlciBmcm9tIER5bmFtb0RCOicsIGVycm9yKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIGdldCB1c2VyOiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSB1c2VyIGJ5IGVtYWlsIGZyb20gRHluYW1vREJcbiAgICogVXNlcyBhIHNlY29uZGFyeSBpbmRleCBvbiB0aGUgZW1haWwgZmllbGRcbiAgICogQHBhcmFtIGVtYWlsIEVtYWlsIG9mIHRoZSB1c2VyIHRvIHJldHJpZXZlXG4gICAqL1xuICBhc3luYyBnZXRVc2VyQnlFbWFpbChlbWFpbDogc3RyaW5nKTogUHJvbWlzZTxVc2VyIHwgbnVsbD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMuY2xpZW50LnNlbmQobmV3IFF1ZXJ5Q29tbWFuZCh7XG4gICAgICAgIFRhYmxlTmFtZTogdGhpcy50YWJsZU5hbWUsXG4gICAgICAgIEluZGV4TmFtZTogJ0VtYWlsSW5kZXgnLFxuICAgICAgICBLZXlDb25kaXRpb25FeHByZXNzaW9uOiAnZW1haWwgPSA6ZW1haWwnLFxuICAgICAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAgICAgJzplbWFpbCc6IGVtYWlsXG4gICAgICAgIH1cbiAgICAgIH0pKTtcblxuICAgICAgaWYgKCFyZXNwb25zZS5JdGVtcyB8fCByZXNwb25zZS5JdGVtcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBVc2VyLmZyb21PYmplY3QocmVzcG9uc2UuSXRlbXNbMF0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBxdWVyeWluZyB1c2VyIGJ5IGVtYWlsIGZyb20gRHluYW1vREI6JywgZXJyb3IpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gZ2V0IHVzZXIgYnkgZW1haWw6ICR7ZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcid9YCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIHVzZXIgZnJvbSBEeW5hbW9EQlxuICAgKiBAcGFyYW0gdXNlcklkIElEIG9mIHRoZSB1c2VyIHRvIGRlbGV0ZVxuICAgKi9cbiAgYXN5bmMgZGVsZXRlVXNlcih1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmNsaWVudC5zZW5kKG5ldyBEZWxldGVDb21tYW5kKHtcbiAgICAgICAgVGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgICAgS2V5OiB7IHVzZXJJZCB9XG4gICAgICB9KSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGRlbGV0aW5nIHVzZXIgZnJvbSBEeW5hbW9EQjonLCBlcnJvcik7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBkZWxldGUgdXNlcjogJHtlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJ31gKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==