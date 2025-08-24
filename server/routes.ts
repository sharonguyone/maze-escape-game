import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

// Simple in-memory storage for player positions, roles, and game state
const gameRooms: Record<string, { 
  position?: { x: number; y: number; timestamp: number };
  roles?: { player1?: 'navigator' | 'guide'; player2?: 'navigator' | 'guide' };
  gameState?: { phase: 'playing' | 'level-complete' | 'ended'; currentLevel: number; timestamp: number };
  players?: { player1?: boolean; player2?: boolean; timestamp: number };
  playersReady?: { player1?: boolean; player2?: boolean; timestamp: number };
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

  // API endpoint to switch roles (creator only)
  app.post('/api/switch-roles/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    const room = gameRooms[roomCode];
    
    if (!room || !room.roles) {
      res.status(404).json({ error: 'Room or roles not found' });
      return;
    }
    
    const roles = room.roles;
    // Switch the roles
    const temp = roles.player1;
    roles.player1 = roles.player2;
    roles.player2 = temp;
    
    console.log(`Roles switched for room ${roomCode}:`, roles);
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

  // API endpoint to update game state (level completion, win, etc.)
  app.post('/api/game-state/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    const { phase, currentLevel } = req.body;
    
    if (!gameRooms[roomCode]) {
      gameRooms[roomCode] = {};
    }
    
    gameRooms[roomCode].gameState = { 
      phase, 
      currentLevel: currentLevel || 1, 
      timestamp: Date.now() 
    };
    
    console.log(`Game state updated for room ${roomCode}: ${phase}, level ${currentLevel}`);
    res.json({ success: true });
  });

  // API endpoint to get game state
  app.get('/api/game-state/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    const room = gameRooms[roomCode];
    const gameState = room?.gameState;
    
    if (gameState) {
      res.json(gameState);
    } else {
      res.json({ phase: 'playing', currentLevel: 1 });
    }
  });

  // API endpoint to join room (register player presence)
  app.post('/api/join/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    const { playerId } = req.body;
    
    if (!gameRooms[roomCode]) {
      gameRooms[roomCode] = {};
    }
    if (!gameRooms[roomCode].players) {
      gameRooms[roomCode].players = { timestamp: Date.now() };
    }
    
    const players = gameRooms[roomCode].players!;
    if (playerId === 'player1' || playerId === 'player2') {
      (players as any)[playerId] = true;
      players.timestamp = Date.now();
      
      const bothPlayersJoined = players.player1 && players.player2;
      console.log(`Player ${playerId} joined room ${roomCode}. Both players: ${bothPlayersJoined}`);
      
      res.json({ 
        success: true, 
        bothPlayersJoined,
        players: { player1: !!players.player1, player2: !!players.player2 }
      });
    } else {
      res.status(400).json({ error: 'Invalid player ID' });
    }
  });

  // API endpoint to get room status
  app.get('/api/room-status/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    const room = gameRooms[roomCode];
    
    if (!room) {
      res.json({ 
        exists: false, 
        bothPlayersJoined: false,
        players: { player1: false, player2: false }
      });
      return;
    }
    
    const players = room.players || { timestamp: Date.now() };
    const bothPlayersJoined = !!(players as any).player1 && !!(players as any).player2;
    
    res.json({ 
      exists: true,
      bothPlayersJoined,
      players: { player1: !!(players as any).player1, player2: !!(players as any).player2 }
    });
  });

  // API endpoint to mark player as ready (after receiving role)
  app.post('/api/player-ready/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    const { playerId } = req.body;
    
    if (!gameRooms[roomCode]) {
      gameRooms[roomCode] = {};
    }
    if (!gameRooms[roomCode].playersReady) {
      gameRooms[roomCode].playersReady = { timestamp: Date.now() };
    }
    
    const playersReady = gameRooms[roomCode].playersReady!;
    if (playerId === 'player1' || playerId === 'player2') {
      (playersReady as any)[playerId] = true;
      playersReady.timestamp = Date.now();
      
      const bothPlayersReady = playersReady.player1 && playersReady.player2;
      console.log(`Player ${playerId} is ready in room ${roomCode}. Both players ready: ${bothPlayersReady}`);
      
      // If both players are ready, automatically start the game
      if (bothPlayersReady) {
        gameRooms[roomCode].gameState = {
          phase: 'playing',
          currentLevel: 1,
          timestamp: Date.now()
        };
        console.log(`Both players ready - starting game in room ${roomCode}`);
      }
      
      res.json({ 
        success: true, 
        bothPlayersReady,
        playersReady: { player1: !!playersReady.player1, player2: !!playersReady.player2 }
      });
    } else {
      res.status(400).json({ error: 'Invalid player ID' });
    }
  });

  // API endpoint to get player ready status
  app.get('/api/player-ready/:roomCode', (req, res) => {
    const { roomCode } = req.params;
    const room = gameRooms[roomCode];
    
    if (!room || !room.playersReady) {
      res.json({ 
        bothPlayersReady: false,
        playersReady: { player1: false, player2: false }
      });
      return;
    }
    
    const playersReady = room.playersReady;
    const bothPlayersReady = !!playersReady.player1 && !!playersReady.player2;
    
    res.json({ 
      bothPlayersReady,
      playersReady: { player1: !!playersReady.player1, player2: !!playersReady.player2 }
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
