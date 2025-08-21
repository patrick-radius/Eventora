import type {Event} from './types.js';
import {EventStore} from './EventStore';

type Context = Record<string, any> & { accountId: string, userId: string };

export class MultiTenantEventStore implements EventStore {
    constructor(private readonly baseStore: EventStore) {}

    public async appendEvent(
        aggregateId: string,
        aggregateType: string,
        eventType: string,
        payload: object,
        context: Context
    ): Promise<void> {
        if (!context.accountId) {
            throw new Error('tenant aware Event Store should get an `accountId` in the context');
        }
        if (!context.userId) {
            throw new Error('tenant aware Event Store should get a `userId` in the context');
        }
        await this.baseStore.appendEvent(
            aggregateId,
            aggregateType,
            eventType,
            payload,
            { accountId: context.accountId, created_by_user_id: context.userId }
        );
    }

    public async loadEvents(
        aggregateId: string,
        context: Context
    ): Promise<Event[]> {
        if (!context.accountId) {
            throw new Error('tenant aware Event Store should get an `accountId` in the context');
        }
        return this.baseStore.loadEvents(
            aggregateId,
            {accountId: context.accountId}
        );
    }
}
