import type { Event } from './types.js';

const eventClassMap = new Map<string, new (...args: any[]) => Event>();

export function registerEvent(eventName: string, clazz: new (...args: any[]) => Event) {
  eventClassMap.set(eventName, clazz);
}

export function rehydrateEvent(eventType: string, payload: Record<string, any>): Event {
  const EventClass = eventClassMap.get(eventType);
  if (!EventClass) throw new Error(`Unknown event type: ${eventType}`);
  return new EventClass(...Object.values(payload));
}
