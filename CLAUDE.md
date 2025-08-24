# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production artifacts (client and server)
- `npm start` - Start production server 
- `npm run check` - Run TypeScript type checking

### Database Management
- `npm run db:push` - Push schema changes to database using Drizzle Kit

## Architecture Overview

### Project Structure
This is a full-stack TypeScript maze game application with cooperative multiplayer functionality:

- `client/` - React frontend with Canvas-based game engine
- `server/` - Express.js backend with RESTful API
- `shared/` - Shared TypeScript schemas and types
- Database configured for PostgreSQL via Drizzle ORM

### Key Technical Components

#### Game Engine (`client/src/lib/GameEngine.ts`)
- Canvas-based 2D rendering with requestAnimationFrame game loop
- Dual-role cooperative gameplay: Navigator (limited visibility) and Guide (full maze view)
- Real-time position synchronization via HTTP API polling
- Role-based rendering with different visual perspectives

#### State Management
- Zustand stores in `client/src/lib/stores/`:
  - `useGame.tsx` - Game phases, player roles, room management, HTTP-based position sync
  - `useMaze.tsx` - Maze generation state
  - `useAudio.tsx` - Audio system management

#### Maze Generation (`client/src/lib/MazeGenerator.ts`)
- Recursive backtracking algorithm with seeded random generation
- Deterministic maze creation for consistent multiplayer experiences

#### Multiplayer System
- Room-based gameplay with 4-digit room codes
- HTTP API for real-time position synchronization (`/api/position/:roomCode`)
- Automatic role assignment system (`/api/role/:roomCode`)
- Cross-device position sharing

### API Structure (`server/routes.ts`)
- In-memory game room storage with position and role data
- Position endpoints: POST/GET `/api/position/:roomCode`
- Role management: POST/GET `/api/role/:roomCode`
- Automatic complementary role assignment between players

### Technology Stack
- **Frontend**: React 18 + TypeScript, Canvas 2D API, Zustand state management
- **Backend**: Express.js with TypeScript, in-memory session storage
- **Database**: PostgreSQL via Drizzle ORM (configured but minimal usage)
- **Build**: Vite with custom configuration for assets (GLTF, GLSL, audio files)
- **UI**: Radix UI primitives with Tailwind CSS
- **Deployment**: Render (auto-deploys from main branch on GitHub)

### Path Aliases
- `@/` → `client/src/`
- `@shared/` → `shared/`

### Asset Pipeline
- Supports GLTF/GLB 3D models, MP3/OGG/WAV audio, GLSL shaders
- Public assets in `client/public/` including fonts, textures, geometries, sounds

## Deployment

### Render Configuration
- **Platform**: Render (render.com)
- **Auto-deployment**: Configured to deploy automatically from the main branch on GitHub
- **Build Command**: `npm run build` (builds client assets and server bundle)
- **Start Command**: `npm start` (runs `node dist/index.js`)
- **Environment**: Production builds are optimized and bundled

### Deployment Process
1. Push changes to main branch on GitHub
2. Render automatically triggers deployment
3. Runs build process (Vite + esbuild)
4. Serves production application

## Development Notes

### Cooperative Multiplayer Pattern
The game implements a unique cooperative pattern where two players have different perspectives of the same maze:
- **Navigator**: Limited visibility, controls player movement
- **Guide**: Full maze view, provides navigation assistance
- Position synchronization happens via HTTP polling every 200ms

### Testing
No specific test framework is configured. Check if tests are needed before implementing testing infrastructure.