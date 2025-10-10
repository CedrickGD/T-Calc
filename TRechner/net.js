// Reactive “cobweb / network” background that adapts to current theme variables
(function () {
  const canvas = document.getElementById('netCanvas');
  const ctx = canvas.getContext('2d');
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  let width, height, particles, mouse;
  let linkDistance, cursorLinkDistance, particleCount;

  let colorNode, colorLinkBase, colorCursorBase;

  // EXPOSED FUNCTION: Creates a ripple effect in the particle network
  window.triggerNetRipple = (x, y) => {
    if (!particles) return;
    const rippleRadius = 100;
    const rippleStrength = 1.5;
    for (const p of particles) {
      const dx = x - p.x;
      const dy = y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < rippleRadius) {
        const pull = (1 - dist / rippleRadius) * rippleStrength;
        p.vx -= (dx / (dist || 1)) * pull;
        p.vy -= (dy / (dist || 1)) * pull;
      }
    }
  };

  function readCssColors() {
    const cs = getComputedStyle(document.documentElement);
    colorNode = (cs.getPropertyValue('--net-node').trim()) || 'rgba(255,255,255,0.55)';
    colorLinkBase = (cs.getPropertyValue('--net-link').trim()) || 'rgba(180,200,255,0.28)';
    colorCursorBase = (cs.getPropertyValue('--net-cursor').trim()) || 'rgba(130,200,255,0.40)';
  }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.floor(width * DPR);
    canvas.height = Math.floor(height * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const density = 0.00012;
    particleCount = Math.floor(width * height * density);
    linkDistance = Math.max(80, Math.min(140, Math.hypot(width, height) * 0.06));
    cursorLinkDistance = linkDistance * 0.9;
    initParticles();
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 1.15 + Math.random() * 1.1
      });
    }
  }

  mouse = { x: null, y: null, active: false };
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });
  window.addEventListener('mouseleave', () => { mouse.active = false; });
  window.addEventListener('resize', resize);
  window.addEventListener('themechange', () => { readCssColors(); });

  function colorWithAlpha(baseRgba, alpha) {
    const m = baseRgba.match(/rgba?\s*\(([^)]+)\)/i);
    if (!m) return baseRgba;
    const [r, g, b] = m[1].split(',').map(s => s.trim());
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
  }

  function step() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      if (mouse.active) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        const attractRadius = 120;
        if (dist < attractRadius) {
          const pull = (1 - dist / attractRadius) * 0.6;
          p.vx += (dx / (dist || 1)) * pull * 0.03;
          p.vy += (dy / (dist || 1)) * pull * 0.03;
        }
      }
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;
    }
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = colorNode;
      ctx.fill();
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < linkDistance) {
          const alpha = 0.28 * (1 - dist / linkDistance);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = colorWithAlpha(colorLinkBase, alpha);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      if (mouse.active) {
        const dist = Math.hypot(mouse.x - a.x, mouse.y - a.y);
        if (dist < cursorLinkDistance) {
          const alpha = 0.35 * (1 - dist / cursorLinkDistance);
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(a.x, a.y);
          ctx.strokeStyle = colorWithAlpha(colorCursorBase, alpha);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(step);
  }

  readCssColors();
  resize();
  step();
})();