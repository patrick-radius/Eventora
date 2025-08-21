// test/bus.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { commandDispatcher } from '../src';
import { registry } from '../src/registry';
import * as replay from '../src/replay';
import * as emit from '../src/emitEvent';
import * as utils from '../src/utils';
import * as eventRegistry from '../src/eventRegistry';

class TestCommand {
    aggregateId = 'agg1';
}
class TestEvent {}
class TestAggregate {
    static type = 'TestAggregate';
    handle(cmd: any) {
        return new TestEvent();
    }
}

describe('commandDispatcher', () => {
    let eventStore: any;
    let logger: any;
    let handlerMeta: any;
    let projectionHandler: any;

    beforeEach(() => {
        eventStore = {
            loadEvents: vi.fn().mockResolvedValue([]),
            appendEvent: vi.fn().mockResolvedValue(undefined),
        };
        logger = { warn: vi.fn() };

        handlerMeta = {
            commandType: TestCommand,
            target: { constructor: TestAggregate },
            method: vi.fn().mockResolvedValue(new TestEvent()),
        };
        projectionHandler = {
            eventType: TestEvent,
            method: vi.fn().mockResolvedValue(undefined),
            target: { constructor: { name: 'Projection' } },
        };

        registry.commandHandlers = [handlerMeta];
        registry.projectionHandlers = [projectionHandler];

        vi.spyOn(replay, 'replayAggregate').mockResolvedValue(new TestAggregate());
        vi.spyOn(emit, 'emitEvent').mockResolvedValue(undefined);
        vi.spyOn(utils, 'eventToPayload').mockReturnValue({ foo: 'bar' });
        vi.spyOn(eventRegistry, 'getEventTypeByConstructor').mockReturnValue('TestEvent');
    });

    it('throws if no handler found for command', async () => {
        registry.commandHandlers = [];
        const dispatch = commandDispatcher(eventStore, logger);
        await expect(dispatch(new TestCommand())).rejects.toThrow('No handler found for command');
    });

    it('throws if command has no aggregateId', async () => {
        const dispatch = commandDispatcher(eventStore, logger);
        await expect(dispatch(Object.create(TestCommand.prototype))).rejects.toThrow('aggregateId');
    });

    it('calls eventStore.loadEvents and replayAggregate', async () => {
        const dispatch = commandDispatcher(eventStore, logger);
        await dispatch(new TestCommand());
        expect(eventStore.loadEvents).toHaveBeenCalledWith('agg1', {});
        expect(replay.replayAggregate).toHaveBeenCalled();
    });

    it('calls handler method and appends event', async () => {
        const dispatch = commandDispatcher(eventStore, logger);
        await dispatch(new TestCommand());
        expect(handlerMeta.method).toHaveBeenCalled();
        expect(eventStore.appendEvent).toHaveBeenCalledWith(
            'agg1',
            'TestAggregate',
            'TestEvent',
            { foo: 'bar' },
            {}
        );
    });

    it('emits event and calls projection handler', async () => {
        const dispatch = commandDispatcher(eventStore, logger);
        await dispatch(new TestCommand());
        expect(emit.emitEvent).toHaveBeenCalled();
        expect(projectionHandler.method).toHaveBeenCalled();
    });

    it('logs warning if projection handler throws', async () => {
        projectionHandler.method.mockRejectedValueOnce(new Error('fail'));
        const dispatch = commandDispatcher(eventStore, logger);
        await dispatch(new TestCommand());
        expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('Projection handler for'),
            expect.any(Error)
        );
    });

    it('returns new events', async () => {
        handlerMeta.method.mockResolvedValueOnce([new TestEvent(), new TestEvent()]);
        const dispatch = commandDispatcher(eventStore, logger);
        const result = await dispatch(new TestCommand());
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
    });
});
