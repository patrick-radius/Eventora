import {Pool} from 'pg';
import {rehydrateEvent} from './eventRegistry.js';
import type {Event} from './types.js';
import {EventStore} from './EventStore';

type Context = Record<string, any> & { accountId: string, userId: string }

export class MultiTenantPostgresEventStore implements EventStore {
    constructor(private readonly pool: Pool
    ) {
    }

    // Append a single event for an aggregate
    public async appendEvent(
        aggregateId: string,
        aggregateType: string,
        eventType: string,
        payload: object,
        context: Context
    ): Promise<void> {
        if (!context.accountId) {
            throw new Error('tenant aware Event Store should get an `accountId` in the context')
        }

        if (!context.userId) {
            throw new Error('tenant aware Event Store should get an `accountId` in the context')
        }

        await this.pool.query(
            ` INSERT INTO "events" (entity_type, entity_id, type, payload, account_id, created_by_user_id)
              VALUES ($1, $2, $3, $4, $5, $6)`,
            [aggregateType, aggregateId, eventType, JSON.stringify(payload), context.accountId, context.userId]
        );
    }

    // Load all events for an aggregate in order
    public async loadEvents(aggregateId: string, context: Context): Promise<Event[]> {
        if (!context.accountId) {
            throw new Error('tenant aware Event Store should get an `accountId` in the context')
        }

        return (await this.pool.query(
            `SELECT type, payload
             FROM events
             WHERE entity_id = $1
               AND account_id = $2
             ORDER BY created_at ASC, id ASC`,
            [aggregateId, context.accountId]
        )).rows.map((row: any) => rehydrateEvent(row.type, row.payload));

    }
}
