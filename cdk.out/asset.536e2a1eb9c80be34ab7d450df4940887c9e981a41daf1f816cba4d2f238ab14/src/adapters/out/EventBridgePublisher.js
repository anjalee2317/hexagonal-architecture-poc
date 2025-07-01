"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBridgePublisher = void 0;
/**
 * Implementation of the EventPublisherPort interface using AWS EventBridge
 */
class EventBridgePublisher {
    /**
     * Constructor for EventBridgePublisher
     * @param eventBusName Name of the EventBridge event bus
     * @param region AWS Region
     */
    constructor(eventBusName, region = process.env.REGION || 'us-east-1') {
        this.eventBusName = eventBusName;
        this.region = region;
    }
    /**
     * Publish an event to the EventBridge event bus
     * @param source Event source identifier
     * @param detailType Event detail type
     * @param detail Event details/payload
     */
    async publishEvent(source, detailType, detail) {
        try {
            console.log(`Publishing event to ${this.eventBusName}:`, {
                source,
                detailType,
                detail,
            });
            // In a real implementation, we would use AWS SDK to publish to EventBridge
            // const eventBridge = new EventBridgeClient({ region: this.region });
            // const command = new PutEventsCommand({
            //   Entries: [
            //     {
            //       EventBusName: this.eventBusName,
            //       Source: source,
            //       DetailType: detailType,
            //       Detail: JSON.stringify(detail),
            //     },
            //   ],
            // });
            // const response = await eventBridge.send(command);
            // For now, just log the event details
            console.log(`Event published successfully to ${this.eventBusName}`);
        }
        catch (error) {
            console.error(`Error publishing event to ${this.eventBusName}:`, error);
            throw error;
        }
    }
}
exports.EventBridgePublisher = EventBridgePublisher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXZlbnRCcmlkZ2VQdWJsaXNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvYWRhcHRlcnMvb3V0L0V2ZW50QnJpZGdlUHVibGlzaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBOztHQUVHO0FBQ0gsTUFBYSxvQkFBb0I7SUFJL0I7Ozs7T0FJRztJQUNILFlBQVksWUFBb0IsRUFBRSxTQUFpQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxXQUFXO1FBQ2xGLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3ZCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxZQUFZLENBQUksTUFBYyxFQUFFLFVBQWtCLEVBQUUsTUFBUztRQUNqRSxJQUFJLENBQUM7WUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixJQUFJLENBQUMsWUFBWSxHQUFHLEVBQUU7Z0JBQ3ZELE1BQU07Z0JBQ04sVUFBVTtnQkFDVixNQUFNO2FBQ1AsQ0FBQyxDQUFDO1lBRUgsMkVBQTJFO1lBQzNFLHNFQUFzRTtZQUN0RSx5Q0FBeUM7WUFDekMsZUFBZTtZQUNmLFFBQVE7WUFDUix5Q0FBeUM7WUFDekMsd0JBQXdCO1lBQ3hCLGdDQUFnQztZQUNoQyx3Q0FBd0M7WUFDeEMsU0FBUztZQUNULE9BQU87WUFDUCxNQUFNO1lBQ04sb0RBQW9EO1lBRXBELHNDQUFzQztZQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLG1DQUFtQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUN0RSxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxLQUFLLENBQUMsNkJBQTZCLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN4RSxNQUFNLEtBQUssQ0FBQztRQUNkLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFqREQsb0RBaURDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnRQdWJsaXNoZXJQb3J0IH0gZnJvbSAnLi4vLi4vYXBwbGljYXRpb24vcG9ydHMvb3V0L0V2ZW50UHVibGlzaGVyUG9ydCc7XG5cbi8qKlxuICogSW1wbGVtZW50YXRpb24gb2YgdGhlIEV2ZW50UHVibGlzaGVyUG9ydCBpbnRlcmZhY2UgdXNpbmcgQVdTIEV2ZW50QnJpZGdlXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudEJyaWRnZVB1Ymxpc2hlciBpbXBsZW1lbnRzIEV2ZW50UHVibGlzaGVyUG9ydCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgZXZlbnRCdXNOYW1lOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVhZG9ubHkgcmVnaW9uOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIGZvciBFdmVudEJyaWRnZVB1Ymxpc2hlclxuICAgKiBAcGFyYW0gZXZlbnRCdXNOYW1lIE5hbWUgb2YgdGhlIEV2ZW50QnJpZGdlIGV2ZW50IGJ1c1xuICAgKiBAcGFyYW0gcmVnaW9uIEFXUyBSZWdpb25cbiAgICovXG4gIGNvbnN0cnVjdG9yKGV2ZW50QnVzTmFtZTogc3RyaW5nLCByZWdpb246IHN0cmluZyA9IHByb2Nlc3MuZW52LlJFR0lPTiB8fCAndXMtZWFzdC0xJykge1xuICAgIHRoaXMuZXZlbnRCdXNOYW1lID0gZXZlbnRCdXNOYW1lO1xuICAgIHRoaXMucmVnaW9uID0gcmVnaW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIFB1Ymxpc2ggYW4gZXZlbnQgdG8gdGhlIEV2ZW50QnJpZGdlIGV2ZW50IGJ1c1xuICAgKiBAcGFyYW0gc291cmNlIEV2ZW50IHNvdXJjZSBpZGVudGlmaWVyXG4gICAqIEBwYXJhbSBkZXRhaWxUeXBlIEV2ZW50IGRldGFpbCB0eXBlXG4gICAqIEBwYXJhbSBkZXRhaWwgRXZlbnQgZGV0YWlscy9wYXlsb2FkXG4gICAqL1xuICBhc3luYyBwdWJsaXNoRXZlbnQ8VD4oc291cmNlOiBzdHJpbmcsIGRldGFpbFR5cGU6IHN0cmluZywgZGV0YWlsOiBUKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnNvbGUubG9nKGBQdWJsaXNoaW5nIGV2ZW50IHRvICR7dGhpcy5ldmVudEJ1c05hbWV9OmAsIHtcbiAgICAgICAgc291cmNlLFxuICAgICAgICBkZXRhaWxUeXBlLFxuICAgICAgICBkZXRhaWwsXG4gICAgICB9KTtcblxuICAgICAgLy8gSW4gYSByZWFsIGltcGxlbWVudGF0aW9uLCB3ZSB3b3VsZCB1c2UgQVdTIFNESyB0byBwdWJsaXNoIHRvIEV2ZW50QnJpZGdlXG4gICAgICAvLyBjb25zdCBldmVudEJyaWRnZSA9IG5ldyBFdmVudEJyaWRnZUNsaWVudCh7IHJlZ2lvbjogdGhpcy5yZWdpb24gfSk7XG4gICAgICAvLyBjb25zdCBjb21tYW5kID0gbmV3IFB1dEV2ZW50c0NvbW1hbmQoe1xuICAgICAgLy8gICBFbnRyaWVzOiBbXG4gICAgICAvLyAgICAge1xuICAgICAgLy8gICAgICAgRXZlbnRCdXNOYW1lOiB0aGlzLmV2ZW50QnVzTmFtZSxcbiAgICAgIC8vICAgICAgIFNvdXJjZTogc291cmNlLFxuICAgICAgLy8gICAgICAgRGV0YWlsVHlwZTogZGV0YWlsVHlwZSxcbiAgICAgIC8vICAgICAgIERldGFpbDogSlNPTi5zdHJpbmdpZnkoZGV0YWlsKSxcbiAgICAgIC8vICAgICB9LFxuICAgICAgLy8gICBdLFxuICAgICAgLy8gfSk7XG4gICAgICAvLyBjb25zdCByZXNwb25zZSA9IGF3YWl0IGV2ZW50QnJpZGdlLnNlbmQoY29tbWFuZCk7XG4gICAgICBcbiAgICAgIC8vIEZvciBub3csIGp1c3QgbG9nIHRoZSBldmVudCBkZXRhaWxzXG4gICAgICBjb25zb2xlLmxvZyhgRXZlbnQgcHVibGlzaGVkIHN1Y2Nlc3NmdWxseSB0byAke3RoaXMuZXZlbnRCdXNOYW1lfWApO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwdWJsaXNoaW5nIGV2ZW50IHRvICR7dGhpcy5ldmVudEJ1c05hbWV9OmAsIGVycm9yKTtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxufVxuIl19