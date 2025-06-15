document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = this.username.value.trim();
        const password = this.password.value;

        const res = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        const msgEl = document.getElementById('login-error');

        if (res.ok) {
            window.location.href = '/';
        } else {
            const result = await res.json();
            msgEl.textContent = result?.error || "Erreur de connexion.";
            msgEl.classList.remove('hidden');
        }
    });
});
