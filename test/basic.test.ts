import { describe, it, expect, beforeEach } from 'vitest';
import { Aggregate, CommandHandler, EventHandler } from '../src/decorators.js';
import { commandDispatcher } from '../src/bus.js';
import { registerEvent } from '../src/eventRegistry.js';
import {clearStore, InMemoryEventStore} from '../src/inMemoryEventStore.js';
import type { Command } from '../src/types.js';

class TestCommand implements Command {
  constructor(public readonly aggregateId: string, public readonly value: string) {}
}

class TestEvent {
  constructor(public readonly value: string) {}
}
registerEvent('TestEvent', TestEvent);

const dispatchCommand = commandDispatcher(new InMemoryEventStore())

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

describe('Eventora', () => {
  beforeEach(() => {
    clearStore();
  });

  it('dispatches command and applies event', async () => {
    const command = new TestCommand('id-123', 'Hi!');
    const events = await dispatchCommand(command);
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(TestEvent);
    expect(events[0].value).toBe('Hi!');
  });
});
