// src/components/CursorRibbon.jsx
import { useEffect, useRef } from 'react';

const CursorRibbon = ({
  color = '#3b82f6',
  ribbonWidth = 5,
  fadeSpeed = 0.97,
  smoothness = 0.2,
  glowIntensity = 5,
  resetDelay = 3000
}) => {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef(null);
  const lastMoveTimeRef = useRef(Date.now());
  const resetTimeoutRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMove = (e) => {
      const x = e.clientX || (e.touches && e.touches[0].clientX);
      const y = e.clientY || (e.touches && e.touches[0].clientY);
      if (x !== undefined && y !== undefined) {
        mouseRef.current = { x, y };
        lastMoveTimeRef.current = Date.now();
        
        // Clear any existing reset timeout
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
        }
        
        // Set new reset timeout
        resetTimeoutRef.current = setTimeout(() => {
          pointsRef.current = [];
        }, resetDelay);
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchstart', handleMove);

    let lastPoint = { x: mouseRef.current.x, y: mouseRef.current.y };

    const animate = () => {
      // Clear canvas completely to avoid transparency issues
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update velocity with smoothing
      const dx = mouseRef.current.x - lastPoint.x;
      const dy = mouseRef.current.y - lastPoint.y;
      velocityRef.current.x += (dx - velocityRef.current.x) * smoothness;
      velocityRef.current.y += (dy - velocityRef.current.y) * smoothness;

      // Add new point if mouse moved
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 1) {
        pointsRef.current.push({
          x: mouseRef.current.x,
          y: mouseRef.current.y,
          vx: velocityRef.current.x,
          vy: velocityRef.current.y,
          life: 1.0
        });
        lastPoint = { ...mouseRef.current };
      }

      // Update and draw all points
      pointsRef.current = pointsRef.current.filter(point => {
        point.life -= (1 - fadeSpeed);
        return point.life > 0.01;
      });

      if (pointsRef.current.length > 1) {
        // Draw ribbon with gradient
        for (let i = 1; i < pointsRef.current.length; i++) {
          const p1 = pointsRef.current[i - 1];
          const p2 = pointsRef.current[i];

          const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          const alpha1 = p1.life * 0.9;
          const alpha2 = p2.life * 0.9;

          // Create color with alpha
          const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
            } : { r: 59, g: 130, b: 246 };
          };

          const rgb = hexToRgb(color);
          gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha1})`);
          gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha2})`);

          // Draw segment with glow
          ctx.strokeStyle = gradient;
          ctx.lineWidth = ribbonWidth * (p1.life + p2.life) / 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          if (glowIntensity > 0) {
            ctx.shadowBlur = glowIntensity;
            ctx.shadowColor = color;
          }

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchstart', handleMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, [color, ribbonWidth, fadeSpeed, smoothness, glowIntensity, resetDelay]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default CursorRibbon;