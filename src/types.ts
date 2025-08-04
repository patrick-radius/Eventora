export interface Command {
  aggregateId: string;
}

export interface Event {
  [key: string]: any;
}

export interface EventClass<T extends Event = Event> {
  new (...args: any[]): T;
  type: string;
}

export interface CommandHandlerMeta<T extends Command = Command> {
  commandType: new (...args: any[]) => T;
  method: (command: T) => Event | Event[] | Promise<Event | Event[]>;
  target: any;
}

export interface EventHandlerMeta {
  eventType: new (...args: any[]) => Event;
  method: (event: Event, context: { aggregateId: string }) => void | Promise<void>;
  target: any;
}

export interface ProjectionHandlerMeta {
  eventType: new (...args: any[]) => Event;
  method: (event: Event, context: { aggregateId: string }) => void | Promise<void>;
  target: any;
}
