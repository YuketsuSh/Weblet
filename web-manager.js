const polka = require('polka');
const serveStatic = require('serve-static');
const path = require('path');
const fs = require('fs');

const PORT = 6696;
const CONFIG_PATH = path.join(__dirname, 'cfg/sites.json');

const app = polka();

app.use('/static', serveStatic(path.join(__dirname, 'webmanager-static')));

app.get('/api/sites', (req, res) => {
    const sites = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    res.end(JSON.stringify(sites));
});

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(fs.readFileSync(path.join(__dirname, 'webmanager-static/index.html')));
});

app.listen(PORT, () => {
    console.log(`🌐 Web Manager UI lancé sur http://localhost:${PORT}`);
});