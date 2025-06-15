const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, spawn } = require('child_process');
const os = require('os');
const crypto = require('crypto');


const CONFIG_PATH = path.join(__dirname, 'cfg/sites.json');
const USERS_PATH = path.join(__dirname, 'cfg/users.json');

const pidFile = path.join(__dirname, 'web-manager.pid');

function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

function saveConfig(sites) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(sites, null, 2));
}

function portInUse(port) {
  try {
    if (os.platform() === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      return output.trim().length > 0;
    } else {
      execSync(`lsof -i:${port}`);
      return true;
    }
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
  if (!name) {
    logError('Syntaxe: delete <nom>');
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

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function loadUsers() {
  if (!fs.existsSync(USERS_PATH)) return [];
  return JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

function addUser(name, password) {
  if (!name || !password) return logError('Syntaxe : adduser <nom> <motdepasse>');
  const users = loadUsers();
  if (users.find(u => u.name === name)) return logError(`Utilisateur "${name}" existe déjà.`);
  users.push({ name, hash: hashPassword(password) });
  saveUsers(users);
  logSuccess(`Utilisateur "${name}" ajouté.`);
}

function removeUser(name) {
  if (!name) return logError('Syntaxe : removeuser <nom>');
  let users = loadUsers();
  if (!users.find(u => u.name === name)) return logError(`Utilisateur "${name}" introuvable.`);
  users = users.filter(u => u.name !== name);
  saveUsers(users);
  logInfo(`Utilisateur "${name}" supprimé.`);
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
  ui <on|off>                 Lancer/Arrêter le gestionnaire web (UI)
  adduser <nom> <motdepasse>   Ajouter un utilisateur
  removeuser <nom>             Supprimer un utilisateur
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

function isWebManagerRunning() {
  if (!fs.existsSync(pidFile)) return false;
  try {
    const pid = Number(fs.readFileSync(pidFile, 'utf-8'));
    process.kill(pid, 0);
    return pid;
  } catch {
    fs.unlinkSync(pidFile);
    return false;
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForProcessToExit(pid, timeout = 5000) {
  const start = Date.now();
  while (true) {
    try {
      process.kill(pid, 0);
      if (Date.now() - start > timeout) {
        return false;
      }
      await wait(200);
    } catch {
      return true;
    }
  }
}

async function waitPortFree(port, timeout = 5000) {
  const start = Date.now();
  while (portInUse(port)) {
    if (Date.now() - start > timeout) return false;
    await wait(200);
  }
  return true;
}

console.clear();
console.log(chalk.bold.green(`🌐 Webhost CLI – Gestionnaire de sites`));
showHelp();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: chalk.cyan('webhost> ')
});

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
    case 'adduser':
      addUser(args[0], args[1]);
      break;
    case 'removeuser':
      removeUser(args[0]);
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
        const runningPid = isWebManagerRunning();
        if (runningPid) {
          logInfo(`🌐 Web Manager déjà lancé (PID: ${runningPid}) sur http://localhost:6696`);
          break;
        }
        const free = waitPortFree(6696);
        if (!free) {
          logInfo('🌐 Port 6696 déjà utilisé, impossible de lancer le Web Manager.');
          break;
        }
        const child = spawn('node', ['web-manager.js'], {
          detached: true,
          stdio: 'ignore',
        });
        child.unref();
        fs.writeFileSync(pidFile, child.pid.toString());
        logSuccess('🧩 Web Manager lancé sur http://localhost:6696');
      } else if (args[0] === 'off') {
        const runningPid = isWebManagerRunning();
        if (!runningPid) {
          logInfo('🌐 Web Manager n’est pas lancé');
          break;
        }
        try {
          if (os.platform() === 'win32') {
            execSync(`taskkill /PID ${runningPid} /F`);
          } else {
            process.kill(runningPid, 'SIGTERM');
          }

          const exited = waitForProcessToExit(runningPid);
          if (!exited) {
            logError('Le processus Web Manager ne s’est pas arrêté à temps.');
            break;
          }

          if (fs.existsSync(pidFile)) {
            fs.unlinkSync(pidFile);
          }
          logInfo('🛑 Web Manager arrêté');
        } catch (err) {
          logError(`Erreur lors de l'arrêt du Web Manager : ${err.message}`);
        }
      } else {
        logError('Syntaxe : ui <on|off>');
      }
      break;
    default:
      console.log(chalk.red(`Commande inconnue : ${cmd}`));
      showHelp();
  }

  rl.prompt();
});
