## Eventora

**Eventora** is a lightweight CQRS and Event Sourcing framework for TypeScript, inspired by Axon Framework. It supports decorators for aggregates, command handlers, and event handlers, and includes support for in-memory and Postgres-based event stores.

### Features

* Lightweight decorator-based API
* Command and event handler registration
* In-memory and Postgres event store implementations
* Simple registry for mapping commands and events to handlers
* Built-in event rehydration

---

### Installation

```bash
npm install @patrick-radius/eventora
```

---

### Usage

#### 1. Define Events and Commands

```ts
// events.ts
export class MealPlanned implements Event {
  constructor(public readonly date: string, public readonly meal: string) {}
}

// commands.ts
export class PlanMeal implements Command {
  constructor(public readonly aggregateId: string, public readonly date: string, public readonly meal: string) {}
}
```

#### 2. Register Events

```ts
// registerEvents.ts
import { registerEvent } from '@patrick-radius/eventora';
import { MealPlanned } from './events';

registerEvent('MealPlanned', MealPlanned);
```

#### 3. Create an Aggregate

```ts
// meal.aggregate.ts
import { Aggregate, CommandHandler, EventHandler } from '@patrick-radius/eventora';
import { PlanMeal } from './commands';
import { MealPlanned } from './events';

@Aggregate()
export class MealAggregate {
  private plannedMeals: Record<string, string> = {};

  @CommandHandler(PlanMeal)
  planMeal(command: PlanMeal) {
    if (this.plannedMeals[command.date]) {
      throw new Error('Meal already planned for this date');
    }
    return new MealPlanned(command.date, command.meal);
  }

  @EventHandler(MealPlanned)
  applyMealPlanned(event: MealPlanned) {
    this.plannedMeals[event.date] = event.meal;
  }
}
```

#### 4. Dispatch a Command

```ts
import { dispatchCommand } from '@patrick-radius/eventora';
import { PlanMeal } from './commands';
import './registerEvents'; // Important: Register event types first

await dispatchCommand(new PlanMeal('abc-123', '2025-08-04', 'Lasagna'));
```

---

### Event Stores

#### InMemoryEventStore

```ts
import { InMemoryEventStore } from '@patrick-radius/eventora';

const store = new InMemoryEventStore();
```

#### PostgresEventStore

```ts
import { PostgresEventStore } from '@patrick-radius/eventora';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const store = new PostgresEventStore(pool);
```

#### MultiTenantPostgresEventStore

```ts
import { MultiTenantPostgresEventStore } from '@patrick-radius/eventora';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

class ContextProvider {
    getAccountId(): string {
        return 'fe75fc7c-f291-4ffd-afa3-85da2ac3185e';
    }

    getUserId(): string {
        return '00a82bbf-c674-47a8-9cf6-ce37cc07c234';
    }

}

const eventStore = new MultiTenantPostgresEventStore(pool, new ContextProvider())```
```
---

### 3. Project Events to a Read Model

```ts
import { Projector, ProjectionHandler } from 'eventora'
import { pool } from './db' // PostgreSQL connection using pg or equivalent

@Projector()
export class RecipeProjection {
    @ProjectionHandler('RecipeRenamed')
    async onRecipeRenamed(event: { title: string }, { aggregateId }: { aggregateId: string }) {
        await pool.query(
            `UPDATE recipe_projection SET title = $1 WHERE id = $2`,
            [event.title, aggregateId]
        )
    }

    @ProjectionHandler('RecipeCreated')
    async onRecipeCreated(event: { title: string }, { aggregateId }: { aggregateId: string }) {
        await pool.query(
            `INSERT INTO recipe_projection (id, title) VALUES ($1, $2)`,
            [aggregateId, event.title]
        )
    }
}
```
> 🧠 Unlike aggregates, projectors are not expected to keep state in memory. Instead, they should write to a fast, queryable read model — such as a Postgres table, Redis cache, or search index.
---


### Development

* Run tests: `npm test`
* Build: `npm run build`
* Type check: `npm run typecheck`

---

### License

MIT
