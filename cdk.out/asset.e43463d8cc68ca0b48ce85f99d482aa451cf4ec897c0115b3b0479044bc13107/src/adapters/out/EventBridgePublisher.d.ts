import { EventPublisherPort } from '../../application/ports/out/EventPublisherPort';
/**
 * Implementation of the EventPublisherPort interface using AWS EventBridge
 */
export declare class EventBridgePublisher implements EventPublisherPort {
    private readonly eventBusName;
    private readonly region;
    /**
     * Constructor for EventBridgePublisher
     * @param eventBusName Name of the EventBridge event bus
     * @param region AWS Region
     */
    constructor(eventBusName: string, region?: string);
    /**
     * Publish an event to the EventBridge event bus
     * @param source Event source identifier
     * @param detailType Event detail type
     * @param detail Event details/payload
     */
    publishEvent<T>(source: string, detailType: string, detail: T): Promise<void>;
}
