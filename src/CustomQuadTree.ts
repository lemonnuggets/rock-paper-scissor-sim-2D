import p5 from "p5";

export class Point<DataType = any> {
  x: number;
  y: number;
  data: DataType;
  constructor(x: number, y: number, data: any) {
    this.x = x;
    this.y = y;
    this.data = data;
  }
  sqDistanceTo(point: Point) {
    return Math.pow(this.x - point.x, 2) + Math.pow(this.y - point.y, 2);
  }
}

type BoxArgs = {
  leftCorner?: Point;
  x?: number;
  y?: number;
  width: number;
  height: number;
};
export class Box {
  leftCorner: Point;
  width: number;
  height: number;
  constructor({ leftCorner, x, y, width, height }: BoxArgs) {
    if (leftCorner) {
      this.leftCorner = leftCorner;
    } else if (x !== undefined && y !== undefined) {
      this.leftCorner = new Point(x, y, null);
    } else {
      throw new Error(
        "Box must be initialized with either leftCorner or x and y"
      );
    }
    this.width = width;
    this.height = height;
  }
  contains(point: Point) {
    return (
      point.x >= this.leftCorner.x &&
      point.x <= this.leftCorner.x + this.width &&
      point.y >= this.leftCorner.y &&
      point.y <= this.leftCorner.y + this.height
    );
  }
  intersects(range: Box) {
    const thisMinX = this.leftCorner.x;
    const thisMinY = this.leftCorner.y;
    const thisMaxX = this.leftCorner.x + this.width;
    const thisMaxY = this.leftCorner.y + this.height;

    const rangeMinX = range.leftCorner.x;
    const rangeMinY = range.leftCorner.y;
    const rangeMaxX = range.leftCorner.x + range.width;
    const rangeMaxY = range.leftCorner.y + range.height;

    const thisLeftOfRange = thisMaxX < rangeMinX;
    const thisRightOfRange = thisMinX > rangeMaxX;
    const thisAboveRange = thisMaxY < rangeMinY;
    const thisBelowRange = thisMinY > rangeMaxY;

    return !(
      thisLeftOfRange ||
      thisRightOfRange ||
      thisAboveRange ||
      thisBelowRange
    );
  }
}

export class QuadTree<DataType = any> {
  bounds: Box;
  points: Point<DataType>[];
  northEast: QuadTree | null;
  northWest: QuadTree | null;
  southEast: QuadTree | null;
  southWest: QuadTree | null;
  capacity: number;
  isSubdivided: boolean;

  constructor(bounds: Box, capacity: number = 4) {
    this.isSubdivided = false;
    this.bounds = bounds;
    this.points = [];
    this.northEast = null;
    this.northWest = null;
    this.southEast = null;
    this.southWest = null;
    this.capacity = capacity;
  }

  refresh(): Point<DataType>[] {
    const pointsToReinsert = [];
    if (this.isSubdivided) {
      const childrenPointsToReinsert: Point<DataType>[] = [];
      childrenPointsToReinsert.push(...this.northEast!.refresh());
      childrenPointsToReinsert.push(...this.northWest!.refresh());
      childrenPointsToReinsert.push(...this.southEast!.refresh());
      childrenPointsToReinsert.push(...this.southWest!.refresh());
      childrenPointsToReinsert.push(...this.points);
      for (let point of childrenPointsToReinsert) {
        if (!this.insert(point, true)) {
          pointsToReinsert.push(point);
        }
      }
      this.points = [];
      return pointsToReinsert;
    }
    if (this.points.length >= this.capacity) {
      this.subdivide();
    }
    for (let point of this.points) {
      if (!this.bounds.contains(point)) {
        pointsToReinsert.push(point);
      }
    }
    return pointsToReinsert;
  }

  getAllPoints(): Point<DataType>[] {
    if (this.isSubdivided) {
      return [
        ...this.northEast!.getAllPoints(),
        ...this.northWest!.getAllPoints(),
        ...this.southEast!.getAllPoints(),
        ...this.southWest!.getAllPoints(),
      ];
    } else {
      return this.points;
    }
  }

  getSize(): number {
    if (this.isSubdivided) {
      return (
        this.northEast!.getSize() +
        this.northWest!.getSize() +
        this.southEast!.getSize() +
        this.southWest!.getSize()
      );
    } else {
      return this.points.length;
    }
  }

  insert(point: Point<DataType>, forceToChild: boolean = false): boolean {
    if (!this.bounds.contains(point)) {
      return false;
    }
    if (this.isSubdivided || forceToChild) {
      if (
        this.northEast === null ||
        this.northWest === null ||
        this.southEast === null ||
        this.southWest === null
      ) {
        throw new Error("Sub quadTree is null");
      }

      if (
        this.northEast.insert(point) ||
        this.northWest.insert(point) ||
        this.southEast.insert(point) ||
        this.southWest.insert(point)
      ) {
        return true;
      }
    }

    if (this.points.length >= this.capacity) {
      this.subdivide();
      return this.insert(point);
    }

    this.points.push(point);
    return true;
  }

