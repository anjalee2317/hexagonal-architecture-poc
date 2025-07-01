import { Task } from '../../../domain/models/Task';

/**
 * Input port (use case) for task operations
 */
export interface TaskUseCase {
  /**
   * Create a new task
   * @param title Task title
   * @param description Task description
   * @param userId Optional user ID for event publishing
   * @param userEmail Optional user email for event publishing
   */
  createTask(title: string, description: string, userId?: string, userEmail?: string): Promise<any>;

  /**
   * Get a task by ID
   * @param id Task ID
   */
  getTask(id: string): Promise<any>;

  /**
   * Get all tasks
   */
  getAllTasks(): Promise<any[]>;

  /**
   * Complete a task
   * @param id Task ID
   * @param userId Optional user ID for event publishing
   * @param userEmail Optional user email for event publishing
   */
  completeTask(id: string, userId?: string, userEmail?: string): Promise<any>;

  /**
   * Update a task
   * @param id Task ID
   * @param title New task title
   * @param description New task description
   */
  updateTask(id: string, title?: string, description?: string): Promise<any>;

  /**
   * Delete a task
   * @param id Task ID
   */
  deleteTask(id: string): Promise<boolean>;
}
