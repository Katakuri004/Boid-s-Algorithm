import * as THREE from 'three';

export interface BoidParams {
  maxSpeed: number;
  maxForce: number;
  perceptionRadius: number;
  separationWeight: number;
  alignmentWeight: number;
  cohesionWeight: number;
}

const randomVector3 = (range: number) =>
  new THREE.Vector3(
    (Math.random() * 2 - 1) * range,
    (Math.random() * 2 - 1) * range,
    (Math.random() * 2 - 1) * range
  );

class Boid {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  maxSpeed: number;
  maxForce: number;
  perceptionRadius: number;
  worldSize: number;

  constructor(id: number, worldSize: number, params: BoidParams) {
    this.id = id;
    this.position = randomVector3(worldSize / 2);
    this.velocity = randomVector3(1);
    this.acceleration = new THREE.Vector3();
    this.maxSpeed = params.maxSpeed;
    this.maxForce = params.maxForce;
    this.perceptionRadius = params.perceptionRadius;
    this.worldSize = worldSize;
  }

  separation(boids: Boid[], params: BoidParams) {
    const steer = new THREE.Vector3();
    let total = 0;
    const perceptionRadiusSq = this.perceptionRadius * this.perceptionRadius;
    for (let other of boids) {
      if (other.id === this.id) continue;
      const distSq = this.position.distanceToSquared(other.position);
      if (distSq < perceptionRadiusSq && distSq > 0) {
        const diff = new THREE.Vector3().subVectors(this.position, other.position);
        steer.add(diff.divideScalar(distSq));
        total++;
      }
    }
    if (total > 0) {
      steer.divideScalar(total);
      steer.setLength(this.maxSpeed);
      steer.sub(this.velocity);
      steer.clampLength(0, this.maxForce);
    }
    return steer;
  }

  alignment(boids: Boid[], params: BoidParams) {
    const steer = new THREE.Vector3();
    let total = 0;
    const perceptionRadiusSq = this.perceptionRadius * this.perceptionRadius;
    for (let other of boids) {
      if (other.id === this.id) continue;
      const distSq = this.position.distanceToSquared(other.position);
      if (distSq < perceptionRadiusSq) {
        steer.add(other.velocity);
        total++;
      }
    }
    if (total > 0) {
      steer.divideScalar(total);
      steer.setLength(this.maxSpeed);
      steer.sub(this.velocity);
      steer.clampLength(0, this.maxForce);
    }
    return steer;
  }

  cohesion(boids: Boid[], params: BoidParams) {
    const centerOfMass = new THREE.Vector3();
    let total = 0;
    const perceptionRadiusSq = this.perceptionRadius * this.perceptionRadius;
    for (let other of boids) {
      if (other.id === this.id) continue;
      const distSq = this.position.distanceToSquared(other.position);
      if (distSq < perceptionRadiusSq) {
        centerOfMass.add(other.position);
        total++;
      }
    }
    if (total > 0) {
      centerOfMass.divideScalar(total);
      const steer = new THREE.Vector3().subVectors(centerOfMass, this.position);
      steer.setLength(this.maxSpeed);
      steer.sub(this.velocity);
      steer.clampLength(0, this.maxForce);
      return steer;
    }
    return new THREE.Vector3();
  }

  flock(allBoids: Boid[], params: BoidParams, spatialGrid: any) {
    this.acceleration.set(0, 0, 0);
    const neighbors = spatialGrid.getNeighbors(this.position, this.perceptionRadius);
    const separation = this.separation(neighbors, params);
    const alignment = this.alignment(neighbors, params);
    const cohesion = this.cohesion(neighbors, params);
    this.acceleration.add(separation.multiplyScalar(params.separationWeight));
    this.acceleration.add(alignment.multiplyScalar(params.alignmentWeight));
    this.acceleration.add(cohesion.multiplyScalar(params.cohesionWeight));
  }

  update(deltaTime: number) {
    this.velocity.add(this.acceleration);
    this.velocity.clampLength(0, this.maxSpeed);
    this.position.add(new THREE.Vector3().copy(this.velocity).multiplyScalar(deltaTime));
    this.acceleration.set(0, 0, 0);
  }
}

export default Boid;
