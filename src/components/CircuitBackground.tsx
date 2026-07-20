import React, { useEffect, useRef } from "react";

export default function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    interface ScienceSymbol {
      x: number;
      y: number;
      type: "atom" | "dna" | "molecule" | "orbit" | "math";
      size: number;
      rotation: number;
      rotSpeed: number;
      opacity: number;
      text?: string;
    }

    let scienceSymbols: ScienceSymbol[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
      initSymbols();
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(14, 165, 233, 0.25)";
        ctx.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      const numParticles = Math.floor((canvas.width * canvas.height) / 12000);
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
      }
    };

    const initSymbols = () => {
      scienceSymbols = [];
      const numSymbols = Math.max(6, Math.floor((canvas.width * canvas.height) / 160000));
      const types: Array<"atom" | "dna" | "molecule" | "orbit" | "math"> = ["atom", "dna", "molecule", "orbit", "math"];
      const mathTexts = ["E = mc²", "∑ xᵢ = 1", "∫ f(x) dx", "π ≈ 3.1415", "λ = h/p", "i² = -1", "∇ × B = μ₀J"];

      for (let i = 0; i < numSymbols; i++) {
        const type = types[i % types.length];
        scienceSymbols.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          type,
          size: Math.random() * 50 + 50, // 50px to 100px size
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.003,
          opacity: Math.random() * 0.12 + 0.15, // Increased opacity from original 0.05-0.10 for better visibility
          text: type === "math" ? mathTexts[Math.floor(Math.random() * mathTexts.length)] : undefined,
        });
      }
    };

    const drawAtom = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.strokeStyle = `rgba(14, 165, 233, ${opacity})`;
      ctx.lineWidth = 1.5;

      // Draw 3 orbits
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 3);
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Electron
        const angle = (Date.now() * 0.0008) + i * 2;
        const ex = Math.cos(angle) * size;
        const ey = Math.sin(angle) * size * 0.35;
        ctx.beginPath();
        ctx.arc(ex, ey, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14, 165, 233, ${opacity + 0.12})`;
        ctx.fill();
        ctx.restore();
      }

      // Nucleus
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(14, 165, 233, ${opacity + 0.18})`;
      ctx.fill();
      ctx.restore();
    };

    const drawDna = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.strokeStyle = `rgba(14, 165, 233, ${opacity})`;
      ctx.lineWidth = 1.5;

      const numPoints = 10;
      const spacing = size / numPoints;
      const amplitude = size * 0.28;
      const time = Date.now() * 0.001;

      for (let i = 0; i < numPoints; i++) {
        const px = -size / 2 + i * spacing;
        const theta = (i / numPoints) * Math.PI * 2 + time;
        const py1 = Math.sin(theta) * amplitude;
        const py2 = -Math.sin(theta) * amplitude;

        ctx.beginPath();
        ctx.moveTo(px, py1);
        ctx.lineTo(px, py2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px, py1, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14, 165, 233, ${opacity + 0.15})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py2, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${opacity + 0.15})`;
        ctx.fill();
      }
      ctx.restore();
    };

    const drawMolecule = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.strokeStyle = `rgba(14, 165, 233, ${opacity})`;
      ctx.lineWidth = 1.5;

      // Hexagon ring
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const hx = Math.cos(angle) * (size * 0.55);
        const hy = Math.sin(angle) * (size * 0.55);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner ring circle
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.38, 0, Math.PI * 2);
      ctx.stroke();

      // Functional branches
      const branchIndices = [0, 2, 4];
      branchIndices.forEach((idx) => {
        const angle = (idx * Math.PI) / 3;
        const bx1 = Math.cos(angle) * (size * 0.55);
        const by1 = Math.sin(angle) * (size * 0.55);
        const bx2 = Math.cos(angle) * (size * 0.9);
        const by2 = Math.sin(angle) * (size * 0.9);

        ctx.beginPath();
        ctx.moveTo(bx1, by1);
        ctx.lineTo(bx2, by2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bx2, by2, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14, 165, 233, ${opacity + 0.18})`;
        ctx.fill();
      });
      ctx.restore();
    };

    const drawOrbit = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.strokeStyle = `rgba(14, 165, 233, ${opacity})`;
      ctx.lineWidth = 1.2;

      const radii = [0.45, 0.75, 1.05];
      radii.forEach((rMult, idx) => {
        const r = size * rMult;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        const angle = (Date.now() * (0.0004 * (3 - idx))) + idx * 1.5;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;

        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14, 165, 233, ${opacity + 0.15})`;
        ctx.fill();
      });

      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(14, 165, 233, ${opacity + 0.2})`;
      ctx.fill();
      ctx.restore();
    };

    const drawMath = (x: number, y: number, size: number, rotation: number, opacity: number, text: string) => {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation * 0.15);
      ctx.fillStyle = `rgba(14, 165, 233, ${opacity + 0.22})`;
      ctx.font = `600 ${Math.max(13, Math.floor(size * 0.32))}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 0, 0);
      ctx.restore();
    };

    const drawLines = () => {
      if (!ctx) return;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 130) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(14, 165, 233, ${0.12 - distance / 1100})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    };

    const updateSymbols = () => {
      scienceSymbols.forEach((s) => {
        s.rotation += s.rotSpeed;
        
        // Float very slowly across the page
        s.x += Math.sin(Date.now() * 0.00005 + s.size) * 0.08;
        s.y += Math.cos(Date.now() * 0.00005 + s.size) * 0.08;

        // Wrap boundaries
        if (s.x < -s.size) s.x = canvas.width + s.size;
        if (s.x > canvas.width + s.size) s.x = -s.size;
        if (s.y < -s.size) s.y = canvas.height + s.size;
        if (s.y > canvas.height + s.size) s.y = -s.size;
      });
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Science Symbols Background first
      updateSymbols();
      scienceSymbols.forEach((s) => {
        if (s.type === "atom") drawAtom(s.x, s.y, s.size, s.rotation, s.opacity);
        else if (s.type === "dna") drawDna(s.x, s.y, s.size, s.rotation, s.opacity);
        else if (s.type === "molecule") drawMolecule(s.x, s.y, s.size, s.rotation, s.opacity);
        else if (s.type === "orbit") drawOrbit(s.x, s.y, s.size, s.rotation, s.opacity);
        else if (s.type === "math") drawMath(s.x, s.y, s.size, s.rotation, s.opacity, s.text || "");
      });

      // 2. Draw Network particles and connecting lines
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      drawLines();

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.95 }}
    />
  );
}
