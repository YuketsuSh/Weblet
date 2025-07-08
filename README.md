# Weblet

Un serveur web minimaliste et extensible pour l'hébergement de sites statiques multiples avec une configuration simple en JSON.

## 📝 Description

Weblet est un serveur web léger et flexible conçu pour simplifier l'hébergement de plusieurs sites statiques. Que vous ayez des *builds* React, Vue, Nuxt ou de simples pages HTML, Weblet vous permet de les servir facilement, à la manière d'Apache ou Nginx, mais en utilisant le framework HTTP ultra-rapide [Polka](https://github.com/lukeed/polka) et une configuration intuitive basée sur un fichier JSON. Il est idéal pour le développement local, les démonstrations ou le déploiement de petits projets statiques avec une empreinte minimale.

## ✨ Fonctionnalités

*   **Minimaliste et Léger** : Conçu pour être rapide et consommer peu de ressources.
*   **Hébergement Multi-sites** : Gérez et servez plusieurs sites statiques à partir d'une seule instance de Weblet.
*   **Support des Builds de Frameworks** : Compatible avec les dossiers de *build* générés par React, Vue, Nuxt, Svelte, Angular, et tout autre site statique.
*   **Configuration Simple** : Définissez vos sites et leurs chemins via un fichier JSON clair et facile à modifier.
*   **Basé sur Polka** : Profite de la performance et de la simplicité de Polka pour des requêtes HTTP rapides.
*   **Facile à Déployer** : Pas de configuration complexe de serveur, juste un fichier JSON et une commande `npm start`.

## 📦 Installation

Pour commencer avec Weblet, suivez ces étapes :

### Prérequis

Assurez-vous d'avoir [Node.js](https://nodejs.org/) (version 14 ou supérieure recommandée) et `npm` ou `yarn` installés sur votre machine.

### Étapes

1.  **Clonez le dépôt :**
    ```bash
    git clone https://github.com/YuketsuSh/Weblet.git
    ```

2.  **Naviguez vers le répertoire du projet :**
    ```bash
    cd Weblet
    ```

3.  **Installez les dépendances :**
    ```bash
    npm install
    # ou
    yarn install
    ```

## 🚀 Utilisation

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
🌐 Webhost CLI – Gestionnaire de sites

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
| `ui <on|off>`                  | Lancer/Arrêter le gestionnaire web (UI)           |
| `adduser <nom> <motdepasse>`   | Ajouter un utilisateur               |
| `removeuser <nom>`             | Supprimer un utilisateur             |
| `health <nom>`                 | Vérifie si un site est en ligne      |
| `health-all`                   | Vérifie tous les sites               |
| `help`                         | Affiche l'aide                       |
| `exit` ou `quit`               | Ferme le CLI                         |

## ⚙️ Stack technique

Weblet est construit avec les technologies suivantes :

*   **Node.js** : Environnement d'exécution JavaScript côté serveur.
*   **Polka** : Un framework HTTP minimaliste et ultra-rapide pour Node.js.
*   **JavaScript** : Langage de programmation principal.
*   **JSON** : Format de fichier pour la configuration.
*   **File System (fs)** : Module Node.js pour l'interaction avec le système de fichiers.
*   **Path** : Module Node.js pour la manipulation des chemins de fichiers.

## 🗂️ Structure du projet

Voici un aperçu simplifié de la structure des fichiers et dossiers de Weblet :

```
.
├── src/                      # Code source principal de Weblet
│   ├── index.js              # Point d'entrée du serveur Weblet
│   └── utils/                # Fichiers utilitaires (e.g., gestion de la configuration, service de fichiers)
├── config.json               # Exemple de fichier de configuration pour vos sites
├── sites/                    # Dossier où vous pouvez placer vos dossiers de build de sites statiques
│   ├── mon-app-react/
│   │   └── build/            # Ex: le dossier de build de votre app React
│   ├── mon-blog-vue/
│   │   └── dist/             # Ex: le dossier de build de votre app Vue
│   └── bienvenue-par-defaut/ # Ex: un site par défaut pour les requêtes non-appariées
├── package.json              # Métadonnées du projet et dépendances
├── package-lock.json         # Dépendances verrouillées
├── README.md                 # Ce fichier
└── .gitignore                # Fichiers et dossiers à ignorer par Git
```

## 🔌 API / Endpoints

Weblet est un serveur de fichiers statiques, il ne propose donc pas d'API REST au sens traditionnel. Son "API" réside dans sa capacité à mapper des requêtes HTTP (basées sur le domaine et le chemin) à des fichiers locaux.

*   Chaque `domain` défini dans `config.json` agit comme un point d'entrée pour servir les fichiers depuis son `path` associé.
*   Les requêtes sur le chemin racine (`/`) pour un domaine donné serviront le fichier `index.html` (ou le fichier `index` spécifié) du `path` configuré.
*   Les requêtes pour des chemins spécifiques (`/images/logo.png`) serviront directement le fichier correspondant dans le répertoire du site.
*   Si aucun domaine ne correspond à la requête entrante, et qu'un `defaultSite` est configuré, Weblet servira le contenu de ce site par défaut.

## 🤝 Contribution

Nous encourageons les contributions à Weblet ! Si vous souhaitez contribuer, veuillez suivre ces étapes :

1.  **Fork** le dépôt sur GitHub.
2.  **Clonez** votre fork localement : `git clone https://github.com/YuketsuSh/Weblet.git`
3.  Créez une **branche** pour votre fonctionnalité ou votre correction de bug : `git checkout -b feature/ma-super-fonctionnalite` ou `bugfix/corriger-un-bug`
4.  Effectuez vos **modifications** et assurez-vous que tout fonctionne correctement.
5.  **Commitez** vos changements avec un message clair et descriptif : `git commit -m "feat: Ajout de la fonctionnalité X"`
6.  **Poussez** vos changements vers votre fork : `git push origin feature/ma-super-fonctionnalite`
7.  Ouvrez une **Pull Request** sur le dépôt original de Weblet, en décrivant vos changements.

Veuillez également vous assurer de suivre les bonnes pratiques de codage et d'inclure des tests si vos modifications le justifient.

## 🪪 Licence

Ce projet est sous licence MIT. Vous pouvez trouver plus de détails dans le fichier [LICENSE](LICENSE) à la racine du dépôt.
