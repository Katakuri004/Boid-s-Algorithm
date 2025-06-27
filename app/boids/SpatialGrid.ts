import * as THREE from 'three';
import Boid from './Boid';

class SpatialGrid {
  worldSize: number;
  cellSize: number;
  grid: Map<string, Boid[]>;

  constructor(worldSize: number, cellSize: number) {
    this.worldSize = worldSize;
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  _getCellKey(position: THREE.Vector3) {
    const x = Math.floor((position.x + this.worldSize / 2) / this.cellSize);
    const y = Math.floor((position.y + this.worldSize / 2) / this.cellSize);
    const z = Math.floor((position.z + this.worldSize / 2) / this.cellSize);
    return `${x}_${y}_${z}`;
  }

  update(boids: Boid[]) {
    this.grid.clear();
    for (const boid of boids) {
      const key = this._getCellKey(boid.position);
      if (!this.grid.has(key)) {
        this.grid.set(key, []);
      }
      this.grid.get(key)!.push(boid);
    }
  }

  getNeighbors(boidPosition: THREE.Vector3, perceptionRadius: number) {
    const neighbors: Boid[] = [];
    const perceptionRadiusSq = perceptionRadius * perceptionRadius;
    const boidCell = this._getCellKey(boidPosition);
    const [cx, cy, cz] = boidCell.split('_').map(Number);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const neighborCellKey = `${cx + dx}_${cy + dy}_${cz + dz}`;
          const cellBoids = this.grid.get(neighborCellKey);
          if (cellBoids) {
            for (const otherBoid of cellBoids) {
              const distSq = boidPosition.distanceToSquared(otherBoid.position);
              if (distSq < perceptionRadiusSq) {
                neighbors.push(otherBoid);
              }
            }
          }
        }
      }
    }
    return neighbors;
  }
}

export default SpatialGrid;
