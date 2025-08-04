import type { Event } from './types.js';

const globalKey = '__eventora_event_registry__' as const;

type Registry = Map<string, new (...args: any[]) => Event>;

export function getGlobalRegistry(): Registry {
  if (!(global as any)[globalKey]) {
    (global as any)[globalKey] = new Map<string, new (...args: any[]) => Event>();
  }
  return (global as any)[globalKey];
}

export function clearRegistry() {
  getGlobalRegistry().clear();
}

export function registerEvent(
    nameOrClass: string | (new (...args: any[]) => Event),
    maybeClass?: new (...args: any[]) => Event
) {
  const map = getGlobalRegistry();

  if (typeof nameOrClass === 'string' && maybeClass) {
    map.set(nameOrClass, maybeClass);
  } else if (typeof nameOrClass === 'function') {
    map.set(nameOrClass.name, nameOrClass);
  } else {
    throw new Error('Invalid arguments for registerEvent');
  }
}

export function rehydrateEvent(eventType: string, payload: Record<string, any>): Event {
  const map = getGlobalRegistry();

  const EventClass = map.get(eventType);
  if (!EventClass) throw new Error(`Unknown event type: ${eventType}`);
  return new EventClass(...Object.values(payload));
}
