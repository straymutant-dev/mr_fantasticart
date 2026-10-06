/**
 * MR.FANTASTIC — Dynamic Portfolio Engine
 * Hooks directly to your Django backend portfolio streams
 * Handles dynamic grid generation, lightbox controls, and category filtering
 */

document.addEventListener('DOMContentLoaded', () => {
  const portfolioGrid = document.getElementById('portfolioGrid');
  const filterButtons = document.querySelectorAll('#filters .filter-btn');
  
  /* ── Escape HTML Utility ───────────────────────────── */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ── Fetch & Hydrate Gallery Items ──────────────────── */
  async function loadDynamicPortfolio() {
    if (!portfolioGrid) return;

    try {
      const response = await fetch('https://mrfantastic-backend.onrender.com/api/portfolio/items/');
      if (!response.ok) throw new Error('Portfolio stream server connection dropped');

      const data = await response.json();
      const items = data.results || data;

      // Wipe out fallback placeholder layout structures completely
      portfolioGrid.innerHTML = '';

      if (items.length === 0) {
        portfolioGrid.innerHTML = `<p class="no-items" style="grid-column: 1/-1; text-align: center; color: #555; padding: 4rem 0; font-family: 'Barlow Condensed'; font-size: 1.2rem;">Showcase entries are currently being uploaded. Check back soon!</p>`;
        return;
      }

      items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'portfolio-item';
        
        // Normalize underscore codes into dash strings to match your CSS filtering tags
        const categoryString = item.categories.map(c => c.code.replace('_', '-')).join(' ');
        const displayTags = item.categories.map(c => c.display_name).join(' · ');

        // Hydrate data attributes required by filtering and presentation layout schemes
        itemCard.dataset.cat = categoryString;
        itemCard.dataset.title = item.title;
        itemCard.dataset.tag = displayTags;

        itemCard.innerHTML = `
          <img src="${item.image}" alt="${escapeHtml(item.title)} — Digital illustration by MR.FANTASTIC" loading="lazy">
          <div class="portfolio-expand">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </div>
          <div class="portfolio-info">
            <p class="work-name">${escapeHtml(item.title)}</p>
            <p class="work-tag">${escapeHtml(displayTags)}</p>
          </div>
        `;

        // Maintain full lightbox navigation connectivity seamlessly
        itemCard.addEventListener('click', () => {
          const lightbox = document.getElementById('lightbox');
          const lightboxImg = document.getElementById('lightboxImg');
          const lightboxTitle = document.getElementById('lightboxTitle');
          const lightboxTag = document.getElementById('lightboxTag');

          if (lightbox && lightboxImg) {
            lightboxImg.src = item.image;
            if (lightboxTitle) lightboxTitle.textContent = item.title;
            if (lightboxTag) lightboxTag.textContent = displayTags;
            lightbox.classList.add('open');
          }
        });

        portfolioGrid.appendChild(itemCard);
      });

      // Hook up category search terms filter logic once layout is fully populated
      initializeCategoryFilters();

    } catch (err) {
      console.error('Error fetching real-time showcase gallery data:', err);
    }
  }

  /* ── Dynamic Category Filtering Controller ──────────── */
  function initializeCategoryFilters() {
    if (filterButtons.length === 0) return;

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Toggle layout active button styling states
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const selectedFilter = button.dataset.filter;
        const portfolioItems = document.querySelectorAll('.portfolio-item');

        portfolioItems.forEach(item => {
          // Parse data target codes matching user selection
          const itemCategories = item.dataset.cat ? item.dataset.cat.split(' ') : [];
          
          if (selectedFilter === 'all' || itemCategories.includes(selectedFilter)) {
            item.style.display = ''; // Shows the element using standard layout rules
          } else {
            item.style.display = 'none'; // Hides unassigned variations
          }
        });
      });
    });
  }

  // Fire live initialization sequence immediately
  loadDynamicPortfolio();
});