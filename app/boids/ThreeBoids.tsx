'use client';
import React, { useRef, useEffect, useState } from 'react';
import Boid from './Boid'; // Ensure this uses the multi-species Boid class from the previous step
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2 } from 'lucide-react'; // Example icon, install with `npm i lucide-react`

// --- 1. UPDATED DATA STRUCTURES ---

interface SpeciesParams {
  id: number;
  name: string;
  color: string;
  quantity: number;
  isPredator: boolean; // Flag to determine behavior
  maxSpeed: number;
  maxForce: number;
  perceptionRadius: number;
  separationRadius: number;
  // Interaction Matrices
  cohesionWeights: number[];
  separationWeights: number[];
  alignmentWeights: number[];
}

// Default prey and predator settings for new species
const defaultPreyParams = {
    maxSpeed: 10, maxForce: 0.3, perceptionRadius: 50, separationRadius: 25,
};
const defaultPredatorParams = {
    maxSpeed: 12, maxForce: 0.5, perceptionRadius: 150, separationRadius: 50,
};

// Initial setup with one prey and one predator species
const initialSpeciesList: SpeciesParams[] = [
  {
    id: 0, name: "Prey", color: '#60a5fa', quantity: 150, isPredator: false,
    ...defaultPreyParams,
    cohesionWeights:   [1.2, 0.0],
    separationWeights: [1.5, 5.0], // High separation from predators
    alignmentWeights:  [1.0, 0.0],
  },
  {
    id: 1, name: "Predator", color: '#ef4444', quantity: 5, isPredator: true,
    ...defaultPredatorParams,
    cohesionWeights:   [0.0, 0.0], // Predators don't use matrix cohesion
    separationWeights: [0.0, 1.5],
    alignmentWeights:  [0.0, 0.5],
  }
];

// Canvas constants
const ASPECT_RATIO = 16 / 9;
const MARGIN = 24;

// --- UTILITY AND COMPONENT START ---
function getCanvasSize() {
    const w = window.innerWidth - MARGIN * 2;
    const h = window.innerHeight - MARGIN * 2 - 280; // More space for expanded UI
    return (w / h > ASPECT_RATIO) 
        ? { width: Math.floor(h * ASPECT_RATIO), height: h }
        : { width: w, height: Math.floor(w / ASPECT_RATIO) };
}

