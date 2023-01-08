import p5, { Image } from "p5";
import { AbstractObject, Paper, Rock, Scissor } from "./objects";

export class Stage {
  rocks: Rock[];
  papers: Paper[];
  scissors: Scissor[];
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
    this.rocks = [];
    this.papers = [];
    this.scissors = [];
    this.rockImage = rockImage;
    this.paperImage = paperImage;
    this.scissorImage = scissorImage;
    this.p5 = p5;
    this.init();
  }
  init() {
    console.groupCollapsed("setup");
    const NUM_OBJECTS = 50;
    for (let i = 0; i < NUM_OBJECTS; i++) {
      console.group("adding objects", i);
      this.addObject(new Rock(this), false);
      console.log(
        "added rock",
        this.rocks.length,
        this.papers.length,
        this.scissors.length
      );

      this.addObject(new Paper(this), false);
      console.log(
        "added paper",
        this.rocks.length,
        this.papers.length,
        this.scissors.length
      );

      this.addObject(new Scissor(this), false);
      console.log(
        "added scissor",
        this.rocks.length,
        this.papers.length,
        this.scissors.length
      );
      console.groupEnd();
    }
    console.log(this.rocks);
    console.log(this.papers);
    console.log(this.scissors);
    console.groupEnd();
  }
  getDeltaTime() {
    // return this.p5.deltaTime;
    return 1;
  }
  addObject(object: AbstractObject, addToScene = true) {
    if (object instanceof Rock) {
      this.rocks.push(object);
    } else if (object instanceof Paper) {
      this.papers.push(object);
    } else if (object instanceof Scissor) {
      this.scissors.push(object);
    }
  }
  removeObject(object: AbstractObject) {
    if (object instanceof Rock) {
      this.rocks = this.rocks.filter((rock) => rock !== object);
    } else if (object instanceof Paper) {
      this.papers = this.papers.filter((paper) => paper !== object);
    } else if (object instanceof Scissor) {
      this.scissors = this.scissors.filter((scissor) => scissor !== object);
    }
  }
  replaceObject(
    object: AbstractObject,
    replacementType: "rock" | "paper" | "scissor"
  ) {
    let replacementObject: AbstractObject;
    switch (replacementType) {
      case "rock":
        replacementObject = new Rock(
          this,
          object.centre.copy(),
          object.velocity.copy(),
          object.acceleration.copy()
        );
        break;
      case "paper":
        replacementObject = new Paper(
          this,
          object.centre.copy(),
          object.velocity.copy(),
          object.acceleration.copy()
        );
        break;
      case "scissor":
        replacementObject = new Scissor(
          this,
          object.centre.copy(),
          object.velocity.copy(),
          object.acceleration.copy()
        );
        break;
    }
    replacementObject.centre = object.centre.copy();
    replacementObject.velocity = object.velocity.copy();
    replacementObject.acceleration = object.acceleration.copy();
    this.removeObject(object);
    this.addObject(replacementObject);
  }
  update() {
    const deltaTime = this.getDeltaTime();
    // const speedup = 1;
    for (const object of [...this.rocks, ...this.papers, ...this.scissors]) {
      // for (let i = 0; i < speedup; i++) {
      object.update(deltaTime);
      object.draw(this.p5);
      // }
    }
  }
}
