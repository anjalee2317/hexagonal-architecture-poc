/**
 * User entity representing a confirmed user in the system
 */
export interface UserPreferences {
  notifications: boolean;
  theme: 'light' | 'dark';
}

export class User {
  private _userId: string;
  private _email: string;
  private _phoneNumber?: string;
  private _createdAt: string;
  private _updatedAt?: string;
  private _preferences: UserPreferences;

  constructor(
    userId: string,
    email: string,
    createdAt: string,
    preferences: UserPreferences,
    phoneNumber?: string,
    updatedAt?: string
  ) {
    this._userId = userId;
    this._email = email;
    this._phoneNumber = phoneNumber;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._preferences = preferences;
  }

  get userId(): string {
    return this._userId;
  }

  get email(): string {
    return this._email;
  }

  get phoneNumber(): string | undefined {
    return this._phoneNumber;
  }

  get createdAt(): string {
    return this._createdAt;
  }

  get updatedAt(): string | undefined {
    return this._updatedAt;
  }

  get preferences(): UserPreferences {
    return { ...this._preferences };
  }

  /**
   * Update user preferences
   * @param preferences New preferences to set
   */
  updatePreferences(preferences: Partial<UserPreferences>): void {
    this._preferences = {
      ...this._preferences,
      ...preferences
    };
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Update user email
   * @param email New email address
   */
  updateEmail(email: string): void {
    this._email = email;
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Update user phone number
   * @param phoneNumber New phone number
   */
  updatePhoneNumber(phoneNumber: string): void {
    this._phoneNumber = phoneNumber;
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Convert User entity to a plain object for storage
   */
  toObject(): Record<string, any> {
    return {
      userId: this._userId,
      email: this._email,
      phoneNumber: this._phoneNumber,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      preferences: this._preferences
    };
  }

  /**
   * Create a User entity from a plain object
   * @param data User data from storage
   */
  static fromObject(data: Record<string, any>): User {
    return new User(
      data.userId,
      data.email,
      data.createdAt,
      data.preferences,
      data.phoneNumber,
      data.updatedAt
    );
  }
}
