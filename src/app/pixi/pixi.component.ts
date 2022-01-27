import { Component, OnInit } from "@angular/core";

import { ImageParticleSystem } from "./image-particle-system";

@Component({
  selector: "pixi-image-particle",
  template: ` <canvas class="canvas" id="viewport"></canvas> `,
  styleUrls: ['./pixi.component.css'],
})
export class PixiComponent implements OnInit {
  imageParticleSystem!:ImageParticleSystem;
  IMAGE_URL:string =  "https://i.ibb.co/GpftHS8/m-1040-1040.png"||
                      "https://i.ibb.co/7n8XGkY/m-512-512.png"  ||
                      "https://i.ibb.co/9qbv8xk/m-340-340.png";
  
  constructor() {}
  ngOnInit(): void {}
     
  ngAfterContentInit(){
    this.imageParticleSystem = new ImageParticleSystem();
    this.imageParticleSystem.setup(this.setXOffset(), this.setYOffset(), this.setPadding());
    this.imageParticleSystem.changeImage(this.IMAGE_URL);
  }

  ngOnDestroy(){
    this.imageParticleSystem.destroy();
  }

  private setXOffset():number{
    if(window.innerWidth <= 992)
      return  0
    if(window.innerWidth >1180)
      return 0.6;
    
      return 0.3;
  }

  private setYOffset():number{
    if(window.innerWidth <= 500)
    return 0;
    
    if(window.innerWidth <= 800)
      return 1;
    
    if(window.innerWidth <= 900)
      return 0.1;
    
    if(window.innerWidth <= 992)
      return 0;

      return 0;
  }

  private setPadding():number{
    if(window.innerWidth <= 500)
    return 100;
    if(window.innerWidth <= 800)
    return 160;
    if(window.innerWidth <= 900)
    return 200;
    if(window.innerWidth <= 992)
      return  260;
    if(window.innerWidth > 1180)
      return 200;
    
      return 260;
  }
}
