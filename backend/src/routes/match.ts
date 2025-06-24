import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import { z } from 'zod';
import bcrypt from 'bcrypt';

interface AuthenticatedRequest extends Request {
    user?: { userId: string; role: string; username?: string };
}

interface Player {
    id: string;
    name: string;
    socketId: string;
    team: 'attackers' | 'defenders';
    roleId: string;
    roleName: string;
    roleIcon: string;
}

interface Game {
    id: string;
    status: 'waiting' | 'playing' | 'ended';
    players: Player[];
    scores: { attackers: number; defenders: number };
    startedAt?: Date;
    endedAt?: Date;
}

const connectedUsers = new Map<string, { userId: string; username: string; socketId: string; role: string }>();
const games = new Map<string, Game>();

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const SALT_ROUNDS = 10;

const roles = {
    attackers: [
        { id: 'web_hacker', name: 'Hacker Web', icon: '🕸️' },
        { id: 'network_intruder', name: 'Intrus Réseau', icon: '📡' },
        { id: 'social_engineer', name: 'Ingénieur Social', icon: '🗣️' },
    ],
    defenders: [
        { id: 'web_protector', name: 'Protecteur Web', icon: '🛡️' },
        { id: 'network_guard', name: 'Gardien Réseau', icon: '🔒' },
        { id: 'security_analyst', name: 'Analyste Sécurité', icon: '🔍' },
    ],
};

// Validation schemas
const joinGameSchema = z.object({
    gameId: z.string().uuid(),
    playerName: z.string().min(1).max(50),
});

const playerActionSchema = z.object({
    playerId: z.string().uuid(),
    gameId: z.string().uuid(),
    type: z.enum(['score-update', 'vulnerability-exploited', 'vulnerability-fixed']),
    data: z.object({
        team: z.enum(['attackers', 'defenders']).optional(),
        points: z.number().int().optional(),
        message: z.string().optional(),
        vulnerability: z.string().optional(),
    }),
    playerName: z.string().min(1).max(50),
    timestamp: z.number(),
});

const rejoinGameSchema = z.object({
    gameId: z.string().uuid(),
    playerId: z.string().uuid(),
});

