export interface Cell {
  x: number;
  y: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  visited: boolean;
}

export class MazeGenerator {
  private width: number;
  private height: number;
  private grid: Cell[][];
  private seed: number;
  private rng: () => number;

  constructor(width: number, height: number, seed?: number) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.seed = seed || Math.floor(Math.random() * 1000000);
    this.rng = this.createSeededRandom(this.seed);
    this.initializeGrid();
  }

  private createSeededRandom(seed: number): () => number {
    let m = 0x80000000; // 2**31;
    let a = 1103515245;
    let c = 12345;
    let state = seed;
    
    return function() {
      state = (a * state + c) % m;
      return state / (m - 1);
    };
  }

  public getSeed(): number {
    return this.seed;
  }

  private initializeGrid() {
    this.grid = [];
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = {
          x,
          y,
          walls: {
            top: true,
            right: true,
            bottom: true,
            left: true,
          },
          visited: false,
        };
      }
    }
  }

  private getCell(x: number, y: number): Cell | undefined {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return undefined;
    }
    return this.grid[y][x];
  }

  private getUnvisitedNeighbors(cell: Cell): Cell[] {
    const neighbors: Cell[] = [];
    const { x, y } = cell;

    const top = this.getCell(x, y - 1);
    const right = this.getCell(x + 1, y);
    const bottom = this.getCell(x, y + 1);
    const left = this.getCell(x - 1, y);

    if (top && !top.visited) neighbors.push(top);
    if (right && !right.visited) neighbors.push(right);
    if (bottom && !bottom.visited) neighbors.push(bottom);
    if (left && !left.visited) neighbors.push(left);

    return neighbors;
  }

  private removeWall(current: Cell, neighbor: Cell) {
    const dx = current.x - neighbor.x;
    const dy = current.y - neighbor.y;

    if (dx === 1) {
      // Neighbor is to the left
      current.walls.left = false;
      neighbor.walls.right = false;
    } else if (dx === -1) {
      // Neighbor is to the right
      current.walls.right = false;
      neighbor.walls.left = false;
    } else if (dy === 1) {
      // Neighbor is above
      current.walls.top = false;
      neighbor.walls.bottom = false;
    } else if (dy === -1) {
      // Neighbor is below
      current.walls.bottom = false;
      neighbor.walls.top = false;
    }
  }

  public generate(): Cell[][] {
    const stack: Cell[] = [];
    const startCell = this.grid[0][0];
    startCell.visited = true;
    stack.push(startCell);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(current);

      if (neighbors.length > 0) {
        const randomNeighbor = neighbors[Math.floor(this.rng() * neighbors.length)];
        randomNeighbor.visited = true;
        
        this.removeWall(current, randomNeighbor);
        stack.push(randomNeighbor);
      } else {
        stack.pop();
      }
    }

    return this.grid;
  }

  public getStartPosition(): { x: number; y: number } {
    return { x: 0, y: 0 };
  }

  public getEndPosition(): { x: number; y: number } {
    return { x: this.width - 1, y: this.height - 1 };
  }
}
