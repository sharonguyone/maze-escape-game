import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Simple in-memory storage for player positions and roles
const gameRooms: Record<string, { 
  position?: { x: number; y: number; timestamp: number };
  roles?: { player1?: 'navigator' | 'guide'; player2?: 'navigator' | 'guide' };
}> = {};

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // API endpoint to update player position
  app.post('/api/position/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    const { x, y } = req.body;
    
    if (typeof x === 'number' && typeof y === 'number') {
      if (!gameRooms[roomCode]) {
        gameRooms[roomCode] = {};
      }
      gameRooms[roomCode].position = { x, y, timestamp: Date.now() };
      console.log(`Position updated for room ${roomCode}: ${x}, ${y}`);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid position data' });
    }
  });

  // API endpoint to get player position
  app.get('/api/position/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    const room = gameRooms[roomCode];
    const position = room?.position;
    
    if (position) {
      res.json(position);
    } else {
      res.status(404).json({ error: 'Position not found' });
    }
  });

  // API endpoint to set player role (with automatic assignment)
  app.post('/api/role/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    const { role, playerId } = req.body;
    
    if (!gameRooms[roomCode]) {
      gameRooms[roomCode] = {};
    }
    if (!gameRooms[roomCode].roles) {
      gameRooms[roomCode].roles = {};
    }
    
    const roles = gameRooms[roomCode].roles!;
    
    // Assign the role to this player
    if (playerId === 'player1') {
      roles.player1 = role;
      // Auto-assign other role to player2
      roles.player2 = role === 'navigator' ? 'guide' : 'navigator';
    } else {
      roles.player2 = role;
      // Auto-assign other role to player1
      roles.player1 = role === 'navigator' ? 'guide' : 'navigator';
    }
    
    console.log(`Roles assigned for room ${roomCode}:`, roles);
    res.json({ roles });
  });

  // API endpoint to get room roles
  app.get('/api/role/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    const room = gameRooms[roomCode];
    const roles = room?.roles;
    
    if (roles) {
      res.json({ roles });
    } else {
      res.json({ roles: {} });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
