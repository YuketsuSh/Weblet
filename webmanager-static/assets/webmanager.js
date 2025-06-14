const API_BASE = '/api';

const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const messageEl = document.getElementById('message');
const sitesListUl = document.getElementById('sites-list-ul');
const globalHealthStatus = document.getElementById('global-health-status');

const formSection = document.getElementById('site-form');
const formEl = document.getElementById('site-form-el');
const formTitle = document.getElementById('form-title');
const cancelBtn = document.getElementById('cancel-btn');

const modal = document.getElementById('modal');
const modalText = document.getElementById('modal-text');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const overlay = document.getElementById('overlay');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');

let editingSiteName = null;
let siteToDelete = null;

function openSidebar() {
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
}
function closeSidebar() {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
}
sidebarToggle.addEventListener('click', openSidebar);
mobileMenuBtn.addEventListener('click', openSidebar);
overlay.addEventListener('click', closeSidebar);

tabs.forEach(btn => {
    btn.addEventListener('click', () => {
        setActiveTab(btn.dataset.tab);
        closeSidebar();
    });
});

function setActiveTab(tabName) {
    tabContents.forEach(section => {
        section.classList.toggle('hidden', section.id !== tabName);
    });

    tabs.forEach(btn => {
        btn.classList.toggle('bg-blue-700', btn.dataset.tab === tabName);
        btn.classList.toggle('text-white', btn.dataset.tab === tabName);
        btn.classList.toggle('text-blue-300', btn.dataset.tab !== tabName);
    });

    if (tabName !== 'site-form') resetForm();

    if (tabName === 'dashboard') loadGlobalHealth();
    if (tabName === 'sites-list') loadSites();
}

function showMessage(text, type = 'info') {
    messageEl.textContent = text;
    messageEl.className = 'p-3 rounded mb-4 text-center text-sm transition-opacity duration-500';

    if (type === 'success') {
        messageEl.classList.add('bg-green-800', 'text-green-200', 'border', 'border-green-600', 'shadow-glass');
    } else if (type === 'error') {
        messageEl.classList.add('bg-red-800', 'text-red-300', 'border', 'border-red-600', 'shadow-glass');
    } else {
        messageEl.classList.add('bg-blue-800', 'text-blue-300', 'border', 'border-blue-600', 'shadow-glass');
    }

    messageEl.style.opacity = '1';
    setTimeout(() => {
        messageEl.style.opacity = '0';
        setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = '';
        }, 500);
    }, 4500);
}

async function loadGlobalHealth() {
    globalHealthStatus.innerHTML = '<p class="text-blue-300 italic">Chargement des statuts...</p>';
    try {
        const res = await fetch(`${API_BASE}/health-all`);
        if (!res.ok) throw new Error('Erreur lors du chargement des statuts');

        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
            globalHealthStatus.innerHTML = '<p class="text-blue-300 italic">Aucun statut disponible.</p>';
            return;
        }

        globalHealthStatus.innerHTML = '';
        data.forEach(siteStatus => {
            const statusColor = siteStatus.status === 'offline' ? 'text-red-500' : 'text-green-400';
            const statusText = siteStatus.status === 'offline' ? '🛑 Hors ligne' : `✅ HTTP ${siteStatus.status}`;

            const card = document.createElement('div');
            card.className = 'bg-white/10 backdrop-blur-md rounded-lg p-4 mb-4 flex justify-between items-center shadow-glass';

            card.innerHTML = `
                <div>
                    <strong class="text-lg">${siteStatus.name}</strong><br/>
                    <span class="text-sm font-mono text-gray-300">Port: ${siteStatus.port}</span>
                </div>
                <div class="${statusColor} font-semibold">${statusText}</div>
            `;

            globalHealthStatus.appendChild(card);
        });
    } catch (err) {
        globalHealthStatus.innerHTML = `<p class="text-red-500 font-semibold">${err.message}</p>`;
    }
}

