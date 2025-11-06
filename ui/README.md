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


### 3. State management
For state management, we are using [Jotai](https://jotai.org/). Jotai is a simple and scalable state management library for React. It provides a lightweight and intuitive API for managing state in your application.

To get started with Jotai, follow these steps:

1. Import the necessary functions from Jotai in your code:

```javascript
import { atom, useAtom } from 'jotai';
```

2. Define your state atoms using the `atom` function. For example:

```javascript
const countAtom = atom(0);
```

3. Use the `useAtom` hook to access and update the state in your components. For example:

```javascript
function Counter() {
  const [count, setCount] = useAtom(countAtom);

  const increment = () => {
    setCount(count + 1);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

For more information and advanced usage of Jotai, refer to the official documentation: [Jotai Documentation](https://github.com/pmndrs/jotai).

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
