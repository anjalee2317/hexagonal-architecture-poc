import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { Task } from '../../domain/models/Task';
import { TaskRepository } from '../../application/ports/out/TaskRepository';

/**
 * DynamoDB implementation of the TaskRepository port
 */
export class DynamoDBTaskRepository implements TaskRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(region: string, tableName: string) {
    const client = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  async save(task: Task): Promise<Task> {
    const item = task.toObject();
    
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item
      })
    );

    return task;
  }

  async findById(id: string): Promise<Task | null> {
    const response = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id }
      })
    );

    if (!response.Item) {
      return null;
    }

    return Task.fromObject(response.Item);
  }

  async findAll(): Promise<Task[]> {
    const response = await this.docClient.send(
      new ScanCommand({
        TableName: this.tableName
      })
    );

    if (!response.Items || response.Items.length === 0) {
      return [];
    }

    return response.Items.map((item: Record<string, any>) => Task.fromObject(item));
  }

  async update(task: Task): Promise<Task> {
    const item = task.toObject();
    
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item
      })
    );

    return task;
  }

  async delete(id: string): Promise<boolean> {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { id }
      })
    );

    return true;
  }
}
