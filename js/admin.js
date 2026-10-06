/**
 * MR.FANTASTIC — DUMMY Admin Dashboard Logic
 * UI Testing only. No backend connection. 
 * Instant bypass enabled.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- UI Elements ---
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('adminLoginForm');
    const logoutBtn = document.getElementById('logoutBtn');

    // --- 1. INSTANT BYPASS ON LOAD ---
    // This immediately hides the login and shows the dashboard
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    loadDummyData();

    // --- 2. LOGIN BUTTON LOGIC (In case you log out and want to get back in) ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        loadDummyData(); 
    });

    // --- 3. LOGOUT LOGIC ---
    logoutBtn.addEventListener('click', () => {
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'flex';
        document.getElementById('adminPassword').value = '';
    });

    // Prevent default form submissions on the upload buttons so the page doesn't refresh
    document.getElementById('portfolioUploadForm').addEventListener('submit', (e) => e.preventDefault());
    document.getElementById('shopUploadForm').addEventListener('submit', (e) => e.preventDefault());

    // --- 4. DUMMY DATA LOADER ---
    function loadDummyData() {
        // Stats
        document.getElementById('statRevenue').textContent = "GH₵0.00";
        document.getElementById('statOrders').textContent = "1";
        document.getElementById('statArtworks').textContent = "1";

        // Fake Order
        document.getElementById('orderList').innerHTML = `
            <li class="data-row">
                <div class="data-info">
                    <span class="data-title">UI Test Customer</span>
                    <span class="data-meta">Item: UI Test Artwork · Paid: GH₵0.00 · Ref: MF_TEST_000</span>
                </div>
            </li>
        `;

        // Fake Artwork
        document.getElementById('artworkList').innerHTML = `
            <li class="data-row">
                <div class="data-info">
                    <span class="data-title">UI Test Artwork</span>
                    <span class="data-meta">SHOP · UI Test</span>
                </div>
                <button class="btn-delete">Delete</button>
            </li>
        `;
    }
});