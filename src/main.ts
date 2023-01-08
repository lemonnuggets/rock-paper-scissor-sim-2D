import P5 from "p5";
import { BG_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH } from "./params";
import { Stage } from "./Stage";

// const myCircles: MyCircle[] = [];
let canvas: P5.Renderer;
let stage: Stage;
let rockImage: P5.Image;
let paperImage: P5.Image;
let scissorImage: P5.Image;
function preload(p5: P5) {
  rockImage = p5.loadImage("assets/rock.png");
  paperImage = p5.loadImage("assets/paper.png");
  scissorImage = p5.loadImage("assets/scissor.png");
}
function setup(p5: P5) {
  console.clear();
  canvas = p5.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent("app");
  p5.background(BG_COLOR);

  stage = new Stage(p5, rockImage, paperImage, scissorImage);
}

function draw(p5: P5) {
  p5.background(BG_COLOR);

  // draw borders for the canvas
  p5.push();
  p5.stroke("black");
  p5.strokeWeight(2);
  p5.noFill();
  p5.rect(0, 0, p5.width, p5.height);
  p5.pop();

  stage.update();
}

const sketch = (p5: P5) => {
  p5.preload = () => preload(p5);
  p5.setup = () => setup(p5);
  p5.draw = () => draw(p5);
  // };
  // setInterval(() => {
  //   draw(p5);
  // }, 500);
};

new P5(sketch);
