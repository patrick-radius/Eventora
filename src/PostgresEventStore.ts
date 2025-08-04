import {Pool} from 'pg';
import {rehydrateEvent} from './eventRegistry.js';
import type {Event} from './types.js';
import {EventStore} from './EventStore';


export class PostgresEventStore implements EventStore {
    constructor(private readonly pool: Pool) {
    }

    // Append a single event for an aggregate
    public async appendEvent(
        aggregateId: string,
        aggregateType: string,
        eventType: string,
        payload: object,
        context: Record<string, any> = {}
    ): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query(
                ` INSERT INTO "events" (entity_type, entity_id, type, payload)
                  VALUES ($1, $2, $3, $4)`,
                [aggregateType, aggregateId, eventType, JSON.stringify(payload)]
            );
        } finally {
            client.release();
        }
    }

    // Load all events for an aggregate in order
    public async loadEvents(aggregateId: string, context: Record<string, any> = {}): Promise<Event[]> {
        const client = await this.pool.connect();
        try {
            const res = await client.query(
                `SELECT type, payload
                 FROM events
                 WHERE entity_id = $1
                 ORDER BY created_at ASC, id ASC`,
                [aggregateId]
            );
            return res.rows.map((row: any) => rehydrateEvent(row.type, row.payload));
        } finally {
            client.release();
        }
    }
}
