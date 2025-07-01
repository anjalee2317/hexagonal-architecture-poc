import { Task } from '../../../domain/models/Task';
/**
 * Output port for task persistence operations
 */
export interface TaskRepository {
    save(task: Task): Promise<Task>;
    findById(id: string): Promise<Task | null>;
    findAll(): Promise<Task[]>;
    update(task: Task): Promise<Task>;
    delete(id: string): Promise<boolean>;
}
