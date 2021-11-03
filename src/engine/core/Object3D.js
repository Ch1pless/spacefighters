
import { EventDispatcher } from "./EventDispatcher.js";
import { UUID } from "../math/UUID.js";
import { Matrix4, Matrix3, Quaternion, Vector3, Euler } from "@math.gl/core";


let _object3DId = 0;

export class Object3D extends EventDispatcher {

  constructor() {
    super();

    this.id = _object3DId++;
    this.name = "";
    this.uuid = UUID.generate(); // see if we'll need it

    this.position = new Vector3();
    this.rotation =  new Euler();
    this.quaternion = new Quaternion();
    this.scale = new Vector3(1, 1, 1);

    this.up = new Vector3(0, 1, 0);

    this.parent = null;
    this.children = [];
    
    this.visible = true;
    this.renderOrder = 0;
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
      this.removeParent();
    this.parent = parent;
  }

  removeParent() {
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
      child.removeParent();
  }

  applyMatrix(matrix4) {
    this.updateMatrix();

    this.matrix.multiplyLeft(matrix4);

    this.position = this.matrix.getTranslation();
    this.rotation = this.matrix.getRotation();
    this.scale = this.matrix.getScale();
  }

  setRotationFromAxisAngle(axis, rad) {
    this.quaternion.setFromAxisAngle(axis, rad);
  }

  setRotationFromQuaternion(quat) {
    this.quaternion.copy(quat);
  }

  rotateOnAxis(axis, rad) {
    const quat = new Quaternion().setFromAxisAngle(axis, rad);
    this.quaternion = Quaternion.multiplyRight(quat);
  }

  translateOnAxis(axis, dist) {
    const trans = axis.copy().transformByQuaternion(this.quaternion);
    this.position.add(trans.multiplyScalar(dist));
  }

  lookAt(vect) {
    const target = vect.clone();
    const position = this.matrixWorld.getTranslation();

    const lookMatrix = new Matrix4().lookAt(target, position, this.up);

    this.quaternion.fromMatrix3(lookMatrix.getRotationMatrix3());

    if (this.parent) {
      const parentRotation = this.parent.matrixWorld.getRotationMatrix3();
      const quat = new Quaternion().fromMatrix3(parentRotation.getRotationMatrix3());
      this.quaternion.multiplyLeft(quat.invert());
    }
  }

  localToWorld(vect) {
    return vect.transform(this.matrixWorld);
  }

  worldToLocal(vect) {
    return vect.transform(this.matrixWorld.clone().invert());
  }

  updateMatrix() {
    const T = new Matrix4().translate(this.position);
    const R = this.rotation.getRotationMatrix(new Matrix4())
    const S = new Matrix4().scale(this.scale);

    this.matrix = T.multiplyRight(R.multiplyRight(S));
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

  
  
}