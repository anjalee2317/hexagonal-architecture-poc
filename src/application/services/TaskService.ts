import { Task } from '../../domain/models/Task';
import { TaskUseCase } from '../ports/in/TaskUseCase';
import { TaskRepository } from '../ports/out/TaskRepository';
import { EventPublisherPort } from '../ports/out/EventPublisherPort';
import { v4 as uuidv4 } from 'uuid';

/**
 * Implementation of the TaskUseCase input port
 * This service orchestrates the domain logic and uses the repository port
 */
export class TaskService implements TaskUseCase {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly eventPublisher?: EventPublisherPort
  ) {}

  async createTask(title: string, description: string, userId?: string, userEmail?: string): Promise<Task> {
    const task = new Task(uuidv4(), title, description);
    const savedTask = await this.taskRepository.save(task);
    
    // Publish task creation event if event publisher is available
    if (this.eventPublisher) {
      try {
        await this.eventPublisher.publishEvent(
          'com.taskapp.tasks',
          'TaskCreation',
          {
            taskId: savedTask.getId(),
            title: savedTask.getTitle(),
            description: savedTask.getDescription(),
            userId,
            userEmail
          }
        );
        console.log(`Published TaskCreation event for task ${savedTask.getId()}`);
      } catch (error) {
        // Log error but don't fail the operation
        console.error('Failed to publish TaskCreation event:', error);
      }
    }
    
    return savedTask;
  }

  async getTask(id: string): Promise<Task | null> {
    return this.taskRepository.findById(id);
  }

  async getAllTasks(): Promise<Task[]> {
    return this.taskRepository.findAll();
  }

  async completeTask(id: string, userId?: string, userEmail?: string): Promise<Task | null> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      return null;
    }

    task.complete();
    const updatedTask = await this.taskRepository.update(task);
    
    // Publish task completion event if event publisher is available
    if (this.eventPublisher && updatedTask) {
      try {
        await this.eventPublisher.publishEvent(
          'com.taskapp.tasks',
          'TaskCompletion',
          {
            taskId: updatedTask.getId(),
            title: updatedTask.getTitle(),
            completedAt: updatedTask.getUpdatedAt(),
            userId,
            userEmail
          }
        );
        console.log(`Published TaskCompletion event for task ${updatedTask.getId()}`);
      } catch (error) {
        // Log error but don't fail the operation
        console.error('Failed to publish TaskCompletion event:', error);
      }
    }
    
    return updatedTask;
  }

  async updateTask(id: string, title?: string, description?: string): Promise<Task | null> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      return null;
    }

    if (title) {
      task.updateTitle(title);
    }

    if (description) {
      task.updateDescription(description);
    }

    return this.taskRepository.update(task);
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.taskRepository.delete(id);
  }
}
