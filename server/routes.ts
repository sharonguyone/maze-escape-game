import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Simple in-memory storage for player positions
const gameRooms: Record<string, { x: number; y: number; timestamp: number }> = {};

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
      gameRooms[roomCode] = { x, y, timestamp: Date.now() };
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid position data' });
    }
  });

  // API endpoint to get player position
  app.get('/api/position/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    const position = gameRooms[roomCode];
    
    if (position) {
      res.json(position);
    } else {
      res.status(404).json({ error: 'Position not found' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
