import p5, { Image } from "p5";
import { Box, Point, QuadTree } from "./CustomQuadTree";
import { AbstractObject, Paper, RealObject, Rock, Scissor } from "./objects";
import { NUM_OBJECTS, TIME_FACTOR } from "./params";

export class Stage {
  rocks: QuadTree<Rock>;
  papers: QuadTree<Paper>;
  scissors: QuadTree<Scissor>;
  rockImage: Image;
  paperImage: Image;
  scissorImage: Image;
  p5: p5;
  constructor(
    p5: p5,
    rockImage: Image,
    paperImage: Image,
    scissorImage: Image
  ) {
    const bounds = new Box({
      x: 0,
      y: 0,
      width: p5.width,
      height: p5.height,
    });
    this.rocks = new QuadTree<Rock>(bounds);
    this.papers = new QuadTree<Paper>(bounds);
    this.scissors = new QuadTree<Scissor>(bounds);
    this.rockImage = rockImage;
    this.paperImage = paperImage;
    this.scissorImage = scissorImage;
    this.p5 = p5;
    this.init();
  }
  init() {
    for (let i = 0; i < NUM_OBJECTS; i++) {
      this.addObject(new Rock(this));

      this.addObject(new Paper(this));

      this.addObject(new Scissor(this));
    }
  }
  getDeltaTime() {
    return this.p5.deltaTime * TIME_FACTOR;
  }
  addObject(object: RealObject) {
    let point = new Point(object.centre.x, object.centre.y, object);
    if (object instanceof Rock) {
      this.rocks.insert(point);
    } else if (object instanceof Paper) {
      this.papers.insert(point);
    } else if (object instanceof Scissor) {
      this.scissors.insert(point);
    }
  }
  removePoint(point: Point<RealObject>) {
    if (point.data instanceof Rock) {
      this.rocks.remove(point);
    } else if (point.data instanceof Paper) {
      this.papers.remove(point);
    } else if (point.data instanceof Scissor) {
      this.scissors.remove(point);
    }
  }
  replacePoint(
    point: Point<RealObject>,
    replacementType: "rock" | "paper" | "scissor"
  ) {
    const object = point.data;
    let replacementObject: AbstractObject;
    switch (replacementType) {
      case "rock":
        replacementObject = new Rock(this);
        break;
      case "paper":
        replacementObject = new Paper(this);
        break;
      case "scissor":
        replacementObject = new Scissor(this);
        break;
    }
    replacementObject.centre = object.centre.copy();
    replacementObject.velocity = object.velocity.copy();
    replacementObject.acceleration = object.acceleration.copy();
    this.removePoint(point);
    this.addObject(replacementObject);
  }
  updateQuadTree(qt: QuadTree<RealObject>) {
    const brokenPoints = qt.refresh();
    if (brokenPoints.length > 0) {
      console.log("broken points", brokenPoints);
    }
  }
  update() {
    const deltaTime = this.getDeltaTime();

    for (const point of [
      ...this.rocks.getAllPoints(),
      ...this.papers.getAllPoints(),
      ...this.scissors.getAllPoints(),
    ]) {
      point.data.update(deltaTime);
      point.data.draw(this.p5);
    }

    this.updateQuadTree(this.rocks);
    this.updateQuadTree(this.papers);
    this.updateQuadTree(this.scissors);

    this.rocks.render(this.p5, this.p5.color(255, 0, 0));
    this.papers.render(this.p5, this.p5.color(0, 255, 0));
    this.scissors.render(this.p5, this.p5.color(0, 0, 255));
  }
}
