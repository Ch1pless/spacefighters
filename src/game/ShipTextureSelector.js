import { ImageLoader } from "three";

export class ShipTextureSelector {
  constructor() {
    this.colors = ["blue", "green", "yellow", "red", "cyan", "orange", "purple"];
    this.currentLocation = 0;
    this.colorChanged = false;
    this.leftButton = document.querySelector("#color-left");
    this.rightButton = document.querySelector("#color-right");
    this.colorDisplay = document.querySelector("#color-box");

    this.colorDisplay.style.backgroundColor = this.colors[this.currentLocation];
  }

  async init() {
    if (this.textures) return;
    this.textures = await Promise.all([
      new ImageLoader().loadAsync(require("../assets/StarSparrow_OBJ/Textures/StarSparrow_Blue.png")),
      new ImageLoader().loadAsync(require("../assets/StarSparrow_OBJ/Textures/StarSparrow_Green.png")),
      new ImageLoader().loadAsync(require("../assets/StarSparrow_OBJ/Textures/StarSparrow_Yellow.png")),
      new ImageLoader().loadAsync(require("../assets/StarSparrow_OBJ/Textures/StarSparrow_Red.png")),
      new ImageLoader().loadAsync(require("../assets/StarSparrow_OBJ/Textures/StarSparrow_Cyan.png")),
      new ImageLoader().loadAsync(require("../assets/StarSparrow_OBJ/Textures/StarSparrow_Orange.png")),
      new ImageLoader().loadAsync(require("../assets/StarSparrow_OBJ/Textures/StarSparrow_Purple.png"))
    ]);

    this.leftButton.addEventListener("click", this.shiftLeft.bind(this));
    this.rightButton.addEventListener("click", this.shiftRight.bind(this));
  }

  getColorChanged() {
    if (this.colorChanged) {
      this.colorChanged = false;
      return true;
    }
    return false;
  }

  shiftLeft() {
    console.log("shifted");
    this.currentLocation = (this.currentLocation - 1 + this.colors.length) % this.colors.length;
    this.colorDisplay.style.backgroundColor = this.colors[this.currentLocation];
    this.colorChanged = true;
  }

  shiftRight() {
    console.log("shifted");
    this.currentLocation = (this.currentLocation + 1) % this.colors.length;
    this.colorDisplay.style.backgroundColor = this.colors[this.currentLocation];
    this.colorChanged = true;
  }

  currentColor() {
    return this.colors[this.currentLocation];
  }

  currentTexture() {
    return this.textures[this.currentLocation];
  }
}