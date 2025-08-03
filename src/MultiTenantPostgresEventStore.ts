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
        const client = await this.pool.connect();
        try {
            await client.query(
                ` INSERT INTO "events" (entity_type, entity_id, type, payload, account_id, created_by_user_id)
                  VALUES ($1, $2, $3, $4, $5, $6)`,
                [aggregateType, aggregateId, eventType, JSON.stringify(payload), this.context.getAccountId(), this.context.getUserId()]
            );
        } finally {
            client.release();
        }
    }

    // Load all events for an aggregate in order
    public async loadEvents(aggregateId: string): Promise<Event[]> {
        const client = await this.pool.connect();
        try {
            const accountId = this.context.getAccountId();

            const res = await client.query(
                `SELECT type, payload
                 FROM events
                 WHERE entity_id = $1 AND account_id = $2
                 ORDER BY created_at ASC, id ASC`,
                [aggregateId, accountId]
            );
            return res.rows.map((row: any) => rehydrateEvent(row.type, row.payload));
        } finally {
            client.release();
        }
    }

    // Optionally: close the pool
    public async close() {
        await this.pool.end();
    }
}
