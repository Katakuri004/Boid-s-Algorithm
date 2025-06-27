'use client';
import React, { useRef, useEffect, useState } from 'react';
import Boid, { BoidParams } from './Boid';
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const NUM_BOIDS = 150;
const ASPECT_RATIO = 16 / 9;
const MARGIN = 24;

const defaultParams: BoidParams = {
  maxSpeed: 10,
  maxForce: 0.2,
  perceptionRadius: 40,
  separationWeight: 1.5,
  alignmentWeight: 1.0,
  cohesionWeight: 1.0,
};

function getCanvasSize() {
  const w = window.innerWidth - MARGIN * 2;
  const h = window.innerHeight - MARGIN * 2 - 120; // leave space for controls
  if (w / h > ASPECT_RATIO) {
    return { width: Math.floor(h * ASPECT_RATIO), height: h };
  } else {
    return { width: w, height: Math.floor(w / ASPECT_RATIO) };
  }
}

const ThreeBoids: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cohesion, setCohesion] = useState(defaultParams.cohesionWeight);
  const [separation, setSeparation] = useState(defaultParams.separationWeight);
  const [alignment, setAlignment] = useState(defaultParams.alignmentWeight);
  const [visualRange, setVisualRange] = useState(defaultParams.perceptionRadius);
  const [tracePaths, setTracePaths] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [canvasSize, setCanvasSize] = useState(getCanvasSize());
  const [numPredators, setNumPredators] = useState(1); // Default 1 predator

  useEffect(() => {
    function handleResize() {
      setCanvasSize(getCanvasSize());
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let boids: Boid[] = [];
    let predators: Boid[] = [];
    let paths: Array<Array<{ x: number, y: number }>> = [];
    const width = canvasSize.width;
    const height = canvasSize.height;

    // Initialize prey boids
    for (let i = 0; i < NUM_BOIDS; i++) {
      const b = new Boid(i, 1, {
        ...defaultParams,
        separationWeight: separation,
        alignmentWeight: alignment,
        cohesionWeight: cohesion,
        perceptionRadius: visualRange,
      });
      b.position.x = Math.random() * width;
      b.position.y = Math.random() * height;
      b.position.z = 0;
      b.velocity.x = Math.random() * 4 - 2;
      b.velocity.y = Math.random() * 4 - 2;
      b.velocity.z = 0;
      boids.push(b);
      paths.push([]);
    }
    // Initialize predator boids
    for (let i = 0; i < numPredators; i++) {
      const p = new Boid(NUM_BOIDS + i, 1, {
        maxSpeed: 9,
        maxForce: 0.25,
        perceptionRadius: 180,
        separationWeight: 0,
        alignmentWeight: 0,
        cohesionWeight: 0,
      });
      p.position.x = Math.random() * width;
      p.position.y = Math.random() * height;
      p.position.z = 0;
      p.velocity.x = Math.random() * 4 - 2;
      p.velocity.y = Math.random() * 4 - 2;
      p.velocity.z = 0;
      predators.push(p);
    }

    // Soft wall edge handling
    function keepWithinBounds(boid: Boid, width: number, height: number) {
      const margin = 50;
      const turnFactor = 1;
      if (boid.position.x < margin) {
        boid.velocity.x += turnFactor;
      }
      if (boid.position.x > width - margin) {
        boid.velocity.x -= turnFactor;
      }
      if (boid.position.y < margin) {
        boid.velocity.y += turnFactor;
      }
      if (boid.position.y > height - margin) {
        boid.velocity.y -= turnFactor;
      }
    }

    // Limit speed after all rules
    function limitSpeed(boid: Boid, speedLimit: number) {
      const speed = Math.sqrt(boid.velocity.x * boid.velocity.x + boid.velocity.y * boid.velocity.y);
      if (speed > speedLimit) {
        boid.velocity.x = (boid.velocity.x / speed) * speedLimit;
        boid.velocity.y = (boid.velocity.y / speed) * speedLimit;
      }
    }

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      // --- Prey logic ---
      boids.forEach((boid, idx) => {
        // Cohesion
        let centerX = 0, centerY = 0, numNeighbors = 0;
        for (let other of boids) {
          if (other !== boid && boid.position.distanceTo(other.position) < visualRange) {
            centerX += other.position.x;
            centerY += other.position.y;
            numNeighbors++;
          }
        }
        if (numNeighbors) {
          centerX = centerX / numNeighbors;
          centerY = centerY / numNeighbors;
          boid.velocity.x += (centerX - boid.position.x) * 0.005;
          boid.velocity.y += (centerY - boid.position.y) * 0.005;
        }
        // Separation
        let moveX = 0, moveY = 0;
        for (let other of boids) {
          if (other !== boid && boid.position.distanceTo(other.position) < 20) {
            moveX += boid.position.x - other.position.x;
            moveY += boid.position.y - other.position.y;
          }
        }
        boid.velocity.x += moveX * 0.05;
        boid.velocity.y += moveY * 0.05;
        // Alignment
        let avgDX = 0, avgDY = 0, numAlign = 0;
        for (let other of boids) {
          if (other !== boid && boid.position.distanceTo(other.position) < visualRange) {
            avgDX += other.velocity.x;
            avgDY += other.velocity.y;
            numAlign++;
          }
        }
        if (numAlign) {
          avgDX = avgDX / numAlign;
          avgDY = avgDY / numAlign;
          boid.velocity.x += (avgDX - boid.velocity.x) * 0.05;
          boid.velocity.y += (avgDY - boid.velocity.y) * 0.05;
        }
        // Prey avoidance: flee from predators
        for (let predator of predators) {
          const dist = boid.position.distanceTo(predator.position);
          if (dist < 80) { // fear radius
            boid.velocity.x += (boid.position.x - predator.position.x) * 0.15;
            boid.velocity.y += (boid.position.y - predator.position.y) * 0.15;
          }
        }
        keepWithinBounds(boid, width, height);
        limitSpeed(boid, 15);
        boid.position.x += boid.velocity.x;
        boid.position.y += boid.velocity.y;
        boid.position.z = 0;
        boid.velocity.z = 0;
        // Draw
        if (tracePaths) {
          paths[idx].push({ x: boid.position.x, y: boid.position.y });
          if (paths[idx].length > 100) paths[idx].shift();
          if (paths[idx].length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(100,150,255,0.2)';
            ctx.moveTo(paths[idx][0].x, paths[idx][0].y);
            for (let p of paths[idx]) ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        } else {
          paths[idx] = [];
        }
        ctx.save();
        ctx.translate(boid.position.x, boid.position.y);
        ctx.rotate(Math.atan2(boid.velocity.y, boid.velocity.x));
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-7, 5);
        ctx.lineTo(-7, -5);
        ctx.closePath();
        ctx.fillStyle = '#60a5fa';
        ctx.fill();
        ctx.restore();
      });
      // --- Predator logic ---
      predators.forEach((predator) => {
        // Chase nearest prey
        let nearest = null;
        let minDist = Infinity;
        for (let prey of boids) {
          const dist = predator.position.distanceTo(prey.position);
          if (dist < minDist && dist < 180) {
            minDist = dist;
            nearest = prey;
          }
        }
        if (nearest) {
          const steerX = (nearest.position.x - predator.position.x) * 0.04;
          const steerY = (nearest.position.y - predator.position.y) * 0.04;
          predator.velocity.x += steerX;
          predator.velocity.y += steerY;
        }
        keepWithinBounds(predator, width, height);
        // Stronger boundary: clamp and bounce
        if (predator.position.x < 0) {
          predator.position.x = 0;
          predator.velocity.x *= -1;
        }
        if (predator.position.x > width) {
          predator.position.x = width;
          predator.velocity.x *= -1;
        }
        if (predator.position.y < 0) {
          predator.position.y = 0;
          predator.velocity.y *= -1;
        }
        if (predator.position.y > height) {
          predator.position.y = height;
          predator.velocity.y *= -1;
        }
        limitSpeed(predator, 18);
        predator.position.x += predator.velocity.x;
        predator.position.y += predator.velocity.y;
        predator.position.z = 0;
        predator.velocity.z = 0;
        // Draw predator
        ctx.save();
        ctx.translate(predator.position.x, predator.position.y);
        ctx.rotate(Math.atan2(predator.velocity.y, predator.velocity.x));
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-9, 7);
        ctx.lineTo(-9, -7);
        ctx.closePath();
        ctx.fillStyle = '#ef4444'; // red-500
        ctx.fill();
        ctx.restore();
      });
      animationId = requestAnimationFrame(animate);
    }
    animate();
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [cohesion, separation, alignment, visualRange, tracePaths, resetKey, canvasSize, numPredators]);

  const handleReset = () => setResetKey(k => k + 1);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#282c34',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
    }}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{
          background: '#32353b',
          borderRadius: 16,
          boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
          display: 'block',
          margin: '0 auto',
        }}
      />
      <div style={{
        width: canvasSize.width,
        maxWidth: '100vw',
        margin: '24px auto 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(30,30,30,0.85)',
        borderRadius: 12,
        padding: 24,
        position: 'relative',
        bottom: 0,
      }}>
        <Button variant="outline" className="text-red-500 border-red-500" onClick={handleReset}>Reset</Button>
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', gap: 48 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#60a5fa', fontWeight: 500, marginBottom: 4 }}>Cohesion</span>
            <Slider min={0} max={3} step={0.1} value={cohesion} onValueChange={setCohesion} />
            <span style={{ fontSize: 12, color: '#93c5fd', marginTop: 4 }}>{cohesion === 0 ? 'Off' : cohesion}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#60a5fa', fontWeight: 500, marginBottom: 4 }}>Separation</span>
            <Slider min={0} max={3} step={0.1} value={separation} onValueChange={setSeparation} />
            <span style={{ fontSize: 12, color: '#93c5fd', marginTop: 4 }}>{separation === 0 ? 'Off' : separation}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#60a5fa', fontWeight: 500, marginBottom: 4 }}>Alignment</span>
            <Slider min={0} max={3} step={0.1} value={alignment} onValueChange={setAlignment} />
            <span style={{ fontSize: 12, color: '#93c5fd', marginTop: 4 }}>{alignment === 0 ? 'Off' : alignment}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#60a5fa', fontWeight: 500, marginBottom: 4 }}>Visual range</span>
            <Slider min={10} max={200} step={1} value={visualRange} onValueChange={setVisualRange} />
            <span style={{ fontSize: 12, color: '#93c5fd', marginTop: 4 }}>{visualRange}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#ef4444', fontWeight: 500, marginBottom: 4 }}>Predators</span>
            <Slider min={0} max={3} step={1} value={numPredators} onValueChange={setNumPredators} />
            <span style={{ fontSize: 12, color: '#fca5a5', marginTop: 4 }}>{numPredators}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 24 }}>
          <Switch checked={tracePaths} onCheckedChange={setTracePaths} />
          <span style={{ fontSize: 12, color: '#93c5fd', marginTop: 4 }}>Trace paths</span>
        </div>
      </div>
    </div>
  );
};

export default ThreeBoids;
