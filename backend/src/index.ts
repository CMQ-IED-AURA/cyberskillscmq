import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer } from 'http';
import { setupSocket } from './routes/match';

// Ajout des imports manquants
import authRoutes from './routes/auth';
import matchRoutes from './routes/match';

// Extension de l'interface Socket pour ajouter nos propriétés personnalisées
interface CustomSocket extends Socket {
  gameId?: string;
  playerId?: string;
}

dotenv.config();

const app: Application = express();
const server = createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: 'https://cyberskillscmq.vercel.app',
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
});

app.use(cors({
  origin: 'https://cyberskillscmq.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Authorization', 'Content-Type'],
}));

app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}, Body:`, req.body);
  res.on('finish', () => {
    console.log(`Response: ${req.method} ${req.url}, Status: ${res.statusCode}, Headers:`, res.getHeaders());
  });
  next();
});

app.use(express.json());
app.use((req, res, next) => {
  req.app.set('io', io);
  next();
});

// Maintenant ces routes sont correctement importées
app.use('/auth', authRoutes);
app.use('/match', matchRoutes);

const roles = {
  attackers: [
    {
      id: 'web_hacker',
      name: 'Hacker Web',
      icon: '🕸️',
      specialty: 'Attaques web',
      description: 'Trouve des failles dans les sites web.',
      tasks: ['Teste XSS sur la page Contact.', 'Tente SQLi sur la page Connexion.'],
    },
    {
      id: 'network_intruder',
      name: 'Intrus Réseau',
      icon: '📡',
      specialty: 'Piratage réseau',
      description: 'Attaque les services réseau.',
      tasks: ['Scanne les ports.', 'Tente un accès SSH.'],
    },
    {
      id: 'social_engineer',
      name: 'Ingénieur Social',
      icon: '🗣️',
      specialty: 'Manipulation sociale',
      description: 'Récupère des infos via OSINT.',
      tasks: ['Analyse OSINT.', 'Teste des mots de passe faibles.'],
    },
  ],
  defenders: [
    {
      id: 'web_protector',
      name: 'Protecteur Web',
      icon: '🛡️',
      specialty: 'Sécurisation web',
      description: 'Protège le site contre les attaques.',
      tasks: ['Bloque XSS.', 'Surveille les attaques.'],
    },
    {
      id: 'network_guard',
      name: 'Gardien Réseau',
      icon: '🔒',
      specialty: 'Sécurisation réseau',
      description: 'Verrouille les services réseau.',
      tasks: ['Configure le pare-feu.', 'Surveille SSH.'],
    },
    {
      id: 'security_analyst',
      name: 'Analyste Sécurité',
      icon: '🔍',
      specialty: 'Surveillance',
      description: 'Renforce les mots de passe.',
      tasks: ['Applique une politique de mots de passe.', 'Vérifie les logs.'],
    },
  ],
};

const games = new Map();

class Game {
  id: string;
  players: Map<string, any>;
  status: string;
  scores: { attackers: number; defenders: number };
  startTime: number | null;
  duration: number;
  availableRoles: { attackers: any[]; defenders: any[] };

  constructor(gameId: string) {
    this.id = gameId;
    this.players = new Map();
    this.status = 'waiting';
    this.scores = { attackers: 0, defenders: 0 };
    this.startTime = null;
    this.duration = 600000;
    this.availableRoles = this.shuffleRoles();
  }

  shuffleRoles() {
    const attackerRoles = [...roles.attackers];
    const defenderRoles = [...roles.defenders];
    this.shuffle(attackerRoles);
    this.shuffle(defenderRoles);
    return { attackers: attackerRoles, defenders: defenderRoles };
  }

  shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  addPlayer(playerId: string, playerName: string, socket: any) {
    if (this.players.size >= 6) {
      return { success: false, error: 'Partie pleine' };
    }

    if (this.players.has(playerId)) {
      return { success: false, error: 'Joueur déjà connecté' };
    }

    const attackersCount = Array.from(this.players.values()).filter(p => p.team === 'attackers').length;
    const defendersCount = Array.from(this.players.values()).filter(p => p.team === 'defenders').length;

    let team, role;
    if (attackersCount < 3) {
      team = 'attackers';
      role = this.availableRoles.attackers[attackersCount];
    } else if (defendersCount < 3) {
      team = 'defenders';
      role = this.availableRoles.defenders[defendersCount];
    } else {
      return { success: false, error: 'Toutes les équipes sont complètes' };
    }

    const player = {
      id: playerId,
      name: playerName,
      team,
      roleId: role.id,
      roleName: role.name,
      roleIcon: role.icon,
      role,
      socket,
      connected: true,
      joinedAt: Date.now(),
    };

    this.players.set(playerId, player);

    socket.emit('role-assigned', {
      playerId,
      team,
      roleId: role.id,
      roleName: role.name,
      roleIcon: role.icon,
      role,
    });

    console.log(`Joueur ${playerName} assigné au rôle ${role.name} dans l'équipe ${team}`);
    return { success: true, player };
  }

  removePlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (player) {
      player.connected = false;
      this.players.delete(playerId);
      console.log(`Joueur ${player.name} déconnecté`);
    }
  }

  canStart() {
    return this.players.size === 6 && this.status === 'waiting';
  }

  start() {
    if (!this.canStart()) {
      return false;
    }
    this.status = 'playing';
    this.startTime = Date.now();
    setTimeout(() => this.end(), this.duration);
    console.log(`Partie ${this.id} démarrée avec 6 joueurs`);
    return true;
  }

  end() {
    this.status = 'finished';
    this.broadcastToAll('game-ended', {
      scores: this.scores,
      winner: this.scores.attackers > this.scores.defenders ? 'attackers' : 'defenders',
    });
    console.log(`Partie ${this.id} terminée`);
  }


  broadcastToAll(event: string, data: any) {
    this.players.forEach(player => {
      if (player.connected && player.socket) {
        player.socket.emit(event, data);
      }
    });
  }

  getGameState() {
    return {
      id: this.id,
      status: this.status,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        team: p.team,
        roleName: p.roleName,
        roleIcon: p.roleIcon,
        connected: p.connected,
      })),
      scores: this.scores,
      startTime: this.startTime,
    };
  }
}

