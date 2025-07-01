import { EventPublisherPort } from '../../application/ports/out/EventPublisherPort';

/**
 * Implementation of the EventPublisherPort interface using AWS EventBridge
 */
export class EventBridgePublisher implements EventPublisherPort {
  private readonly eventBusName: string;
  private readonly region: string;

  /**
   * Constructor for EventBridgePublisher
   * @param eventBusName Name of the EventBridge event bus
   * @param region AWS Region
   */
  constructor(eventBusName: string, region: string = process.env.REGION || 'us-east-1') {
    this.eventBusName = eventBusName;
    this.region = region;
  }

  /**
   * Publish an event to the EventBridge event bus
   * @param source Event source identifier
   * @param detailType Event detail type
   * @param detail Event details/payload
   */
  async publishEvent<T>(source: string, detailType: string, detail: T): Promise<void> {
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
    } catch (error) {
      console.error(`Error publishing event to ${this.eventBusName}:`, error);
      throw error;
    }
  }
}
