'use client';
import dynamic from 'next/dynamic';
import React from 'react';

const ThreeBoids = dynamic(() => import('./boids/ThreeBoids'), { ssr: false });

const Page = () => {
  return (
    <main style={{ width: '100vw', height: '100vh', background: '#111' }}>
      <ThreeBoids />
    </main>
  );
};

export default Page;