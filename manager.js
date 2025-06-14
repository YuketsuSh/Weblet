const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, spawn } = require('child_process');

const CONFIG_PATH = path.join(__dirname, 'cfg/sites.json');

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

function saveConfig(sites) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(sites, null, 2));
}

function portInUse(port) {
  try {
    execSync(`lsof -i:${port}`);
    return true;
  } catch {
    return false;
  }
}

function createSite(name, directory, port) {
  if (!name || !directory || !port) {
    logError('Syntaxe : create <nom> <path> <port>');
    return;
  }
  const sites = loadConfig();
  if (sites.find(site => site.name === name)) return logError(`Le site "${name}" existe déjà.`);
  if (portInUse(port)) return logError(`Le port ${port} est déjà utilisé.`);
  sites.push({ name, directory, port });
  saveConfig(sites);
  logSuccess(`Site "${name}" créé.`);
}

function deleteSite(name) {
  if (!name){
    logError('Syntaxe: delete <nom>')
    return;
  }
  let sites = loadConfig();
  const site = sites.find(s => s.name === name);
  if (!site) return logError(`Site "${name}" introuvable.`);
  sites = sites.filter(s => s.name !== name);
  saveConfig(sites);
  logInfo(`Site "${name}" supprimé.`);
}

function updateSite(name, port, directory) {
  if (!name) {
    logError('Syntaxe : update <nom> <port?> <path?>');
    return;
  }
  const sites = loadConfig();
  const site = sites.find(s => s.name === name);
  if (!site) return logError(`Site "${name}" introuvable.`);
  if (port && port !== site.port && portInUse(port)) return logError(`Port ${port} déjà utilisé.`);
  if (port) site.port = port;
  if (directory) site.directory = directory;
  saveConfig(sites);
  logSuccess(`Site "${name}" mis à jour.`);
}

function healthCheck(name) {
  if (!name) {
    logError('Syntaxe : health <nom>');
    return;
  }
  const sites = loadConfig();
  const site = sites.find(s => s.name === name);
  if (!site) return logError(`Site "${name}" introuvable.`);
  http.get(`http://localhost:${site.port}`, res => {
    logSuccess(`${name} (${site.port}) : HTTP ${res.statusCode}`);
  }).on('error', () => {
    logError(`${name} (${site.port}) : Hors ligne`);
  });
}

function healthAll() {
  const sites = loadConfig();
  sites.forEach(s => healthCheck(s.name));
}

function listSites() {
  const sites = loadConfig();
  console.log(chalk.yellow.bold('\n📄 Sites configurés :'));
  sites.forEach(site => {
    console.log(` - ${chalk.cyan(site.name)} (${site.port}) => ${site.directory}`);
  });
}

function showHelp() {
  console.log(chalk.green(`
Commandes disponibles :

  create <nom> <path> <port>   Créer un nouveau site
  delete <nom>                Supprimer un site
  update <nom> <port?> <path?> Modifier un site
  list                        Afficher tous les sites
  health <nom>                Vérifier un site
  health-all                  Vérifier tous les sites
  ui <on|off>                 Lancer le gestionnaire web (UI)
  help                        Afficher l’aide
  exit / quit                 Quitter le CLI
`));
}

function logSuccess(msg) {
  console.log(chalk.greenBright(`✅ ${msg}`));
}
function logError(msg) {
  console.log(chalk.redBright(`❌ ${msg}`));
}
function logInfo(msg) {
  console.log(chalk.blueBright(`ℹ️  ${msg}`));
}

console.clear();
console.log(chalk.bold.green(`🌐 Webhost CLI – Gestionnaire de sites`));
showHelp();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: chalk.cyan('webhost> ')
});

let webManagerProcess = null;

rl.prompt();

rl.on('line', (line) => {
  const [cmd, ...args] = line.trim().split(/\s+/);

  switch (cmd) {
    case 'create':
      createSite(args[0], args[1], Number(args[2]));
      break;
    case 'delete':
      deleteSite(args[0]);
      break;
    case 'update':
      updateSite(args[0], args[1] ? Number(args[1]) : undefined, args[2]);
      break;
    case 'list':
      listSites();
      break;
    case 'health':
      healthCheck(args[0]);
      break;
    case 'health-all':
      healthAll();
      break;
    case 'help':
      showHelp();
      break;
    case 'exit':
    case 'quit':
      rl.close();
      return;
    case 'ui':
      if (!args[0]) {
        logError('Syntaxe : ui <on|off>');
        break;
      }
      if (args[0] === 'on') {
        if(webManagerProcess){
          logInfo('🌐 Web Manager déjà lancé');
        }else if (portInUse(6696)){
          logInfo('🌐 Web Manager déjà en ligne sur http://localhost:6696');
        }else{
          webManagerProcess = spawn('node', ['web-manager.js'], {
            detached: true,
            stdio: 'ignore',
          });
          webManagerProcess.unref();
          logSuccess('🧩 Web Manager lancé sur http://localhost:6696');
        }
      }else if (args[0] === 'off') {
        if (webManagerProcess) {
          process.kill(-webManagerProcess.pid);
          webManagerProcess = null;
          logInfo('🛑 Web Manager arrêté');
        }else{
          logInfo('🌐 Web Manager n’est pas lancé');
        }
      }else{
        logError('Syntaxe : ui <on|off>');
      }
      break;
    default:
      console.log(chalk.red(`Commande inconnue : ${cmd}`));
      showHelp();
  }

  rl.prompt();
});
