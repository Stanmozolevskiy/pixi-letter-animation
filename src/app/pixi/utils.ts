// ==================================================
// Utils
// ==================================================
export class Utils {
  public static approxDistance(distanceX: number, distanceY: number) {
    distanceX = Math.abs(distanceX);
    distanceY = Math.abs(distanceY);

    const max = Math.max(distanceX, distanceY);
    const min = Math.min(distanceX, distanceY);
    let approx = max * 1007 + min * 441;

    if (max < min << 4) {
      approx -= max * 40;
    }

    return (approx + 512) >> 10;
  }

  public static random(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }
}

export class PerformanceChecker {

  private processStartTime!: number;
  private performanceCheckCount!: number;
  private performanceTimeSum!: number;

  constructor() {
    this.performanceCheckCount = 0;
    this.performanceTimeSum = 0;
  }

  public startProcess() {
    this.processStartTime = performance.now();
  }

  public endProcess() {
    this.performanceTimeSum += performance.now() - this.processStartTime;
    this.performanceCheckCount++;
  }

  public getAverage() {
    return this.performanceTimeSum / this.performanceCheckCount;
  }
}

