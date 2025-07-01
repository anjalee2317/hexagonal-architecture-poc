/**
 * Task entity representing a task in our domain
 */
export class Task {
  constructor(
    private readonly id: string,
    private title: string,
    private description: string,
    private completed: boolean = false,
    private createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // Getters
  getId(): string {
    return this.id;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string {
    return this.description;
  }

  isCompleted(): boolean {
    return this.completed;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Business logic methods
  complete(): void {
    this.completed = true;
    this.updatedAt = new Date();
  }

  updateTitle(title: string): void {
    this.title = title;
    this.updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this.description = description;
    this.updatedAt = new Date();
  }

  // Convert to plain object for storage
  toObject(): Record<string, any> {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      completed: this.completed,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  // Create from plain object
  static fromObject(obj: Record<string, any>): Task {
    return new Task(
      obj.id,
      obj.title,
      obj.description,
      obj.completed,
      new Date(obj.createdAt),
      new Date(obj.updatedAt)
    );
  }
}
