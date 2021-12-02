//<script src="../../../node_modules/three/build/three.min.js"></script>
// <script src="ammo.js"></script>

import * as THREE from "three";
import * as Ammo from "./ammo";


let tmpTrans = null, tmpPos = new THREE.Vector3(), tmpQuat = new THREE.Quaternion();
let ammoTmpPos = null, ammoTmpQuat = null;
let cbContactResult;

export function setupContactResultCallback(){

    cbContactResult = new Ammo.ConcreteContactResultCallback();

    cbContactResult.addSingleResult = function(cp, colObj0Wrap, partId0, index0, colObj1Wrap, partId1, index1){
        
        let contactPoint = Ammo.wrapPointer( cp, Ammo.btManifoldPoint );

        const distance = contactPoint.getDistance();

        if( distance > 0 ) return;

        let colWrapper0 = Ammo.wrapPointer( colObj0Wrap, Ammo.btCollisionObjectWrapper );
        let rb0 = Ammo.castObject( colWrapper0.getCollisionObject(), Ammo.btRigidBody );
        
        let colWrapper1 = Ammo.wrapPointer( colObj1Wrap, Ammo.btCollisionObjectWrapper );
        let rb1 = Ammo.castObject( colWrapper1.getCollisionObject(), Ammo.btRigidBody );

        let threeObject0 = rb0.threeObject;
        let threeObject1 = rb1.threeObject;

        let tag, localPos, worldPos

        if( threeObject0.userData.tag != "spaceship" ){

            tag = threeObject0.userData.tag;
            localPos = contactPoint.get_m_localPointA();
            worldPos = contactPoint.get_m_positionWorldOnA();

        }
        else{

            tag = threeObject1.userData.tag;
            localPos = contactPoint.get_m_localPointB();
            worldPos = contactPoint.get_m_positionWorldOnB();

        }
        
        let localPosDisplay = {x: localPos.x(), y: localPos.y(), z: localPos.z()};
        let worldPosDisplay = {x: worldPos.x(), y: worldPos.y(), z: worldPos.z()};

        console.log( { tag, localPosDisplay, worldPosDisplay } );
        
    }
}

export function checkContact(){
    physicsWorld.contactTest( ball.userData.physicsBody , cbContactResult);   
}

export function setupPhysicsWorld(){
    let collisionConfiguration  = new Ammo.btDefaultCollisionConfiguration();
    let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    let overlappingPairCache = new Ammo.btDbvtBroadphase();
    let solver = new Ammo.btSequentialImpulseConstraintSolver();
    let physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, 0, 0));
    return physicsWorld;
}

export function generateDynamicRigidBody(dynamic, physicsWorld, mesh){
    if (mesh.geometry.boundingBox === null){
        mesh.geometry.computeBoundingBox();
    }
    let pos = mesh.geometry.boundingBox.getCenter();
    let scale = mesh.geometry.boundingBox.getSize();
    let quat = mesh.getWorldQuaternion();
    let mass = 1;
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );
    let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
    colShape.setMargin( 0.05 );
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );
    physicsWorld.addRigidBody(body);        
    mesh.userData.physicsBody = body;
    dynamic.push(mesh);
}

export function generateStaticRigidBody(physicsWorld, mesh){
    if (mesh.geometry.boundingBox === null){
        mesh.geometry.computeBoundingBox();
    }
    let pos = mesh.geometry.boundingBox.getCenter();
    let scale = mesh.geometry.boundingBox.getSize();
    let quat = mesh.getWorldQuaternion();
    let mass = 0;
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );
    let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
    colShape.setMargin( 0.05 );
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );
    physicsWorld.addRigidBody(body);        
}

export const STATE = { DISABLE_DEACTIVATION : 4 }
export const FLAGS = { CF_KINEMATIC_OBJECT: 2 }

export function generateKinematicRigidBody(physicsWorld, mesh){
    if (mesh.geometry.boundingBox === null){
        mesh.geometry.computeBoundingBox();
    }
    let pos = mesh.geometry.boundingBox.getCenter();
    let scale = mesh.geometry.boundingBox.getSize();
    let quat = mesh.getWorldQuaternion();
    let mass = 0;
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
    transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
    let motionState = new Ammo.btDefaultMotionState( transform );
    let colShape = new Ammo.btBoxShape( new Ammo.btVector3( scale.x * 0.5, scale.y * 0.5, scale.z * 0.5 ) );
    colShape.setMargin( 0.05 );
    let localInertia = new Ammo.btVector3( 0, 0, 0 );
    colShape.calculateLocalInertia( mass, localInertia );
    let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, colShape, localInertia );
    let body = new Ammo.btRigidBody( rbInfo );
    body.setActivationState( STATE.DISABLE_DEACTIVATION );
    body.setCollisionFlags( FLAGS.CF_KINEMATIC_OBJECT );
    physicsWorld.addRigidBody(body);  
    mesh.userData.physicsBody = body;   
    mesh.userData.tag = "spaceship";   
}

export function moveKinematic(kObject){
    kObject.getWorldPosition(tmpPos);
    kObject.getWorldQuaternion(tmpQuat);

    let physicsBody = kObject.userData.physicsBody;

    let ms = physicsBody.getMotionState();
    if (ms) {
        ammoTmpPos.setValue(tmpPos.x, tmpPos.y, tmpPos.z);
        ammoTmpQuat.setValue( tmpQuat.x, tmpQuat.y, tmpQuat.z, tmpQuat.w);
        tmpTrans.setIdentity();
        tmpTrans.setOrigin( ammoTmpPos ); 
        tmpTrans.setRotation( ammoTmpQuat ); 
        ms.setWorldTransform(tmpTrans);
    }
}

// export function updatePhysics(tmpTrans, rigidBodies, deltaTime){

//     // Step world
//     physicsWorld.stepSimulation( deltaTime, 10 );

//     // Update rigid bodies
//     for ( let i = 0; i < rigidBodies.length; i++ ) {
//         let objThree = rigidBodies[ i ];
//         let objAmmo = objThree.userData.physicsBody;
//         let ms = objAmmo.getMotionState();
//         if ( ms ) {
//             ms.getWorldTransform( tmpTrans );
//             let p = tmpTrans.getOrigin();
//             let q = tmpTrans.getRotation();
//             objThree.position.set( p.x(), p.y(), p.z() );
//             objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
//         }
//     }

// }




