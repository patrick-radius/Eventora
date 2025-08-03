import type { Event } from './types.js';

const globalKey = '__eventora_event_registry__' as const;

type Registry = Map<string, new (...args: any[]) => Event>;

function getGlobalRegistry(): Registry {
  if (!(global as any)[globalKey]) {
    (global as any)[globalKey] = new Map<string, new (...args: any[]) => Event>();
  }
  return (global as any)[globalKey];
}

export function registerEvent(eventName: string, clazz: new (...args: any[]) => Event) {
  const map = getGlobalRegistry();
  map.set(eventName, clazz);
}

export function rehydrateEvent(eventType: string, payload: Record<string, any>): Event {
  const map = getGlobalRegistry();

  const EventClass = map.get(eventType);
  if (!EventClass) throw new Error(`Unknown event type: ${eventType}`);
  return new EventClass(...Object.values(payload));
}