  subdivide() {
    console.group("Subdivide");
    if (this.isSubdivided) {
      return;
    }
    console.groupCollapsed("Before subdivide");
    console.log("Subdivided", this.isSubdivided);
    console.log("Points", this.points);
    console.log("North East", this.northEast);
    console.log("North West", this.northWest);
    console.log("South East", this.southEast);
    console.log("South West", this.southWest);
    console.groupEnd();

    const x = this.bounds.leftCorner.x;
    const y = this.bounds.leftCorner.y;
    const width = this.bounds.width;
    const height = this.bounds.height;

    const northEastBounds = new Box({
      x: x + width / 2,
      y: y,
      width: width / 2,
      height: height / 2,
    });
    this.northEast = new QuadTree(northEastBounds, this.capacity);

    const northWestBounds = new Box({
      x: x,
      y: y,
      width: width / 2,
      height: height / 2,
    });
    this.northWest = new QuadTree(northWestBounds, this.capacity);

    const southEastBounds = new Box({
      x: x + width / 2,
      y: y + height / 2,
      width: width / 2,
      height: height / 2,
    });
    this.southEast = new QuadTree(southEastBounds, this.capacity);

    const southWestBounds = new Box({
      x: x,
      y: y + height / 2,
      width: width / 2,
      height: height / 2,
    });
    this.southWest = new QuadTree(southWestBounds, this.capacity);

    const points = [...this.points];
    for (const point of points) {
      this.remove(point);
      this.insert(point, true);
    }

    this.isSubdivided = true;
    console.groupCollapsed("After subdivide");
    console.log("Subdivided", this.isSubdivided);
    console.log(`Points, length = ${this.points.length}`, this.points);
    console.log(
      `North East, length = ${this.northEast.getSize()}`,
      this.northEast
    );
    console.log(
      `North West, length = ${this.northWest.getSize()}`,
      this.northWest
    );
    console.log(
      `South East, length = ${this.southEast.getSize()}`,
      this.southEast
    );
    console.log(
      `South West, length = ${this.southWest.getSize()}`,
      this.southWest
    );
    console.groupEnd();
    console.groupEnd();
  }

  query(area: Box): Point<DataType>[] {
    const pointsInArea: Point<DataType>[] = [];
    if (!this.bounds.intersects(area)) {
      return pointsInArea;
    }
    for (const point of this.points) {
      if (area.contains(point)) {
        pointsInArea.push(point);
      }
    }
    if (
      this.northEast === null ||
      this.northWest === null ||
      this.southEast === null ||
      this.southWest === null
    ) {
      return pointsInArea;
    }
    pointsInArea.push(...this.northEast.query(area));
    pointsInArea.push(...this.northWest.query(area));
    pointsInArea.push(...this.southEast.query(area));
    pointsInArea.push(...this.southWest.query(area));
    return pointsInArea;
  }

  remove(point: Point<DataType>, forceFromThis: boolean = false): boolean {
    if (!this.bounds.contains(point)) {
      return false;
    }
    if (this.isSubdivided && !forceFromThis) {
      if (
        this.northEast === null ||
        this.northWest === null ||
        this.southEast === null ||
        this.southWest === null
      ) {
        throw new Error("SubQuadTrees are null");
      }

      if (
        this.northEast.remove(point) ||
        this.northWest.remove(point) ||
        this.southEast.remove(point) ||
        this.southWest.remove(point)
      ) {
        return true;
      }
    }

    const index = this.points.indexOf(point);
    if (index !== -1) {
      this.points.splice(index, 1);
      return true;
    }
    return false;
  }

  findClosest(
    increaseWidthBy: number,
    increaseHeightBy: number,
    xOrPoint: number | Point,
    y?: number
  ): Point<DataType> | null {
    let point: Point;
    if (typeof xOrPoint === "number" && typeof y === "number") {
      point = new Point(xOrPoint, y, undefined);
    } else if (xOrPoint instanceof Point) {
      point = xOrPoint;
    } else {
      throw new Error("Invalid arguments. Expected (number, number) or Point");
    }

    if (!this.bounds.contains(point) || this.getSize() === 0) {
      return null;
    }
    let bounds = new Box({
      x: point.x - increaseWidthBy,
      y: point.y - increaseHeightBy,
      width: increaseWidthBy * 2,
      height: increaseHeightBy * 2,
    });
    let points = this.query(bounds);
    while (points.length === 0) {
      increaseWidthBy *= 2;
      increaseHeightBy *= 2;
      bounds = new Box({
        x: point.x - increaseWidthBy,
        y: point.y - increaseHeightBy,
        width: increaseWidthBy * 2,
        height: increaseHeightBy * 2,
      });
      points = this.query(bounds);
    }

    let closestPoint = points[0];
    let closestDistance = point.sqDistanceTo(closestPoint);
    for (const p of points) {
      const distance = point.sqDistanceTo(p);
      if (distance < closestDistance) {
        closestPoint = p;
        closestDistance = distance;
      }
    }
    return closestPoint;
  }

  render(p5: p5, color: p5.Color) {
    p5.push();
    p5.noFill();
    color.setAlpha(200);
    p5.stroke(color);
    p5.strokeWeight(5);
    p5.rect(
      this.bounds.leftCorner.x,
      this.bounds.leftCorner.y,
      this.bounds.width,
      this.bounds.height
    );
    p5.pop();

    if (this.isSubdivided) {
      this.northEast?.render(p5, color);
      this.northWest?.render(p5, color);
      this.southEast?.render(p5, color);
      this.southWest?.render(p5, color);
    }
  }
}
