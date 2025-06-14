const polka = require('polka');
const serveStatic = require('serve-static');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const PORT = 6696;
const CONFIG_PATH = path.join(__dirname, 'cfg/sites.json');

function loadConfig() {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

const app = polka();

app.use('/static', serveStatic(path.join(__dirname, 'webmanager-static')));
app.use(bodyParser.json());

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

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(fs.readFileSync(path.join(__dirname, 'webmanager-static/index.html')));
});

app.listen(PORT, () => {
    console.log(`🌐 Web Manager UI lancé sur http://localhost:${PORT}`);
});