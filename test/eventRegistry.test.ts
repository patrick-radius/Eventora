import { describe, it, expect, beforeEach } from 'vitest';
import {
    registerEvent,
    getEventTypeByConstructor,
    rehydrateEvent,
    clearRegistry,
    getGlobalRegistry,
} from '../src/eventRegistry';

class TestEvent {
    constructor(public foo: string, public bar: number) {}
}

describe('eventRegistry', () => {
    beforeEach(() => {
        clearRegistry();
    });

    it('registers and retrieves event by name', () => {
        registerEvent('TestEvent', TestEvent);
        const registry = getGlobalRegistry();
        expect(registry.get('TestEvent')).toBe(TestEvent);
    });

    it('registers event by class', () => {
        registerEvent(TestEvent);
        const registry = getGlobalRegistry();
        expect(registry.get('TestEvent')).toBe(TestEvent);
    });

    it('throws on invalid registerEvent arguments', () => {
        // @ts-expect-error
        expect(() => registerEvent(123)).toThrow('Invalid arguments for registerEvent');
    });

    it('rehydrates event from type and payload', () => {
        registerEvent(TestEvent);
        const event = rehydrateEvent('TestEvent', { foo: 'abc', bar: 42 });
        expect(event).toBeInstanceOf(TestEvent);
        expect((event as any).foo).toBe('abc');
        expect((event as any).bar).toBe(42);
    });

    it('throws if rehydrating unknown event type', () => {
        expect(() => rehydrateEvent('UnknownEvent', {})).toThrow('Unknown event type: UnknownEvent');
    });

    it('gets event type by constructor', () => {
        registerEvent('TestEvent', TestEvent);
        expect(getEventTypeByConstructor(TestEvent)).toBe('TestEvent');
    });

    it('returns undefined for unknown constructor', () => {
        class OtherEvent {}
        expect(getEventTypeByConstructor(OtherEvent)).toBeUndefined();
    });

    it('clearRegistry empties the registry', () => {
        registerEvent(TestEvent);
        clearRegistry();
        expect(getGlobalRegistry().size).toBe(0);
    });
});
