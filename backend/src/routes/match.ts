import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';

interface AuthenticatedRequest extends Request {
    user?: { userId: string; role: string; username?: string };
}

const connectedUsers = new Map<string, { userId: string; username: string; socketId: string; role: string }>();

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

export const setupSocket = (io: SocketIOServer) => {
    io.on('connection', (socket) => {
        console.log('Utilisateur connecté:', socket.id);

        socket.on('authenticate', async (token: string) => {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username?: string; role: string };
                const user = await prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: { username: true, role: true }
                });

                if (!user) {
                    throw new Error('Utilisateur non trouvé');
                }

                connectedUsers.set(decoded.userId, {
                    userId: decoded.userId,
                    username: user.username || 'Inconnu',
                    socketId: socket.id,
                    role: user.role,
                });

                console.log('Utilisateur authentifié:', { userId: decoded.userId, username: user.username, role: user.role });

                // Envoyer la liste complète des utilisateurs avec leur statut de connexion
                const allUsers = await prisma.user.findMany({
                    select: { id: true, username: true, teamId: true, role: true }
                });
                const usersWithConnectionInfo = allUsers.map(user => ({
                    ...user,
                    isConnected: connectedUsers.has(user.id),
                    socketId: connectedUsers.get(user.id)?.socketId || null,
                }));
                io.emit('connectedUsers', usersWithConnectionInfo);

                socket.emit('authenticated', { success: true, userId: decoded.userId });

            } catch (err: any) {
                console.error('Échec de l\'authentification WebSocket:', err.message);
                socket.emit('authError', { message: 'Token invalide' });
                socket.disconnect();
            }
        });

        socket.on('disconnect', () => {
            console.log('Utilisateur déconnecté:', socket.id);
            for (const [userId, user] of connectedUsers) {
                if (user.socketId === socket.id) {
                    connectedUsers.delete(userId);
                    console.log(`Utilisateur ${user.username} retiré de la liste des connectés`);
                    // Mettre à jour la liste des utilisateurs
                    prisma.user.findMany({
                        select: { id: true, username: true, teamId: true, role: true }
                    }).then(allUsers => {
                        const usersWithConnectionInfo = allUsers.map(u => ({
                            ...u,
                            isConnected: connectedUsers.has(u.id),
                            socketId: connectedUsers.get(u.id)?.socketId || null,
                        }));
                        io.emit('connectedUsers', usersWithConnectionInfo);
                    });
                    break;
                }
            }
        });
    });
};

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.error('Token manquant dans la requête');
        res.status(401).json({ success: false, message: 'Token manquant' });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            console.error('Erreur de vérification du token:', err.message);
            res.status(403).json({ success: false, message: 'Token invalide' });
            return;
        }
        req.user = user;
        next();
    });
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'ADMIN') {
        console.error('Accès non autorisé: utilisateur non admin', { user: req.user });
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
            }
        });

        console.log('Match créé:', { matchId: match.id, redTeamId: redTeam.id, blueTeamId: blueTeam.id });

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
        console.error('Erreur lors de la création du match:', err.message, err.stack);
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
            orderBy: { createdAt: 'desc' }
        });

        console.log('Matchs récupérés:', matches.length);
        return res.status(200).json({
            success: true,
            matches,
        });
    } catch (err: any) {
        console.error('Erreur lors de la récupération des matchs:', err.message, err.stack);
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
            console.log('Match non trouvé:', matchId);
            return res.status(404).json({ success: false, message: 'Match non trouvé' });
        }

        console.log('Équipes récupérées pour match:', matchId);
        return res.status(200).json({
            success: true,
            redTeam: match.redTeam,
            blueTeam: match.blueTeam,
        });
    } catch (err: any) {
        console.error('Erreur lors de la récupération des équipes:', err.message, err.stack);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des équipes', error: err.message });
    }
});

router.get('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, teamId: true, role: true }
        });

        const usersWithConnectionInfo = users.map(user => {
            const connectedUser = connectedUsers.get(user.id);
            return {
                ...user,
                isConnected: !!connectedUser,
                socketId: connectedUser?.socketId || null,
                role: user.role
            };
        });

        console.log('Utilisateurs envoyés:', usersWithConnectionInfo.length);
        return res.status(200).json({
            success: true,
            users: usersWithConnectionInfo,
        });
    } catch (err: any) {
        console.error('Erreur lors de la récupération des utilisateurs:', err.message, err.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des utilisateurs',
            error: err.message
        });
    }
});

