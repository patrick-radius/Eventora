import { describe, it, expect, beforeEach } from 'vitest';
import { Aggregate, CommandHandler, EventType, EventHandler, ProjectionHandler, Projector, commandDispatcher } from '../src';
import {clearRegistry, getGlobalRegistry, registerEvent} from '../src/eventRegistry.js';
import {clearStore, InMemoryEventStore} from '../src/inMemoryEventStore.js';
import type { Command } from '../src';
import {registry} from "../src/registry";

class TestCommand implements Command {
  constructor(public readonly aggregateId: string, public readonly value: string) {}
}

@EventType('TestEvent')
class TestEvent {
  static type = 'TestEvent';

  constructor(public readonly value: string) {}
}

@Projector()
class TestProjector {
  state: string[] = [];

  @ProjectionHandler(TestEvent)
  applyTestEvent(evt: TestEvent) {
    this.state.push(evt.value);
  }
}

@Aggregate()
class TestAggregate {
  state: string[] = [];

  @CommandHandler(TestCommand)
  handle(cmd: TestCommand) {
    return new TestEvent(cmd.value);
  }

  @EventHandler(TestEvent)
  applyTestEvent(evt: TestEvent) {
    this.state.push(evt.value);
  }
}

const dispatchCommand = commandDispatcher(new InMemoryEventStore())

describe('Eventora', () => {
  beforeEach(() => {
    clearStore();
  });

  describe('dispatchCommand', () => {
    it('dispatches command and returns events', async () => {
      const projectorInstance = registry.projectorInstances.find(p => p instanceof TestProjector) as TestProjector;

      const command = new TestCommand('id-123', 'Hi!');
      const events = await dispatchCommand(command);

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TestEvent);
      expect(events[0].value).toBe('Hi!');

      expect(projectorInstance.state).toEqual(['Hi!']);
    });
  })

  describe('Aggregates', () => {
    it('can accept an event to handle', () => {
      const aggregate = new TestAggregate();

      aggregate.applyTestEvent(new TestEvent('Hi!'));

      expect(aggregate.state).toEqual(['Hi!']);
    })
  })

  describe('Projectors', () => {
    it('can accept an event to handle', async () => {
      const projector = new TestProjector();
      projector.applyTestEvent(new TestEvent('Hi!'))

      expect(projector.state).toContain('Hi!');
    })
  })

  describe('registerEvent', () => {
    beforeEach(() => {
      clearRegistry();
    })

    it('can register events by only passing the class', () => {
      class SomethingHappendEvent {
        constructor(public readonly value: string) {}
      }

      registerEvent(SomethingHappendEvent)

      expect(getGlobalRegistry().keys()).toContain('SomethingHappendEvent');
    });

    it('can register events by an explicit name and class', () => {
      class SomethingHappendEvent {
        constructor(public readonly value: string) {}
      }

      registerEvent('SomethingHappened', SomethingHappendEvent)

      expect(getGlobalRegistry().keys()).toContain('SomethingHappened');
    });
  })
});
