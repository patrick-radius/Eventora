import { describe, it, expect, beforeEach } from 'vitest';
import {
    InMemoryEventStore,
    MultiTenantEventStore,
    Command,
    Aggregate,
    CommandHandler,
    EventHandler,
    commandDispatcher,
    registerEvent,
} from '../src';
import {clearStore} from "../src/inMemoryEventStore";

class TestEvent {
    constructor(public value: string) {}
}
class TestCommand implements Command {
    aggregateId: string;
    constructor(id: string, public value: string) {
        this.aggregateId = id;
    }
}
@Aggregate()
class TestAggregate {
    value = '';
    @CommandHandler(TestCommand)
    handleTestCommand(cmd: TestCommand) {
        return new TestEvent(cmd.value);
    }
    @EventHandler(TestEvent)
    onTestEvent(evt: TestEvent) {
        this.value = evt.value;
    }
}

describe('Integration: Public API', () => {
    beforeEach(() => {
        clearStore();
    });

    it('registers and rehydrates events', () => {
        registerEvent(TestEvent);

        const evt = new TestEvent('abc');
        expect(evt.value).toBe('abc');
    });

    it('stores and loads events using InMemoryEventStore', async () => {
        const store = new InMemoryEventStore();
        await store.appendEvent('id1', 'TestAggregate', 'TestEvent', { value: 'foo' });
        const events = await store.loadEvents('id1');
        expect(events[0]).toMatchObject({ value: 'foo' });
    });

    it('dispatches command and stores event (InMemoryEventStore)', async () => {
        registerEvent(TestEvent);
        const store = new InMemoryEventStore();
        const dispatch = commandDispatcher(store);
        const cmd = new TestCommand('agg1', 'bar');
        await dispatch(cmd);
        const events = await store.loadEvents('agg1');
        expect(events[0]).toMatchObject({ value: 'bar' });
    });

    describe('MultiTenantEventStore context isolation', () => {
        const contextA = { accountId: 'acc1', userId: 'user1' };
        const contextB = { accountId: 'acc2', userId: 'user2' };

        let baseStore: InMemoryEventStore;
        let store: MultiTenantEventStore;

        beforeEach(() => {
            baseStore = new InMemoryEventStore();
            store = new MultiTenantEventStore(baseStore as any);
            clearStore();
        });

        it('stores and loads events with correct context', async () => {
            await store.appendEvent('agg1', 'TestAggregate', 'TestEvent', { value: 'foo' }, contextA);
            const events = await store.loadEvents('agg1', contextA);
            expect(events[0]).toMatchObject({ value: 'foo' });
        });

        it('does not load events with different accountId', async () => {
            await store.appendEvent('agg1', 'TestAggregate', 'TestEvent', { value: 'foo' }, contextA);
            const events = await store.loadEvents('agg1', contextB);
            expect(events.length).toBe(0);
        });

        it('does not load events with missing context', async () => {
            await store.appendEvent('agg1', 'TestAggregate', 'TestEvent', { value: 'foo' }, contextA);
            // @ts-expect-error
            await expect(store.loadEvents('agg1')).rejects.toThrow('accountId');
        });

        it('throws if context is missing required fields on append', async () => {
            // @ts-expect-error
            await expect(store.appendEvent('agg1', 'TestAggregate', 'TestEvent', { value: 'foo' }, { userId: 'user1' }))
                .rejects.toThrow('accountId');
            // @ts-expect-error
            await expect(store.appendEvent('agg1', 'TestAggregate', 'TestEvent', { value: 'foo' }, { accountId: 'acc1' }))
                .rejects.toThrow('userId');
        });

        it('throws if context is missing required fields on load', async () => {
            // @ts-expect-error
            await expect(store.loadEvents('agg1', { userId: 'user1' })).rejects.toThrow('accountId');
        });
    });
});
