const polka = require('polka');
const serve = require('serve-static');
const path = require('path');
const fs = require('fs');
let servers = [];

function createSiteServer({ name, port, directory }) {
  const sitePath = path.resolve(__dirname, directory);
  const app = polka();

  app.use(serve(sitePath));
  app.get('*', (req, res) => {
    fs.readFile(path.join(sitePath, 'index.html'), (err, data) => {
      res.writeHead(err ? 500 : 200, { 'Content-Type': 'text/html' });
      res.end(err ? `Erreur serveur (${name})` : data);
    });
  });

  const server = app.listen(port, () => {
    console.log(`✅ Site "${name}" lancé sur http://localhost:${port}`);
  });

  return server.server;
}

function startServers() {
  stopServers();

  const config = JSON.parse(fs.readFileSync('./cfg/sites.json', 'utf-8'));
  servers = config.map(createSiteServer);
}

function stopServers() {
  servers.forEach(server => {
    try {
      server.close();
    } catch (err) {
      console.warn('Erreur lors de la fermeture du serveur :', err.message);
    }
  });
  servers = [];
}

startServers();

fs.watchFile('./cfg/sites.json', (curr, prev) => {
  console.log('🔁 Config modifiée. Rechargement des sites...');
  startServers();
});
