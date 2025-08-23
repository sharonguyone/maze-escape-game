import { Cell } from './MazeGenerator';
import { Player } from './Player';

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
  public onWin: (() => void) | null = null;

  constructor(
    ctx: CanvasRenderingContext2D,
    maze: Cell[][],
    startPos: { x: number; y: number },
    endPos: { x: number; y: number },
    canvasWidth: number,
    canvasHeight: number
  ) {
    this.ctx = ctx;
    this.maze = maze;
    this.startPos = startPos;
    this.endPos = endPos;

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

    // Render maze
    this.renderMaze();
    
    // Render start and end positions
    this.renderStartEnd();
    
    // Render player
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
