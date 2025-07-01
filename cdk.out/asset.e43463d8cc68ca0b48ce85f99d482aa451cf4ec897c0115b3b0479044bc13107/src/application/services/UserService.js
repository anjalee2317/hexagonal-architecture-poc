"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const User_1 = require("../../domain/User");
/**
 * Service for user-related operations
 * Implements application logic for user management
 */
class UserService {
    constructor(userRepository, eventPublisher) {
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }
    /**
     * Create a user profile after confirmation
     * @param userData User data from confirmation event
     */
    async createUserProfile(userData) {
        // Check if user already exists
        const existingUser = await this.userRepository.getUserById(userData.userId);
        if (existingUser) {
            throw new Error(`User with ID ${userData.userId} already exists`);
        }
        // Create new user entity
        const user = new User_1.User(userData.userId, userData.email, userData.createdAt, userData.preferences, userData.phoneNumber);
        // Save user to repository
        await this.userRepository.saveUser(user);
        // Publish user created event
        if (this.eventPublisher) {
            await this.eventPublisher.publishEvent('user-service', 'UserCreated', {
                userId: user.userId,
                email: user.email,
                createdAt: user.createdAt
            });
        }
        return user;
    }
    /**
     * Get a user by ID
     * @param userId User ID to look up
     */
    async getUserById(userId) {
        return this.userRepository.getUserById(userId);
    }
    /**
     * Update user preferences
     * @param userId User ID to update
     * @param preferences New preferences
     */
    async updateUserPreferences(userId, preferences) {
        const user = await this.userRepository.getUserById(userId);
        if (!user) {
            throw new Error(`User with ID ${userId} not found`);
        }
        user.updatePreferences(preferences);
        await this.userRepository.saveUser(user);
        // Publish user preferences updated event
        if (this.eventPublisher) {
            await this.eventPublisher.publishEvent('user-service', 'UserPreferencesUpdated', {
                userId: user.userId,
                preferences: user.preferences
            });
        }
        return user;
    }
}
exports.UserService = UserService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXNlclNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBwbGljYXRpb24vc2VydmljZXMvVXNlclNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNENBQTBEO0FBZTFEOzs7R0FHRztBQUNILE1BQWEsV0FBVztJQUl0QixZQUFZLGNBQThCLEVBQUUsY0FBbUM7UUFDN0UsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFDckMsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7SUFDdkMsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxRQUF5QjtRQUMvQywrQkFBK0I7UUFDL0IsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUUsSUFBSSxZQUFZLEVBQUUsQ0FBQztZQUNqQixNQUFNLElBQUksS0FBSyxDQUFDLGdCQUFnQixRQUFRLENBQUMsTUFBTSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3BFLENBQUM7UUFFRCx5QkFBeUI7UUFDekIsTUFBTSxJQUFJLEdBQUcsSUFBSSxXQUFJLENBQ25CLFFBQVEsQ0FBQyxNQUFNLEVBQ2YsUUFBUSxDQUFDLEtBQUssRUFDZCxRQUFRLENBQUMsU0FBUyxFQUNsQixRQUFRLENBQUMsV0FBVyxFQUNwQixRQUFRLENBQUMsV0FBVyxDQUNyQixDQUFDO1FBRUYsMEJBQTBCO1FBQzFCLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFekMsNkJBQTZCO1FBQzdCLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3hCLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQ3BDLGNBQWMsRUFDZCxhQUFhLEVBQ2I7Z0JBQ0UsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO2dCQUNuQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7Z0JBQ2pCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUzthQUMxQixDQUNGLENBQUM7UUFDSixDQUFDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFjO1FBQzlCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMscUJBQXFCLENBQUMsTUFBYyxFQUFFLFdBQXFDO1FBQy9FLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0QsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1YsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsTUFBTSxZQUFZLENBQUMsQ0FBQztRQUN0RCxDQUFDO1FBRUQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFekMseUNBQXlDO1FBQ3pDLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ3hCLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQ3BDLGNBQWMsRUFDZCx3QkFBd0IsRUFDeEI7Z0JBQ0UsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO2dCQUNuQixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7YUFDOUIsQ0FDRixDQUFDO1FBQ0osQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUNGO0FBcEZELGtDQW9GQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFVzZXIsIFVzZXJQcmVmZXJlbmNlcyB9IGZyb20gJy4uLy4uL2RvbWFpbi9Vc2VyJztcbmltcG9ydCB7IEV2ZW50UHVibGlzaGVyUG9ydCB9IGZyb20gJy4uL3BvcnRzL291dC9FdmVudFB1Ymxpc2hlclBvcnQnO1xuaW1wb3J0IHsgVXNlclJlcG9zaXRvcnkgfSBmcm9tICcuLi9wb3J0cy9Vc2VyUmVwb3NpdG9yeSc7XG5cbi8qKlxuICogSW50ZXJmYWNlIGZvciB1c2VyIHByb2ZpbGUgY3JlYXRpb25cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBVc2VyUHJvZmlsZURhdGEge1xuICB1c2VySWQ6IHN0cmluZztcbiAgZW1haWw6IHN0cmluZztcbiAgcGhvbmVOdW1iZXI/OiBzdHJpbmc7XG4gIGNyZWF0ZWRBdDogc3RyaW5nO1xuICBwcmVmZXJlbmNlczogVXNlclByZWZlcmVuY2VzO1xufVxuXG4vKipcbiAqIFNlcnZpY2UgZm9yIHVzZXItcmVsYXRlZCBvcGVyYXRpb25zXG4gKiBJbXBsZW1lbnRzIGFwcGxpY2F0aW9uIGxvZ2ljIGZvciB1c2VyIG1hbmFnZW1lbnRcbiAqL1xuZXhwb3J0IGNsYXNzIFVzZXJTZXJ2aWNlIHtcbiAgcHJpdmF0ZSB1c2VyUmVwb3NpdG9yeTogVXNlclJlcG9zaXRvcnk7XG4gIHByaXZhdGUgZXZlbnRQdWJsaXNoZXI/OiBFdmVudFB1Ymxpc2hlclBvcnQ7XG5cbiAgY29uc3RydWN0b3IodXNlclJlcG9zaXRvcnk6IFVzZXJSZXBvc2l0b3J5LCBldmVudFB1Ymxpc2hlcj86IEV2ZW50UHVibGlzaGVyUG9ydCkge1xuICAgIHRoaXMudXNlclJlcG9zaXRvcnkgPSB1c2VyUmVwb3NpdG9yeTtcbiAgICB0aGlzLmV2ZW50UHVibGlzaGVyID0gZXZlbnRQdWJsaXNoZXI7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgdXNlciBwcm9maWxlIGFmdGVyIGNvbmZpcm1hdGlvblxuICAgKiBAcGFyYW0gdXNlckRhdGEgVXNlciBkYXRhIGZyb20gY29uZmlybWF0aW9uIGV2ZW50XG4gICAqL1xuICBhc3luYyBjcmVhdGVVc2VyUHJvZmlsZSh1c2VyRGF0YTogVXNlclByb2ZpbGVEYXRhKTogUHJvbWlzZTxVc2VyPiB7XG4gICAgLy8gQ2hlY2sgaWYgdXNlciBhbHJlYWR5IGV4aXN0c1xuICAgIGNvbnN0IGV4aXN0aW5nVXNlciA9IGF3YWl0IHRoaXMudXNlclJlcG9zaXRvcnkuZ2V0VXNlckJ5SWQodXNlckRhdGEudXNlcklkKTtcbiAgICBpZiAoZXhpc3RpbmdVc2VyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVzZXIgd2l0aCBJRCAke3VzZXJEYXRhLnVzZXJJZH0gYWxyZWFkeSBleGlzdHNgKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgbmV3IHVzZXIgZW50aXR5XG4gICAgY29uc3QgdXNlciA9IG5ldyBVc2VyKFxuICAgICAgdXNlckRhdGEudXNlcklkLFxuICAgICAgdXNlckRhdGEuZW1haWwsXG4gICAgICB1c2VyRGF0YS5jcmVhdGVkQXQsXG4gICAgICB1c2VyRGF0YS5wcmVmZXJlbmNlcyxcbiAgICAgIHVzZXJEYXRhLnBob25lTnVtYmVyXG4gICAgKTtcblxuICAgIC8vIFNhdmUgdXNlciB0byByZXBvc2l0b3J5XG4gICAgYXdhaXQgdGhpcy51c2VyUmVwb3NpdG9yeS5zYXZlVXNlcih1c2VyKTtcblxuICAgIC8vIFB1Ymxpc2ggdXNlciBjcmVhdGVkIGV2ZW50XG4gICAgaWYgKHRoaXMuZXZlbnRQdWJsaXNoZXIpIHtcbiAgICAgIGF3YWl0IHRoaXMuZXZlbnRQdWJsaXNoZXIucHVibGlzaEV2ZW50KFxuICAgICAgICAndXNlci1zZXJ2aWNlJyxcbiAgICAgICAgJ1VzZXJDcmVhdGVkJyxcbiAgICAgICAge1xuICAgICAgICAgIHVzZXJJZDogdXNlci51c2VySWQsXG4gICAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXG4gICAgICAgICAgY3JlYXRlZEF0OiB1c2VyLmNyZWF0ZWRBdFxuICAgICAgICB9XG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiB1c2VyO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHVzZXIgYnkgSURcbiAgICogQHBhcmFtIHVzZXJJZCBVc2VyIElEIHRvIGxvb2sgdXBcbiAgICovXG4gIGFzeW5jIGdldFVzZXJCeUlkKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VyIHwgbnVsbD4ge1xuICAgIHJldHVybiB0aGlzLnVzZXJSZXBvc2l0b3J5LmdldFVzZXJCeUlkKHVzZXJJZCk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHVzZXIgcHJlZmVyZW5jZXNcbiAgICogQHBhcmFtIHVzZXJJZCBVc2VyIElEIHRvIHVwZGF0ZVxuICAgKiBAcGFyYW0gcHJlZmVyZW5jZXMgTmV3IHByZWZlcmVuY2VzXG4gICAqL1xuICBhc3luYyB1cGRhdGVVc2VyUHJlZmVyZW5jZXModXNlcklkOiBzdHJpbmcsIHByZWZlcmVuY2VzOiBQYXJ0aWFsPFVzZXJQcmVmZXJlbmNlcz4pOiBQcm9taXNlPFVzZXI+IHtcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgdGhpcy51c2VyUmVwb3NpdG9yeS5nZXRVc2VyQnlJZCh1c2VySWQpO1xuICAgIGlmICghdXNlcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVc2VyIHdpdGggSUQgJHt1c2VySWR9IG5vdCBmb3VuZGApO1xuICAgIH1cblxuICAgIHVzZXIudXBkYXRlUHJlZmVyZW5jZXMocHJlZmVyZW5jZXMpO1xuICAgIGF3YWl0IHRoaXMudXNlclJlcG9zaXRvcnkuc2F2ZVVzZXIodXNlcik7XG5cbiAgICAvLyBQdWJsaXNoIHVzZXIgcHJlZmVyZW5jZXMgdXBkYXRlZCBldmVudFxuICAgIGlmICh0aGlzLmV2ZW50UHVibGlzaGVyKSB7XG4gICAgICBhd2FpdCB0aGlzLmV2ZW50UHVibGlzaGVyLnB1Ymxpc2hFdmVudChcbiAgICAgICAgJ3VzZXItc2VydmljZScsXG4gICAgICAgICdVc2VyUHJlZmVyZW5jZXNVcGRhdGVkJyxcbiAgICAgICAge1xuICAgICAgICAgIHVzZXJJZDogdXNlci51c2VySWQsXG4gICAgICAgICAgcHJlZmVyZW5jZXM6IHVzZXIucHJlZmVyZW5jZXNcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdXNlcjtcbiAgfVxufVxuIl19