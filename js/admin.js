/**
 * MR.FANTASTIC — Live Admin Dashboard Logic
 * Connected to real backend endpoints
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- UI Elements ---
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('adminLoginForm');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const logoutBtn = document.getElementById('logoutBtn');

    // --- 1. AUTHENTICATION LOGIC ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;
        loginBtn.textContent = 'Authenticating...';
        loginError.style.display = 'none';

        try {
            // REAL BACKEND CALL (Currently bypassed by your server.js dev mode)
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (!res.ok) throw new Error('Invalid Credentials');

            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            fetchDashboardData(); // Load tables once logged in

        } catch (err) {
            loginError.style.display = 'block';
            loginBtn.textContent = 'Authenticate →';
        }
    });

    logoutBtn.addEventListener('click', () => {
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'flex';
        document.getElementById('adminPassword').value = '';
        loginBtn.textContent = 'Authenticate →';
    });

    // --- 2. UPLOAD LOGIC ---

    // Portfolio Upload
    document.getElementById('portfolioUploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('portSubmitBtn');
        btn.textContent = 'Uploading...';

        const formData = new FormData();
        formData.append('title', document.getElementById('portTitle').value);
        formData.append('category', document.getElementById('portCategory').value);
        formData.append('image', document.getElementById('portFile').files[0]);

        try {
            const res = await fetch('/api/portfolio', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');

            alert('Portfolio artwork uploaded successfully!');
            e.target.reset();
            fetchDashboardData(); // Refresh the list with the new live data
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            btn.textContent = 'Upload to Portfolio ↑';
        }
    });

    // Shop Upload
    document.getElementById('shopUploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('shopSubmitBtn');
        btn.textContent = 'Uploading...';

        const formData = new FormData();
        formData.append('title', document.getElementById('shopTitle').value);
        formData.append('price', document.getElementById('shopPrice').value); // Set to GH₵ in HTML
        formData.append('category', document.getElementById('shopCategory').value);
        formData.append('description', document.getElementById('shopDesc').value);
        formData.append('image', document.getElementById('shopFile').files[0]);

        try {
            const res = await fetch('/api/shop', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');

            alert('Shop artwork uploaded successfully!');
            e.target.reset();
            fetchDashboardData(); // Refresh the list
        } catch (err) {
            alert('Upload failed: ' + err.message);
        } finally {
            btn.textContent = 'Upload to Shop ↑';
        }
    });

    // --- 3. FETCH & DISPLAY LIVE DATA ---
    async function fetchDashboardData() {
        const orderList = document.getElementById('orderList');
        const artworkList = document.getElementById('artworkList');

        try {
            // Fetch Real Data from the Backend
            const [ordersRes, shopRes, portfolioRes] = await Promise.all([
                fetch('/api/orders'),
                fetch('/api/shop'),
                fetch('/api/portfolio')
            ]);

            const orders = await ordersRes.json();
            const shopItems = await shopRes.json();
            const portfolioItems = await portfolioRes.json();

            // Calculate Real Revenue in GH₵
            const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.amount_paid || 0), 0);

            // Update Stats
            document.getElementById('statRevenue').textContent = `GH₵${totalRevenue.toFixed(2)}`;
            document.getElementById('statOrders').textContent = orders.length;
            document.getElementById('statArtworks').textContent = shopItems.length + portfolioItems.length;

            // Render Live Order List
            if (orders.length === 0) {
                orderList.innerHTML = `<li class="data-row"><div class="data-info"><span class="data-title">No orders yet</span><span class="data-meta">Sales will appear here</span></div></li>`;
            } else {
                orderList.innerHTML = orders.map(order => `
                    <li class="data-row">
                        <div class="data-info">
                            <span class="data-title">${order.customer_name}</span>
                            <span class="data-meta">Item: ${order.artwork_title} · Paid: GH₵${order.amount_paid} · Ref: ${order.payment_ref}</span>
                        </div>
                    </li>
                `).join('');
            }

            // Render Live Artwork List
            const allArt = [
                ...shopItems.map(i => ({...i, source: 'shop'})),
                ...portfolioItems.map(i => ({...i, source: 'portfolio'}))
            ];

            if (allArt.length === 0) {
                artworkList.innerHTML = `<li class="data-row"><div class="data-info"><span class="data-title">Gallery is empty</span></div></li>`;
            } else {
                artworkList.innerHTML = allArt.map(art => `
                    <li class="data-row">
                        <div class="data-info">
                            <span class="data-title">${art.title}</span>
                            <span class="data-meta">${art.source.toUpperCase()} · ${art.category}</span>
                        </div>
                    </li>
                `).join('');
            }

        } catch (err) {
            console.error("Connection to backend failed:", err);
            alert("Failed to load dashboard data. Check terminal for server errors.");
        }
    }
});