# 🦅 Boids Algorithm Visualization

A modern, interactive 2D visualization of the classic Boids algorithm, implemented in React and TypeScript with a beautiful UI and real-time controls.

---

## ✨ What is the Boids Algorithm?

The Boids algorithm, invented by Craig Reynolds in 1986, simulates the flocking behavior of birds (or fish, or herds) using three simple rules:

1. **Cohesion** 🫂: Steer towards the average position of local flockmates.
2. **Separation** ↔️: Avoid crowding neighbors (steer to avoid collisions).
3. **Alignment** 🧭: Steer towards the average heading of local flockmates.

These simple rules, when applied to each "boid" (bird-oid object), create emergent, lifelike group movement—no central control required!

---

## 🖥️ Features of This Implementation

- **2D Canvas Rendering**: Fast, smooth, and visually appealing.
- **Real-Time Controls**: Adjust Cohesion, Separation, Alignment, and Visual Range with sliders.
- **Predator–Prey Dynamics**: Add up to 3 predator boids that chase the flock, while prey boids flee when a predator is near.
- **Trace Paths**: Toggle to see the trails left by each boid.
- **Responsive UI**: Canvas and controls adapt to your screen size.
- **Modern Design**: Clean, dark-themed interface with color-coded boids (blue for prey, red for predators).

---

## 🕹️ How to Use

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd boids-algo
   npm install
   npm run dev
   ```
2. **Open in Browser**
   - Visit [http://localhost:3000](http://localhost:3000)

3. **Controls**
   - **Sliders**: Adjust flocking parameters in real time.
   - **Predators**: Add/remove predators to see predator-prey dynamics.
   - **Reset**: Randomize the simulation.
   - **Trace Paths**: Toggle to visualize boid trails.

---

## 🧠 How It Works

- **Prey Boids**
  - Follow the classic three rules (cohesion, separation, alignment).
  - Flee from predators within a "fear radius" for survival.
- **Predator Boids**
  - Chase the nearest prey within their perception radius.
  - Move faster and with more force than prey, but are limited to keep the simulation balanced.
- **Edge Handling**
  - Boids and predators are kept inside the canvas with soft walls and bounce logic.
- **Rendering**
  - Boids are drawn as triangles, with color indicating type (blue = prey, red = predator).

---

## 📸 Demo

![Boids Demo Screenshot](demo-screenshot.png)

---

## 📚 References
- [Craig Reynolds: Boids (Flocks, Herds, and Schools)](https://www.red3d.com/cwr/boids/)
- [Interactive Boids Demo by Ben Eater](https://eater.net/boids)

---

## 🚀 Enjoy exploring emergent behavior and flocking dynamics!

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
