# Dependency Graph Visualizer

A project structure visualizer application that analyzes TypeScript/JavaScript projects and creates interactive dependency graphs.

## Architecture

This is a monorepo containing two main packages:

- **`packages/parser`** - Backend service built with Fastify that analyzes project structure and generates dependency graphs
- **`packages/visualizer`** - Frontend client built with Astro and React that provides an interactive visualization interface

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Getting Started

1. Install pnpm globally if you haven't already:

   ```bash
   npm install -g pnpm
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start development servers:

   ```bash
   pnpm dev
   ```

## Available Scripts

- `pnpm dev` - Start both backend and frontend in development mode
- `pnpm build` - Build all packages
- `pnpm lint` - Run linting across all packages
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Run TypeScript type checking
- `pnpm clean` - Clean all build artifacts and node_modules

## Package Structure

```text
dependency-graph/
├── packages/
│   ├── parser/          # Backend API service
│   └── visualizer/      # Frontend web application
├── package.json         # Root package.json with workspace configuration
└── tsconfig.json        # Root TypeScript configuration
```
