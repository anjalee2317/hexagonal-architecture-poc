"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const UserService_1 = require("../../application/services/UserService");
const DynamoDBUserRepository_1 = require("../out/DynamoDBUserRepository");
const EventBridgePublisher_1 = require("../out/EventBridgePublisher");
/**
 * Environment variables expected to be set in the Lambda function
 */
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || '';
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME || '';
const REGION = process.env.REGION || 'us-east-1';
// Create event publisher if event bus name is provided
const eventPublisher = EVENT_BUS_NAME ? new EventBridgePublisher_1.EventBridgePublisher(EVENT_BUS_NAME, REGION) : undefined;
/**
 * Lambda handler for Cognito Post Confirmation trigger
 * This adapter handles the post confirmation event from Cognito
 */
const handler = async (event) => {
    try {
        console.log('Post confirmation event received:', JSON.stringify(event));
        // Extract user data from the event
        const { userName, request } = event;
        const { userAttributes } = request;
        // Create user repository
        const userRepository = new DynamoDBUserRepository_1.DynamoDBUserRepository(USER_TABLE_NAME, REGION);
        // Create user service
        const userService = new UserService_1.UserService(userRepository, eventPublisher);
        // Process the confirmed user
        await userService.createUserProfile({
            userId: userName,
            email: userAttributes.email,
            phoneNumber: userAttributes.phone_number,
            createdAt: new Date().toISOString(),
            preferences: {
                notifications: true,
                theme: 'light'
            }
        });
        console.log(`User profile created for ${userName}`);
        // Return the event to continue the authentication flow
        return event;
    }
    catch (error) {
        console.error('Error in post confirmation handler:', error);
        // Important: We still return the event to allow the user to be confirmed
        // even if our additional processing fails
        return event;
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdENvbmZpcm1hdGlvbkZ1bmN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FkYXB0ZXJzL2luL3Bvc3RDb25maXJtYXRpb25GdW5jdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx3RUFBcUU7QUFDckUsMEVBQXVFO0FBQ3ZFLHNFQUFtRTtBQUVuRTs7R0FFRztBQUNILE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxJQUFJLEVBQUUsQ0FBQztBQUMxRCxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsSUFBSSxFQUFFLENBQUM7QUFDeEQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLElBQUksV0FBVyxDQUFDO0FBRWpELHVEQUF1RDtBQUN2RCxNQUFNLGNBQWMsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLElBQUksMkNBQW9CLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFFckc7OztHQUdHO0FBQ0ksTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQW1DLEVBQXlDLEVBQUU7SUFDMUcsSUFBSSxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQ0FBbUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFeEUsbUNBQW1DO1FBQ25DLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBQ3BDLE1BQU0sRUFBRSxjQUFjLEVBQUUsR0FBRyxPQUFPLENBQUM7UUFFbkMseUJBQXlCO1FBQ3pCLE1BQU0sY0FBYyxHQUFHLElBQUksK0NBQXNCLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRTNFLHNCQUFzQjtRQUN0QixNQUFNLFdBQVcsR0FBRyxJQUFJLHlCQUFXLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBRXBFLDZCQUE2QjtRQUM3QixNQUFNLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQztZQUNsQyxNQUFNLEVBQUUsUUFBUTtZQUNoQixLQUFLLEVBQUUsY0FBYyxDQUFDLEtBQUs7WUFDM0IsV0FBVyxFQUFFLGNBQWMsQ0FBQyxZQUFZO1lBQ3hDLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtZQUNuQyxXQUFXLEVBQUU7Z0JBQ1gsYUFBYSxFQUFFLElBQUk7Z0JBQ25CLEtBQUssRUFBRSxPQUFPO2FBQ2Y7U0FDRixDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBRXBELHVEQUF1RDtRQUN2RCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUU1RCx5RUFBeUU7UUFDekUsMENBQTBDO1FBQzFDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztBQUNILENBQUMsQ0FBQztBQXJDVyxRQUFBLE9BQU8sV0FxQ2xCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUG9zdENvbmZpcm1hdGlvblRyaWdnZXJFdmVudCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgVXNlclNlcnZpY2UgfSBmcm9tICcuLi8uLi9hcHBsaWNhdGlvbi9zZXJ2aWNlcy9Vc2VyU2VydmljZSc7XG5pbXBvcnQgeyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vb3V0L0R5bmFtb0RCVXNlclJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRXZlbnRCcmlkZ2VQdWJsaXNoZXIgfSBmcm9tICcuLi9vdXQvRXZlbnRCcmlkZ2VQdWJsaXNoZXInO1xuXG4vKipcbiAqIEVudmlyb25tZW50IHZhcmlhYmxlcyBleHBlY3RlZCB0byBiZSBzZXQgaW4gdGhlIExhbWJkYSBmdW5jdGlvblxuICovXG5jb25zdCBVU0VSX1RBQkxFX05BTUUgPSBwcm9jZXNzLmVudi5VU0VSX1RBQkxFX05BTUUgfHwgJyc7XG5jb25zdCBFVkVOVF9CVVNfTkFNRSA9IHByb2Nlc3MuZW52LkVWRU5UX0JVU19OQU1FIHx8ICcnO1xuY29uc3QgUkVHSU9OID0gcHJvY2Vzcy5lbnYuUkVHSU9OIHx8ICd1cy1lYXN0LTEnO1xuXG4vLyBDcmVhdGUgZXZlbnQgcHVibGlzaGVyIGlmIGV2ZW50IGJ1cyBuYW1lIGlzIHByb3ZpZGVkXG5jb25zdCBldmVudFB1Ymxpc2hlciA9IEVWRU5UX0JVU19OQU1FID8gbmV3IEV2ZW50QnJpZGdlUHVibGlzaGVyKEVWRU5UX0JVU19OQU1FLCBSRUdJT04pIDogdW5kZWZpbmVkO1xuXG4vKipcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBDb2duaXRvIFBvc3QgQ29uZmlybWF0aW9uIHRyaWdnZXJcbiAqIFRoaXMgYWRhcHRlciBoYW5kbGVzIHRoZSBwb3N0IGNvbmZpcm1hdGlvbiBldmVudCBmcm9tIENvZ25pdG9cbiAqL1xuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IFBvc3RDb25maXJtYXRpb25UcmlnZ2VyRXZlbnQpOiBQcm9taXNlPFBvc3RDb25maXJtYXRpb25UcmlnZ2VyRXZlbnQ+ID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZygnUG9zdCBjb25maXJtYXRpb24gZXZlbnQgcmVjZWl2ZWQ6JywgSlNPTi5zdHJpbmdpZnkoZXZlbnQpKTtcbiAgICBcbiAgICAvLyBFeHRyYWN0IHVzZXIgZGF0YSBmcm9tIHRoZSBldmVudFxuICAgIGNvbnN0IHsgdXNlck5hbWUsIHJlcXVlc3QgfSA9IGV2ZW50O1xuICAgIGNvbnN0IHsgdXNlckF0dHJpYnV0ZXMgfSA9IHJlcXVlc3Q7XG4gICAgXG4gICAgLy8gQ3JlYXRlIHVzZXIgcmVwb3NpdG9yeVxuICAgIGNvbnN0IHVzZXJSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCVXNlclJlcG9zaXRvcnkoVVNFUl9UQUJMRV9OQU1FLCBSRUdJT04pO1xuICAgIFxuICAgIC8vIENyZWF0ZSB1c2VyIHNlcnZpY2VcbiAgICBjb25zdCB1c2VyU2VydmljZSA9IG5ldyBVc2VyU2VydmljZSh1c2VyUmVwb3NpdG9yeSwgZXZlbnRQdWJsaXNoZXIpO1xuICAgIFxuICAgIC8vIFByb2Nlc3MgdGhlIGNvbmZpcm1lZCB1c2VyXG4gICAgYXdhaXQgdXNlclNlcnZpY2UuY3JlYXRlVXNlclByb2ZpbGUoe1xuICAgICAgdXNlcklkOiB1c2VyTmFtZSxcbiAgICAgIGVtYWlsOiB1c2VyQXR0cmlidXRlcy5lbWFpbCxcbiAgICAgIHBob25lTnVtYmVyOiB1c2VyQXR0cmlidXRlcy5waG9uZV9udW1iZXIsXG4gICAgICBjcmVhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIHByZWZlcmVuY2VzOiB7XG4gICAgICAgIG5vdGlmaWNhdGlvbnM6IHRydWUsXG4gICAgICAgIHRoZW1lOiAnbGlnaHQnXG4gICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgY29uc29sZS5sb2coYFVzZXIgcHJvZmlsZSBjcmVhdGVkIGZvciAke3VzZXJOYW1lfWApO1xuICAgIFxuICAgIC8vIFJldHVybiB0aGUgZXZlbnQgdG8gY29udGludWUgdGhlIGF1dGhlbnRpY2F0aW9uIGZsb3dcbiAgICByZXR1cm4gZXZlbnQ7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaW4gcG9zdCBjb25maXJtYXRpb24gaGFuZGxlcjonLCBlcnJvcik7XG4gICAgXG4gICAgLy8gSW1wb3J0YW50OiBXZSBzdGlsbCByZXR1cm4gdGhlIGV2ZW50IHRvIGFsbG93IHRoZSB1c2VyIHRvIGJlIGNvbmZpcm1lZFxuICAgIC8vIGV2ZW4gaWYgb3VyIGFkZGl0aW9uYWwgcHJvY2Vzc2luZyBmYWlsc1xuICAgIHJldHVybiBldmVudDtcbiAgfVxufTtcbiJdfQ==