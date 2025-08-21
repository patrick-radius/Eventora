import {rehydrateEvent} from './eventRegistry.js';
import type {Event} from './types.js';
import {EventStore} from "./EventStore";

export const __store = new Map<string, { eventType: string, payload: object }[]>();

export interface Logger {
    debug: (...args: any[]) => void;
}

function getNamespacedId(aggregateId: string, context: Record<string, any>) {
    return context && context.accountId ? `${context.accountId}:${aggregateId}` : aggregateId;
}

export class InMemoryEventStore implements EventStore {
    private readonly logger?: Logger;

    constructor(logger?: Logger) {
        this.logger = logger;
        if (this.logger) {
            this.logger.debug('InMemoryEventStore initialized');
        }
    }

    public async appendEvent(
        aggregateId: string,
        aggregateType: string,
        eventType: string,
        payload: object,
        context: Record<string, any> = {}
    ): Promise<void> {
        const namespacedId = getNamespacedId(aggregateId, context);
        const events = __store.get(namespacedId) || [];
        events.push({eventType, payload});
        __store.set(namespacedId, events);

        this.logger?.debug(
            `[InMemoryEventStore] Event appended`,
            {aggregateId, aggregateType, eventType, payload, context}
        );
    }

    public async loadEvents(aggregateId: string, context: Record<string, any> = {}): Promise<Event[]> {
        const namespacedId = getNamespacedId(aggregateId, context);
        const events = __store.get(namespacedId) || [];

        this.logger?.debug(`[InMemoryEventStore] Loading ${events.length} events for aggregateId: ${namespacedId}`, events, context);

        return events.map(({eventType, payload}) => rehydrateEvent(eventType, payload));
    }
}

export function clearStore() {
    __store.clear();
}
