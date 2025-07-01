import { Task } from '../../domain/models/Task';
import { TaskRepository } from '../../application/ports/out/TaskRepository';
/**
 * DynamoDB implementation of the TaskRepository port
 */
export declare class DynamoDBTaskRepository implements TaskRepository {
    private readonly docClient;
    private readonly tableName;
    constructor(region: string, tableName: string);
    save(task: Task): Promise<Task>;
    findById(id: string): Promise<Task | null>;
    findAll(): Promise<Task[]>;
    update(task: Task): Promise<Task>;
    delete(id: string): Promise<boolean>;
}
