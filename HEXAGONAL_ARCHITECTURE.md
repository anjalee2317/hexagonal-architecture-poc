# Hexagonal Architecture in AWS Amplify Gen 2

## Overview

Hexagonal Architecture (also known as Ports and Adapters pattern) is an architectural pattern that allows an application to be equally driven by users, programs, automated tests, or batch scripts, and to be developed and tested in isolation from its eventual runtime devices and databases.

This project implements Hexagonal Architecture with AWS Amplify Gen 2, providing a clean separation between business logic and infrastructure concerns.

## Key Components in Our Implementation

### 1. Domain Layer

The core of the application containing business logic and entities.

- **Entities**: Domain models like `Task` that encapsulate business rules and data
  ```typescript
  // src/domain/Task.ts
  export class Task {
    constructor(
      public readonly id: string,
      public title: string,
      public description: string,
      public readonly userId: string,
      public readonly createdAt: string,
      public completedAt?: string
    ) {}

    complete(): Task {
      return new Task(
        this.id,
        this.title,
        this.description,
        this.userId,
        this.createdAt,
        new Date().toISOString()
      );
    }

    updateTitle(newTitle: string): Task {
      return new Task(
        this.id,
        newTitle,
        this.description,
        this.userId,
        this.createdAt,
        this.completedAt
      );
    }

    isCompleted(): boolean {
      return !!this.completedAt;
    }
  }
  ```

### 2. Application Layer

Contains application-specific business rules and defines interfaces (ports) for the domain to interact with external systems.

- **Input Ports**: Interfaces that define how the application can be used
  ```typescript
  // src/application/ports/in/TaskUseCase.ts
  export interface TaskUseCase {
    createTask(title: string, description: string, userId: string): Promise<Task>;
    getTask(taskId: string): Promise<Task>;
    getTasks(userId: string): Promise<Task[]>;
    completeTask(taskId: string): Promise<Task>;
    updateTaskTitle(taskId: string, newTitle: string): Promise<Task>;
  }
  ```

- **Output Ports**: Interfaces that define what the application needs from external systems
  ```typescript
  // src/application/ports/out/TaskRepository.ts
  export interface TaskRepository {
    save(task: Task): Promise<Task>;
    findById(taskId: string): Promise<Task | null>;
    findByUserId(userId: string): Promise<Task[]>;
  }
  ```

- **Services**: Implementations of input ports that orchestrate domain entities and use output ports
  ```typescript
  // src/application/services/TaskService.ts
  export class TaskService implements TaskUseCase {
    constructor(private readonly taskRepository: TaskRepository) {}

    async createTask(title: string, description: string, userId: string): Promise<Task> {
      const task = new Task(
        uuidv4(),
        title,
        description,
        userId,
        new Date().toISOString()
      );
      return this.taskRepository.save(task);
    }

    async getTask(taskId: string): Promise<Task> {
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }
      return task;
    }

    // Other methods...
  }
  ```

### 3. Adapters Layer

Connects the application to external systems by implementing the ports.

- **Input Adapters**: Implementations that handle external requests
  ```typescript
  // src/adapters/in/TaskLambdaHandler.ts
  export class TaskLambdaHandler {
    constructor(private readonly taskUseCase: TaskUseCase) {}

    async createTask(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
      try {
        const { title, description } = JSON.parse(event.body || '{}');
        const userId = event.requestContext.authorizer?.claims?.sub;
        
        const task = await this.taskUseCase.createTask(title, description, userId);
        
        return {
          statusCode: 201,
          body: JSON.stringify(task)
        };
      } catch (error) {
        return {
          statusCode: 500,
          body: JSON.stringify({ message: error.message })
        };
      }
    }

    // Other handler methods...
  }
  ```

- **Output Adapters**: Implementations that interact with external systems
  ```typescript
  // src/adapters/out/DynamoDBTaskRepository.ts
  export class DynamoDBTaskRepository implements TaskRepository {
    private readonly docClient: DynamoDBDocumentClient;
    private readonly tableName: string;

    constructor() {
      const client = new DynamoDBClient({ region: process.env.REGION || 'us-east-1' });
      this.docClient = DynamoDBDocumentClient.from(client);
      this.tableName = process.env.TASK_TABLE_NAME || 'Tasks';
    }

    async save(task: Task): Promise<Task> {
      const params = {
        TableName: this.tableName,
        Item: {
          id: task.id,
          title: task.title,
          description: task.description,
          userId: task.userId,
          createdAt: task.createdAt,
          completedAt: task.completedAt
        }
      };

      await this.docClient.send(new PutCommand(params));
      return task;
    }

    // Other repository methods...
  }
  ```

### 4. Infrastructure Layer

Contains configuration and setup for external frameworks and tools.

