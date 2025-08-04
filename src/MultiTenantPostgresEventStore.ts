import {Pool} from 'pg';
import {rehydrateEvent} from './eventRegistry.js';
import type {ContextProvider, Event} from './types.js';
import {EventStore} from './EventStore';


export class MultiTenantPostgresEventStore implements EventStore {
    constructor(private readonly pool: Pool, private readonly context: ContextProvider,
    ) {
    }

    // Append a single event for an aggregate
    public async appendEvent(
        aggregateId: string,
        aggregateType: string,
        eventType: string,
        payload: object,
    ): Promise<void> {
        await this.pool.query(
            ` INSERT INTO "events" (entity_type, entity_id, type, payload, account_id, created_by_user_id)
              VALUES ($1, $2, $3, $4, $5, $6)`,
            [aggregateType, aggregateId, eventType, JSON.stringify(payload), this.context.getAccountId(), this.context.getUserId()]
        );
    }

    // Load all events for an aggregate in order
    public async loadEvents(aggregateId: string): Promise<Event[]> {
        const accountId = this.context.getAccountId();

        return (await this.pool.query(
            `SELECT type, payload
             FROM events
             WHERE entity_id = $1 AND account_id = $2
             ORDER BY created_at ASC, id ASC`,
            [aggregateId, accountId]
        )).rows.map((row: any) => rehydrateEvent(row.type, row.payload));

    }
}