const ThreeBoids: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [speciesList, setSpeciesList] = useState<SpeciesParams[]>(initialSpeciesList);
    const [resetKey, setResetKey] = useState(0);
    const [canvasSize, setCanvasSize] = useState(getCanvasSize());
    // Track which tab is active (species id as string)
    const [activeTab, setActiveTab] = useState(speciesList[0]?.id.toString() ?? "0");
    // Ensure activeTab is always a valid tab when speciesList changes
    React.useEffect(() => {
        if (speciesList.length === 0) return;
        // If the current activeTab is not in the list, switch to the first tab
        if (!speciesList.some(sp => sp.id.toString() === activeTab)) {
            setActiveTab(speciesList[0].id.toString());
        }
    }, [speciesList]);
    useEffect(() => {
        const handleResize = () => setCanvasSize(getCanvasSize());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- 2. THE CORE SIMULATION LOGIC (useEffect) ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        const boids: Boid[] = [];
        const width = canvasSize.width;
        const height = canvasSize.height;

        // Initialize all boids from the species list
        speciesList.forEach(sp => {
            for (let i = 0; i < sp.quantity; i++) {
                const b = new Boid(boids.length, sp.id, { maxSpeed: sp.maxSpeed, maxForce: sp.maxForce, perceptionRadius: sp.perceptionRadius });
                b.position.x = Math.random() * width;
                b.position.y = Math.random() * height;
                b.velocity.x = Math.random() * 4 - 2;
                b.velocity.y = Math.random() * 4 - 2;
                boids.push(b);
            }
        });

        const preyBoids = boids.filter(b => !speciesList[b.speciesId].isPredator);
        const predatorBoids = boids.filter(b => speciesList[b.speciesId].isPredator);

        function animate() {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            boids.forEach(boid => {
                const myParams = speciesList[boid.speciesId];
                if (!myParams) return; // Defensive: skip if speciesId is invalid

                let acceleration = { x: 0, y: 0 };

                if (myParams.isPredator) {
                    // --- PREDATOR LOGIC: CHASE NEAREST PREY ---
                    let nearestPrey = null;
                    let minDistSq = Infinity;
                    for (const prey of preyBoids) {
                        if (!speciesList[prey.speciesId]) continue;
                        const distSq = boid.position.distanceToSquared(prey.position);
                        if (distSq < minDistSq && distSq < myParams.perceptionRadius * myParams.perceptionRadius) {
                            minDistSq = distSq;
                            nearestPrey = prey;
                        }
                    }
                    if (nearestPrey) {
                        const steer = { x: nearestPrey.position.x - boid.position.x, y: nearestPrey.position.y - boid.position.y };
                        acceleration.x += steer.x * 0.1;
                        acceleration.y += steer.y * 0.1;
                    }
                } else {
                    // --- PREY LOGIC: FLOCK + FLEE ---
                    let fleeForce = { x: 0, y: 0 };
                    let predatorsNearby = 0;
                    for (const predator of predatorBoids) {
                        if (!speciesList[predator.speciesId]) continue;
                        const dist = boid.position.distanceTo(predator.position);
                        if (dist < myParams.perceptionRadius * 1.5) {
                            fleeForce.x += boid.position.x - predator.position.x;
                            fleeForce.y += boid.position.y - predator.position.y;
                            predatorsNearby++;
                        }
                    }
                    if (predatorsNearby > 0) {
                        acceleration.x += (fleeForce.x / predatorsNearby) * 0.5;
                        acceleration.y += (fleeForce.y / predatorsNearby) * 0.5;
                    } else {
                        const flockingForce = boid.flock(preyBoids, speciesList);
                        if (flockingForce && typeof flockingForce.x === 'number' && typeof flockingForce.y === 'number') {
                            acceleration.x += flockingForce.x;
                            acceleration.y += flockingForce.y;
                        }
                    }
                }

                boid.velocity.x += acceleration.x;
                boid.velocity.y += acceleration.y;
                limitSpeed(boid, myParams.maxSpeed);
                boid.position.x += boid.velocity.x;
                boid.position.y += boid.velocity.y;
                keepWithinBounds(boid, width, height);
                drawBoid(boid);
            });

            animationId = requestAnimationFrame(animate);
        }

        function drawBoid(boid: Boid) {
            const params = speciesList[boid.speciesId];
            if (!ctx) return;
            ctx.save();
            ctx.translate(boid.position.x, boid.position.y);
            ctx.rotate(Math.atan2(boid.velocity.y, boid.velocity.x));
            ctx.beginPath();
            const size = params.isPredator ? 14 : 10;
            ctx.moveTo(size, 0);
            ctx.lineTo(-size * 0.7, size * 0.5);
            ctx.lineTo(-size * 0.7, -size * 0.5);
            ctx.closePath();
            ctx.fillStyle = params.color;
            ctx.fill();
            ctx.restore();
        }

        // Helper functions from previous steps
        // Improved edge-handling: nudge boids back in with a margin and turn factor, inspired by classic reference
        function keepWithinBounds(boid: Boid, w: number, h: number) {
            const margin = 40; // Responsive margin for edge avoidance
            const turnFactor = 1.5; // How sharply to turn back

            // X axis
            if (boid.position.x < margin) {
                boid.velocity.x += turnFactor;
                boid.position.x = Math.max(boid.position.x, margin * 0.5);
            }
            if (boid.position.x > w - margin) {
                boid.velocity.x -= turnFactor;
                boid.position.x = Math.min(boid.position.x, w - margin * 0.5);
            }
            // Y axis
            if (boid.position.y < margin) {
                boid.velocity.y += turnFactor;
                boid.position.y = Math.max(boid.position.y, margin * 0.5);
            }
            if (boid.position.y > h - margin) {
                boid.velocity.y -= turnFactor;
                boid.position.y = Math.min(boid.position.y, h - margin * 0.5);
            }
        }
        function limitSpeed(boid: Boid, limit: number) { /* ... */ }

        animate();
        return () => cancelAnimationFrame(animationId);
    }, [resetKey, canvasSize, speciesList]);

    // --- 3. DYNAMIC UI HANDLERS ---
    const addSpecies = () => {
        setSpeciesList((currentList: SpeciesParams[]) => {
            const newList: SpeciesParams[] = JSON.parse(JSON.stringify(currentList));
            const newId: number = newList.length > 0 ? Math.max(...newList.map((s: SpeciesParams) => s.id)) + 1 : 0;
            const numSpecies: number = newList.length + 1;

            // Add new column to existing species' weights
            newList.forEach((sp: SpeciesParams) => {
                sp.cohesionWeights.push(1.0);
                sp.separationWeights.push(1.0);
                sp.alignmentWeights.push(1.0);
            });

            // Create the new species
            const newSpecies: SpeciesParams = {
                id: newId,
                name: `Species ${newId}`,
                color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
                quantity: 50,
                isPredator: false,
                ...defaultPreyParams,
                cohesionWeights: new Array(numSpecies).fill(1.0),
                separationWeights: new Array(numSpecies).fill(1.0),
                alignmentWeights: new Array(numSpecies).fill(1.0),
            };
            newList.push(newSpecies);
            // Set the new tab as active
            setActiveTab(newId.toString());
            return newList;
        });
    };

    const removeSpecies = (idToRemove: number) => {
        setSpeciesList((currentList: SpeciesParams[]) => {
            let listAfterRemove = currentList.filter((sp: SpeciesParams) => sp.id !== idToRemove);
            // Re-index IDs and update weight arrays
            const reindexedList = listAfterRemove.map((sp: SpeciesParams, newIndex: number) => {
                const oldIndex = currentList.findIndex((s: SpeciesParams) => s.id === sp.id);
                sp.cohesionWeights.splice(oldIndex, 1);
                sp.separationWeights.splice(oldIndex, 1);
                sp.alignmentWeights.splice(oldIndex, 1);
                return { ...sp, id: newIndex };
            });
            // If the removed tab was active, switch to the first tab if any left
            if (reindexedList.length > 0 && activeTab === idToRemove.toString()) {
                setActiveTab(reindexedList[0].id.toString());
            }
            return reindexedList;
        });
        setResetKey(k => k + 1); // Force simulation reset after removing species
    };
    
    const updateSpeciesProperty = (id: number, prop: keyof SpeciesParams, value: any) => {
        setSpeciesList(list => list.map(sp => sp.id === id ? { ...sp, [prop]: value } : sp));
    };

    const updateWeight = (speciesId: number, weightType: 'cohesionWeights' | 'separationWeights' | 'alignmentWeights', targetId: number, value: number) => {
        setSpeciesList(list => list.map(sp => {
            if (sp.id === speciesId) {
                const newWeights = [...sp[weightType]];
                newWeights[targetId] = value;
                return { ...sp, [weightType]: newWeights };
            }
            return sp;
        }));
    };

    // --- 4. JSX with Dynamic Controls ---
    return (
        <main className="min-h-screen w-full bg-gradient-to-b from-neutral-950 to-neutral-900 flex flex-col items-center justify-center py-0 px-0">
            <section className="w-full max-w-[1800px] flex flex-row items-start justify-center gap-0 md:gap-8 py-8 px-2">
                {/* Sidebar Controls */}
                <aside className="w-full max-w-xs md:max-w-sm lg:max-w-xs xl:max-w-sm bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-xl flex flex-col items-stretch p-6 gap-6 sticky top-8 self-start min-h-[600px]">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-2xl font-bold text-neutral-100">Species Controls</h2>
                        <Button onClick={addSpecies} className="text-xs px-2 py-1 h-8">Add Species</Button>
                    </div>
                    <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-neutral-800/80 p-1 text-muted-foreground w-full overflow-x-auto">
                            {speciesList.map(sp => (
                                <div key={sp.id} className="flex items-center">
                                    <TabsTrigger 
                                        value={sp.id.toString()} 
                                        className="relative inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:bg-neutral-700/50"
                                    >
                                        {sp.name}
                                    </TabsTrigger>
                                    <span
                                        onClick={e => {
                                            e.stopPropagation();
                                            if (speciesList.length > 1) {
                                                removeSpecies(sp.id);
                                            }
                                        }}
                                        className={`inline-flex px-1.5 hover:text-red-500 cursor-pointer ${speciesList.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-70 hover:opacity-100'}`}
                                        role="button"
                                        aria-label={`Remove ${sp.name}`}
                                    >
                                        ×
                                    </span>
                                </div>
                            ))}
                        </TabsList>
                        {speciesList.map(species => (
                            <TabsContent key={species.id} value={species.id.toString()} className="mt-0">
                                <div className="bg-neutral-800/60 rounded-lg p-4 space-y-4 border border-neutral-700">
                                    <div className="flex gap-2 items-center">
                                        <Label htmlFor={`name-${species.id}`}>Name</Label>
                                        <Input 
                                            id={`name-${species.id}`}
                                            value={species.name}
                                            onChange={e => updateSpeciesProperty(species.id, 'name', e.target.value)}
                                            className="flex-1 min-w-0"
                                        />
                                        <Input 
                                            type="color"
                                            value={species.color}
                                            onChange={e => updateSpeciesProperty(species.id, 'color', e.target.value)}
                                            className="w-8 h-8 p-0 border-none bg-transparent"
                                        />
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <Label htmlFor={`qty-${species.id}`}>Quantity</Label>
                                        <Input 
                                            id={`qty-${species.id}`}
                                            type="number"
                                            value={species.quantity}
                                            min={1}
                                            max={500}
                                            onChange={e => updateSpeciesProperty(species.id, 'quantity', Number(e.target.value))}
                                            className="w-20"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch 
                                            checked={species.isPredator}
                                            onCheckedChange={c => updateSpeciesProperty(species.id, 'isPredator', c)}
                                        />
                                        <Label className="text-red-400 font-medium">Is Predator?</Label>
                                    </div>
                                    {!species.isPredator && (
                                        <div>
                                            <h3 className="text-base font-semibold my-2 text-neutral-300">Flocking Weights</h3>
                                            <div className="flex flex-col gap-2">
                                                {speciesList.map(target => (
                                                    <div key={target.id} className="mb-1 p-2 bg-neutral-900/80 rounded border border-neutral-800">
                                                        <h4 className="font-medium text-neutral-400 mb-1">
                                                            Towards: <span style={{color: target.color}}>{target.name}</span>
                                                        </h4>
                                                        <div className="text-xs flex flex-col gap-1">
                                                            <Label>Separation: {species.separationWeights[target.id]?.toFixed(1)}</Label>
                                                            <Slider
                                                                min={0}
                                                                max={5}
                                                                step={0.1}
                                                                value={species.separationWeights[target.id] || 0}
                                                                onValueChange={v => updateWeight(species.id, 'separationWeights', target.id, v)}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </aside>
                {/* Main Canvas Area */}
                <section className="flex-1 flex flex-col items-center justify-center min-w-0">
                    <div className="w-full flex flex-col items-center justify-center">
                        <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="rounded-2xl shadow-2xl border border-neutral-800 bg-[#32353b] max-w-full max-h-[80vh] aspect-video" style={{background: '#32353b'}}/>
                    </div>
                    <div className="w-full flex items-center justify-center gap-4 mt-6">
                        <Button variant="outline" className="text-red-500 border-red-500 px-4 py-2" onClick={() => setResetKey(k => k + 1)}>Reset Simulation</Button>
                    </div>
                </section>
            </section>
        </main>
    );
}

export default ThreeBoids;