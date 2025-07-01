import { Task } from '../domain/models/Task';
import { TaskRepository } from '../application/ports/out/TaskRepository';
import { TaskService } from '../application/services/TaskService';

/**
 * In-memory implementation of TaskRepository for testing
 * This demonstrates how we can easily swap implementations in hexagonal architecture
 */
class InMemoryTaskRepository implements TaskRepository {
  private tasks: Map<string, Task> = new Map();

  async save(task: Task): Promise<Task> {
    this.tasks.set(task.getId(), task);
    return task;
  }

  async findById(id: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return task || null;
  }

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async update(task: Task): Promise<Task> {
    this.tasks.set(task.getId(), task);
    return task;
  }

  async delete(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }
}

/**
 * Test function to demonstrate hexagonal architecture
 */
async function testHexagonalArchitecture() {
  console.log('Testing Hexagonal Architecture...');
  
  // Create an in-memory repository implementation
  const taskRepository = new InMemoryTaskRepository();
  
  // Create the service with the repository
  const taskService = new TaskService(taskRepository);
  
  // Create a new task
  console.log('Creating a new task...');
  const task = await taskService.createTask('Test Task', 'This is a test task');
  console.log('Task created:', task);
  
  // Get the task by ID
  console.log('\nGetting task by ID...');
  const retrievedTask = await taskService.getTask(task.getId());
  console.log('Retrieved task:', retrievedTask);
  
  // Update the task
  console.log('\nUpdating task...');
  const updatedTask = await taskService.updateTask(task.getId(), 'Updated Task', 'This task has been updated');
  console.log('Updated task:', updatedTask);
  
  // Complete the task
  console.log('\nCompleting task...');
  const completedTask = await taskService.completeTask(task.getId());
  console.log('Completed task:', completedTask);
  
  // Get all tasks
  console.log('\nGetting all tasks...');
  const allTasks = await taskService.getAllTasks();
  console.log('All tasks:', allTasks);
  
  // Delete the task
  console.log('\nDeleting task...');
  const deleted = await taskService.deleteTask(task.getId());
  console.log('Task deleted:', deleted);
  
  // Verify task is deleted
  console.log('\nVerifying task is deleted...');
  const deletedTask = await taskService.getTask(task.getId());
  console.log('Task after deletion (should be null):', deletedTask);
}

// Run the test
testHexagonalArchitecture().catch(console.error);
