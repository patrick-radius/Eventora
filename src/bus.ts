import { registry } from './registry.js';
import { replayAggregate } from './replay.js';
import { emitEvent } from './emitEvent.js';
import { eventToPayload } from './utils.js';
import type { Command, Event } from './types.js';
import {EventStore} from "./EventStore";

export function buildDispatcher(eventStore: EventStore) {
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
    }

    return newEvents;
  }
}
