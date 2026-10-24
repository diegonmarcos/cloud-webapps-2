import { initParallax } from './modules/parallax';
import { initCategories } from './modules/categories';
import { initAuth } from './modules/auth';
import { updateActionButtons } from './modules/actionButtons';
import { initVmControl } from './modules/vmControl';

document.addEventListener('DOMContentLoaded', () => {
  initParallax();
  initCategories();
  initAuth();
  initVmControl();
  updateActionButtons();
});
