import type { Event } from './types.js';
import { registry } from './registry.js';

export async function emitEvent(event: Event, context: { aggregateId: string }, instance: any) {
  const matchingHandlers = registry.eventHandlers.filter(h => event instanceof h.eventType);

  for (const handler of matchingHandlers) {
    // Call on the aggregate instance, not the prototype
    await handler.method.call(instance, event, context);
  }
}