router.post('/assign-team', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { userId, teamId, matchId } = req.body;

    console.log('Requête assign-team reçue:', { userId, teamId, matchId, body: req.body });

    try {
        if (!userId || !matchId) {
            console.error('Paramètres manquants:', { userId, matchId });
            return res.status(400).json({ success: false, message: 'userId et matchId sont requis' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { team: true }
        });
        if (!user) {
            console.error('Utilisateur non trouvé:', userId);
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                redTeam: { include: { users: true } },
                blueTeam: { include: { users: true } }
            },
        });
        if (!match) {
            console.error('Match non trouvé:', matchId);
            return res.status(404).json({ success: false, message: 'Match non trouvé' });
        }

        if (teamId && teamId !== match.redTeamId && teamId !== match.blueTeamId) {
            console.error('teamId invalide:', { teamId, redTeamId: match.redTeamId, blueTeamId: match.blueTeamId });
            return res.status(400).json({
                success: false,
                message: 'teamId ne correspond pas au match'
            });
        }

        // Retirer l'utilisateur de toutes les autres équipes avant assignation
        await prisma.user.update({
            where: { id: userId },
            data: { teamId: null }
        });

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { teamId },
            include: { team: true }
        });

        const updatedMatch = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                redTeam: { include: { users: { select: { id: true, username: true, score: true } } } },
                blueTeam: { include: { users: { select: { id: true, username: true, score: true } } } },
            },
        });

        console.log('Utilisateur assigné:', { userId, teamId, matchId });

        const io = getSocketIO(req);
        if (io) {
            io.emit('teamAssigned', {
                matchId,
                userId,
                teamId,
                username: user.username,
                updatedMatch
            });
            // Mettre à jour tous les matchs pour refléter le retrait de l'utilisateur des autres équipes
            const allMatches = await prisma.match.findMany({
                include: {
                    redTeam: { include: { users: { select: { id: true, username: true, score: true } } } },
                    blueTeam: { include: { users: { select: { id: true, username: true, score: true } } } },
                }
            });
            allMatches.forEach(m => {
                if (m.id !== matchId) {
                    io.emit('teamAssigned', {
                        matchId: m.id,
                        userId,
                        teamId: null,
                        username: user.username,
                        updatedMatch: m
                    });
                }
            });
            // Mettre à jour la liste des utilisateurs
            const allUsers = await prisma.user.findMany({
                select: { id: true, username: true, teamId: true, role: true }
            });
            const usersWithConnectionInfo = allUsers.map(u => ({
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
            match: updatedMatch
        });
    } catch (err: any) {
        console.error('Erreur lors de l\'assignation de l\'équipe:', err.message, err.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'assignation de l\'équipe',
            error: err.message
        });
    }
});

router.post('/ban-user', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { userId, ipAddress } = req.body;

    console.log('Requête ban-user reçue:', { userId, ipAddress });

    try {
        if (!userId || !ipAddress) {
            console.error('Paramètres manquants:', { userId, ipAddress });
            return res.status(400).json({ success: false, message: 'userId et ipAddress sont requis' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, role: true }
        });
        if (!user) {
            console.error('Utilisateur non trouvé:', userId);
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        if (user.role === 'BANNED') {
            console.warn('Utilisateur déjà banni:', userId);
            return res.status(400).json({ success: false, message: 'Utilisateur déjà banni' });
        }

        // Mettre à jour le rôle de l'utilisateur à BANNED
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role: 'BANNED', teamId: null }
        });

        // Ajouter l'IP à la liste des IP bannies
        await prisma.bannedIP.create({
            data: {
                ipAddress,
                userId,
                bannedAt: new Date()
            }
        });

        console.log('Utilisateur banni:', { userId, ipAddress });

        const io = getSocketIO(req);
        if (io) {
            // Déconnecter l'utilisateur s'il est connecté
            const connectedUser = connectedUsers.get(userId);
            if (connectedUser) {
                io.to(connectedUser.socketId).emit('authError', { message: 'Vous avez été banni' });
                io.to(connectedUser.socketId).disconnectSockets();
                connectedUsers.delete(userId);
            }
            // Mettre à jour la liste des utilisateurs
            const allUsers = await prisma.user.findMany({
                select: { id: true, username: true, teamId: true, role: true }
            });
            const usersWithConnectionInfo = allUsers.map(u => ({
                ...u,
                isConnected: connectedUsers.has(u.id),
                socketId: connectedUsers.get(u.id)?.socketId || null,
            }));
            io.emit('connectedUsers', usersWithConnectionInfo);
        }

        return res.status(200).json({
            success: true,
            message: 'Utilisateur banni avec succès',
            user: updatedUser
        });
    } catch (err: any) {
        console.error('Erreur lors du bannissement:', err.message, err.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du bannissement de l\'utilisateur',
            error: err.message
        });
    }
});

