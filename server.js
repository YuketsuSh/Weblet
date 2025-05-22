const polka = require('polka');
const serve = require('serve-static');
const path = require('path');
const fs = require('fs');
const config = require('./cfg/sites.json');

function createSiteServer({ name, port, directory }) {
  const sitePath = path.resolve(__dirname, directory);
  const app = polka();

  app.use(serve(sitePath));

  app.get('*', (req, res) => {
    fs.readFile(path.join(sitePath, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end(`Erreur serveur (${name})`);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  });

  app.listen(port, () => {
    console.log(`✅ Site "${name}" lancé sur http://localhost:${port}`);
  });
}

config.forEach(createSiteServer);
