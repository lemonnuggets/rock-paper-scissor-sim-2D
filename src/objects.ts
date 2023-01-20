import P5, { Color, Image, Vector } from "p5";
import { Point, QuadTree } from "./CustomQuadTree";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MAX_FORCE,
  MAX_VECTOR_LENGTH,
  MAX_VELOCITY,
  OBJECT_HEIGHT,
  OBJECT_WIDTH,
  RESTITUTION,
} from "./params";
import { Stage } from "./Stage";

export type RealObject = Rock | Paper | Scissor;

export class AbstractObject {
  centre: Vector;
  velocity: Vector;
  acceleration: Vector;
  stage: Stage;
  color: Color;
  objectType: "rock" | "paper" | "scissor";
  width: number;
  height: number;
  constructor(
    stage: Stage,
    objectType: "rock" | "paper" | "scissor",
    color: Color,
    width: number,
    height: number,
    centre?: Vector,
    velocity?: Vector,
    acceleration?: Vector
  ) {
    this.stage = stage;
    this.objectType = objectType;
    this.color = color;
    this.width = width;
    this.height = height;

    this.centre =
      centre === undefined
        ? getRandomPoint(CANVAS_WIDTH, CANVAS_HEIGHT, this.width, this.height)
        : centre;
    this.velocity = velocity === undefined ? new Vector(0, 0, 0) : velocity;
    this.acceleration =
      acceleration == undefined ? new Vector(0, 0, 0) : acceleration;
  }
  getObjectsToMoveTowards(): QuadTree<RealObject> {
    switch (this.objectType) {
      case "rock":
        return this.stage.scissors;
      case "paper":
        return this.stage.rocks;
      case "scissor":
        return this.stage.papers;
    }
  }
  getSprite(): Image {
    switch (this.objectType) {
      case "rock":
        return this.stage.rockImage;
      case "paper":
        return this.stage.paperImage;
      case "scissor":
        return this.stage.scissorImage;
    }
  }
  getNearest(qt: QuadTree<RealObject>): Point<RealObject> | null {
    return qt.findClosest(
      this.width,
      this.height,
      this.centre.x,
      this.centre.y
    );
  }
  collidesWith(object: RealObject) {
    // check if the object is within the bounds of this object
    const thisMinX = this.centre.x - this.width / 2;
    const thisMaxX = this.centre.x + this.width / 2;
    const thisMinY = this.centre.y - this.height / 2;
    const thisMaxY = this.centre.y + this.height / 2;

    const objectMinX = object.centre.x - object.width / 2;
    const objectMaxX = object.centre.x + object.width / 2;
    const objectMinY = object.centre.y - object.height / 2;
    const objectMaxY = object.centre.y + object.height / 2;

    const thisLeftOfObject = thisMaxX < objectMinX;
    const thisRightOfObject = thisMinX > objectMaxX;
    const thisAboveObject = thisMaxY < objectMinY;
    const thisBelowObject = thisMinY > objectMaxY;

    return !(
      thisLeftOfObject ||
      thisRightOfObject ||
      thisAboveObject ||
      thisBelowObject
    );
  }
  applyForce(force: Vector) {
    this.acceleration.add(force);
  }
  updateVelocity(deltaTime: number) {
    this.velocity
      .add(this.acceleration.copy().mult(deltaTime))
      .limit(MAX_VELOCITY);
  }
  updatePosition(deltaTime: number) {
    this.centre.add(this.velocity.copy().mult(deltaTime));
  }
  keepInBounds() {
    if (this.centre.x - this.width / 2 < 0) {
      this.centre.x = 0 + this.width / 2;
      this.velocity.x = -this.velocity.x * RESTITUTION;
    }
    if (this.centre.x + this.width / 2 > CANVAS_WIDTH) {
      this.centre.x = CANVAS_WIDTH - this.width / 2;
      this.velocity.x = -this.velocity.x * RESTITUTION;
    }
    if (this.centre.y - this.height / 2 < 0) {
      this.centre.y = 0 + this.height / 2;
      this.velocity.y = -this.velocity.y * RESTITUTION;
    }
    if (this.centre.y + this.height / 2 > CANVAS_HEIGHT) {
      this.centre.y = CANVAS_HEIGHT - this.height / 2;
      this.velocity.y = -this.velocity.y * RESTITUTION;
    }
  }
  seek(target: Vector) {
    let desired = Vector.sub(target, this.centre); // A vector pointing from the location to the target
    // Normalize desired and scale to maximum speed
    desired.normalize();
    desired.mult(MAX_VELOCITY);
    // Steering = Desired minus Velocity
    let steer = Vector.sub(desired, this.velocity);
    steer.limit(MAX_FORCE); // Limit to maximum steering force
    return steer;
  }

