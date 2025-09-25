This is a detailed task checklist for developing the project structure visualizer application, broken down by module and task type.

## I. General Development Setup

- **Project Initialization**
  - [ ] Initialize the monorepo or project structure.
  - [ ] Install **pnpm** globally (if necessary).
  - [ ] Set up the root `package.json` with necessary scripts and dependencies.
  - [ ] Configure tooling (e.g., Linters, Formatters).

---

## II. Module 1: The Parser (Backend Service)

- **Setup & Framework**
  - [ ] Initialize a **Node.js** project for the backend service.
  - [ ] Install **Fastify** and related dependencies.
  - [ ] Define the API structure, starting with the `POST /api/parse` endpoint.
  - [ ] Implement basic request handling for the `/api/parse` endpoint to receive the project folder path.
- **Core Parsing Logic**
  - [ ] Implement directory scanning using Node's built-in **`fs` (File System) module**.
  - [ ] Develop a function to **recursively scan** the specified project folder.
  - [ ] Filter files to include only relevant source code extensions (`.ts`, `.tsx`, `.js`, `.jsx`).
  - [ ] Integrate the **TypeScript Compiler API** for AST generation.
  - [ ] Develop the core parser function to iterate over files and generate an **AST** for each.
  - [ ] Implement logic to traverse the AST and identify all **`import` and `require` statements**.
  - [ ] Develop a **module resolution** logic that handles file path resolution, including support for **`tsconfig.json` path aliases**.
- **Data Structure Generation**
  - [ ] Define the generic graph data structure (`nodes` and `links` arrays).
  - [ ] Implement logic to build the **`nodes` array**, using the **relative file path** as the unique `id`.
  - [ ] Implement logic to build the **`links` array** based on resolved import/export relationships, using `source` (importer) and `target` (imported file) file paths.
- **Transformer Plugin Development**
  - [ ] Create the initial **Transformer Plugin** module.
  - [ ] Implement the transformation function that accepts the **generic graph data structure**.
  - [ ] Develop the logic within the transformer to convert the generic structure into the **specific JSON format required by React Flow** (e.g., adding `position` properties, defining node types).
  - [ ] Integrate the Transformer Plugin into the Fastify API route handler.
- **API Completion**
  - [ ] Ensure the `/api/parse` endpoint sends the **transformed, ready-to-use JSON data** back in the response.
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
  - [ ] Implement the client-side function to send a **`POST` request** to the backend API (`/api/parse`) with the user-provided folder path.
  - [ ] Implement logic to handle the API response (receiving the transformed JSON graph data).
  - [ ] Implement basic client-side error and loading state handling for the API request.
- **Visualization**
  - [ ] Create the **Visualizer React component**.
  - [ ] Integrate **React Flow** within the Visualizer component.
  - [ ] Implement logic to consume the received JSON data and correctly render the **interactive dependency graph** (nodes and edges).
  - [ ] Implement initial styling and layout for the nodes and edges within React Flow.
