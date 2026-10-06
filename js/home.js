/**
 * MR.FANTASTIC — Homepage Selected Works Pipeline
 * Grabs the latest 6 additions uploaded to the database automatically
 */

document.addEventListener('DOMContentLoaded', () => {
  async function loadHomeFeaturedWorks() {
    const worksGrid = document.querySelector('.works-grid');
    if (!worksGrid) return;

    try {
      const response = await fetch('https://mrfantastic-backend.onrender.com/api/shop/items/');
      if (!response.ok) throw new Error('Failed to retrieve storefront showcase feed');

      const data = await response.json();
      const items = data.results || data;

      // Slice the array payload cleanly to show exactly your 6 latest uploads
      const featuredItems = items.slice(0, 6);
      
      // Wipe the static fallback items
      worksGrid.innerHTML = '';

      featuredItems.forEach(item => {
        const itemContainer = document.createElement('div');
        itemContainer.className = 'work-item';
        
        const displayTags = item.categories.map(c => c.display_name).join(' · ');

        itemContainer.innerHTML = `
          <img src="${item.image}" alt="${item.title} — Featured Work" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)">
          <div class="work-info">
            <p class="work-name">${item.title}</p>
            <p class="work-tag">${displayTags}</p>
          </div>
        `;
        
        // Let user easily jump straight into store modal triggers upon interaction
        itemContainer.addEventListener('click', () => {
          window.location.href = 'shop.html';
        });

        worksGrid.appendChild(itemContainer);
      });

    } catch (err) {
      console.error('Error refreshing homepage selected works carousel:', err);
    }
  }

  loadHomeFeaturedWorks();
});