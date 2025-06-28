import * as THREE from 'three';

// --- 1. INTERFACES MATCHING THE REACT COMPONENT ---
// This interface defines the parameters for a single species, including interaction weights.
export interface SpeciesParams {
  id: number;
  name: string;
  color: string;
  quantity: number;
  maxSpeed: number;
  maxForce: number;
  perceptionRadius: number;
  separationRadius: number;
  cohesionWeights: number[];
  separationWeights: number[];
  alignmentWeights: number[];
}

// A simple interface for the parameters needed by the constructor.
export interface BoidConstructorParams {
    maxSpeed: number;
    maxForce: number;
    perceptionRadius: number;
}


const randomVector3 = (range: number) =>
  new THREE.Vector3(
    (Math.random() * 2 - 1) * range,
    (Math.random() * 2 - 1) * range,
    (Math.random() * 2 - 1) * range
  );

class Boid {
  id: number;
  speciesId: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;

  // These properties are set from the boid's own species parameters
  maxSpeed: number;
  maxForce: number;
  perceptionRadius: number;
  
  worldSize: number;

  constructor(id: number, speciesId: number, params: BoidConstructorParams, worldSize: number = 1) {
    this.id = id;
    this.speciesId = speciesId;
    this.worldSize = worldSize;

    // Initialize with random position and velocity
    this.position = randomVector3(this.worldSize / 2);
    this.velocity = randomVector3(1);
    this.acceleration = new THREE.Vector3();

    // Set physical properties from species data
    this.maxSpeed = params.maxSpeed;
    this.maxForce = params.maxForce;
    this.perceptionRadius = params.perceptionRadius;
  }

  // --- 2. CONSOLIDATED AND REWRITTEN FLOCK METHOD ---
  // This single method calculates all forces in one loop over the neighbors.
  // It replaces the separate separation, alignment, and cohesion methods.
  flock(neighbors: Boid[], speciesList: SpeciesParams[]): { x: number, y: number } {
    this.acceleration.set(0, 0, 0);

    const myParams = speciesList[this.speciesId];
    if (!myParams) return { x: 0, y: 0 };

    // Steering vectors for each rule
    const separationSteer = new THREE.Vector3();
    const alignmentSteer = new THREE.Vector3();
    const cohesionSteer = new THREE.Vector3();

    let separationCount = 0;
    let alignmentCount = 0;
    let cohesionCount = 0;

    for (const other of neighbors) {
        if (other.id === this.id) continue;

        const distSq = this.position.distanceToSquared(other.position);
        
        // --- 3. MATRIX-BASED WEIGHT LOOKUP ---
        const wSep = myParams.separationWeights[other.speciesId];
        const wAli = myParams.alignmentWeights[other.speciesId];
        const wCoh = myParams.cohesionWeights[other.speciesId];

        // Separation
        if (distSq < myParams.separationRadius * myParams.separationRadius && wSep > 0) {
            const diff = new THREE.Vector3().subVectors(this.position, other.position);
            if (distSq > 0) diff.divideScalar(distSq); 
            separationSteer.add(diff);
            separationCount++;
        }

        // Alignment & Cohesion (use the general perception radius)
        if (distSq < myParams.perceptionRadius * myParams.perceptionRadius) {
            if (wAli > 0) {
                alignmentSteer.add(other.velocity);
                alignmentCount++;
            }
            if (wCoh > 0) {
                cohesionSteer.add(other.position);
                cohesionCount++;
            }
        }
    }

    // --- 4. CALCULATE AND APPLY FORCES ---
    // Each force is calculated independently and then added to the acceleration,
    // scaled by its corresponding weight from the interaction matrix.

    if (separationCount > 0) {
        separationSteer.divideScalar(separationCount);
        if (separationSteer.lengthSq() > 0) {
            separationSteer.setLength(this.maxSpeed);
            separationSteer.sub(this.velocity);
            separationSteer.clampLength(0, this.maxForce);
            this.acceleration.add(separationSteer.multiplyScalar(myParams.separationWeights[this.speciesId]));
        }
    }

    if (alignmentCount > 0) {
        alignmentSteer.divideScalar(alignmentCount);
        if(alignmentSteer.lengthSq() > 0) {
            alignmentSteer.setLength(this.maxSpeed);
            alignmentSteer.sub(this.velocity);
            alignmentSteer.clampLength(0, this.maxForce);
            this.acceleration.add(alignmentSteer.multiplyScalar(myParams.alignmentWeights[this.speciesId]));
        }
    }
    
    if (cohesionCount > 0) {
        cohesionSteer.divideScalar(cohesionCount);
        const desired = new THREE.Vector3().subVectors(cohesionSteer, this.position);
        if (desired.lengthSq() > 0) {
            desired.setLength(this.maxSpeed);
            desired.sub(this.velocity);
            desired.clampLength(0, this.maxForce);
            this.acceleration.add(desired.multiplyScalar(myParams.cohesionWeights[this.speciesId]));
        }
    }

    // Return the 2D acceleration vector for use in the React simulation
    return { x: this.acceleration.x, y: this.acceleration.y };
  }

  // The update method remains the same, applying the calculated acceleration.
  update(deltaTime: number) {
    this.velocity.add(this.acceleration);
    this.velocity.clampLength(0, this.maxSpeed);
    this.position.add(new THREE.Vector3().copy(this.velocity).multiplyScalar(deltaTime));
    
    // Reset acceleration for the next frame
    this.acceleration.set(0, 0, 0);
  }

  // Optional: Add a boundary wrapping function for 3D worlds
  wrap(worldSize: number) {
      const halfSize = worldSize / 2;
      if (this.position.x > halfSize) this.position.x = -halfSize;
      if (this.position.x < -halfSize) this.position.x = halfSize;
      if (this.position.y > halfSize) this.position.y = -halfSize;
      if (this.position.y < -halfSize) this.position.y = halfSize;
      if (this.position.z > halfSize) this.position.z = -halfSize;
      if (this.position.z < -halfSize) this.position.z = halfSize;
  }
}

export default Boid;