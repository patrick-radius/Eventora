import { registry } from './registry.js';
import type { Event } from './types.js';

export async function replayAggregate(
    aggregateClass: new () => any,
    events: Event[]
): Promise<any> {
  const instance = new aggregateClass();

  for (const event of events) {
    const handlers = registry.eventHandlers.filter(
        h =>
            event instanceof h.eventType &&
            h.target.constructor === aggregateClass
    );

    for (const handler of handlers) {
      const methodName = handler.method.name;
      const method = instance[methodName];

      if (typeof method === 'function') {
        await method.call(instance, event);
      } else {
        throw new Error(
            `Expected method '${methodName}' on instance of ${aggregateClass.name}`
        );
      }
    }
  }

  return instance;
}
