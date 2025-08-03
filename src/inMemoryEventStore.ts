import { rehydrateEvent } from './eventRegistry.js';
import type { Event } from './types.js';
import {EventStore} from "./EventStore";

export const __store = new Map<string, { eventType: string, payload: object }[]>();

export class InMemoryEventStore implements EventStore {
  public async appendEvent(
      aggregateId: string,
      aggregateType: string,
      eventType: string,
      payload: object
  ): Promise<void> {
    const events = __store.get(aggregateId) || [];
    events.push({ eventType, payload });
    __store.set(aggregateId, events);
  }

  public async loadEvents(aggregateId: string): Promise<Event[]> {
    const events = __store.get(aggregateId) || [];
    return events.map(({ eventType, payload }) => rehydrateEvent(eventType, payload));
  }
}

export function clearStore() {
  __store.clear();
}