- **Custom CDK Constructs**: Define AWS resources
  ```typescript
  // infrastructure/TaskApiConstruct.ts
  export class TaskApiConstruct extends Construct {
    constructor(scope: Construct, id: string, props: TaskApiConstructProps) {
      super(scope, id);

      // Create DynamoDB table
      const taskTable = new dynamodb.Table(this, 'TaskTable', {
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: RemovalPolicy.DESTROY,
      });

      // Create Lambda functions
      const createTaskFunction = new lambda.Function(this, 'CreateTaskFunction', {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'createTaskFunction.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, '../dist/adapters/in')),
        environment: {
          TASK_TABLE_NAME: taskTable.tableName,
          EVENT_BUS_NAME: props.eventBus.eventBusName,
          REGION: this.region,
        },
      });

      // Other Lambda functions...

      // Create API Gateway
      const api = new apigateway.RestApi(this, 'TaskApi', {
        restApiName: 'Task Service',
        description: 'This service handles task operations',
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
        },
      });

      // Configure API routes
      const tasks = api.root.addResource('tasks');
      const singleTask = tasks.addResource('{taskId}');
      const completeTask = singleTask.addResource('complete');

      // Add Cognito authorizer
      const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'TaskApiAuthorizer', {
        cognitoUserPools: [props.userPool],
      });

      // Configure API methods with authorizer
      tasks.addMethod('POST', new apigateway.LambdaIntegration(createTaskFunction), {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      });

      // Other API methods...

      // Grant permissions
      taskTable.grantReadWriteData(createTaskFunction);
      // Other permissions...
    }
  }
  ```

## Benefits in AWS Amplify Context

### 1. Technology Independence

The domain and application layers are completely independent of AWS services. This means:

- You can change from DynamoDB to another database without affecting business logic
- You can switch from Lambda to another compute service without rewriting core code
- You can migrate away from AWS Amplify if needed with minimal changes to core logic

### 2. Testability

- **Unit Testing**: Domain and application layers can be tested without AWS services
  ```typescript
  // tests/unit/TaskService.test.ts
  describe('TaskService', () => {
    let taskService: TaskService;
    let mockRepository: InMemoryTaskRepository;

    beforeEach(() => {
      mockRepository = new InMemoryTaskRepository();
      taskService = new TaskService(mockRepository);
    });

    it('should create a task', async () => {
      const task = await taskService.createTask('Test Task', 'Test Description', 'user123');
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.userId).toBe('user123');
    });

    // Other tests...
  });
  ```

- **Integration Testing**: Can use in-memory implementations for faster tests
  ```typescript
  // src/adapters/out/InMemoryTaskRepository.ts
  export class InMemoryTaskRepository implements TaskRepository {
    private tasks: Task[] = [];

    async save(task: Task): Promise<Task> {
      const existingIndex = this.tasks.findIndex(t => t.id === task.id);
      if (existingIndex >= 0) {
        this.tasks[existingIndex] = task;
      } else {
        this.tasks.push(task);
      }
      return task;
    }

    // Other repository methods...
  }
  ```

### 3. Maintainability

- **Clear Boundaries**: Each layer has a specific responsibility
- **Dependency Direction**: Dependencies point inward (infrastructure → adapters → application → domain)
- **Isolation**: Changes in one layer don't affect others if interfaces remain stable

### 4. AWS Amplify Gen 2 Integration

Amplify Gen 2's code-first approach aligns well with Hexagonal Architecture:

- **Custom CDK Constructs**: Allow for infrastructure as code that respects architectural boundaries
- **TypeScript Support**: Enables strong typing for interfaces and implementations
- **Dependency Injection**: Makes it easy to swap implementations for different environments

## Current Implementation

Our project currently implements the following components:

1. **Task Management**:
   - Complete task domain model with business logic
   - TaskUseCase interface and TaskService implementation
   - DynamoDB adapter for persistence
   - Lambda handlers for API Gateway integration
   - CDK construct for infrastructure

2. **Authentication**:
   - Cognito User Pool with advanced security features
   - Post-confirmation Lambda trigger for user profile creation
   - EventBridge integration for user events

3. **Notification System**:
   - Event-driven architecture using EventBridge
   - Notification Lambda for processing events
   - Decoupled from core business logic

## Conclusion

Hexagonal Architecture provides significant benefits when working with AWS Amplify Gen 2:

- **Reduced Vendor Lock-in**: Core business logic is independent of AWS
- **Improved Developer Experience**: Clear separation of concerns
- **Better Testing**: Faster and more focused tests
- **Future-Proofing**: Easier to adapt to changes in requirements or technology

By implementing this architecture pattern, our AWS Amplify Gen 2 backend becomes more maintainable, testable, and adaptable to change.
