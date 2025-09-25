# Design Document

## 1. Overview 📜

This application will provide developers with a visual representation of their project's structure by analyzing file import/export relationships. It consists of two primary, decoupled modules:

- **The Parser:** A backend service that **ingests a local source code folder** on the server, analyzes the Abstract Syntax Tree (AST) of each file, and produces a generic graph data structure.
- **The Visualizer:** A frontend client that receives a transformed graph data structure and renders it as an interactive network graph.

---

## 2. System Architecture

The architecture uses a client-server model. This approach is robust, scalable, and keeps the heavy lifting of code analysis on the server, ensuring the user's browser remains fast and responsive. A key part of this architecture is the transformer plugin, which decouples the core parsing logic from the specific needs of the frontend visualization library.

### Architecture Diagram

The user interacts with the **Frontend Application** in their browser. They provide the **server path to an existing project folder**, which the frontend sends to the **Backend Server API**. The server's **Parser Service** analyzes the code within that local directory, creating a generic dependency graph. This generic data is then passed to a **Transformer Plugin**, which reformats it for the specific graph library used on the frontend. The server API then sends this final, formatted JSON to the frontend, where the **Visualizer** renders it.

### Workflow

1.  **User Input:** The user navigates to the web application and submits the **server-side absolute or relative path of an existing project folder** to be analyzed.
2.  **API Request:** The frontend sends a POST request to the backend API endpoint (e.g., `/api/parse`) with the folder path.
3.  **Parsing:**
    - The backend's **Parser Service** receives the request.
    - The parser **scans the specified local directory** recursively for relevant files (.ts, .tsx, .js, .jsx).
    - For each file, it generates an **Abstract Syntax Tree (AST)** to identify all import and require statements.
    - It resolves the path of each import to build a **generic graph data structure** representing the file dependencies.
4.  **Transformation:** The generic graph data is passed to a **Transformer Plugin**. This plugin converts the data into the specific JSON format required by the frontend's graphing library (e.g., adding position properties for React Flow nodes).
5.  **API Response:** The API endpoint sends the transformed, ready-to-use JSON data back to the frontend.
6.  **Visualization:** The frontend's **Visualizer** component receives the JSON data and renders the interactive dependency graph.

---

## 3. Core Modules & Technology Stack

### General Development

- **Package Manager:** **pnpm**. Chosen for its efficient disk space usage and faster installation times due to a content-addressable store and strict node module structure.

### Module 1: The Parser (Backend)

The backend is responsible for the core analysis and data transformation logic.

- **Runtime:** Node.js.
- **Framework:** Fastify. It is a highly performant, low-overhead web framework ideal for building the required API.
- **AST Parsing:** TypeScript Compiler API. This is the most accurate tool for the job, as it fully understands TypeScript, module resolution, and path aliases defined in `tsconfig.json`.
- **File System Integration:** Node's built-in `fs` (File System) module for recursively scanning the specified project folder.
- **Transformer Plugins:** A set of modules responsible for converting the generic AST-derived graph into a specific format for a rendering library.

### Module 2: The Visualizer (Frontend)

The visualizer is the user-facing part of the application.

- **Framework:** Astro. It allows for building fast content-driven sites while seamlessly integrating interactive UI "islands" built with frameworks like React, which is perfect for hosting the graph component.
- **Graph Rendering Library:** React Flow. A modern and highly customizable library for building node-based UIs and graphs. It is the target for which the backend transformer will format data.
- **UI Components:** **Chakra UI**. A simple, modular, and accessible component library that will be used within a React component in Astro for building the application shell (buttons, inputs, etc.).

---

## 4. Data Structure 📊

A simple, standardized data structure will serve as the contract between the parser and the transformer plugins. The parser will output a JSON object with two main keys: `nodes` and `links`.

- **`nodes`**: An array of objects, where each object represents a file.
  - `id`: A unique identifier, which is the file path **relative to the root of the analyzed project folder** (e.g., `src/components/Button.tsx`).
- **`links`**: An array of objects, where each object represents an import/dependency.
  - `source`: The `id` of the file doing the importing.
  - `target`: The `id` of the file being imported.

### Example JSON (Parser Output)

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
