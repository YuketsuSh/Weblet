const polka = require('polka');
const serve = require('serve-static');
const path = require('path');
const fs = require('fs');
const send = require('send');
let servers = [];

function createSiteServer({ name, port, directory }) {
  const sitePath = path.resolve(__dirname, directory);
  const app = polka();

  app.use(serve(sitePath, {
    extensions: ['html'],
  }));

  app.get('*', (req, res) => {
    const indexPath = path.join(sitePath, 'index.html');
    fs.readFile(indexPath, (err, data) => {
      if (err) {
        console.error(`❌ Erreur pour le site "${name}" :`, err.message);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Erreur serveur (${name}) : ${err.message}`);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
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

fs.watchFile('./cfg/sites.json', () => {
  console.log('🔁 Config modifiée. Rechargement des sites...');
  startServers();
});
