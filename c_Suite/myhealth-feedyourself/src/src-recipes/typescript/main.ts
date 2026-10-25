import type { Recipe, TabId } from './types';
import { recipes } from './data';

// State
let currentTab: TabId = 'breakfast';

// DOM Elements
const getTabButton = (id: TabId): HTMLElement | null =>
  document.getElementById(`btn-${id}`);
const getTabView = (id: TabId): HTMLElement | null =>
  document.getElementById(`view-${id}`);
const getRecipeGrid = (id: TabId): HTMLElement | null =>
  document.getElementById(`${id}-recipes`);

// Initialize
function init(): void {
  renderAllCategories();
  setupTabListeners();
}

// Render all category grids
function renderAllCategories(): void {
  const categories: TabId[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

  categories.forEach(category => {
    const grid = getRecipeGrid(category);
    if (grid) {
      const categoryRecipes = recipes.filter(r => r.category === category);
      grid.innerHTML = categoryRecipes.map(renderRecipeCard).join('');
    }
  });
}

// Render single recipe card
function renderRecipeCard(recipe: Recipe): string {
  return `
    <div class="recipe-card" onclick="openRecipeModal('${recipe.id}')">
      <div class="recipe-card__header">
        <h3 class="recipe-card__title">${recipe.name}</h3>
        <div class="recipe-card__time">${recipe.prepTime + recipe.cookTime} min</div>
      </div>
      <div class="recipe-card__macros">
        <span class="macro macro--calories">${recipe.calories} kcal</span>
        <span class="macro macro--protein">${recipe.protein}g P</span>
        <span class="macro macro--carbs">${recipe.carbs}g C</span>
        <span class="macro macro--fat">${recipe.fat}g F</span>
      </div>
      <div class="recipe-card__tags">
        ${recipe.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
    </div>
  `;
}

// Setup tab listeners
function setupTabListeners(): void {
  const categories: TabId[] = ['breakfast', 'lunch', 'dinner', 'snacks'];
  categories.forEach(id => {
    const btn = getTabButton(id);
    if (btn) {
      btn.addEventListener('click', () => switchTab(id));
    }
  });
}

// Switch tabs
function switchTab(tabId: TabId): void {
  const categories: TabId[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

  // Update buttons
  categories.forEach(id => {
    const btn = getTabButton(id);
    if (btn) {
      btn.classList.toggle('tab-active', id === tabId);
    }
  });

  // Update views
  categories.forEach(id => {
    const view = getTabView(id);
    if (view) {
      view.style.display = id === tabId ? 'block' : 'none';
    }
  });

  currentTab = tabId;
}

// Open recipe modal
function openRecipeModal(recipeId: string): void {
  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe) return;

  const modal = document.getElementById('recipe-modal');
  const title = document.getElementById('modal-title');
  const macros = document.getElementById('modal-macros');
  const ingredients = document.getElementById('modal-ingredients');
  const instructions = document.getElementById('modal-instructions');

  if (modal && title && macros && ingredients && instructions) {
    title.textContent = recipe.name;

    macros.innerHTML = `
      <span class="modal-macro">${recipe.calories} kcal</span>
      <span class="modal-macro">${recipe.protein}g protein</span>
      <span class="modal-macro">${recipe.carbs}g carbs</span>
      <span class="modal-macro">${recipe.fat}g fat</span>
      <span class="modal-macro">${recipe.prepTime + recipe.cookTime} min</span>
      <span class="modal-macro">${recipe.servings} servings</span>
    `;

    ingredients.innerHTML = recipe.ingredients
      .map(ing => `<li>${ing}</li>`)
      .join('');

    instructions.innerHTML = recipe.instructions
      .map(inst => `<li>${inst}</li>`)
      .join('');

    modal.style.display = 'flex';
  }
}

// Close modal
function closeModal(): void {
  const modal = document.getElementById('recipe-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
  const modal = document.getElementById('recipe-modal');
  if (e.target === modal) {
    closeModal();
  }
});

// Expose functions globally
(window as any).switchTab = switchTab;
(window as any).openRecipeModal = openRecipeModal;
(window as any).closeModal = closeModal;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