  applyForces() {
    this.acceleration.mult(0);
    let nearestPoint = this.getNearest(this.getObjectsToMoveTowards());
    if (nearestPoint === null) {
      return;
    }
    while (this.collidesWith(nearestPoint.data)) {
      console.log(
        `${nearestPoint.data.objectType} collided with ${this.objectType}`
      );
      this.stage.replacePoint(nearestPoint, this.objectType);
      nearestPoint = this.getNearest(this.getObjectsToMoveTowards());
      if (nearestPoint === null) {
        return;
      }
    }
    this.acceleration.add(this.seek(nearestPoint.data.centre));
  }

  update(deltaTime: number) {
    // this.updateAcceleration();
    this.applyForces();
    this.updateVelocity(deltaTime);
    this.updatePosition(deltaTime);
    this.keepInBounds();
  }
  drawVelocity(p5: P5) {
    p5.push();
    p5.stroke(255, 0, 255);
    p5.strokeWeight(1);
    p5.translate(this.centre.x, this.centre.y);
    p5.rotate(this.velocity.heading());
    const velLength = p5.map(
      this.velocity.mag(),
      0,
      MAX_VELOCITY,
      0,
      MAX_VECTOR_LENGTH
    );
    p5.line(0, 0, velLength, 0);
    p5.pop();
  }
  drawAcceleration(p5: P5) {
    p5.push();
    p5.stroke(255, 255, 0);
    p5.strokeWeight(3);
    p5.translate(this.centre.x, this.centre.y);
    p5.rotate(this.acceleration.heading());
    const accLength = p5.map(
      this.acceleration.mag(),
      0,
      MAX_FORCE,
      0,
      MAX_VECTOR_LENGTH
    );
    p5.line(0, 0, accLength, 0);
    p5.pop();
  }
  draw(p5: P5) {
    const sprite = this.getSprite();
    // Draw sprite in the direction of velocity
    let theta = this.velocity.heading() + p5.radians(90);
    p5.push();
    p5.translate(this.centre.x, this.centre.y);
    p5.rotate(theta);
    p5.image(
      sprite,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    p5.pop();

    // this.drawVelocity(p5);
    // this.drawAcceleration(p5);
  }
}

export class Rock extends AbstractObject {
  constructor(
    stage: Stage,
    centre?: Vector,
    velocity?: Vector,
    acceleration?: Vector
  ) {
    const p5 = stage.p5;
    const col = p5.color(255, 0, 0);
    // const rockMesh = new Mesh(boxGeometry, rockMaterial);
    super(
      stage,
      "rock",
      col,
      OBJECT_WIDTH,
      OBJECT_HEIGHT,
      centre,
      velocity,
      acceleration
    );
  }
}

export class Paper extends AbstractObject {
  constructor(
    stage: Stage,
    centre?: Vector,
    velocity?: Vector,
    acceleration?: Vector
  ) {
    const p5 = stage.p5;
    const col = p5.color(0, 255, 0);
    // const paperMesh = new Mesh(boxGeometry, paperMaterial);
    super(
      stage,
      "paper",
      col,
      OBJECT_WIDTH,
      OBJECT_HEIGHT,
      centre,
      velocity,
      acceleration
    );
  }
}

export class Scissor extends AbstractObject {
  constructor(
    stage: Stage,
    centre?: Vector,
    velocity?: Vector,
    acceleration?: Vector
  ) {
    // const scissorMesh = new Mesh(boxGeometry, scissorMaterial);
    const p5 = stage.p5;
    const col = p5.color(0, 0, 255);
    super(
      stage,
      "scissor",
      col,
      OBJECT_WIDTH,
      OBJECT_HEIGHT,
      centre,
      velocity,
      acceleration
    );
  }
}

function getRandomPoint(
  maxWidth: number,
  maxHeight: number,
  objectWidth: number,
  objectHeight: number
) {
  const x = Math.floor(Math.random() * (maxWidth - objectWidth));
  const y = Math.floor(Math.random() * (maxHeight - objectHeight));
  const centerX = x + objectWidth / 2;
  const centerY = y + objectHeight / 2;
  return new Vector(centerX, centerY);
}