export const setupSocketIO = (io: SocketIOServer) => {
    io.on('connection', (socket) => {
        console.log(`Utilisateur connecté: ${socket.id}`);

        socket.on('authenticate', async (token: string) => {
            if (!token) {
                console.error('Erreur authenticate: Token non fourni');
                socket.emit('authError', { message: 'Token non fourni' });
                socket.disconnect();
                return;
            }
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username?: string; role: string };
                const user = await prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: { username: true, role: true },
                });

                if (!user || user.role === 'BANNED') {
                    console.error(`Erreur authenticate: Utilisateur ${user?.role === 'BANNED' ? 'banni' : 'non trouvé'}`);
                    socket.emit('authError', { message: user?.role === 'BANNED' ? 'Utilisateur banni' : 'Utilisateur non trouvé' });
                    socket.disconnect();
                    return;
                }

                connectedUsers.set(decoded.userId, {
                    userId: decoded.userId,
                    username: user.username || 'Inconnu',
                    socketId: socket.id,
                    role: user.role,
                });

                console.log('Utilisateur authentifié:', { userId: decoded.userId, username: user.username, role: user.role });

                const allUsers = await prisma.user.findMany({
                    select: { id: true, username: true, teamId: true, role: true },
                });
                const usersWithConnectionInfo = allUsers.map((u) => ({
                    ...u,
                    isConnected: connectedUsers.has(u.id),
                    socketId: connectedUsers.get(u.id)?.socketId || null,
                }));
                io.emit('connectedUsers', usersWithConnectionInfo);

                socket.emit('authenticated', { success: true, userId: decoded.userId });
            } catch (err: any) {
                console.error('Échec de l\'authentification WebSocket:', err.message);
                socket.emit('authError', { message: 'Token invalide' });
                socket.disconnect();
            }
        });

        socket.on('join-game', async (payload) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    console.error('Erreur join-game: Token non fourni');
                    socket.emit('error', { message: 'Token d\'authentification requis' });
                    return;
                }
                const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username?: string; role: string };
                const { gameId, playerName } = joinGameSchema.parse(payload);
                const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

                if (!user || user.role === 'BANNED') {
                    console.error('Erreur join-game: Accès refusé pour utilisateur:', decoded.userId);
                    socket.emit('authError', { message: 'Accès refusé' });
                    return;
                }

                const match = await prisma.match.findUnique({ where: { id: gameId } });
                if (!match) {
                    console.error(`Erreur join-game: Match non trouvé: ${gameId}`);
                    socket.emit('error', { message: 'Match non trouvé' });
                    return;
                }

                let game = games.get(gameId);
                if (!game) {
                    game = {
                        id: gameId,
                        status: 'waiting',
                        players: [],
                        scores: { attackers: 0, defenders: 0 },
                    };
                    games.set(gameId, game);
                }

                if (game.status !== 'waiting') {
                    console.error(`Erreur join-game: Partie ${gameId} déjà ${game.status}`);
                    socket.emit('error', { message: 'Partie non disponible ou déjà commencée' });
                    return;
                }

                if (game.players.find((p) => p.id === decoded.userId)) {
                    console.error(`Erreur join-game: Joueur ${decoded.userId} déjà dans la partie`);
                    socket.emit('error', { message: 'Déjà dans la partie' });
                    return;
                }

                const assignedRoles = game.players.map((p) => p.roleId);
                const team = game.players.filter((p) => p.team === 'attackers').length <= game.players.filter((p) => p.team === 'defenders').length ? 'attackers' : 'defenders';
                const availableRoles = roles[team].filter((r) => !assignedRoles.includes(r.id));
                const role = availableRoles.length > 0 ? availableRoles[Math.floor(Math.random() * availableRoles.length)] : roles[team][Math.floor(Math.random() * roles[team].length)];

                const player: Player = {
                    id: decoded.userId,
                    name: playerName,
                    socketId: socket.id,
                    team,
                    roleId: role.id,
                    roleName: role.name,
                    roleIcon: role.icon,
                };

                game.players.push(player);
                games.set(gameId, game);

                socket.join(gameId);
                socket.emit('role-assigned', {
                    team,
                    roleId: role.id,
                    roleName: role.name,
                    roleIcon: role.icon,
                    playerId: decoded.userId,
                });

                io.to(gameId).emit('game-state-update', {
                    status: game.status,
                    players: game.players,
                });

                console.log(`Joueur ${playerName} a rejoint la partie ${gameId} en tant que ${role.name} (${team})`);
            } catch (err: any) {
                console.error('Erreur join-game:', err.message);
                socket.emit('error', { message: 'Erreur lors de la jointure: ' + err.message });
            }
        });

        socket.on('rejoin-game', async (payload) => {
            try {
                const { gameId, playerId } = rejoinGameSchema.parse(payload);
                const game = games.get(gameId);
                if (!game) {
                    console.error(`Erreur rejoin-game: Partie non trouvée: ${gameId}`);
                    socket.emit('error', { message: 'Partie non trouvée' });
                    return;
                }

                const player = game.players.find((p) => p.id === playerId);
                if (!player) {
                    console.error(`Erreur rejoin-game: Joueur non trouvé: ${playerId}`);
                    socket.emit('error', { message: 'Joueur non trouvé' });
                    return;
                }

                player.socketId = socket.id;
                socket.join(gameId);
                socket.emit('rejoin-success', {
                    team: player.team,
                    roleId: player.roleId,
                    roleName: player.roleName,
                    roleIcon: player.roleIcon,
                    playerId: player.id,
                });

                io.to(gameId).emit('game-state-update', {
                    status: game.status,
                    players: game.players,
                });

                console.log(`Joueur ${player.name} a rejoint la partie ${gameId}`);
            } catch (err: any) {
                console.error('Erreur rejoin-game:', err.message);
                socket.emit('error', { message: 'Erreur lors de la reconnection: ' + err.message });
            }
        });

        socket.on('start-game', async (payload) => {
            try {
                const { gameId } = z.object({ gameId: z.string().uuid() }).parse(payload);
                const token = socket.handshake.auth.token;
                if (!token) {
                    console.error('Erreur start-game: Token non fourni');
                    socket.emit('error', { message: 'Token d\'authentification requis' });
                    return;
                }
                const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
                if (decoded.role !== 'ADMIN') {
                    console.error(`Erreur start-game: Utilisateur ${decoded.userId} n'est pas administrateur`);
                    socket.emit('error', { message: 'Seuls les administrateurs peuvent lancer la partie' });
                    return;
                }
                const game = games.get(gameId);
                console.log(`État du jeu ${gameId} avant start-game:`, game ? { status: game.status, players: game.players.length } : 'non trouvé');
                if (!game || game.status !== 'waiting') {
                    console.error(`Erreur start-game: Partie ${gameId} non disponible ou déjà ${game?.status || 'non trouvée'}`);
                    socket.emit('error', { message: 'Partie non disponible ou déjà commencée' });
                    return;
                }

                const match = await prisma.match.findUnique({
                    where: { id: gameId },
                    include: {
                        redTeam: { include: { users: true } },
                        blueTeam: { include: { users: true } },
                    },
                });
                if (!match) {
                    console.error(`Erreur start-game: Match non trouvé: ${gameId}`);
                    socket.emit('error', { message: 'Match non trouvé' });
                    return;
                }

                const redTeamPlayers = match.redTeam.users;
                const blueTeamPlayers = match.blueTeam.users;
                if (redTeamPlayers.length < 1 || blueTeamPlayers.length < 1) {
                    console.error(`Erreur start-game: Équipes incomplètes pour ${gameId} (Rouge: ${redTeamPlayers.length}, Bleu: ${blueTeamPlayers.length})`);
                    socket.emit('error', { message: 'Chaque équipe doit avoir au moins un joueur' });
                    return;
                }

                // Assign roles to players who haven't joined yet and join all players to the game room
                const allPlayers = [...redTeamPlayers, ...blueTeamPlayers];
                const assignedRoles = game.players.map((p) => p.roleId);
                for (const user of allPlayers) {
                    if (!game.players.find((p) => p.id === user.id)) {
                        const team = redTeamPlayers.some((p) => p.id === user.id) ? 'attackers' : 'defenders';
                        const availableRoles = roles[team].filter((r) => !assignedRoles.includes(r.id));
                        const role = availableRoles.length > 0 ? availableRoles[Math.floor(Math.random() * availableRoles.length)] : roles[team][Math.floor(Math.random() * roles[team].length)];
                        const player: Player = {
                            id: user.id,
                            name: user.username,
                            socketId: connectedUsers.get(user.id)?.socketId || '',
                            team,
                            roleId: role.id,
                            roleName: role.name,
                            roleIcon: role.icon,
                        };
                        game.players.push(player);
                        assignedRoles.push(role.id);
                        const userSocket = connectedUsers.get(user.id);
                        if (userSocket) {
                            console.log(`Ajout de l'utilisateur ${user.id} (${user.username}) au salon ${gameId} avec socketId ${userSocket.socketId}`);
                            io.sockets.sockets.get(userSocket.socketId)?.join(gameId);
                            io.to(userSocket.socketId).emit('role-assigned', {
                                team,
                                roleId: role.id,
                                roleName: role.name,
                                roleIcon: role.icon,
                                playerId: user.id,
                            });
                        } else {
                            console.warn(`Utilisateur ${user.id} (${user.username}) non connecté, ajouté sans socketId`);
                        }
                    }
                }

                game.status = 'playing';
                game.startedAt = new Date();
                games.set(gameId, game);

                io.to(gameId).emit('game-state-update', {
                    status: game.status,
                    players: game.players,
                });

                console.log(`Émission de game-started pour gameId: ${gameId} à ${game.players.length} joueurs:`, game.players.map(p => ({ id: p.id, name: p.name, socketId: p.socketId })));
                io.to(gameId).emit('game-started', { gameId });

                // Set timeout for game duration (30 minutes)
                setTimeout(() => endGame(gameId, io), 30 * 60 * 1000);

                console.log(`Partie ${gameId} démarrée`);
            } catch (err: any) {
                console.error('Erreur start-game:', err.message);
                socket.emit('error', { message: 'Erreur lors du démarrage: ' + err.message });
            }
        });

        socket.on('player-action', (payload) => {
            try {
                const action = playerActionSchema.parse(payload);
                const game = games.get(action.gameId);
                if (!game || game.status !== 'playing') {
                    console.error(`Erreur player-action: Partie ${action.gameId} non active (statut: ${game?.status || 'non trouvée'})`);
                    socket.emit('error', { message: 'Partie non active' });
                    return;
                }

                const player = game.players.find((p) => p.id === action.playerId);
                if (!player) {
                    console.error(`Erreur player-action: Joueur ${action.playerId} non trouvé dans ${action.gameId}`);
                    socket.emit('error', { message: 'Joueur non trouvé' });
                    return;
                }

                if (action.type === 'score-update' && action.data.team && action.data.points) {
                    game.scores[action.data.team] += action.data.points;
                    games.set(action.gameId, game);
                    io.to(action.gameId).emit('score-update', game.scores);
                }

                io.to(action.gameId).emit('player-action', action);

                console.log(`Action ${action.type} par ${action.playerName} dans ${action.gameId}`);
            } catch (err: any) {
                console.error('Erreur player-action:', err.message);
                socket.emit('error', { message: 'Erreur lors de l\'action: ' + err.message });
            }
        });

        socket.on('disconnect', () => {
            console.log(`Utilisateur déconnecté: ${socket.id}`);
            for (const [userId, user] of connectedUsers) {
                if (user.socketId === socket.id) {
                    connectedUsers.delete(userId);
                    prisma.user
                        .findMany({ select: { id: true, username: true, teamId: true, role: true } })
                        .then((users) => {
                            const usersWithConnectionInfo = users.map((u) => ({
                                ...u,
                                isConnected: connectedUsers.has(u.id),
                                socketId: connectedUsers.get(u.id)?.socketId || null,
                            }));
                            io.emit('connectedUsers', usersWithConnectionInfo);
                        })
                        .catch((err) => console.error('Erreur lors de la mise à jour des utilisateurs:', err.message));
                    break;
                }
            }
        });
    });
};

