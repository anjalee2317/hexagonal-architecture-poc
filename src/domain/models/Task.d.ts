/**
 * Task domain model
 */
export class Task {
  /**
   * Constructor for Task
   */
  constructor(id: string, title: string, description: string, completed?: boolean, createdAt?: string, updatedAt?: string);
  
  /**
   * Task ID
   */
  readonly id: string;
  
  /**
   * Task title
   */
  title: string;
  
  /**
   * Task description
   */
  description: string;
  
  /**
   * Whether the task is completed
   */
  completed: boolean;
  
  /**
   * Task creation timestamp
   */
  readonly createdAt: string;
  
  /**
   * Task update timestamp
   */
  updatedAt: string;
  
  /**
   * Complete the task
   */
  complete(): void;
  
  /**
   * Update task title
   */
  updateTitle(title: string): void;
  
  /**
   * Update task description
   */
  updateDescription(description: string): void;
  
  /**
   * Convert task to plain object
   */
  toObject(): {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
  };
}
