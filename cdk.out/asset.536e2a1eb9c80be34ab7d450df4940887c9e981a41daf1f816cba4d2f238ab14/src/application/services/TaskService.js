"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
const Task_1 = require("../../domain/models/Task");
const uuid_1 = require("uuid");
/**
 * Implementation of the TaskUseCase input port
 * This service orchestrates the domain logic and uses the repository port
 */
class TaskService {
    constructor(taskRepository, eventPublisher) {
        this.taskRepository = taskRepository;
        this.eventPublisher = eventPublisher;
    }
    async createTask(title, description, userId, userEmail) {
        const task = new Task_1.Task((0, uuid_1.v4)(), title, description);
        const savedTask = await this.taskRepository.save(task);
        // Publish task creation event if event publisher is available
        if (this.eventPublisher) {
            try {
                await this.eventPublisher.publishEvent('com.taskapp.tasks', 'TaskCreation', {
                    taskId: savedTask.getId(),
                    title: savedTask.getTitle(),
                    description: savedTask.getDescription(),
                    userId,
                    userEmail
                });
                console.log(`Published TaskCreation event for task ${savedTask.getId()}`);
            }
            catch (error) {
                // Log error but don't fail the operation
                console.error('Failed to publish TaskCreation event:', error);
            }
        }
        return savedTask;
    }
    async getTask(id) {
        return this.taskRepository.findById(id);
    }
    async getAllTasks() {
        return this.taskRepository.findAll();
    }
    async completeTask(id, userId, userEmail) {
        const task = await this.taskRepository.findById(id);
        if (!task) {
            return null;
        }
        task.complete();
        const updatedTask = await this.taskRepository.update(task);
        // Publish task completion event if event publisher is available
        if (this.eventPublisher && updatedTask) {
            try {
                await this.eventPublisher.publishEvent('com.taskapp.tasks', 'TaskCompletion', {
                    taskId: updatedTask.getId(),
                    title: updatedTask.getTitle(),
                    completedAt: updatedTask.getUpdatedAt(),
                    userId,
                    userEmail
                });
                console.log(`Published TaskCompletion event for task ${updatedTask.getId()}`);
            }
            catch (error) {
                // Log error but don't fail the operation
                console.error('Failed to publish TaskCompletion event:', error);
            }
        }
        return updatedTask;
    }
    async updateTask(id, title, description) {
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
    async deleteTask(id) {
        return this.taskRepository.delete(id);
    }
}
exports.TaskService = TaskService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGFza1NlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYXBwbGljYXRpb24vc2VydmljZXMvVGFza1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbURBQWdEO0FBSWhELCtCQUFvQztBQUVwQzs7O0dBR0c7QUFDSCxNQUFhLFdBQVc7SUFDdEIsWUFDbUIsY0FBOEIsRUFDOUIsY0FBbUM7UUFEbkMsbUJBQWMsR0FBZCxjQUFjLENBQWdCO1FBQzlCLG1CQUFjLEdBQWQsY0FBYyxDQUFxQjtJQUNuRCxDQUFDO0lBRUosS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFhLEVBQUUsV0FBbUIsRUFBRSxNQUFlLEVBQUUsU0FBa0I7UUFDdEYsTUFBTSxJQUFJLEdBQUcsSUFBSSxXQUFJLENBQUMsSUFBQSxTQUFNLEdBQUUsRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDcEQsTUFBTSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2RCw4REFBOEQ7UUFDOUQsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDO2dCQUNILE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQ3BDLG1CQUFtQixFQUNuQixjQUFjLEVBQ2Q7b0JBQ0UsTUFBTSxFQUFFLFNBQVMsQ0FBQyxLQUFLLEVBQUU7b0JBQ3pCLEtBQUssRUFBRSxTQUFTLENBQUMsUUFBUSxFQUFFO29CQUMzQixXQUFXLEVBQUUsU0FBUyxDQUFDLGNBQWMsRUFBRTtvQkFDdkMsTUFBTTtvQkFDTixTQUFTO2lCQUNWLENBQ0YsQ0FBQztnQkFDRixPQUFPLENBQUMsR0FBRyxDQUFDLHlDQUF5QyxTQUFTLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzVFLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNmLHlDQUF5QztnQkFDekMsT0FBTyxDQUFDLEtBQUssQ0FBQyx1Q0FBdUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNoRSxDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQVU7UUFDdEIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQsS0FBSyxDQUFDLFdBQVc7UUFDZixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUVELEtBQUssQ0FBQyxZQUFZLENBQUMsRUFBVSxFQUFFLE1BQWUsRUFBRSxTQUFrQjtRQUNoRSxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNWLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVELElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNoQixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRTNELGdFQUFnRTtRQUNoRSxJQUFJLElBQUksQ0FBQyxjQUFjLElBQUksV0FBVyxFQUFFLENBQUM7WUFDdkMsSUFBSSxDQUFDO2dCQUNILE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQ3BDLG1CQUFtQixFQUNuQixnQkFBZ0IsRUFDaEI7b0JBQ0UsTUFBTSxFQUFFLFdBQVcsQ0FBQyxLQUFLLEVBQUU7b0JBQzNCLEtBQUssRUFBRSxXQUFXLENBQUMsUUFBUSxFQUFFO29CQUM3QixXQUFXLEVBQUUsV0FBVyxDQUFDLFlBQVksRUFBRTtvQkFDdkMsTUFBTTtvQkFDTixTQUFTO2lCQUNWLENBQ0YsQ0FBQztnQkFDRixPQUFPLENBQUMsR0FBRyxDQUFDLDJDQUEyQyxXQUFXLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2hGLENBQUM7WUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO2dCQUNmLHlDQUF5QztnQkFDekMsT0FBTyxDQUFDLEtBQUssQ0FBQyx5Q0FBeUMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsRSxDQUFDO1FBQ0gsQ0FBQztRQUVELE9BQU8sV0FBVyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQVUsRUFBRSxLQUFjLEVBQUUsV0FBb0I7UUFDL0QsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDVixPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFFRCxJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ1YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQixDQUFDO1FBRUQsSUFBSSxXQUFXLEVBQUUsQ0FBQztZQUNoQixJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdEMsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBVTtRQUN6QixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7Q0FDRjtBQS9GRCxrQ0ErRkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUYXNrIH0gZnJvbSAnLi4vLi4vZG9tYWluL21vZGVscy9UYXNrJztcbmltcG9ydCB7IFRhc2tVc2VDYXNlIH0gZnJvbSAnLi4vcG9ydHMvaW4vVGFza1VzZUNhc2UnO1xuaW1wb3J0IHsgVGFza1JlcG9zaXRvcnkgfSBmcm9tICcuLi9wb3J0cy9vdXQvVGFza1JlcG9zaXRvcnknO1xuaW1wb3J0IHsgRXZlbnRQdWJsaXNoZXJQb3J0IH0gZnJvbSAnLi4vcG9ydHMvb3V0L0V2ZW50UHVibGlzaGVyUG9ydCc7XG5pbXBvcnQgeyB2NCBhcyB1dWlkdjQgfSBmcm9tICd1dWlkJztcblxuLyoqXG4gKiBJbXBsZW1lbnRhdGlvbiBvZiB0aGUgVGFza1VzZUNhc2UgaW5wdXQgcG9ydFxuICogVGhpcyBzZXJ2aWNlIG9yY2hlc3RyYXRlcyB0aGUgZG9tYWluIGxvZ2ljIGFuZCB1c2VzIHRoZSByZXBvc2l0b3J5IHBvcnRcbiAqL1xuZXhwb3J0IGNsYXNzIFRhc2tTZXJ2aWNlIGltcGxlbWVudHMgVGFza1VzZUNhc2Uge1xuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRhc2tSZXBvc2l0b3J5OiBUYXNrUmVwb3NpdG9yeSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IGV2ZW50UHVibGlzaGVyPzogRXZlbnRQdWJsaXNoZXJQb3J0XG4gICkge31cblxuICBhc3luYyBjcmVhdGVUYXNrKHRpdGxlOiBzdHJpbmcsIGRlc2NyaXB0aW9uOiBzdHJpbmcsIHVzZXJJZD86IHN0cmluZywgdXNlckVtYWlsPzogc3RyaW5nKTogUHJvbWlzZTxUYXNrPiB7XG4gICAgY29uc3QgdGFzayA9IG5ldyBUYXNrKHV1aWR2NCgpLCB0aXRsZSwgZGVzY3JpcHRpb24pO1xuICAgIGNvbnN0IHNhdmVkVGFzayA9IGF3YWl0IHRoaXMudGFza1JlcG9zaXRvcnkuc2F2ZSh0YXNrKTtcbiAgICBcbiAgICAvLyBQdWJsaXNoIHRhc2sgY3JlYXRpb24gZXZlbnQgaWYgZXZlbnQgcHVibGlzaGVyIGlzIGF2YWlsYWJsZVxuICAgIGlmICh0aGlzLmV2ZW50UHVibGlzaGVyKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCB0aGlzLmV2ZW50UHVibGlzaGVyLnB1Ymxpc2hFdmVudChcbiAgICAgICAgICAnY29tLnRhc2thcHAudGFza3MnLFxuICAgICAgICAgICdUYXNrQ3JlYXRpb24nLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRhc2tJZDogc2F2ZWRUYXNrLmdldElkKCksXG4gICAgICAgICAgICB0aXRsZTogc2F2ZWRUYXNrLmdldFRpdGxlKCksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogc2F2ZWRUYXNrLmdldERlc2NyaXB0aW9uKCksXG4gICAgICAgICAgICB1c2VySWQsXG4gICAgICAgICAgICB1c2VyRW1haWxcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBQdWJsaXNoZWQgVGFza0NyZWF0aW9uIGV2ZW50IGZvciB0YXNrICR7c2F2ZWRUYXNrLmdldElkKCl9YCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAvLyBMb2cgZXJyb3IgYnV0IGRvbid0IGZhaWwgdGhlIG9wZXJhdGlvblxuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcHVibGlzaCBUYXNrQ3JlYXRpb24gZXZlbnQ6JywgZXJyb3IpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gc2F2ZWRUYXNrO1xuICB9XG5cbiAgYXN5bmMgZ2V0VGFzayhpZDogc3RyaW5nKTogUHJvbWlzZTxUYXNrIHwgbnVsbD4ge1xuICAgIHJldHVybiB0aGlzLnRhc2tSZXBvc2l0b3J5LmZpbmRCeUlkKGlkKTtcbiAgfVxuXG4gIGFzeW5jIGdldEFsbFRhc2tzKCk6IFByb21pc2U8VGFza1tdPiB7XG4gICAgcmV0dXJuIHRoaXMudGFza1JlcG9zaXRvcnkuZmluZEFsbCgpO1xuICB9XG5cbiAgYXN5bmMgY29tcGxldGVUYXNrKGlkOiBzdHJpbmcsIHVzZXJJZD86IHN0cmluZywgdXNlckVtYWlsPzogc3RyaW5nKTogUHJvbWlzZTxUYXNrIHwgbnVsbD4ge1xuICAgIGNvbnN0IHRhc2sgPSBhd2FpdCB0aGlzLnRhc2tSZXBvc2l0b3J5LmZpbmRCeUlkKGlkKTtcbiAgICBpZiAoIXRhc2spIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHRhc2suY29tcGxldGUoKTtcbiAgICBjb25zdCB1cGRhdGVkVGFzayA9IGF3YWl0IHRoaXMudGFza1JlcG9zaXRvcnkudXBkYXRlKHRhc2spO1xuICAgIFxuICAgIC8vIFB1Ymxpc2ggdGFzayBjb21wbGV0aW9uIGV2ZW50IGlmIGV2ZW50IHB1Ymxpc2hlciBpcyBhdmFpbGFibGVcbiAgICBpZiAodGhpcy5ldmVudFB1Ymxpc2hlciAmJiB1cGRhdGVkVGFzaykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy5ldmVudFB1Ymxpc2hlci5wdWJsaXNoRXZlbnQoXG4gICAgICAgICAgJ2NvbS50YXNrYXBwLnRhc2tzJyxcbiAgICAgICAgICAnVGFza0NvbXBsZXRpb24nLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRhc2tJZDogdXBkYXRlZFRhc2suZ2V0SWQoKSxcbiAgICAgICAgICAgIHRpdGxlOiB1cGRhdGVkVGFzay5nZXRUaXRsZSgpLFxuICAgICAgICAgICAgY29tcGxldGVkQXQ6IHVwZGF0ZWRUYXNrLmdldFVwZGF0ZWRBdCgpLFxuICAgICAgICAgICAgdXNlcklkLFxuICAgICAgICAgICAgdXNlckVtYWlsXG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICBjb25zb2xlLmxvZyhgUHVibGlzaGVkIFRhc2tDb21wbGV0aW9uIGV2ZW50IGZvciB0YXNrICR7dXBkYXRlZFRhc2suZ2V0SWQoKX1gKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIC8vIExvZyBlcnJvciBidXQgZG9uJ3QgZmFpbCB0aGUgb3BlcmF0aW9uXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBwdWJsaXNoIFRhc2tDb21wbGV0aW9uIGV2ZW50OicsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHVwZGF0ZWRUYXNrO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlVGFzayhpZDogc3RyaW5nLCB0aXRsZT86IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBQcm9taXNlPFRhc2sgfCBudWxsPiB7XG4gICAgY29uc3QgdGFzayA9IGF3YWl0IHRoaXMudGFza1JlcG9zaXRvcnkuZmluZEJ5SWQoaWQpO1xuICAgIGlmICghdGFzaykge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHRpdGxlKSB7XG4gICAgICB0YXNrLnVwZGF0ZVRpdGxlKHRpdGxlKTtcbiAgICB9XG5cbiAgICBpZiAoZGVzY3JpcHRpb24pIHtcbiAgICAgIHRhc2sudXBkYXRlRGVzY3JpcHRpb24oZGVzY3JpcHRpb24pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnRhc2tSZXBvc2l0b3J5LnVwZGF0ZSh0YXNrKTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZVRhc2soaWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLnRhc2tSZXBvc2l0b3J5LmRlbGV0ZShpZCk7XG4gIH1cbn1cbiJdfQ==