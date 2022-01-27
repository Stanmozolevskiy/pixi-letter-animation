//@ts-ignore
import { Renderer } from "@pixi/core";
//@ts-ignore
import { ParticleContainer, ParticleRenderer } from "@pixi/particle-container";
//@ts-ignore
import { EventSystem } from "@pixi/events";
//@ts-ignore
import { Graphics } from "@pixi/graphics";
//@ts-ignore
delete Renderer.__plugins.interaction;

import * as PIXI from "pixi.js";
import {Utils,PerformanceChecker} from "./utils"


const PARTICLE_SIZE = 3; // image pixel size
const DEFAULT_REPULSION_CHANGE_DISTANCE = 100;

let repulsionChangeDistance: number = DEFAULT_REPULSION_CHANGE_DISTANCE;
//@ts-ignore
let mousePositionX: number = null;
//@ts-ignore
let mousePositionY: number = null;
let renderingWidth: number = window.innerWidth;
let renderingHeight: number = window.innerHeight;



Renderer.registerPlugin("particle", ParticleRenderer);

// ==================================================
// ImageParticle Class
// ==================================================
class ImageParticle {
  private position: PIXI.Point;
  private originPosition: PIXI.Point;
  private velocity: PIXI.Point;
  private repulsion: number;
  private mouseRepulsion: number;
  private gravity: number;
  private maxGravity: number;
  private scale: number;
  private color: number[];
  private sprite: PIXI.Sprite;

  constructor(
    originPosition: PIXI.Point,
    originScale: number,
    originColor: number[]
  ) {
    this.position = originPosition.clone();
    this.originPosition = originPosition.clone();
    this.velocity = new PIXI.Point(Utils.random(0, 19), Utils.random(0, 19));
    this.repulsion = Utils.random(1.0, 5.0);
    this.mouseRepulsion = 1.0;
    this.gravity = 0.01;
    this.maxGravity = Utils.random(0.01, 0.03);
    this.scale = originScale;
    this.color = originColor;
    //@ts-ignore
    this.sprite = null;
  }

  createSprite(texture: PIXI.Texture) {
    this.sprite = PIXI.Sprite.from(texture);
    this.sprite.tint =
      (this.color[0] << 16) + (this.color[1] << 8) + this.color[2];
    this.sprite.scale.set(this.scale, this.scale);

    return this.sprite;
  }

  updateState() {
    // Calc position
    this.updateStateByMouse();
    this.updateStateByOrigin();

    if (this.velocity.x > 1.5 || this.velocity.y > 1) {
      this.velocity.set(this.velocity.x * 0.95, this.velocity.y * 0.95);
    }

    this.position.set(
      this.position.x + this.velocity.x,
      this.position.y + this.velocity.y
    );

    // Update sprite state
    this.sprite.position.set(this.position.x, this.position.y);
  }

  private updateStateByMouse() {
    const distanceX = mousePositionX - this.position.x;
    const distanceY = mousePositionY - this.position.y;
    const distance = Utils.approxDistance(distanceX, distanceY);
    const pointCos = distanceX / distance;
    const pointSin = distanceY / distance;

    if (distance < repulsionChangeDistance) {
      const invertRepulsionSub = 1 - this.mouseRepulsion;
      this.gravity *= 0.6;
      this.mouseRepulsion = Math.max(0, this.mouseRepulsion * 0.5 - 0.01);
      this.velocity.x =
        (this.velocity.x - pointCos * this.repulsion) * invertRepulsionSub;
      this.velocity.y =
        (this.velocity.y - pointSin * this.repulsion) * invertRepulsionSub;
    } else {
      this.gravity += (this.maxGravity - this.gravity) * 0.1;
      this.mouseRepulsion = Math.min(1, this.mouseRepulsion + 0.03);
    }
  }

  private updateStateByOrigin() {
    const distanceX = this.originPosition.x - this.position.x;
    const distanceY = this.originPosition.y - this.position.y;

    this.velocity.x += distanceX * this.gravity;
    this.velocity.y += distanceY * this.gravity;
  }
}

// ==================================================
// ImageParticleSystem
// ==================================================
export class ImageParticleSystem {
  private app: PIXI.Application;
  private imageParticles: ImageParticle[];
  private particleContainer!: ParticleContainer;
  private imageTexture!: PIXI.Texture;
  private imageTexturePixels!: Uint8ClampedArray;
  private performanceChecker: PerformanceChecker;
  private XoffsetIndex!: number;
  private YoffsetIndex!: number;
  private PADDING!: number;

  constructor() {
    this.performanceChecker = new PerformanceChecker();
    this.imageParticles = [];
    const canvas = document.getElementById("viewport") as HTMLCanvasElement;

    this.app = new PIXI.Application({
      view: canvas,
      backgroundColor: 0x16203A,
      width: renderingWidth,
      height: renderingHeight,
      antialias: true
    });
  }

  public destroy(){
    this.app.destroy(true);
  }

