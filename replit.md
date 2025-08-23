# Overview

This is a maze game web application built with a full-stack architecture. The application features a 3D-capable frontend game engine that generates procedural mazes with increasing difficulty levels. Players navigate through mazes using keyboard controls or touch interfaces on mobile devices, with audio feedback and visual effects. The backend provides a REST API foundation with user management capabilities, though the current implementation focuses primarily on the frontend game mechanics.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Build Tool**: Vite with custom configuration supporting GLSL shaders and large asset files
- **Styling**: Tailwind CSS with a comprehensive design system using CSS custom properties for theming
- **State Management**: Zustand with subscribeWithSelector middleware for game state, maze generation, and audio management
- **UI Components**: Radix UI primitives with custom styling for consistent, accessible interface elements
- **3D Graphics**: React Three Fiber ecosystem (@react-three/fiber, @react-three/drei, @react-three/postprocessing) for potential 3D maze rendering

## Game Engine Design
- **Maze Generation**: Custom recursive backtracking algorithm implemented in TypeScript for procedural maze creation
- **Game Loop**: Canvas-based rendering with requestAnimationFrame for smooth 60fps gameplay
- **Player System**: Object-oriented player class with movement validation and collision detection
- **Audio System**: HTML5 Audio API with centralized state management for background music and sound effects
- **Touch Controls**: Custom touch interface with visual feedback for mobile gameplay

## Backend Architecture
- **Runtime**: Node.js with Express.js framework using ES modules
- **Database Layer**: Drizzle ORM configured for PostgreSQL with schema-first design approach
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development and PostgreSQL for production
- **Development Setup**: Vite middleware integration for seamless full-stack development experience
- **Error Handling**: Centralized error middleware with proper HTTP status code handling

## Data Architecture
- **Database**: PostgreSQL with Neon serverless hosting for scalable cloud deployment
- **Schema Management**: Drizzle Kit for type-safe schema definitions and migrations
- **User System**: Basic user table with username/password authentication foundation
- **Development Storage**: In-memory storage implementation for rapid prototyping without database dependencies

## Responsive Design
- **Mobile-First**: Touch controls and responsive canvas sizing for optimal mobile experience
- **Desktop Support**: Keyboard navigation with arrow keys and spacebar for desktop gameplay
- **Cross-Platform**: Consistent experience across devices with platform-specific optimizations

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling and automatic scaling
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect support

## Development Tools
- **Replit Integration**: Custom Vite plugin for runtime error overlay in development environment
- **ESBuild**: Production bundling for server-side code with external package handling

## UI/UX Libraries
- **Radix UI**: Complete suite of accessible, unstyled UI primitives including dialogs, dropdowns, tooltips, and form controls
- **Lucide React**: Consistent icon library for interface elements
- **Class Variance Authority**: Type-safe component variant system for maintainable styling
- **React Hook Form**: Form state management with validation support

## Audio/Media Support
- **Font Assets**: Inter font family self-hosted for consistent typography
- **Asset Pipeline**: Vite configuration supporting GLTF, GLB, MP3, OGG, and WAV file types
- **GLSL Shaders**: Vite plugin for shader file processing in potential 3D rendering

## Query Management
- **TanStack Query**: Server state management with caching, background updates, and error handling for API interactions

## Utility Libraries
- **date-fns**: Date manipulation and formatting utilities
- **clsx & tailwind-merge**: Conditional CSS class composition with Tailwind CSS optimization
- **nanoid**: Cryptographically secure unique ID generation