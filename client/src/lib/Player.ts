export class Player {
  public x: number;
  public y: number;
  private cellSize: number;

  constructor(startX: number, startY: number, cellSize: number) {
    this.x = startX;
    this.y = startY;
    this.cellSize = cellSize;
  }

  public move(direction: 'up' | 'down' | 'left' | 'right') {
    switch (direction) {
      case 'up':
        this.y -= 1;
        break;
      case 'down':
        this.y += 1;
        break;
      case 'left':
        this.x -= 1;
        break;
      case 'right':
        this.x += 1;
        break;
    }
  }

  public render(ctx: CanvasRenderingContext2D, offsetX: number, offsetY: number) {
    const pixelX = this.x * this.cellSize + offsetX;
    const pixelY = this.y * this.cellSize + offsetY;
    const playerSize = this.cellSize * 0.6;
    const centerOffset = (this.cellSize - playerSize) / 2;

    // Draw player as a blue circle
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.arc(
      pixelX + centerOffset + playerSize / 2,
      pixelY + centerOffset + playerSize / 2,
      playerSize / 2,
      0,
      2 * Math.PI
    );
    ctx.fill();

    // Add a white border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  public setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}
