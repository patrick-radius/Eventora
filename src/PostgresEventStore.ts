import {Pool} from 'pg';
import {rehydrateEvent} from './eventRegistry.js';
import type {Event} from './types.js';
import {EventStore} from './EventStore';

const snakeCase = (str: string): string => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

export class PostgresEventStore implements EventStore {
    constructor(protected readonly pool: Pool) {
    }

    public async appendEvent(
        aggregateId: string,
        aggregateType: string,
        eventType: string,
        payload: object,
        extraFields: Record<string, any> = {}
    ): Promise<void> {
        const fields = ['entity_type', 'entity_id', 'type', 'payload'];
        const values = [aggregateType, aggregateId, eventType, JSON.stringify(payload)];
        let placeholders = ['$1', '$2', '$3', '$4'];
        let idx = fields.length + 1;

        for (const [key, value] of Object.entries(extraFields)) {
            fields.push(snakeCase(key));
            values.push(value);
            placeholders.push(`$${idx++}`);
        }

        await this.pool.query(
            `INSERT INTO "events" (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
            values
        );
    }

    public async loadEvents(
        aggregateId: string,
        context: Record<string, any> = {}
    ): Promise<Event[]> {
        let where = [`entity_id = $1`];
        let params: any[] = [aggregateId];
        let idx = 2;

        for (const [key, value] of Object.entries(context)) {
            where.push(`${snakeCase(key)} = $${idx++}`);
            params.push(value);
        }

        const query = `SELECT type, payload FROM events WHERE ${where.join(' AND ')}  ORDER BY created_at ASC, id ASC`;

        const res = await this.pool.query(query, params);
        return res.rows.map((row: any) => rehydrateEvent(row.type, row.payload));
    }
}
