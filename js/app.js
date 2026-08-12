// app.js — Router & App Initialization

import { renderDashboard } from './views/dashboard.js';
import { renderDeckDetail } from './views/deckDetail.js';
import { renderStudy } from './views/study.js';
import { renderSettings } from './views/settings.js';
import { renderStats } from './views/stats.js';
import { preloadVoices } from './utils/speech.js';

const appContainer = document.getElementById('app');
let currentCleanup = null;

function route() {
  // Cleanup previous view
  if (typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  const hash = location.hash || '#dashboard';
  const parts = hash.slice(1).split('/');
  const view = parts[0];

  // Scroll to top on view change
  window.scrollTo(0, 0);

  // Add transition
  appContainer.classList.add('view-fade-out');

  requestAnimationFrame(() => {
    switch (view) {
      case 'dashboard':
        renderDashboard(appContainer);
        break;
      case 'deck':
        renderDeckDetail(appContainer, parts[1]);
        break;
      case 'study':
        currentCleanup = renderStudy(appContainer, parts[1], parts[2]);
        break;
      case 'settings':
        renderSettings(appContainer);
        break;
      case 'stats':
        renderStats(appContainer);
        break;
      default:
        renderDashboard(appContainer);
    }

    appContainer.classList.remove('view-fade-out');
    appContainer.classList.add('view-fade-in');
    setTimeout(() => appContainer.classList.remove('view-fade-in'), 300);
  });
}

// Initialize
async function init() {
  // Preload TTS voices
  await preloadVoices();

  // Background auto cloud sync
  import('./cloud.js').then(cloud => {
    cloud.pullFromCloud().then(res => {
      if (res && res.success) {
        route(); // Refresh view if new data pulled
      }
    }).catch(() => {});
  });

  // Route
  window.addEventListener('hashchange', route);
  route();
}

init();