  public setup( XoffsetIndex: number, YoffsetIndex:number, Padding: number) {
    this.XoffsetIndex = XoffsetIndex;
    this.YoffsetIndex = YoffsetIndex;
    this.PADDING = Padding;
    // Assuming renderer is at "app.renderer"
    if (!("events" in this.app.renderer)) {
      //@ts-ignore
      this.app.renderer.addSystem(EventSystem, "events");
    }

    // Setup view
    this.createParticleContainer();
    
    const sp = this.app.stage.addChild(this.particleContainer);
    document.body.appendChild(this.app.renderer.view);
   
    
    this.app.stage.interactive = true;
    this.app.stage.hitArea = this.app.renderer.screen;

    // Setup mouse event
    this.app.stage.addEventListener("mousemove", this.onMouseMove.bind(this));
   
    // Setup tick event
    this.app.ticker.add(() => {
      repulsionChangeDistance = Math.max(0, repulsionChangeDistance - 0.5);
     
      this.performanceChecker.startProcess();
      for (const imageParticle of this.imageParticles) {
        imageParticle.updateState();
      }
      this.performanceChecker.endProcess();
    });
  }

  public changeImage(imageUrl: string) {
    this.imageTexture = PIXI.Texture.from(imageUrl);
    const img = new Image();
    const canvas = document.createElement("canvas") as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    //const mainCanvas = document.getElementById("viewport") as HTMLCanvasElement;

    const startRendering = () => {
      canvas.width = img.width; 
      canvas.height = img.height;
      
      context?.drawImage(img,0, 0);

      //@ts-ignore
      this.imageTexturePixels = context?.getImageData(0,0,img.width,img.height).data;
      this.createParticles();
      this.addParticleSpritesToContainer();
    };

    img.onload = (e) => {
      startRendering();
      if (this.imageParticles.length < (this.imageTexture.width * this.imageTexture.height) / 100) 
        this.changeImage(imageUrl);

      this.app.renderer.resize(renderingWidth, renderingHeight);
    };
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
  }

  private onMouseMove(event: any) {
    const newPosition = event.data.global;
    repulsionChangeDistance = DEFAULT_REPULSION_CHANGE_DISTANCE;
    mousePositionX = newPosition.x;
    mousePositionY = newPosition.y;
  }

  private getPixelColorFromImage(x: number, y: number): any {
    const pixels = this.imageTexturePixels;
    const idx = (y * this.imageTexture.width + x) * 4;

    if (x > this.imageTexture.width || x < 0 || y > this.imageTexture.height || y < 0)
     {
      return [0, 0, 0, 0];
      }
      return [pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]];
    }

  private createParticleContainer() {
    const fractionSizeX = renderingWidth / PARTICLE_SIZE;
    const fractionSizeY = renderingHeight / PARTICLE_SIZE;
    this.particleContainer = new ParticleContainer(fractionSizeX * fractionSizeY,
      {
        vertices: false,
        position: true,
        rotation: false,
        uvs: false,
        tint: false,
      }
    );
  }

  private createParticles() {
    const imageWidth = this.imageTexture.width ;
    const imageHeight = this.imageTexture.height;
      
    const imageScale = Math.min((renderingWidth - this.PADDING * 2) / imageWidth,(renderingHeight - this.PADDING * 2) / imageHeight);

    const fractionSizeX = imageWidth / PARTICLE_SIZE;
    const fractionSizeY = imageHeight / PARTICLE_SIZE;
    //HERER WE SET OFFSET 

    // console.log(`Xoffset: ${((renderingWidth -Math.min(renderingWidth, renderingHeight)/2)/2)* this.XoffsetIndex}` );
    // console.log(`Yffset: ${((renderingHeight - Math.min(renderingWidth, renderingHeight))/2)/2 * this.YoffsetIndex}` );

    const offsetX = ((renderingWidth - Math.min(renderingWidth, renderingHeight)/2)/2)* this.XoffsetIndex ;
    const offsetY = ((renderingHeight - Math.min(renderingWidth, renderingHeight)/2)/2)* this.YoffsetIndex;

    for (let i = 0; i < fractionSizeX; i++) {
      for (let j = 0; j < fractionSizeY; j++) {
        const imagePosition = new PIXI.Point( Math.floor(i * PARTICLE_SIZE),Math.floor(j * PARTICLE_SIZE));
        const originPosition = imagePosition;
        const originScale = imageScale;
        const originColor = this.getPixelColorFromImage(imagePosition.x, imagePosition.y);
        // Skip transparent pixel
        if (originColor[3] === 0) {
          continue;
        }

        imagePosition.x *= imageScale;
        imagePosition.y *= imageScale;
        imagePosition.x += offsetX + this.PADDING;
        imagePosition.y += offsetY + this.PADDING;

        const particle = new ImageParticle(originPosition,originScale,originColor);
        this.imageParticles.push(particle);
      }
    }
    // console.log("Particle amount: ", this.imageParticles.length);
  }

  private addParticleSpritesToContainer() {
    
    const particleGraphics = new Graphics();
    particleGraphics.beginFill(0xffffff);
    particleGraphics.drawRect(0, 0, PARTICLE_SIZE, PARTICLE_SIZE);
    particleGraphics.endFill();

    const particleTexture = this.app.renderer.generateTexture(particleGraphics,{ scaleMode: PIXI.SCALE_MODES.LINEAR });

    const particleSprites = this.imageParticles.map(function (imageParticle) {
      return imageParticle.createSprite(particleTexture);
    });

    this.particleContainer.addChild(...particleSprites);
  }
}
