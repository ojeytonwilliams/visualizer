This is a detailed task checklist for developing the project structure visualizer application, broken down by module and task type.

## General guidelines

Aim for simplicity (e.g. using minimal configuration), modularity (e.g. collect related functionality in modules and expose minimal apis).

Write tests first. When implementing any feature, first specify that feature with tests. Any implementation should be the bare minimum. For example, if testing the `add` function in a `maths` module, `add` should be defined as `function add() {}`. Just enough that it can be tested. 

After creating the tests, stop!

Use vitest for tests.

Avoid mocking where possible, except for the filesystem which should be mocked by memfs always. Otherwise prefer dependency injection

Use TypeScript and ESM

When running tests pass --run e.g. pnpm test --run

## I. General Development Setup

- **Project Initialization**
  - [x] Initialize the monorepo or project structure.
  - [x] Install **pnpm** globally (if necessary).
  - [x] Set up the root `package.json` with necessary scripts and dependencies.
  - [x] Use turborepo to manage the monorepo
  - [x] Configure eslint separately in each package

---

## II. Module 1: The Parser (Backend Service)

- **Setup & Framework**
  - [x] Initialize a **Node.js** project for the backend service.
  - [x] Install **Fastify** and related dependencies.
  - [x] Define the API structure, starting with the `POST /dependency-map` endpoint.
  - [ ] Implement basic request handling for the `/dependency-map` endpoint to receive the project folder path.
- **Core Parsing Logic**
  - [x] Implement directory scanning using Node's built-in **`fs` (File System) module**.
  - [x] Develop a function to **recursively scan** the specified project folder.
  - [x] Filter files to include only relevant source code extensions (`.ts`, `.tsx`, `.js`, `.jsx`).
  - [x] Develop the import-parser module which exposes a single function `parse({ filename: string, contents: string}): string[]` which returns a list of all the files imported or required by the input file.
- - **Details**
    - [x] Use typescript's createSourceFile to generate an AST
    - [x] Implement logic to traverse the AST and identify all **`import` and `require` statements**, ignoring path aliases
- **Data Structure Generation**
Sample Output:

```json
{
  "nodes": [
    {
      "id": "src/index.ts"
    },
    {
      "id": "src/utils/api.ts"
    },
    {
      "id": "src/components/Login.tsx"
    }
  ],
  "links": [
    {
      "source": "src/index.ts",
      "target": "src/components/Login.tsx"
    },
    {
      "source": "src/components/Login.tsx",
      "target": "src/utils/api.ts"
    }
  ]
}
```
  - [x] Create a file-parser module that takes a `ScannedFile[]` array as input and returns an object conforming to the sample output. Subtasks:
    - [x] Implement logic to build the **`nodes` array**, using the **relative file path** as the unique `id`.
    - [x] Implement logic to build the **`links` array** based on resolved import/export relationships, using `source` (importer) and `target` (imported file) file paths.

- **API Completion**
  - [ ] Ensure the `/dependency-map` endpoint sends the **transformed, ready-to-use JSON data** back in the response.
  - [ ] Implement error handling for scenarios like "folder not found," "parsing errors," or "invalid input."

---

## III. Module 2: The Visualizer (Frontend Client)

- **Setup & Framework**
  - [ ] Initialize the frontend project using **Astro**.
  - [ ] Configure Astro to support **React** for interactive UI "islands."
  - [ ] Install **React Flow** and its dependencies.
  - [ ] Install **Chakra UI** and set up its provider/configuration within a React island component.
- **User Interface (UI)**
  - [ ] Design and build the application shell using **Chakra UI components** (e.g., header, layout).
  - [ ] Create a form using Chakra UI for user input, including a text field for the **server-side project folder path**.
  - [ ] Implement the button and associated logic to handle the user submitting the path.
- **Client-Server Communication**
  - [ ] Implement the client-side function to send a **`POST` request** to the backend API (`/dependency-map`) with the user-provided folder path.
  - [ ] Implement logic to handle the API response (receiving the transformed JSON graph data).
  - [ ] Implement basic client-side error and loading state handling for the API request.
- **Visualization**
  - [ ] Create the **Visualizer React component**.
  - [ ] Integrate **React Flow** within the Visualizer component.
  - [ ] Implement logic to consume the received JSON data and correctly render the **interactive dependency graph** (nodes and edges).
  - [ ] Implement initial styling and layout for the nodes and edges within React Flow.

## Post MVP

- [ ] Handle standard import resolution correctly. E.g. if file.ts imports thing.js, but only thing.ts exists, the source should be file.ts and the target thing.ts. Similarly cts, mts and so on.
- [ ] Investigate the other import resolution algorithms (bun, bundlers etc. etc.)
- [ ] Develop a **module resolution** logic that handles file path resolution, including support for **`tsconfig.json` path aliases**.
- [ ] Handle [...] file segments e.g. src/pages/learn/daily-coding-challenge/[...].tsx

- **Transformer Plugin Development**
  - [ ] Create the initial **Transformer Plugin** module.
  - [ ] Implement the transformation function that accepts the **generic graph data structure**.
  - [ ] Develop the logic within the transformer to convert the generic structure into the **specific JSON format required by React Flow** (e.g., adding `position` properties, defining node types).
  - [ ] Integrate the Transformer Plugin into the Fastify API route handler.