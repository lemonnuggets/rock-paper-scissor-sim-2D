export class Point<DataType = any> {
  x: number;
  y: number;
  data: DataType;
  constructor(x: number, y: number, data: DataType) {
    this.x = x;
    this.y = y;
    this.data = data;
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
  northEast: QuadTree<DataType> | null;
  northWest: QuadTree<DataType> | null;
  southEast: QuadTree<DataType> | null;
  southWest: QuadTree<DataType> | null;
  capacity: number;

  constructor(bounds: Box, capacity: number) {
    this.bounds = bounds;
    this.points = [];
    this.northEast = null;
    this.northWest = null;
    this.southEast = null;
    this.southWest = null;
    this.capacity = capacity;
  }

  insert(point: Point<DataType>) {
    if (!this.bounds.contains(point)) {
      return false;
    }
    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (
      this.northEast === null ||
      this.northWest === null ||
      this.southEast === null ||
      this.southWest === null
    ) {
      this.subdivide();
    }
    if (
      this.northEast === null ||
      this.northWest === null ||
      this.southEast === null ||
      this.southWest === null
    ) {
      throw new Error("Subdivide failed");
    }

    if (this.northEast && this.northEast.insert(point)) {
      return true;
    }
    if (this.northWest && this.northWest.insert(point)) {
      return true;
    }
    if (this.southEast && this.southEast.insert(point)) {
      return true;
    }
    if (this.southWest && this.southWest.insert(point)) {
      return true;
    }
    return false;
  }

  subdivide() {
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
    this.northEast = new QuadTree<DataType>(northEastBounds, this.capacity);

    const northWestBounds = new Box({
      x: x,
      y: y,
      width: width / 2,
      height: height / 2,
    });
    this.northWest = new QuadTree<DataType>(northWestBounds, this.capacity);

    const southEastBounds = new Box({
      x: x + width / 2,
      y: y + height / 2,
      width: width / 2,
      height: height / 2,
    });
    this.southEast = new QuadTree<DataType>(southEastBounds, this.capacity);

    const southWestBounds = new Box({
      x: x,
      y: y + height / 2,
      width: width / 2,
      height: height / 2,
    });
    this.southWest = new QuadTree<DataType>(southWestBounds, this.capacity);
  }

  query(area: Box): Point[] {
    const pointsInArea: Point[] = [];
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

  remove(point: Point) {
    if (!this.bounds.contains(point)) {
      return false;
    }
    const index = this.points.indexOf(point);
    if (index !== -1) {
      this.points.splice(index, 1);
      return true;
    }
    if (
      this.northEast === null ||
      this.northWest === null ||
      this.southEast === null ||
      this.southWest === null
    ) {
      return false;
    }
    if (this.northEast.remove(point)) {
      return true;
    }
    if (this.northWest.remove(point)) {
      return true;
    }
    if (this.southEast.remove(point)) {
      return true;
    }
    if (this.southWest.remove(point)) {
      return true;
    }
    return false;
  }
}
