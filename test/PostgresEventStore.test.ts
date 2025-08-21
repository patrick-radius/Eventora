import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PostgresEventStore } from '../src';
import type { Pool } from 'pg';

vi.mock('../src/eventRegistry.js', () => ({
    rehydrateEvent: vi.fn((type, payload) => ({ type, ...payload })),
}));

describe('PostgresEventStore', () => {
    let pool: Pool;
    let store: PostgresEventStore;

    beforeEach(() => {
        pool = {
            query: vi.fn(),
        } as any;
        store = new PostgresEventStore(pool);
        vi.clearAllMocks();
    });

    describe('appendEvent', () => {
        it('appends event with required fields', async () => {
            (pool.query as any).mockResolvedValueOnce({});
            await store.appendEvent('agg1', 'aggType', 'evtType', { foo: 1 });
            expect(pool.query).toHaveBeenCalledWith(
                'INSERT INTO "events" (entity_type, entity_id, type, payload) VALUES ($1, $2, $3, $4)',
                ['aggType', 'agg1', 'evtType', JSON.stringify({ foo: 1 })]
            );
        });

        describe('context handling', () => {
            it('converts camelCase context keys to snake_case in appendEvent', async () => {
                (pool.query as any).mockResolvedValueOnce({});
                await store.appendEvent('agg1', 'aggType', 'evtType', { foo: 1 }, { accountId: 42, userId: 7 });
                expect(pool.query).toHaveBeenCalledWith(
                    'INSERT INTO "events" (entity_type, entity_id, type, payload, account_id, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
                    ['aggType', 'agg1', 'evtType', JSON.stringify({ foo: 1 }), 42, 7]
                );
            });

            it('handles multiple context fields in appendEvent', async () => {
                (pool.query as any).mockResolvedValueOnce({});
                await store.appendEvent('agg1', 'aggType', 'evtType', { foo: 1 }, { foo: 1, bar: 2, bazQux: 3 });
                expect(pool.query).toHaveBeenCalledWith(
                    'INSERT INTO "events" (entity_type, entity_id, type, payload, foo, bar, baz_qux) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    ['aggType', 'agg1', 'evtType', JSON.stringify({ foo: 1 }), 1, 2, 3]
                );
            });

            it('handles empty context in appendEvent', async () => {
                (pool.query as any).mockResolvedValueOnce({});
                await store.appendEvent('agg1', 'aggType', 'evtType', { foo: 1 }, {});
                expect(pool.query).toHaveBeenCalledWith(
                    'INSERT INTO "events" (entity_type, entity_id, type, payload) VALUES ($1, $2, $3, $4)',
                    ['aggType', 'agg1', 'evtType', JSON.stringify({ foo: 1 })]
                );
            });

            it('handles context with falsy values in appendEvent', async () => {
                (pool.query as any).mockResolvedValueOnce({});
                await store.appendEvent('agg1', 'aggType', 'evtType', { foo: 1 }, { foo: 0, bar: false, baz: '' });
                expect(pool.query).toHaveBeenCalledWith(
                    'INSERT INTO "events" (entity_type, entity_id, type, payload, foo, bar, baz) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    ['aggType', 'agg1', 'evtType', JSON.stringify({ foo: 1 }), 0, false, '']
                );
            });
        });
    });

    describe('loadEvents', () => {
        describe('context handling', () => {
            let pool: Pool;
            let store: PostgresEventStore;

            beforeEach(() => {
                pool = { query: vi.fn() } as any;
                store = new PostgresEventStore(pool);
                vi.clearAllMocks();
            });

            it('converts camelCase context keys to snake_case in loadEvents', async () => {
                (pool.query as any).mockResolvedValueOnce({ rows: [] });
                await store.loadEvents('agg1', { accountId: 42, userId: 7 });
                expect(pool.query).toHaveBeenCalledWith(
                    'SELECT type, payload FROM events WHERE entity_id = $1 AND account_id = $2 AND user_id = $3  ORDER BY created_at ASC, id ASC',
                    ['agg1', 42, 7]
                );
            });

            it('handles multiple context fields in loadEvents', async () => {
                (pool.query as any).mockResolvedValueOnce({ rows: [] });
                await store.loadEvents('agg1', { foo: 1, bar: 2, bazQux: 3 });
                expect(pool.query).toHaveBeenCalledWith(
                    'SELECT type, payload FROM events WHERE entity_id = $1 AND foo = $2 AND bar = $3 AND baz_qux = $4  ORDER BY created_at ASC, id ASC',
                    ['agg1', 1, 2, 3]
                );
            });

            it('handles empty context in loadEvents', async () => {
                (pool.query as any).mockResolvedValueOnce({ rows: [] });
                await store.loadEvents('agg1', {});
                expect(pool.query).toHaveBeenCalledWith(
                    'SELECT type, payload FROM events WHERE entity_id = $1  ORDER BY created_at ASC, id ASC',
                    ['agg1']
                );
            });

            it('handles context with falsy values', async () => {
                (pool.query as any).mockResolvedValueOnce({ rows: [] });
                await store.loadEvents('agg1', { foo: 0, bar: false, baz: '' });
                expect(pool.query).toHaveBeenCalledWith(
                    'SELECT type, payload FROM events WHERE entity_id = $1 AND foo = $2 AND bar = $3 AND baz = $4  ORDER BY created_at ASC, id ASC',
                    ['agg1', 0, false, '']
                );
            });
        });
    });
});
