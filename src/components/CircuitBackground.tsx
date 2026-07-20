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
    
    interface DigitalSymbol {
      x: number;
      y: number;
      type: "wifi" | "chip" | "cloud" | "nodes" | "community";
      size: number;
      rotation: number;
      rotSpeed: number;
      opacity: number;
    }

    let digitalSymbols: DigitalSymbol[] = [];

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
        ctx.fillStyle = "rgba(14, 165, 233, 0.22)";
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
      digitalSymbols = [];
      const numSymbols = Math.max(6, Math.floor((canvas.width * canvas.height) / 150000));
      const types: Array<"wifi" | "chip" | "cloud" | "nodes" | "community"> = [
        "wifi",
        "chip",
        "cloud",
        "nodes",
        "community"
      ];

      for (let i = 0; i < numSymbols; i++) {
        const type = types[i % types.length];
        digitalSymbols.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          type,
          size: Math.random() * 40 + 50, // 50px to 90px size
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.002, // Subtle slow rotating speed
          opacity: Math.random() * 0.04 + 0.04, // Very soft and elegant watermark opacity (4% to 8%)
        });
      }
    };

    const drawWifi = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation * 0.15); // Very slow drift rotation
      ctx.strokeStyle = `rgba(14, 165, 233, ${opacity})`;
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";

      const startAngle = -Math.PI * 0.72;
      const endAngle = -Math.PI * 0.28;
      const centerY = size * 0.25;

      // Base dot
      ctx.beginPath();
      ctx.arc(0, centerY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(14, 165, 233, ${opacity + 0.15})`;
      ctx.fill();

      // Signal arcs
      const radii = [size * 0.25, size * 0.5, size * 0.75];
      radii.forEach((r) => {
        ctx.beginPath();
        ctx.arc(0, centerY, r, startAngle, endAngle);
        ctx.stroke();
      });

      ctx.restore();
    };

    const drawChip = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.strokeStyle = `rgba(14, 165, 233, ${opacity})`;
      ctx.lineWidth = 1.5;

      const half = size * 0.24;
      // Main square
      ctx.beginPath();
      ctx.rect(-half, -half, half * 2, half * 2);
      ctx.stroke();

      // Internal chip core
      ctx.beginPath();
      ctx.rect(-half * 0.55, -half * 0.55, half * 1.1, half * 1.1);
      ctx.fillStyle = `rgba(14, 165, 233, ${opacity * 0.35})`;
      ctx.fill();
      ctx.stroke();

      // Connector pins
      const pinLength = size * 0.16;
      const pinOffsets = [-half * 0.5, 0, half * 0.5];

      // Top/Bottom pins
      pinOffsets.forEach((offset) => {
        // Top pin
        ctx.beginPath();
        ctx.moveTo(offset, -half);
        ctx.lineTo(offset, -half - pinLength);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(offset, -half - pinLength, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14, 165, 233, ${opacity + 0.12})`;
        ctx.fill();

        // Bottom pin
        ctx.beginPath();
        ctx.moveTo(offset, half);
        ctx.lineTo(offset, half + pinLength);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(offset, half + pinLength, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14, 165, 233, ${opacity + 0.12})`;
        ctx.fill();
      });

      // Left/Right pins
      pinOffsets.forEach((offset) => {
        // Left pin
        ctx.beginPath();
        ctx.moveTo(-half, offset);
        ctx.lineTo(-half - pinLength, offset);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-half - pinLength, offset, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14, 165, 233, ${opacity + 0.12})`;
        ctx.fill();

        // Right pin
        ctx.beginPath();
        ctx.moveTo(half, offset);
        ctx.lineTo(half + pinLength, offset);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(half + pinLength, offset, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14, 165, 233, ${opacity + 0.12})`;
        ctx.fill();
      });

      ctx.restore();
    };

    const drawCloud = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation * 0.08); // Drift slowly
      ctx.strokeStyle = `rgba(14, 165, 233, ${opacity})`;
      ctx.lineWidth = 1.6;

      const w = size * 0.72;
      const h = size * 0.44;
      const ox = -w / 2;
      const oy = h / 2;

      ctx.beginPath();
      // Flat bottom
      ctx.moveTo(ox + w * 0.18, oy);
      ctx.lineTo(ox + w * 0.82, oy);
      
      // Right cloud puff
      ctx.arc(ox + w * 0.82, oy - w * 0.15, w * 0.15, Math.PI * 0.5, -Math.PI * 0.25, true);
      // Large top puff
      ctx.arc(ox + w * 0.58, oy - h * 0.68, w * 0.24, -Math.PI * 0.1, -Math.PI * 0.9, true);
      // Left puff
      ctx.arc(ox + w * 0.32, oy - h * 0.58, w * 0.19, -Math.PI * 0.15, -Math.PI * 1.1, true);
      // Extra left puff
      ctx.arc(ox + w * 0.18, oy - w * 0.12, w * 0.12, -Math.PI * 0.7, Math.PI * 0.5, true);
      
      ctx.closePath();
      ctx.stroke();

      // Data signal lines inside the cloud
      ctx.beginPath();
      ctx.moveTo(ox + w * 0.32, oy - h * 0.2);
      ctx.lineTo(ox + w * 0.68, oy - h * 0.2);
      ctx.moveTo(ox + w * 0.42, oy - h * 0.38);
      ctx.lineTo(ox + w * 0.58, oy - h * 0.38);
      ctx.strokeStyle = `rgba(14, 165, 233, ${opacity * 0.75})`;
      ctx.stroke();

      ctx.restore();
    };

    const drawNodes = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.strokeStyle = `rgba(14, 165, 233, ${opacity})`;
      ctx.lineWidth = 1.3;

      const r = size * 0.38;
      // Define 4 nodes in a ring + 1 center node
      const points = [
        { x: Math.cos(0) * r, y: Math.sin(0) * r },
        { x: Math.cos(Math.PI * 0.5) * r, y: Math.sin(Math.PI * 0.5) * r },
        { x: Math.cos(Math.PI) * r, y: Math.sin(Math.PI) * r },
        { x: Math.cos(Math.PI * 1.5) * r, y: Math.sin(Math.PI * 1.5) * r },
        { x: 0, y: 0 } // Center node
      ];

      // Connections
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.moveTo(0, 0);
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.lineTo(points[2].x, points[2].y);
      ctx.lineTo(points[3].x, points[3].y);
      ctx.lineTo(points[0].x, points[0].y);
      ctx.stroke();

      // Node circles
      points.forEach((pt, idx) => {
        ctx.beginPath();
        const rad = idx === 4 ? 5.5 : 4.2;
        ctx.arc(pt.x, pt.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = idx === 4 ? `rgba(14, 165, 233, ${opacity + 0.18})` : `rgba(56, 189, 248, ${opacity + 0.12})`;
        ctx.fill();
        ctx.stroke();
      });

      ctx.restore();
    };

    const drawCommunity = (x: number, y: number, size: number, rotation: number, opacity: number) => {
      if (!ctx) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation * 0.12); // Drift slowly
      ctx.strokeStyle = `rgba(14, 165, 233, ${opacity})`;
      ctx.lineWidth = 1.5;

      const drawAvatar = (ox: number, oy: number, scale: number) => {
        // Head
        ctx.beginPath();
        ctx.arc(ox, oy - 10 * scale, 6 * scale, 0, Math.PI * 2);
        ctx.stroke();
        
        // Shoulders/Chest
        ctx.beginPath();
        ctx.arc(ox, oy + 10 * scale, 12 * scale, Math.PI, 0);
        ctx.stroke();
      };

      const dist = size * 0.24;
      
      // Connective line (Bridge)
      ctx.beginPath();
      ctx.moveTo(-dist, 0);
      ctx.lineTo(dist, 0);
      ctx.stroke();

      // Connection point
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(14, 165, 233, ${opacity + 0.2})`;
      ctx.fill();

      // Left citizen
      ctx.save();
      drawAvatar(-dist, 0, size * 0.009);
      ctx.restore();

      // Right citizen
      ctx.save();
      drawAvatar(dist, 0, size * 0.009);
      ctx.restore();

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
      digitalSymbols.forEach((s) => {
        s.rotation += s.rotSpeed;
        
        // Floating motion across page
        s.x += Math.sin(Date.now() * 0.00005 + s.size) * 0.08;
        s.y += Math.cos(Date.now() * 0.00005 + s.size) * 0.08;

        // Warp boundaries
        if (s.x < -s.size) s.x = canvas.width + s.size;
        if (s.x > canvas.width + s.size) s.x = -s.size;
        if (s.y < -s.size) s.y = canvas.height + s.size;
        if (s.y > canvas.height + s.size) s.y = -s.size;
      });
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Digital Tech & Connection Symbols Background
      updateSymbols();
      digitalSymbols.forEach((s) => {
        if (s.type === "wifi") drawWifi(s.x, s.y, s.size, s.rotation, s.opacity);
        else if (s.type === "chip") drawChip(s.x, s.y, s.size, s.rotation, s.opacity);
        else if (s.type === "cloud") drawCloud(s.x, s.y, s.size, s.rotation, s.opacity);
        else if (s.type === "nodes") drawNodes(s.x, s.y, s.size, s.rotation, s.opacity);
        else if (s.type === "community") drawCommunity(s.x, s.y, s.size, s.rotation, s.opacity);
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
