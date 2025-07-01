/**
 * Task entity representing a task in our domain
 */
export declare class Task {
    private readonly id;
    private title;
    private description;
    private completed;
    private createdAt;
    private updatedAt;
    constructor(id: string, title: string, description: string, completed?: boolean, createdAt?: Date, updatedAt?: Date);
    getId(): string;
    getTitle(): string;
    getDescription(): string;
    isCompleted(): boolean;
    getCreatedAt(): Date;
    getUpdatedAt(): Date;
    complete(): void;
    updateTitle(title: string): void;
    updateDescription(description: string): void;
    toObject(): Record<string, any>;
    static fromObject(obj: Record<string, any>): Task;
}
