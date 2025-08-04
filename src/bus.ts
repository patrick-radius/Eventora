import {initializeProjectors, registry} from './registry.js';
import { replayAggregate } from './replay.js';
import { emitEvent } from './emitEvent.js';
import { eventToPayload } from './utils.js';
import type { Command, Event } from './types.js';
import {EventStore} from "./EventStore";

interface Logger {
  warn: (...args: any[]) => void;
}

export function commandDispatcher(eventStore: EventStore, logger?: Logger) {
  initializeProjectors();

  return async function dispatchCommand(command: Command): Promise<Event[]> {
    const handlerMeta = registry.commandHandlers.find(h => command instanceof h.commandType);
    if (!handlerMeta) throw new Error(`No handler found for command: ${command.constructor.name}`);

    const aggregateClass = handlerMeta.target.constructor;
    const aggregateId = command.aggregateId;
    if (!aggregateId) throw new Error('Command must have an aggregateId field');

    const history = await eventStore.loadEvents(aggregateId);
    const aggregate = await replayAggregate(aggregateClass, history);

    const result = await handlerMeta.method.call(aggregate, command);

    const newEvents: Event[] = Array.isArray(result) ? result : [result];

    for (const event of newEvents) {
      await eventStore.appendEvent(aggregateId, aggregateClass.name, event.constructor.name, eventToPayload(event));
      await emitEvent(event, { aggregateId }, aggregate);

      for (const handler of registry.projectionHandlers) {
        if (event instanceof handler.eventType) {
          try {
            await handler.method(event, { aggregateId });
          } catch (err) {
            logger?.warn(
                `[Eventora] Projection handler for ${handler.eventType.name} in ${handler.target.constructor.name} threw an error:`,
                err
            );
          }
        }
      }
    }

    return newEvents;
  }
}
