# 🌐 Weblet – Serveur multi-sites statiques avec CLI

**Weblet** est un serveur web minimaliste et extensible qui vous permet d’héberger plusieurs **sites statiques** (build React, Vue, Nuxt, etc.) à la manière d’Apache ou Nginx, mais en utilisant [Polka](https://github.com/lukeed/polka) et une configuration simple en JSON.

C’est aussi un **outil CLI** interactif pour gérer vos sites (ajout, suppression, modification, vérification, etc.).

---

## ⚙️ Fonctionnalités

- 🔧 **Multi-sites** avec ports dédiés
- 🧩 **Gestion via JSON**
- 💬 **CLI interactif** intégré
- 🧠 **Healthcheck** automatique
- 🛠️ **Configuration facile**
- ⚡ Ultra léger grâce à Polka

---

## 📦 Structure du projet

```

Weblet/
├── cfg/
│   └── sites.json         # Configuration des sites web
├── manager.js             # Interface CLI (type Apachectl/Nginx)
├── server.js              # Démarrage des serveurs via Polka
├── web/                   # Dossier des sites web
│   ├── velyorix/
│   └── nexus/
├── package.json

````

---

## 🚀 Installation

```bash
git clone https://github.com/YuketsuSh/Weblet.git
cd Weblet
npm install
````

> ⚠️ Utilise Node.js v16 ou supérieur.

---

## 🔌 Lancer le serveur Weblet

Le fichier `server.js` lit le fichier `cfg/sites.json` et démarre un serveur Polka pour **chaque site configuré**.

### ➤ Pour lancer tous les serveurs :

```bash
node server.js
```

### Log console :

```
✅ Site "velyorix" lancé sur http://localhost:9965
✅ Site "nexus" lancé sur http://localhost:9774
```

---

## 💻 Utiliser le CLI interactif

Lance l’outil de gestion de sites Weblet :

```bash
node manager.js
```

Tu entreras dans un shell personnalisé :

```
🌐 Weblet CLI – Gestionnaire de sites

webhost> create monsite sites/monsite 8080
webhost> list
webhost> update monsite 9090 sites/autre-dossier
webhost> health monsite
webhost> delete monsite
webhost> exit
```

---

## 📁 Exemple de configuration (`cfg/sites.json`)

```json
[
  {
    "name": "velyorix",
    "directory": "sites/velyorix",
    "port": 9965
  },
  {
    "name": "othersite",
    "directory": "sites/othersite",
    "port": 9774
  }
]
```

---

## 🛠️ Commandes CLI disponibles

| Commande                       | Description                          |
| ------------------------------ | ------------------------------------ |
| `create <nom> <path> <port>`   | Crée un nouveau site                 |
| `update <nom> <port?> <path?>` | Modifie le port ou le chemin du site |
| `delete <nom>`                 | Supprime un site                     |
| `list`                         | Affiche la liste des sites           |
| `health <nom>`                 | Vérifie si un site est en ligne      |
| `health-all`                   | Vérifie tous les sites               |
| `help`                         | Affiche l'aide                       |
| `exit` ou `quit`               | Ferme le CLI                         |

---

## ⚠️ Limitations

Weblet est conçu uniquement pour héberger des **sites statiques** (HTML/CSS/JS).
Il ne supporte **pas** les langages côté serveur comme :

* PHP
* Python (Django, Flask)
* Ruby, Go, Java, etc.

Pour l'utiliser avec des frameworks modernes, assurez-vous d’avoir **build** votre site (ex : `npm run build` pour React/Vue/Nuxt), puis utilisez le dossier de sortie (souvent `dist/` ou `build/`) comme chemin dans `sites.json`.

---

## 💡 À venir

* Interface Web de gestion
* Support HTTPS
* Reverse Proxy natif
* Déploiement en container
* Système de logs par site

---

## 🧑‍💻 Auteur

Développé par **Yuketsu**
Un outil conçu pour simplifier l'hébergement de sites statiques.

---

## 📄 Licence

[LICENSE MIT](LICENSE) – Utilisation libre et open-source.