router.post('/join', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    return res.status(403).json({
        success: false,
        message: 'Les utilisateurs ne peuvent pas rejoindre une équipe eux-mêmes'
    });
});

router.post('/leave-team', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    return res.status(403).json({
        success: false,
        message: 'Les utilisateurs ne peuvent pas quitter une équipe eux-mêmes'
    });
});

router.delete('/:matchId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = req.params;

    console.log('Requête de suppression de match reçue:', { matchId, user: req.user });

    try {
        const result = await prisma.$transaction(async (tx) => {
            const match = await tx.match.findUnique({
                where: { id: matchId },
                include: {
                    redTeam: { include: { users: true } },
                    blueTeam: { include: { users: true } }
                },
            });

            if (!match) {
                throw new Error('Match non trouvé');
            }

            console.log('Match trouvé:', {
                matchId,
                redTeamId: match.redTeamId,
                blueTeamId: match.blueTeamId,
                redTeamUsers: match.redTeam.users.length,
                blueTeamUsers: match.blueTeam.users.length,
            });

            console.log('Dissociation des utilisateurs des équipes');
            const updatedUsers = await tx.user.updateMany({
                where: { teamId: { in: [match.redTeamId, match.blueTeamId] } },
                data: { teamId: null },
            });
            console.log('Utilisateurs dissociés:', updatedUsers.count);

            console.log('Suppression du match:', matchId);
            await tx.match.delete({
                where: { id: matchId },
            });

            console.log('Suppression des équipes');
            const deletedTeams = await tx.team.deleteMany({
                where: { id: { in: [match.redTeamId, match.blueTeamId] } },
            });
            console.log('Équipes supprimées:', deletedTeams.count);

            return { match, updatedUsers: updatedUsers.count, deletedTeams: deletedTeams.count };
        });

        console.log('Match supprimé avec succès:', matchId);

        const io = getSocketIO(req);
        if (io) {
            io.emit('matchDeleted', { matchId });
            const allUsers = await prisma.user.findMany({
                select: { id: true, username: true, teamId: true, role: true }
            });
            const usersWithConnectionInfo = allUsers.map(u => ({
                ...u,
                isConnected: connectedUsers.has(u.id),
                socketId: connectedUsers.get(u.id)?.socketId || null,
            }));
            io.emit('connectedUsers', usersWithConnectionInfo);
        }

        return res.status(200).json({
            success: true,
            message: 'Match supprimé avec succès',
            details: {
                matchId,
                usersUnassigned: result.updatedUsers,
                teamsDeleted: result.deletedTeams
            }
        });
    } catch (err: any) {
        console.error('Erreur lors de la suppression du match:', {
            message: err.message,
            code: err.code,
            meta: err.meta,
            stack: err.stack,
            matchId,
        });

        const errorMessage = err.message === 'Match non trouvé'
            ? 'Match non trouvé'
            : 'Erreur lors de la suppression du match';

        const statusCode = err.message === 'Match non trouvé' ? 404 : 500;

        return res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: err.message,
            code: err.code,
        });
    }
});

// Endpoint d'inscription (ajouté pour gérer la vérification d'IP bannie)
router.post('/register', async (req: Request, res: Response) => {
    const { username, password, ipAddress } = req.body;

    try {
        if (!username || !password || !ipAddress) {
            return res.status(400).json({ success: false, message: 'username, password et ipAddress sont requis' });
        }

        // Vérifier si l'IP est bannie
        const bannedIP = await prisma.bannedIP.findUnique({
            where: { ipAddress }
        });
        if (bannedIP) {
            console.warn('Tentative d\'inscription avec IP bannie:', ipAddress);
            return res.status(403).json({ success: false, message: 'Inscription interdite : IP bannie' });
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
            where: { username }
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Nom d\'utilisateur déjà pris' });
        }

        // Créer l'utilisateur (simplifié, à adapter selon votre logique de hachage de mot de passe)
        const user = await prisma.user.create({
            data: {
                username,
                passwordHash: password, // À remplacer par un vrai hachage
                role: 'USER'
            }
        });

        console.log('Utilisateur inscrit:', { username, ipAddress });

        return res.status(201).json({
            success: true,
            message: 'Utilisateur inscrit avec succès',
            user: { id: user.id, username: user.username, role: user.role }
        });
    } catch (err: any) {
        console.error('Erreur lors de l\'inscription:', err.message, err.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'inscription',
            error: err.message
        });
    }
});

export default router;