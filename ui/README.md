# GenAI Mosaik with React + TypeScript + Vite


## 1.Project Setup

1. `npm i` - to install dependencies
2. `npm run dev` - to start project
3. Project can be found at at http://localhost:3000


## 2. Project Structure

The project structure follows a typical React + TypeScript setup. Here is a brief overview:

- `src/`: This directory contains all the source code for the project.
  - `components/`: This directory contains reusable React components.
  - `pages/`: This directory contains the main pages of the application.
  - `utils/`: This directory contains utility functions and helper modules.
  - `App.tsx`: This is the entry point of the application.
  - `main.tsx`: This file renders the root component and mounts it to the DOM.



### 2. Routing
For routing, we are using [React Router](https://reactrouter.com/). React Router is a collection of navigational components that compose declaratively with your application. Whether you want to have bookmarkable URLs for your web app or a composable way to navigate in React Native, React Router works wherever React is rendering.


### 3. State Management

Our project uses **[Zustand](https://github.com/pmndrs/zustand)** and **[TanStack Query](https://tanstack.com/query/latest)** for state management.

### Client State — Zustand

We use **Zustand** for managing **client-side UI and app state** (e.g., active session, form values, filters).
Zustand is a minimal and performant state management library with an intuitive API.

#### Example

```typescript
import { create } from 'zustand';

// Define a store
const useCounterStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}));

// Use it in your component
function Counter() {
  const { count, increment, reset } = useCounterStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+1</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

Zustand works without context providers and supports persistence, middlewares, and TypeScript out of the box.
official documentation [Zustand Documentation](https://docs.pmnd.rs/zustand)


### Server State — TanStack Query

We use **TanStack Query (React Query)** for **server-side data fetching and caching**, such as API requests and backend synchronization.

#### Example

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Fetch example
function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await axios.get('/api/projects');
      return data;
    },
  });
}

// Mutation example
function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newProject) => axios.post('/api/projects', newProject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

TanStack Query manages caching, background refetching, and loading/error states automatically.
official documentation: [Tanstack Query Documentation](https://tanstack.com/query/latest)

### Why this setup

* **Zustand** — lightweight and ideal for client state (no context overhead).
* **TanStack Query** — handles server communication, synchronization, and caching.
* Together, they keep state logic clear:

  * *Client state* lives in Zustand
  * *Server state* lives in TanStack Query


### 4. UI Library
To enhance the styling and user interface of our application, we are utilizing the [Chakra UI Library](https://chakra-ui.com/).

Chakra UI is a simple and accessible component library that provides a set of customizable UI components for React applications.

To get started with Chakra UI, visit the official documentation [Chakra UI Documentation](https://chakra-ui.com/docs/getting-started).



### 5. Shadcn UI Components

We are also using [shadcn/ui](https://ui.shadcn.com/) for a set of composable, customizable React components.

Shadcn provides a flexible system with a modern design and supports custom alias configurations for seamless integration with our project structure.

#### Adding Components

Add new components with:

```bash
npx shadcn add <component-name>
```

**Aliases used in this project:**

```json
{
  "components": "@shared/components",
  "utils": "@shared/cn/utils",
  "ui": "@components/shared",
  "hooks": "hooks",
  "lib": "@shared/cn"
},
```

> Generated components follow these aliases. Lint errors may appear after generation—resolve them as needed.
