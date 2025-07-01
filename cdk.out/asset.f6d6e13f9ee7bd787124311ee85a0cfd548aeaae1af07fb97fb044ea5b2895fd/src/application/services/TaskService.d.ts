import { Task } from '../../domain/models/Task';
import { TaskUseCase } from '../ports/in/TaskUseCase';
import { TaskRepository } from '../ports/out/TaskRepository';
import { EventPublisherPort } from '../ports/out/EventPublisherPort';
/**
 * Implementation of the TaskUseCase input port
 * This service orchestrates the domain logic and uses the repository port
 */
export declare class TaskService implements TaskUseCase {
    private readonly taskRepository;
    private readonly eventPublisher?;
    constructor(taskRepository: TaskRepository, eventPublisher?: EventPublisherPort | undefined);
    createTask(title: string, description: string, userId?: string, userEmail?: string): Promise<Task>;
    getTask(id: string): Promise<Task | null>;
    getAllTasks(): Promise<Task[]>;
    completeTask(id: string, userId?: string, userEmail?: string): Promise<Task | null>;
    updateTask(id: string, title?: string, description?: string): Promise<Task | null>;
    deleteTask(id: string): Promise<boolean>;
}