const endGame = (gameId: string, io: SocketIOServer) => {
    const game = games.get(gameId);
    if (!game || game.status !== 'playing') {
        console.log(`Fin de partie ${gameId} ignorée: statut ${game?.status || 'non trouvé'}`);
        return;
    }

    game.status = 'ended';
    game.endedAt = new Date();
    const winner = game.scores.attackers > game.scores.defenders ? 'Attaquants' : game.scores.defenders > game.scores.attackers ? 'Défenseurs' : 'Égalité';

    io.to(gameId).emit('game-ended', {
        winner,
        scores: game.scores,
    });

    games.delete(gameId); // Clean up game
    console.log(`Partie ${gameId} terminée. Gagnant: ${winner}`);
};

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ success: false, message: 'Token manquant' });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            res.status(403).json({ success: false, message: 'Token invalide' });
            return;
        }
        req.user = user;
        next();
    });
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
        return;
    }
    next();
};

const getSocketIO = (req: Request): SocketIOServer | null => {
    try {
        return req.app.get('io') as SocketIOServer;
    } catch (error) {
        console.error('Instance Socket.IO non trouvée:', error);
        return null;
    }
};

// Match routes
router.post('/create', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const redTeam = await prisma.team.create({ data: { name: 'Équipe Rouge' } });
        const blueTeam = await prisma.team.create({ data: { name: 'Équipe Bleue' } });

        const match = await prisma.match.create({
            data: {
                redTeamId: redTeam.id,
                blueTeamId: blueTeam.id,
            },
            include: {
                redTeam: { include: { users: true } },
                blueTeam: { include: { users: true } },
            },
        });

        const io = getSocketIO(req);
        if (io) {
            io.emit('matchCreated', match);
        }

        return res.status(201).json({
            success: true,
            match,
            matchId: match.id,
            redTeamId: redTeam.id,
            blueTeamId: blueTeam.id,
        });
    } catch (err: any) {
        console.error('Erreur lors de la création du match:', err.message);
        res.status(500).json({ success: false, message: 'Erreur lors de la création du match', error: err.message });
    }
});

