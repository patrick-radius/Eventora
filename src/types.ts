export interface Command {
  aggregateId: string;
}

export interface Event {
  [key: string]: any;
}

export interface CommandHandlerMeta {
  commandType: new (...args: any[]) => Command;
  method: (command: Command) => Event | Event[] | Promise<Event | Event[]>;
  target: any;
}

export interface EventHandlerMeta {
  eventType: new (...args: any[]) => Event;
  method: (event: Event, context: { aggregateId: string }) => void | Promise<void>;
  target: any;
}
