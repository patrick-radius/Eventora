# Eventora

**Eventora** is a lightweight, decorator-based CQRS and Event Sourcing framework for TypeScript applications. Inspired by the Axon Framework, it’s designed for simplicity and flexibility in the Node.js ecosystem.

- 🧠 Command and event handling via decorators
- 🗂️ Event store with PostgreSQL or in-memory support
- 🔁 Built-in support for event replay and projections
- 🔍 Fully typed with TypeScript
- 🧪 Easy to test with Vitest
- ⚡ ESM-ready

---

## Getting Started

### Installation

```bash
npm install Eventora
```

---

## Usage

### 1. Define an Aggregate

```ts
import { Aggregate, CommandHandler, EventHandler } from 'Eventora'

interface State {
  title: string
}

@Aggregate()
export class Recipe {
  private state: State = { title: '' }

  @CommandHandler('RenameRecipe')
  renameRecipe(command: { title: string }) {
    return [{ type: 'RecipeRenamed', payload: { title: command.title } }]
  }

  @EventHandler('RecipeRenamed')
  applyRecipeRenamed(event: { title: string }) {
    this.state.title = event.title
  }
}
```

---

### 2. Dispatch a Command

```ts
import { InMemoryEventStore, CommandDispatcher, AggregateRegistry } from 'Eventora'
import { Recipe } from './Recipe'

const registry = new AggregateRegistry()
registry.register(Recipe)

const store = new InMemoryEventStore()
const dispatcher = new CommandDispatcher({ registry, eventStore: store })

await dispatcher.dispatch({
  aggregateId: 'r1',
  aggregateType: 'Recipe',
  commandType: 'RenameRecipe',
  payload: { title: 'Chili sin carne' },
})
```

---

### 3. Project Events to a Read Model

```ts
import { Projection, EventHandler } from 'Eventora'

@Projection()
export class RecipeProjection {
  recipes: Record<string, string> = {}

  @EventHandler('RecipeRenamed')
  onRecipeRenamed(event: { title: string }, { aggregateId }: { aggregateId: string }) {
    this.recipes[aggregateId] = event.title
  }
}
```

---

## Features

- ✅ Command dispatching via decorators
- ✅ Event application and replay support
- ✅ Multiple aggregates and projections
- ✅ PostgreSQL or in-memory event store
- ✅ Type-safe events and commands
- ✅ Pure ESM module
- ✅ Vitest-ready for unit testing

---

## Testing

Eventora uses Vitest for unit testing.

```bash
npm test
```

You can switch between the in-memory event store and a PostgreSQL-backed store for different environments.

---

## Future Ideas

- Snapshotting support
- Saga / process manager support
- CLI tooling
- Event versioning strategies

---

## License

MIT