router.get('/list', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const matches = await prisma.match.findMany({
            include: {
                redTeam: { include: { users: { select: { id: true, username: true, score: true } } } },
                blueTeam: { include: { users: { select: { id: true, username: true, score: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return res.status(200).json({
            success: true,
            matches,
        });
    } catch (err: any) {
        console.error('Erreur lors de la récupération des matchs:', err.message);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des matchs', error: err.message });
    }
});

router.get('/:matchId/teams', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = req.params;

    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                redTeam: { include: { users: { select: { id: true, username: true, score: true } } } },
                blueTeam: { include: { users: { select: { id: true, username: true, score: true } } } },
            },
        });

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match non trouvé' });
        }

        return res.status(200).json({
            success: true,
            redTeam: match.redTeam,
            blueTeam: match.blueTeam,
        });
    } catch (err: any) {
        console.error('Erreur dans la récupération des équipes:', err.message);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des équipes', error: err.message });
    }
});

router.get('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, teamId: true, role: true },
        });

        const usersWithConnectionInfo = users.map((user) => ({
            ...user,
            isConnected: connectedUsers.has(user.id),
            socketId: connectedUsers.get(user.id)?.socketId || null,
        }));

        return res.status(200).json({
            success: true,
            users: usersWithConnectionInfo,
        });
    } catch (err: any) {
        console.error('Erreur lors de la récupération des utilisateurs:', err.message);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des utilisateurs', error: err.message });
    }
});

