// src/components/SpaceBackground.jsx
import { useEffect, useRef } from 'react';

const SpaceBackground = ({
  particleCount = 150,
  particleColors = ['#ffffff', '#60a5fa', '#3b82f6'],
  speed = 0.3,
  particleSize = 1.3,
  mouseInteraction = true,
  parallaxStrength = 0.03,
  connectionDistance = 120,
  showConnections = true
}) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize);

    // Extend the particle area beyond screen bounds
    const padding = 200; // Extra space around screen

    // Initialize particles in extended area
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random() * (width + padding * 2) - padding,
        y: Math.random() * (height + padding * 2) - padding,
        baseX: 0,
        baseY: 0,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        size: Math.random() * particleSize + 1,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        opacity: Math.random() * 0.5 + 0.5,
        depth: Math.random() * 0.5 + 0.5
      });
    }

    // Store base positions
    particlesRef.current.forEach(particle => {
      particle.baseX = particle.x;
      particle.baseY = particle.y;
    });

    const handleMouseMove = (e) => {
      mouseRef.current.targetX = (e.clientX / width) * 2 - 1;
      mouseRef.current.targetY = (e.clientY / height) * 2 - 1;
    };

    if (mouseInteraction) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.1;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.1;

      if (mouseInteraction) {
        offsetRef.current.x += (-mouseRef.current.x * width * parallaxStrength - offsetRef.current.x) * 0.1;
        offsetRef.current.y += (-mouseRef.current.y * height * parallaxStrength - offsetRef.current.y) * 0.1;
      }

      particlesRef.current.forEach((particle, i) => {
        particle.baseX += particle.vx;
        particle.baseY += particle.vy;

        // Wrap around extended bounds
        if (particle.baseX < -padding) particle.baseX = width + padding;
        if (particle.baseX > width + padding) particle.baseX = -padding;
        if (particle.baseY < -padding) particle.baseY = height + padding;
        if (particle.baseY > height + padding) particle.baseY = -padding;

        particle.vx += (Math.random() - 0.5) * 0.02 * speed;
        particle.vy += (Math.random() - 0.5) * 0.02 * speed;

        const maxSpeed = speed * 2;
        const currentSpeed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (currentSpeed > maxSpeed) {
          particle.vx = (particle.vx / currentSpeed) * maxSpeed;
          particle.vy = (particle.vy / currentSpeed) * maxSpeed;
        }

        particle.vx *= 0.99;
        particle.vy *= 0.99;

        particle.x = particle.baseX + offsetRef.current.x * particle.depth;
        particle.y = particle.baseY + offsetRef.current.y * particle.depth;

        // Only draw if particle is visible on screen (with small margin)
        const margin = 50;
        if (particle.x < -margin || particle.x > width + margin || 
            particle.y < -margin || particle.y > height + margin) {
          return;
        }

        if (showConnections) {
          for (let j = i + 1; j < particlesRef.current.length; j++) {
            const other = particlesRef.current[j];
            
            // Skip if other particle is off screen
            if (other.x < -margin || other.x > width + margin || 
                other.y < -margin || other.y > height + margin) {
              continue;
            }

            const dx = particle.x - other.x;
            const dy = particle.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
              const opacity = (1 - distance / connectionDistance) * 0.15;
              ctx.strokeStyle = `rgba(96, 165, 250, ${opacity})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(other.x, other.y);
              ctx.stroke();
            }
          }
        }

        ctx.shadowBlur = 8;
        ctx.shadowColor = particle.color;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (mouseInteraction) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleCount, particleColors, speed, particleSize, mouseInteraction, parallaxStrength, connectionDistance, showConnections]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full"
      style={{ zIndex: 1, pointerEvents: 'none' }}
    />
  );
};

export default SpaceBackground;