import { registry } from './registry.js';
import type {Command, CommandHandlerMeta, Event} from './types.js';

export function Aggregate() {
  return (target: Function) => {
    registry.aggregates.push(target);
  };
}

export function Projector() {
  return function (constructor: new () => any) {
    registry.projectors.push(constructor);
  };
}


export function CommandHandler<T extends Command>(commandType: new (...args: any[]) => T) {
  return (
      target: any,
      propertyKey: string,
      descriptor: TypedPropertyDescriptor<(command: T) => any>
  ) => {
    const method = descriptor.value!;

    const handler: CommandHandlerMeta<T> = {
      commandType,
      method,
      target,
    };

    registry.commandHandlers.push(handler as unknown as CommandHandlerMeta); // 👈 suppress the generic variance issue
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

export function ProjectionHandler(eventType: new (...args: any[]) => Event) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    registry.projectionHandlers.push({
      eventType,
      method: descriptor.value,
      target,
    });
  };
}
