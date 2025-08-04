import type {Event} from "./types";

export interface EventStore {
    appendEvent(
        aggregateId: string,
        aggregateType: string,
        eventType: string,
        payload: object,
        context?: Record<string, any>
    ): Promise<void>

    loadEvents(aggregateId: string, context?: Record<string, any>): Promise<Event[]>
}