io.on('connection', (socket: CustomSocket) => {
  console.log('Nouvelle connexion WebSocket:', socket.id);

  socket.on('join-game', (data) => {
    const { gameId, playerName } = data;
    const playerId = socket.id;

    if (!games.has(gameId)) {
      games.set(gameId, new Game(gameId));
      console.log(`Nouvelle partie créée: ${gameId}`);
    }

    const game = games.get(gameId);
    const result = game.addPlayer(playerId, playerName, socket);

    if (result.success) {
      socket.join(gameId);
      socket.gameId = gameId;
      socket.playerId = playerId;

      const gameState = game.getGameState();
      io.to(gameId).emit('game-state-update', gameState);
      console.log(`Joueur ${playerName} a rejoint la partie ${gameId} (${game.players.size}/6)`);
    } else {
      socket.emit('join-error', { error: result.error });
    }
  });

  socket.on('start-game', (data) => {
    const { gameId } = data;
    const game = games.get(gameId);

    if (game && game.canStart()) {
      if (game.start()) {
        const gameState = game.getGameState();
        io.to(gameId).emit('game-state-update', gameState);
        io.to(gameId).emit('game-started');
      }
    }
  });

  socket.on('player-action', (actionData) => {
    const { gameId, type, data, playerName } = actionData;
    const game = games.get(gameId);

    if (game && game.status === 'playing') {
      switch (type) {
        case 'score-update':
          game.updateScore(data.team, data.points);
          break;
        case 'vulnerability-exploited':
        case 'vulnerability-fixed':
          game.broadcastToAll('player-action', {
            ...actionData,
            playerName,
          });
          break;
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Déconnexion WebSocket:', socket.id);
    if (socket.gameId && socket.playerId) {
      const game = games.get(socket.gameId);
      if (game) {
        game.removePlayer(socket.playerId);
        const gameState = game.getGameState();
        io.to(socket.gameId).emit('game-state-update', gameState);
        if (game.players.size === 0) {
          games.delete(socket.gameId);
          console.log(`Partie ${socket.gameId} supprimée (vide)`);
        }
      }
    }
  });
});

setupSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Server running on https://cyberskills.onrender.com:${PORT}`);
  console.log(`WebSocket server ready at wss://cyberskills.onrender.com`);
  console.log('Rôles disponibles:');
  console.log('- Attaquants:', roles.attackers.map(r => r.name).join(', '));
  console.log('- Défenseurs:', roles.defenders.map(r => r.name).join(', '));
});