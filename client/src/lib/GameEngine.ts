import { Cell } from './MazeGenerator';
import { Player } from './Player';
import { PlayerRole, useGame } from './stores/useGame';

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private maze: Cell[][];
  private player: Player;
  private startPos: { x: number; y: number };
  private endPos: { x: number; y: number };
  private cellSize: number;
  private offsetX: number;
  private offsetY: number;
  private animationId: number | null = null;
  private playerRole: PlayerRole;
  private positionSyncInterval: number | null = null;
  private gameStateSyncInterval: number | null = null;
  private storageEventHandler: ((e: Event) => void) | null = null;
  public onWin: (() => void) | null = null;

  constructor(
    ctx: CanvasRenderingContext2D,
    maze: Cell[][],
    startPos: { x: number; y: number },
    endPos: { x: number; y: number },
    canvasWidth: number,
    canvasHeight: number,
    playerRole: PlayerRole = null
  ) {
    this.ctx = ctx;
    this.maze = maze;
    this.startPos = startPos;
    this.endPos = endPos;
    this.playerRole = playerRole;

    // Calculate cell size and offsets to center the maze
    const mazeWidth = maze[0].length;
    const mazeHeight = maze.length;
    this.cellSize = Math.min(
      Math.floor(canvasWidth / mazeWidth),
      Math.floor(canvasHeight / mazeHeight)
    );

    const totalMazeWidth = mazeWidth * this.cellSize;
    const totalMazeHeight = mazeHeight * this.cellSize;
    this.offsetX = (canvasWidth - totalMazeWidth) / 2;
    this.offsetY = (canvasHeight - totalMazeHeight) / 2;

    this.player = new Player(startPos.x, startPos.y, this.cellSize);
    
    // Initialize shared position
    const { initializePlayerPosition } = useGame.getState();
    initializePlayerPosition(startPos.x, startPos.y);
  }

  public start() {
    this.gameLoop();
    // Start position synchronization
    this.startPositionSync();
    // Start game state synchronization
    this.startGameStateSync();
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    // Stop position synchronization
    this.stopPositionSync();
    // Stop game state synchronization
    this.stopGameStateSync();
  }

  private gameLoop = () => {
    this.render();
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private render() {
    // Clear canvas
    this.ctx.fillStyle = '#1F2937'; // Dark gray background
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    if (this.playerRole === 'navigator') {
      // Navigator view: Limited visibility - only show player and small area around them
      this.renderNavigatorView();
    } else {
      // Guide view (or default): Show full maze
      this.renderMaze();
      this.renderStartEnd();
      // Add guide mode indicator
      this.renderGuideIndicator();
    }
    
    // Always render player
    this.player.render(this.ctx, this.offsetX, this.offsetY);
  }

  private renderMaze() {
    const wallThickness = 2;
    this.ctx.strokeStyle = '#E5E7EB'; // Light gray walls
    this.ctx.lineWidth = wallThickness;

    for (let y = 0; y < this.maze.length; y++) {
      for (let x = 0; x < this.maze[y].length; x++) {
        const cell = this.maze[y][x];
        const pixelX = x * this.cellSize + this.offsetX;
        const pixelY = y * this.cellSize + this.offsetY;

        this.ctx.beginPath();

        // Top wall
        if (cell.walls.top) {
          this.ctx.moveTo(pixelX, pixelY);
          this.ctx.lineTo(pixelX + this.cellSize, pixelY);
        }

        // Right wall
        if (cell.walls.right) {
          this.ctx.moveTo(pixelX + this.cellSize, pixelY);
          this.ctx.lineTo(pixelX + this.cellSize, pixelY + this.cellSize);
        }

        // Bottom wall
        if (cell.walls.bottom) {
          this.ctx.moveTo(pixelX, pixelY + this.cellSize);
          this.ctx.lineTo(pixelX + this.cellSize, pixelY + this.cellSize);
        }

        // Left wall
        if (cell.walls.left) {
          this.ctx.moveTo(pixelX, pixelY);
          this.ctx.lineTo(pixelX, pixelY + this.cellSize);
        }

        this.ctx.stroke();
      }
    }
  }

  private renderStartEnd() {
    // Render start position (green)
    const startPixelX = this.startPos.x * this.cellSize + this.offsetX;
    const startPixelY = this.startPos.y * this.cellSize + this.offsetY;
    this.ctx.fillStyle = '#10B981';
    this.ctx.fillRect(startPixelX + 2, startPixelY + 2, this.cellSize - 4, this.cellSize - 4);

    // Render end position (red)
    const endPixelX = this.endPos.x * this.cellSize + this.offsetX;
    const endPixelY = this.endPos.y * this.cellSize + this.offsetY;
    this.ctx.fillStyle = '#EF4444';
    this.ctx.fillRect(endPixelX + 2, endPixelY + 2, this.cellSize - 4, this.cellSize - 4);

    // Add "EXIT" text on end position
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = `${Math.max(8, this.cellSize / 4)}px Inter, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      'EXIT',
      endPixelX + this.cellSize / 2,
      endPixelY + this.cellSize / 2
    );
  }

  private renderNavigatorView() {
    const playerPos = this.player.getPosition();
    const visibilityRadius = 2; // How many cells around the player to show
    
    // Show a dimmed background pattern
    this.ctx.fillStyle = '#374151';
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    // Add a subtle grid pattern to help with navigation
    this.ctx.strokeStyle = '#4B5563';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    
    for (let i = 0; i < this.ctx.canvas.width; i += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.ctx.canvas.height);
      this.ctx.stroke();
    }
    
    for (let i = 0; i < this.ctx.canvas.height; i += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.ctx.canvas.width, i);
      this.ctx.stroke();
    }
    
    this.ctx.setLineDash([]);
    
    // Show walls only around the player
    const wallThickness = 3;
    this.ctx.strokeStyle = '#EF4444'; // Red walls for better visibility
    this.ctx.lineWidth = wallThickness;

    for (let y = Math.max(0, playerPos.y - visibilityRadius); 
         y <= Math.min(this.maze.length - 1, playerPos.y + visibilityRadius); y++) {
      for (let x = Math.max(0, playerPos.x - visibilityRadius); 
           x <= Math.min(this.maze[0].length - 1, playerPos.x + visibilityRadius); x++) {
        const cell = this.maze[y][x];
        const pixelX = x * this.cellSize + this.offsetX;
        const pixelY = y * this.cellSize + this.offsetY;

        this.ctx.beginPath();

        // Only show walls that would block the player's movement
        if (cell.walls.top) {
          this.ctx.moveTo(pixelX, pixelY);
          this.ctx.lineTo(pixelX + this.cellSize, pixelY);
        }
        if (cell.walls.right) {
          this.ctx.moveTo(pixelX + this.cellSize, pixelY);
          this.ctx.lineTo(pixelX + this.cellSize, pixelY + this.cellSize);
        }
        if (cell.walls.bottom) {
          this.ctx.moveTo(pixelX, pixelY + this.cellSize);
          this.ctx.lineTo(pixelX + this.cellSize, pixelY + this.cellSize);
        }
        if (cell.walls.left) {
          this.ctx.moveTo(pixelX, pixelY);
          this.ctx.lineTo(pixelX, pixelY + this.cellSize);
        }

        this.ctx.stroke();
      }
    }

    // Show the exit if it's close to the player
    const distanceToExit = Math.abs(playerPos.x - this.endPos.x) + Math.abs(playerPos.y - this.endPos.y);
    if (distanceToExit <= visibilityRadius + 1) {
      const endPixelX = this.endPos.x * this.cellSize + this.offsetX;
      const endPixelY = this.endPos.y * this.cellSize + this.offsetY;
      this.ctx.fillStyle = '#EF4444';
      this.ctx.fillRect(endPixelX + 2, endPixelY + 2, this.cellSize - 4, this.cellSize - 4);
      
      // Add "EXIT" text
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = `${Math.max(8, this.cellSize / 4)}px Inter, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(
        'EXIT',
        endPixelX + this.cellSize / 2,
        endPixelY + this.cellSize / 2
      );
    }
  }

  public movePlayer(direction: 'up' | 'down' | 'left' | 'right') {
    // Only Navigator can move
    if (this.playerRole !== 'navigator') {
      return;
    }

    const currentPos = this.player.getPosition();
    const newPos = { ...currentPos };

    switch (direction) {
      case 'up':
        newPos.y -= 1;
        break;
      case 'down':
        newPos.y += 1;
        break;
      case 'left':
        newPos.x -= 1;
        break;
      case 'right':
        newPos.x += 1;
        break;
    }

    // Check if the move is valid (no wall blocking)
    if (this.isValidMove(currentPos, newPos, direction)) {
      this.player.setPosition(newPos.x, newPos.y);
      
      // Update shared position for other players to see
      const { updatePlayerPosition } = useGame.getState();
      updatePlayerPosition(newPos.x, newPos.y);
      
      console.log(`Navigator moved to: ${newPos.x}, ${newPos.y} - sending to server`);

      // Check win condition
      if (newPos.x === this.endPos.x && newPos.y === this.endPos.y) {
        const { broadcastWin } = useGame.getState();
        broadcastWin(); // Notify both players
        
        if (this.onWin) {
          this.onWin();
        }
      }
    }
  }

  private isValidMove(
    currentPos: { x: number; y: number },
    newPos: { x: number; y: number },
    direction: 'up' | 'down' | 'left' | 'right'
  ): boolean {
    // Check boundaries
    if (
      newPos.x < 0 ||
      newPos.x >= this.maze[0].length ||
      newPos.y < 0 ||
      newPos.y >= this.maze.length
    ) {
      return false;
    }

    const currentCell = this.maze[currentPos.y][currentPos.x];

    // Check if there's a wall in the direction we're trying to move
    switch (direction) {
      case 'up':
        return !currentCell.walls.top;
      case 'down':
        return !currentCell.walls.bottom;
      case 'left':
        return !currentCell.walls.left;
      case 'right':
        return !currentCell.walls.right;
      default:
        return false;
    }
  }

  private startPositionSync() {
    // Only Guide needs to sync position updates
    if (this.playerRole === 'guide') {
      // Poll for position updates from server
      this.positionSyncInterval = window.setInterval(() => {
        this.syncPlayerPositionFromServer();
      }, 200); // Poll every 200ms for smooth movement
      
      console.log('Guide: Started HTTP position sync');
    }
  }

  private stopPositionSync() {
    if (this.positionSyncInterval) {
      clearInterval(this.positionSyncInterval);
      this.positionSyncInterval = null;
    }
  }

  private startGameStateSync() {
    // Both players need to sync game state
    this.gameStateSyncInterval = window.setInterval(() => {
      this.syncGameStateFromServer();
    }, 1000); // Check every second for game state changes
    
    console.log('Started game state synchronization');
  }

  private stopGameStateSync() {
    if (this.gameStateSyncInterval) {
      clearInterval(this.gameStateSyncInterval);
      this.gameStateSyncInterval = null;
    }
  }

  private async syncGameStateFromServer() {
    const { roomCode, phase } = useGame.getState();
    if (!roomCode) return;

    try {
      const response = await fetch(`/api/game-state/${roomCode}`);
      if (response.ok) {
        const serverState = await response.json();
        const currentState = useGame.getState();
        
        // Check if server state changed (level complete, etc.)
        if (serverState.phase !== currentState.phase) {
          if (serverState.phase === 'level-complete' && currentState.phase === 'playing') {
            // Trigger win condition for both players
            const { levelComplete } = useGame.getState();
            levelComplete();
            if (this.onWin) {
              this.onWin();
            }
          }
        }
      }
    } catch (error) {
      // Silently ignore errors - just try again on next poll
    }
  }

  private async syncPlayerPositionFromServer() {
    const { roomCode } = useGame.getState();
    if (!roomCode) return;

    try {
      const response = await fetch(`/api/position/${roomCode}`);
      if (response.ok) {
        const data = await response.json();
        const currentPos = this.player.getPosition();
        if (currentPos.x !== data.x || currentPos.y !== data.y) {
          this.player.setPosition(data.x, data.y);
          console.log(`Guide synced to: ${data.x}, ${data.y}`);
        }
      }
    } catch (error) {
      // Silently ignore errors - just try again on next poll
    }
  }


  private renderGuideIndicator() {
    if (this.playerRole === 'guide') {
      // Add text indicator at top of screen
      this.ctx.fillStyle = '#10B981'; // Green color
      this.ctx.font = 'bold 16px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(
        'GUIDE VIEW - Watching Navigator',
        this.ctx.canvas.width / 2,
        10
      );
      
      // Add small arrow pointing to player
      const playerPos = this.player.getPosition();
      const playerPixelX = playerPos.x * this.cellSize + this.offsetX + this.cellSize / 2;
      const playerPixelY = playerPos.y * this.cellSize + this.offsetY - 15;
      
      this.ctx.fillStyle = '#10B981';
      this.ctx.font = '12px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('↓ Navigator', playerPixelX, playerPixelY);
    }
  }
}
