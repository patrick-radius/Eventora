import { rehydrateEvent } from './eventRegistry.js';
import type { Event } from './types.js';
import {EventStore} from "./EventStore";

export const __store = new Map<string, { eventType: string, payload: object }[]>();

export interface Logger {
  debug: (...args: any[]) => void;
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
      payload: object
  ): Promise<void> {
    const events = __store.get(aggregateId) || [];
    events.push({ eventType, payload });
    __store.set(aggregateId, events);

    this.logger?.debug(
        `[InMemoryEventStore] Event appended`,
        { aggregateId, aggregateType, eventType, payload }
    );
  }

  public async loadEvents(aggregateId: string): Promise<Event[]> {
    const events = __store.get(aggregateId) || [];

    this.logger?.debug(`[InMemoryEventStore] Loading ${events.length} events for aggregateId: ${aggregateId}`, events);

    return events.map(({ eventType, payload }) => rehydrateEvent(eventType, payload));
  }
}

export function clearStore() {
  __store.clear();
}