async function loadSites() {
    sitesListUl.innerHTML = '<li class="text-blue-300 italic">Chargement...</li>';
    try {
        const res = await fetch(`${API_BASE}/sites`);
        if (!res.ok) throw new Error('Erreur chargement des sites');
        const sites = await res.json();

        if (!sites.length) {
            sitesListUl.innerHTML = '<li class="text-blue-300 italic">Aucun site configuré.</li>';
            return;
        }

        sitesListUl.innerHTML = '';
        sites.forEach(site => {
            const li = document.createElement('li');
            li.className = 'bg-white/10 backdrop-blur-md rounded-lg p-4 mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center shadow-glass';

            li.innerHTML = `
                <div>
                    <strong class="text-lg">${site.name}</strong><br/>
                    <span class="text-sm font-mono text-gray-300">Port: ${site.port}</span><br/>
                    <span class="text-sm text-gray-400">Répertoire: ${site.directory}</span>
                    <div class="mt-1 text-sm text-gray-400 italic" id="status-${site.name}">Statut: Chargement...</div>
                </div>
                <div class="mt-3 sm:mt-0 flex space-x-2">
                    <button class="edit-btn bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition-shadow shadow-md" data-name="${site.name}">Modifier</button>
                    <button class="delete-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-shadow shadow-md" data-name="${site.name}">Supprimer</button>
                    <button class="health-btn bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-shadow shadow-md" data-name="${site.name}">Vérifier santé</button>
                </div>
            `;

            sitesListUl.appendChild(li);

            fetchHealth(site.name);
        });
    } catch (err) {
        sitesListUl.innerHTML = `<li class="text-red-500 font-semibold">${err.message}</li>`;
    }
}

async function fetchHealth(siteName) {
    const statusEl = document.getElementById(`status-${siteName}`);
    if (!statusEl) return;

    statusEl.textContent = 'Statut: ⏳ Vérification...';
    statusEl.classList.remove('text-red-500', 'text-green-400');

    try {
        const res = await fetch(`${API_BASE}/health/${encodeURIComponent(siteName)}`);
        if (!res.ok) throw new Error('Erreur lors de la vérification');

        const data = await res.json();

        if (data.status === 'offline') {
            statusEl.textContent = 'Statut: 🛑 Hors ligne';
            statusEl.classList.add('text-red-500');
            statusEl.classList.remove('text-green-400');
        } else {
            statusEl.textContent = `Statut: ✅ HTTP ${data.status}`;
            statusEl.classList.add('text-green-400');
            statusEl.classList.remove('text-red-500');
        }
    } catch {
        statusEl.textContent = 'Statut: ❌ Erreur';
        statusEl.classList.add('text-red-500');
        statusEl.classList.remove('text-green-400');
    }
}

function fillForm(site) {
    formTitle.textContent = `Modifier le site "${site.name}"`;
    formEl.name.value = site.name;
    formEl.name.disabled = true;
    formEl.directory.value = site.directory;
    formEl.port.value = site.port;
    cancelBtn.classList.remove('hidden');
    editingSiteName = site.name;

    setActiveTab('site-form');
}

function resetForm() {
    formTitle.textContent = 'Créer un site';
    formEl.reset();
    formEl.name.disabled = false;
    cancelBtn.classList.add('hidden');
    editingSiteName = null;
}

formEl.addEventListener('submit', async e => {
    e.preventDefault();

    const payload = {
        name: formEl.name.value.trim(),
        directory: formEl.directory.value.trim(),
        port: Number(formEl.port.value),
    };

    try {
        let url = `${API_BASE}/sites`;
        let method = 'POST';
        if (editingSiteName) {
            url = `${API_BASE}/sites/${encodeURIComponent(editingSiteName)}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Erreur lors de la sauvegarde');
        }

        showMessage(editingSiteName ? 'Site modifié avec succès.' : 'Site créé avec succès.', 'success');
        resetForm();
        setActiveTab('sites-list');
        loadSites();
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

cancelBtn.addEventListener('click', () => {
    resetForm();
    setActiveTab('sites-list');
});

sitesListUl.addEventListener('click', e => {
    if (e.target.classList.contains('edit-btn')) {
        const siteName = e.target.dataset.name;
        fetch(`${API_BASE}/sites/${encodeURIComponent(siteName)}`)
            .then(res => res.json())
            .then(site => fillForm(site))
            .catch(() => showMessage('Erreur chargement site', 'error'));
    } else if (e.target.classList.contains('delete-btn')) {
        siteToDelete = e.target.dataset.name;
        modalText.textContent = `Voulez-vous vraiment supprimer le site "${siteToDelete}" ?`;
        modal.classList.remove('hidden');
    } else if (e.target.classList.contains('health-btn')) {
        const siteName = e.target.dataset.name;
        fetchHealth(siteName);
    }
});

modalCancel.addEventListener('click', () => {
    siteToDelete = null;
    modal.classList.add('hidden');
});

modalConfirm.addEventListener('click', async () => {
    if (!siteToDelete) return;
    try {
        const res = await fetch(`${API_BASE}/sites/${encodeURIComponent(siteToDelete)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erreur suppression');
        showMessage(`Site "${siteToDelete}" supprimé.`, 'success');
        siteToDelete = null;
        modal.classList.add('hidden');
        loadSites();
    } catch (err) {
        showMessage(err.message, 'error');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    setActiveTab('dashboard');
});