router.post('/assign-team', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { userId, teamId, matchId } = z
        .object({
            userId: z.string().uuid(),
            teamId: z.string().uuid().nullable(),
            matchId: z.string().uuid(),
        })
        .parse(req.body);

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { team: true },
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                redTeam: { include: { users: true } },
                blueTeam: { include: { users: true } },
            },
        });
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match non trouvé' });
        }

        if (teamId && teamId !== match.redTeamId && teamId !== match.blueTeamId) {
            return res.status(400).json({ success: false, message: 'teamId ne correspond pas au match' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { teamId: null },
        });

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { teamId },
            include: { team: true },
        });

        const updatedMatch = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                redTeam: { include: { users: { select: { id: true, username: true, score: true } } } },
                blueTeam: { include: { users: { select: { id: true, username: true, score: true } } } },
            },
        });

        const io = getSocketIO(req);
        if (io) {
            io.emit('teamAssigned', {
                matchId,
                userId,
                teamId,
                username: user.username,
                updatedMatch,
            });
            const allMatches = await prisma.match.findMany({
                include: {
                    redTeam: { include: { users: { select: { id: true, username: true, score: true } } } },
                    blueTeam: { include: { users: { select: { id: true, username: true, score: true } } } },
                },
            });
            allMatches.forEach((m) => {
                if (m.id !== matchId) {
                    io.emit('teamAssigned', {
                        matchId: m.id,
                        userId,
                        teamId: null,
                        username: user.username,
                        updatedMatch: m,
                    });
                }
            });
            const allUsers = await prisma.user.findMany({
                select: { id: true, username: true, teamId: true, role: true },
            });
            const usersWithConnectionInfo = allUsers.map((u) => ({
                ...u,
                isConnected: connectedUsers.has(u.id),
                socketId: connectedUsers.get(u.id)?.socketId || null,
            }));
            io.emit('connectedUsers', usersWithConnectionInfo);
        }

        return res.status(200).json({
            success: true,
            message: 'Utilisateur assigné avec succès',
            user: updatedUser,
            match: updatedMatch,
        });
    } catch (err: any) {
        console.error('Erreur lors de l\'assignation de l\'équipe:', err.message);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'assignation de l\'équipe', error: err.message });
    }
});

