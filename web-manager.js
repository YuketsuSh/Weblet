const polka = require('polka');
const serveStatic = require('serve-static');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const http = require('http');
const crypto = require('crypto');
const cookie = require('cookie');

const PORT = 6696;
const CONFIG_PATH = path.join(__dirname, 'cfg/sites.json');
const USERS_PATH = path.join(__dirname, 'cfg/users.json');

const SESSION_SECRET = 'webmanager-secret';
let activeSessions = new Map();

function loadConfig() {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

function loadUsers() {
    if (!fs.existsSync(USERS_PATH)) return [];
    return JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function authMiddleware(req, res, next) {
    const cookies = cookie.parse(req.headers.cookie || '');
    const sessionId = cookies.sessionId;

    if (req.url === '/login.html' && sessionId && activeSessions.has(sessionId)) {
        res.writeHead(302, { Location: '/' });
        return res.end();
    }

    if (req.url.startsWith('/auth/login') || req.url.startsWith('/auth/logout')) {
        return next();
    }

    if (req.url.startsWith('/assets/') || req.url === '/favicon.ico') {
        return next();
    }

    if (sessionId && activeSessions.has(sessionId)) {
        req.user = activeSessions.get(sessionId);
        return next();
    }

    if (req.url.startsWith('/api')) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Non authentifié' }));
    }

    if (req.url !== '/login.html') {
        res.writeHead(302, { Location: '/login.html' });
        return res.end();
    }

    next();
}

const app = polka();

app.use(bodyParser.json());
app.use(authMiddleware);
app.use('/', serveStatic(path.join(__dirname, 'webmanager-static')));

app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();
    const user = users.find(u => u.name === username);

    if (!user || user.hash !== hashPassword(password)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Identifiants invalides' }));
    }

    const sessionId = crypto.randomBytes(16).toString('hex');
    activeSessions.set(sessionId, username);

    res.writeHead(200, {
        'Set-Cookie': cookie.serialize('sessionId', sessionId, {
            httpOnly: true,
            maxAge: 3600,
            path: '/'
        }),
        'Content-Type': 'application/json',
        'Access-Control-Allow-Credentials': 'true'
    });
    res.end(JSON.stringify({ success: true }));
});

app.post('/auth/logout', (req, res) => {
    const cookies = cookie.parse(req.headers.cookie || '');
    const sessionId = cookies.sessionId;

    if (sessionId) activeSessions.delete(sessionId);

    res.writeHead(200, {
        'Set-Cookie': cookie.serialize('sessionId', '', {
            httpOnly: true,
            maxAge: 0,
            path: '/'
        }),
        'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({ success: true }));
});

app.get('/api/sites', (req, res) => {
    try {
        const sites = loadConfig();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(sites));
    } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Impossible de charger la config.' }));
    }
});

app.get('/api/sites/:name', (req, res) => {
    const { name } = req.params;
    try {
        const sites = loadConfig();
        const site = sites.find(s => s.name === name);
        if (!site) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Site introuvable.' }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(site));
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erreur serveur.' }));
    }
});

app.post('/api/sites', (req, res) => {
    const { name, directory, port } = req.body;
    if (!name || !directory || !port) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: 'Nom, directory et port requis.' }));
    }
    try {
        const sites = loadConfig();
        if (sites.find(s => s.name === name)) {
            res.writeHead(409);
            return res.end(JSON.stringify({ error: 'Nom déjà utilisé.' }));
        }
        if (sites.find(s => s.port === port)) {
            res.writeHead(409);
            return res.end(JSON.stringify({ error: 'Port déjà utilisé.' }));
        }
        sites.push({ name, directory, port });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(sites, null, 2));
        res.writeHead(201);
        res.end(JSON.stringify({ success: true }));
    } catch {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Erreur serveur.' }));
    }
});

app.put('/api/sites/:name', (req, res) => {
    const { name } = req.params;
    const { port, directory } = req.body;
    try {
        const sites = loadConfig();
        const site = sites.find(s => s.name === name);
        if (!site) {
            res.writeHead(404);
            return res.end(JSON.stringify({ error: 'Site introuvable.' }));
        }
        if (port && port !== site.port && sites.find(s => s.port === port)) {
            res.writeHead(409);
            return res.end(JSON.stringify({ error: 'Port déjà utilisé.' }));
        }
        if (port) site.port = port;
        if (directory) site.directory = directory;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(sites, null, 2));
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
    } catch {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Erreur serveur.' }));
    }
});

app.delete('/api/sites/:name', (req, res) => {
    const { name } = req.params;
    try {
        let sites = loadConfig();
        const siteExists = sites.some(s => s.name === name);
        if (!siteExists) {
            res.writeHead(404);
            return res.end(JSON.stringify({ error: 'Site introuvable.' }));
        }
        sites = sites.filter(s => s.name !== name);
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(sites, null, 2));
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
    } catch {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Erreur serveur.' }));
    }
});

app.get('/api/health-all', (req, res) => {
    const sites = loadConfig();
    if (sites.length === 0) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify([]));
    }

    let results = [];
    let completed = 0;

    sites.forEach(site => {
        http.get(`http://localhost:${site.port}`, (response) => {
            results.push({
                name: site.name,
                port: site.port,
                status: response.statusCode
            });
            completed++;
            if (completed === sites.length) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(results));
            }
        }).on('error', () => {
            results.push({
                name: site.name,
                port: site.port,
                status: 'offline'
            });
            completed++;
            if (completed === sites.length) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(results));
            }
        });
    });
});

app.get('/api/health/:name', (req, res) => {
    const name = req.params.name;
    const sites = loadConfig();
    const site = sites.find(s => s.name === name);

    if (!site) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: `Site "${name}" introuvable.` }));
    }

    http.get(`http://localhost:${site.port}`, (response) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ name: site.name, port: site.port, status: response.statusCode }));
    }).on('error', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ name: site.name, port: site.port, status: 'offline' }));
    });
});

const server = app.listen(PORT, () => {
    console.log(`🌐 Web Manager UI lancé sur http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Serveur fermé proprement.');
        process.exit(0);
    });
});
