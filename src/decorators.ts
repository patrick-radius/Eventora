import { registry } from './registry.js';
import type { Command, Event } from './types.js';

export function Aggregate() {
  return (target: Function) => {
    registry.aggregates.push(target);
  };
}

export function CommandHandler(commandType: new (...args: any[]) => Command) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    registry.commandHandlers.push({
      commandType,
      method: descriptor.value,
      target,
    });
  };
}

export function EventHandler(eventType: new (...args: any[]) => Event) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    registry.eventHandlers.push({
      eventType,
      method: descriptor.value,
      target,
    });
  };
}