router.post('/ban-user', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = z
        .object({
            userId: z.string().uuid(),
        })
        .parse(req.body);

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, role: true },
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        if (user.role === 'BANNED') {
            return res.status(400).json({ success: false, message: 'Utilisateur déjà banni' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: 'BANNED', teamId: null },
        });

        const io = getSocketIO(req);
        if (io) {
            const connectedUser = connectedUsers.get(userId);
            if (connectedUser) {
                io.to(connectedUser.socketId).emit('authError', { message: 'Vous avez été banni' });
                io.to(connectedUser.socketId).disconnectSockets();
                connectedUsers.delete(userId);
            }
            const allUsers = await prisma.user.findMany({
                select: { id: true, username: true, teamId: true, role: true },
            });
            const usersWithConnectionInfo = allUsers.map((u) => ({
                ...u,
                isConnected: connectedUsers.has(u.id),
                socketId: connectedUsers.get(u.id)?.socketId || null,
            }));
            io.emit('connectedUsers', usersWithConnectionInfo);
        }

        return res.status(200).json({
            success: true,
            message: 'Utilisateur banni avec succès',
            user: updatedUser,
        });
    } catch (err: any) {
        console.error('Erreur lors du bannissement:', err.message);
        res.status(500).json({ success: false, message: 'Erreur lors du bannissement de l\'utilisateur', error: err.message });
    }
});

router.post('/:matchId/reset', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = req.params;

    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
        });
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match non trouvé' });
        }

        const game = games.get(matchId);
        console.log(`Réinitialisation du match ${matchId}. État actuel:`, game ? { status: game.status, players: game.players.length } : 'non trouvé');
        games.delete(matchId); // Reset game state
        const io = getSocketIO(req);
        if (io) {
            io.to(matchId).emit('game-reset', { matchId });
            console.log(`Partie ${matchId} réinitialisée`);
        }

        return res.status(200).json({
            success: true,
            message: 'Match réinitialisé avec succès',
            matchId,
        });
    } catch (err: any) {
        console.error('Erreur lors de la réinitialisation du match:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la réinitialisation du match',
            error: err.message,
        });
    }
});

router.delete('/:matchId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = req.params;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const match = await tx.match.findUnique({
                where: { id: matchId },
                include: {
                    redTeam: { include: { users: true } },
                    blueTeam: { include: { users: true } },
                },
            });

            if (!match) {
                throw new Error('Match non trouvé');
            }

            await tx.user.updateMany({
                where: { teamId: { in: [match.redTeamId, match.blueTeamId] } },
                data: { teamId: null },
            });

            await tx.match.delete({
                where: { id: matchId },
            });

            await tx.team.deleteMany({
                where: { id: { in: [match.redTeamId, match.blueTeamId] } },
            });

            return { match };
        });

        const io = getSocketIO(req);
        if (io) {
            io.emit('matchDeleted', { matchId });
            games.delete(matchId); // Clean up game state
            const allUsers = await prisma.user.findMany({
                select: { id: true, username: true, teamId: true, role: true },
            });
            const usersWithConnectionInfo = allUsers.map((u) => ({
                ...u,
                isConnected: connectedUsers.has(u.id),
                socketId: connectedUsers.get(u.id)?.socketId || null,
            }));
            io.emit('connectedUsers', usersWithConnectionInfo);
        }

        return res.status(200).json({
            success: true,
            message: 'Match supprimé avec succès',
            matchId,
        });
    } catch (err: any) {
        console.error('Erreur lors de la suppression du match:', err.message);
        const statusCode = err.message === 'Match non trouvé' ? 404 : 500;
        return res.status(statusCode).json({
            success: false,
            message: err.message === 'Match non trouvé' ? 'Match non trouvé' : 'Erreur lors de la suppression du match',
            error: err.message,
        });
    }
});

router.post('/register', async (req: Request, res: Response) => {
    const { username, password } = z
        .object({
            username: z.string().min(3).max(50),
            password: z.string().min(8),
        })
        .parse(req.body);

    try {
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Nom d\'utilisateur déjà pris' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await prisma.user.create({
            data: {
                username,
                passwordHash,
                role: 'USER',
            },
        });

        return res.status(201).json({
            success: true,
            message: 'Utilisateur inscrit avec succès',
            user: { id: user.id, username: user.username, role: user.role },
        });
    } catch (err: any) {
        console.error('Erreur lors de l\'inscription:', err.message);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'inscription', error: err.message });
    }
});

router.post('/join', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    return res.status(403).json({
        success: false,
        message: 'Les utilisateurs ne peuvent pas rejoindre une équipe eux-mêmes',
    });
});

router.post('/leave-team', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    return res.status(403).json({
        success: false,
        message: 'Les utilisateurs ne peuvent pas quitter une équipe eux-mêmes',
    });
});

export default router;