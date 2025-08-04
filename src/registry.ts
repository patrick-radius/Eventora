import type {CommandHandlerMeta, EventHandlerMeta, ProjectionHandlerMeta} from './types.js';

export const registry = {
  aggregates: [] as Function[],
  projectors: [] as Array<new () => any>,
  projectorInstances: [] as any[],

  commandHandlers: [] as CommandHandlerMeta<any>[],
  eventHandlers: [] as EventHandlerMeta[],
  projectionHandlers: [] as ProjectionHandlerMeta[],
};

export function initializeProjectors() {
  console.log('initialise projectors')
  for (const Constructor of registry.projectors) {
    const instance = new Constructor();

    console.log('projectionHandlers', registry.projectionHandlers);

    for (const handler of registry.projectionHandlers) {
      if (handler.target.constructor === Constructor) {
        handler.target = instance;
        handler.method = handler.method.bind(instance);
      }
    }

    console.log(registry.projectionHandlers);

    registry.projectorInstances.push(instance);
  }
}
