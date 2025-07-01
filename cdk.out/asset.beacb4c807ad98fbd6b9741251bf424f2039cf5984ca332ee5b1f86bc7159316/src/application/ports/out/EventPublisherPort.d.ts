/**
 * Interface for event publishing
 * This port allows the application to publish events to an event bus
 */
export interface EventPublisherPort {
    /**
     * Publish an event to the event bus
     * @param source Event source identifier
     * @param detailType Event detail type
     * @param detail Event details/payload
     */
    publishEvent<T>(source: string, detailType: string, detail: T): Promise<void>;
}
