import type { CommandHandlerMeta, EventHandlerMeta } from './types.js';

export const registry = {
  aggregates: [] as Function[],
  commandHandlers: [] as CommandHandlerMeta[],
  eventHandlers: [] as EventHandlerMeta[],
};
