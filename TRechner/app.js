// Calculator + Theme & Accent handling
(function () {
  'use strict';
  // ---------- Theme Handling ----------
  const THEME_KEY = 'calc-theme';
  const html = document.documentElement;
  const toggleBtn = document.getElementById('themeToggle');
  const accentSelect = document.getElementById('accentSelect');
  const accentDot = document.querySelector('.accent-dot');

  const systemPrefersDark = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDarkTheme = (theme) => theme && theme.startsWith('dark');
  
  const getAccentFromTheme = (theme) => {
    if (theme === 'light' || theme === 'dark') return 'classic';
    return theme.replace('dark-', '').replace('light-', '');
  };

  const updateAccentPreview = () => {
    const cs = getComputedStyle(document.documentElement);
    const accentColor = cs.getPropertyValue('--accent').trim();
    accentDot.style.background = accentColor;
    accentDot.style.boxShadow = `0 0 0 2px color-mix(in oklab, ${accentColor} 40%, transparent)`;
  };

  const applyTheme = (theme) => {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    toggleBtn.textContent = isDarkTheme(theme) ? '☀️' : '🌙';
    accentSelect.value = getAccentFromTheme(theme);
    updateAccentPreview();
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  };

  (() => { // initTheme
    const savedTheme = localStorage.getItem(THEME_KEY);
    applyTheme(savedTheme ?? (systemPrefersDark() ? 'dark-purple' : 'light'));
  })();

  toggleBtn.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const accent = getAccentFromTheme(currentTheme);
    const newTheme = isDarkTheme(currentTheme)
      ? (accent === 'classic' ? 'light' : `light-${accent}`)
      : (accent === 'classic' ? 'dark' : `dark-${accent}`);
    applyTheme(newTheme);
  });

  accentSelect.addEventListener('change', () => {
    const selectedAccent = accentSelect.value;
    const newTheme = selectedAccent === 'classic'
      ? (isDarkTheme(html.getAttribute('data-theme')) ? 'dark' : 'light')
      : `${isDarkTheme(html.getAttribute('data-theme')) ? 'dark' : 'light'}-${selectedAccent}`;
    applyTheme(newTheme);
  });

  // ---------- Calculator ----------
  const display = document.getElementById('result');
  const buttons = document.querySelector('.buttons');
  const historyToggle = document.getElementById('historyToggle');
  const historyPanel = document.getElementById('historyPanel');
  const historyList = document.getElementById('historyList');
  
  const clickAudio = new Audio('click.mp3');
  const mathParser = math.parser();

  let memory = 0;
  let history = [];

  const updateDisplayFontSize = () => {
    const len = display.value.length;
    display.classList.remove('font-medium', 'font-small');
    if (len > 22) display.classList.add('font-small');
    else if (len > 14) display.classList.add('font-medium');
  };

  const appendValue = (val) => {
    const ops = ['+', '-', '*', '/', '.', '^'];
    const last = display.value.slice(-1);
    if (ops.includes(last) && ops.includes(val)) return;
    display.value += val;
    updateDisplayFontSize();
  };

  const clearAll = () => {
    display.value = '';
    updateDisplayFontSize();
  };
  
  const backspace = () => {
    display.value = display.value.slice(0, -1);
    updateDisplayFontSize();
  };
  
  const calculate = () => {
    let expression = display.value.trim();
    if (!expression) return;
    try {
      // Replace visual operators with code-friendly ones
      expression = expression.replace(/×/g, '*').replace(/÷/g, '/');
      const result = mathParser.evaluate(expression);
      
      if (typeof result !== 'number' || !Number.isFinite(result)) throw new Error('Invalid');
      
      // Add to history
      history.unshift({ expression: display.value, result: result });
      if (history.length > 20) history.pop(); // Keep history short
      renderHistory();

      display.value = result.toLocaleString('en-US', { maximumFractionDigits: 10 });

    } catch (e) {
      display.value = 'Error';
      console.error(e);
    }
    updateDisplayFontSize();
  };

  const renderHistory = () => {
    historyList.innerHTML = '';
    history.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<div class="expr">${item.expression} =</div><div class="res">${item.result.toLocaleString('en-US')}</div>`;
      li.addEventListener('click', () => {
        display.value = String(item.result);
        updateDisplayFontSize();
        historyPanel.hidden = true;
      });
      historyList.appendChild(li);
    });
  };

  const handleMemory = (action) => {
    const currentValue = parseFloat(display.value) || 0;
    if (action === 'mem-clear') memory = 0;
    else if (action === 'mem-plus') memory += currentValue;
    else if (action === 'mem-recall') {
      display.value = String(memory);
      updateDisplayFontSize();
    }
  };

  buttons.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLButtonElement)) return;
    
    // Feedback: Sound and Background Ripple
    clickAudio.play().catch(() => {}); // Play sound, ignore errors if blocked
    if (window.triggerNetRipple) {
      const rect = t.getBoundingClientRect();
      window.triggerNetRipple(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    const val = t.dataset.val;
    const action = t.dataset.action;

    if (val !== undefined) appendValue(val);
    else if (action === 'clear') clearAll();
    else if (action === 'back') backspace();
    else if (action === 'equals') calculate();
    else if (action && action.startsWith('mem-')) handleMemory(action);
  });
  
  historyToggle.addEventListener('click', () => {
    historyPanel.hidden = !historyPanel.hidden;
    if (!historyPanel.hidden) renderHistory();
  });

  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if ((k >= '0' && k <= '9') || ['+', '-', '*', '/', '.', '(', ')', '^'].includes(k)) appendValue(k);
    else if (k === 'Enter' || k === '=') { e.preventDefault(); calculate(); }
    else if (k === 'Backspace') backspace();
    else if (k === 'Escape' || (k.toLowerCase() === 'c' && !e.ctrlKey)) clearAll();
  });
})();