import type {Event} from "./types";

export interface EventStore {
    appendEvent(
        aggregateId: string,
        aggregateType: string,
        eventType: string,
        payload: object
    ): Promise<void>

    loadEvents(aggregateId: string): Promise<Event[]>
}