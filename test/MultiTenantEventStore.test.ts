import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Event } from '../src/types.js';
import { MultiTenantEventStore } from '../src';

const mockBaseStore = {
    appendEvent: vi.fn(),
    loadEvents: vi.fn(),
};

const validContext = { accountId: 'acc1', userId: 'user1' };

describe('MultiTenantEventStore', () => {
    let store: MultiTenantEventStore;

    beforeEach(() => {
        vi.clearAllMocks();
        store = new MultiTenantEventStore(mockBaseStore as any);
    });

    it('throws if accountId is missing in appendEvent', async () => {
        await expect(
            store.appendEvent('agg1', 'type', 'evt', {}, { userId: 'user1' } as any)
        ).rejects.toThrow('accountId');
    });

    it('throws if userId is missing in appendEvent', async () => {
        await expect(
            store.appendEvent('agg1', 'type', 'evt', {}, { accountId: 'acc1' } as any)
        ).rejects.toThrow('userId');
    });

    it('calls baseStore.appendEvent with correct params', async () => {
        await store.appendEvent('agg1', 'type', 'evt', { foo: 1 }, validContext);
        expect(mockBaseStore.appendEvent).toHaveBeenCalledWith(
            'agg1',
            'type',
            'evt',
            { foo: 1 },
            { accountId: 'acc1', created_by_user_id: 'user1' }
        );
    });

    it('throws if accountId is missing in loadEvents', async () => {
        await expect(
            store.loadEvents('agg1', { userId: 'user1' } as any)
        ).rejects.toThrow('accountId');
    });

    it('calls baseStore.loadEvents with correct params', async () => {
        mockBaseStore.loadEvents.mockResolvedValue([{ id: 1 }] as Event[]);
        const result = await store.loadEvents('agg1', validContext);
        expect(mockBaseStore.loadEvents).toHaveBeenCalledWith(
            'agg1',
            {accountId: 'acc1'}
        );
        expect(result).toEqual([{ id: 1 }]);
    });
});
