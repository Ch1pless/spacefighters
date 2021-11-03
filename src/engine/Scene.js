export class Scene {
  constructor() {
    this.children = [];
    this.loaded = false;
  }

  load() {
    this.loaded = true;
  }

  isLoaded() {
    return this.loaded;
  }
}