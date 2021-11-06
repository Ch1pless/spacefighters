// import { EventDispatcher } from "./EventDispatcher.js";
import { UUID } from "../math/UUID.js";
import { Matrix4, Matrix3, Quaternion, Vector3, Euler } from "@math.gl/core";


let _base3DId = 0;

export class Base3D {

  constructor() {
    // super();

    this.id = _base3DId++;
    this.name = "";
    this.uuid = UUID.generate(); // see if we'll need it

    this.position = new Vector3(0, 0, 0);
    this.rotation =  new Matrix4().identity();
    this.scale = new Vector3(1, 1, 1);

    this.up = new Vector3(0, 1, 0);

    this.parent = null;
    this.children = [];
    
    this.visible = true;
    this.layers = [];
    // this.frustumCulled = true; may need it, everything in this case should be frustum culled
    
    this.matrix = new Matrix4();
    this.matrixWorld = new Matrix4();
    this.modelViewMatrix = new Matrix4();
    this.normalMatrix = new Matrix3();

    // this.matrixAutoUpdate = true; may need it, don't see so right now
    this.matrixWorldNeedsUpdate = false;

    this.castShadow = false;
    this.recieveShadow = false;

    // materials necessary for shadows when modifying vertex positions in the vertex shader
    this.customDepthMaterial = undefined; // directional light and spot light
    this.customDistanceMaterial = undefined; // point light

    this.data = {};
    this.animations = [];
  }

  onBeforeRender(/* override */) {}
  onAfterRender(/* override */) {}

  setParent(parent) {
    if (this.parent !== null)
      this.removeFromParent();
    this.parent = parent;
  }

  removeFromParent() {
    if (this.parent !== null) {
      const to_remove = this.parent.children.findIndex((element) => { return element === this; });
      this.parent.children.splice(to_remove, 1);
      this.parent = null;
    }
  }
  
  clearChildren() {
    // copied to avoid issues with removal from this.children
    const children = [...this.children];
    for (const child of children)
      child.removeFromParent();
  }

  applyMatrix(matrix4) {
    this.updateMatrix();

    this.matrix.multiplyLeft(matrix4);

    this.matrix.getTranslation(this.position);
    this.matrix.getRotation(this.rotation);
    this.matrix.getScale(this.scale);
  }

  // translates along the axis in local space
  translateOnAxis(axis, dist) {
    const trans = axis.copy().transform(this.rotation);
    this.position.add(trans.scale(dist));
  }

  lookAt(vect) {
    const target = new Vector3(vect[0], vect[1], vect[2]);
    const position = new Vector3(this.matrixWorld.getTranslation());
    
    const lookMatrix = new Matrix4().lookAt(target, position, this.up);

    const lookRotation = new Matrix4(lookMatrix.getRotation());
    
    if (lookRotation.validate())
      this.rotation = lookRotation;
    if (lookRotation.validate() && this.parent) {
      const parentRotation = this.parent.matrixWorld.getRotationMatrix();
      this.rotation.multiplyLeft(parentRotation.invert());
    }
  }

  updateMatrix() {
    const T = new Matrix4().translate(this.position);
    const R = this.rotation.clone();
    const S = new Matrix4().scale(this.scale);

    this.matrix = T.multiplyRight(R.multiplyRight(S));
    this.normalMatrix = this.matrix.clone().invert().transpose().getRotationMatrix3();
    this.matrixWorldNeedsUpdate = true;
  }

  updateMatrixWorld(required) {
    this.updateMatrix();

    if (this.matrixWorldNeedsUpdate || required) {
      if (this.parent === undefined)
        this.matrixWorld.copy(this.matrix);
      else
        this.matrixWorld = this.parent.matrixWorld.clone().rightMultiply(this.matrix);

      this.matrixWorldNeedsUpdate = false;
      
      required = true; // all children will need their matrices updated
    }

    for (const child of this.children)
      child.updateMatrixWorld(required);

  }

  clone(includeChildren) {
    return new this.constructor().copy(this, includeChildren);
  }

  copy(src, includeChildren=true) {
    this.name = src.name;

    this.position.copy(src.position);
    this.rotation.copy(src.rotation);
    this.quaternion.copy(src.quaternion);
    this.scale.copy(src.scale);

    this.up.copy(src.up);

    this.visible = src.visible;
    this.renderOrder = src.renderOrder;
    this.layers.mask = src.layers.mask;
    // this.frustumCulled = src.frustumCulled;

    this.matrix.copy(src.matrix);
    this.matrixWorld.copy(src.matrixWorld);

    // this.matrixAutoUpdate = src.matrixAutoUpdate;
    this.matrixWorldNeedsUpdate = src.matrixWorldNeedsUpdate;

    this.castShadow = src.castShadow;
    this.recieveShadow = src.recieveShadow;

    this.userData = JSON.parse(JSON.stringify(src.userData)); // avoid shallow copy

    if (includeChildren === true)
      for (const child of src.children)
        child.clone().setParent(this);
  }

  // TODO: Complete
  convertFromObject3D(object3D) {
    this.name = object3D.name;

    for (const child of object3D.children) {
      const newChild = new Base3D();
      newChild.setParent(this);
      newChild.convertFromObject3D(child);
    }

    
    this.position = new Vector3(object3D.position);
    this.rotation = new Matrix4().fromQuaternion(object3D.quaternion);
    this.scale = new Vector3(object3D.scale);

    this.up = new Vector3(object3D.up);

    this.matrix = new Matrix4(object3D.matrix);
    this.matrixWorld = new Matrix4(object3D.matrixWorld);
    
    this.normalMatrix = new Matrix3(object3D.normalMatrix);
    
    this.castShadow = object3D.castShadow;
    this.recieveShadow = object3D.recieveShadow;

    this.userData = JSON.parse(JSON.stringify(object3D.userData));
  }
  
}