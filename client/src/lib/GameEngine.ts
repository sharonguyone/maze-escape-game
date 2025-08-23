import { Cell } from './MazeGenerator';
import { Player } from './Player';
import { PlayerRole } from './stores/useGame';

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
  }

  public start() {
    this.gameLoop();
  }

  public stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
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

      // Check win condition
      if (newPos.x === this.endPos.x && newPos.y === this.endPos.y) {
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
}
