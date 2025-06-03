import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';

interface AuthenticatedRequest extends Request {
    user?: { userId: string; role: string; username?: string };
}

const connectedUsers = new Map<string, { userId: string; username: string; socketId: string }>();

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
                    select: { username: true }
                });
                if (!user) {
                    throw new Error('Utilisateur non trouvé');
                }
                connectedUsers.set(decoded.userId, {
                    userId: decoded.userId,
                    username: user.username || 'Inconnu',
                    socketId: socket.id,
                });
                console.log('Utilisateur authentifié:', { userId: decoded.userId, username: user.username });
                io.emit('connectedUsers', Array.from(connectedUsers.values()));
            } catch (err: any) {
                console.error('Échec de l\'authentification WebSocket:', err.message);
                socket.disconnect();
            }
        });

        socket.on('disconnect', () => {
            console.log('Utilisateur déconnecté:', socket.id);
            for (const [userId, user] of connectedUsers) {
                if (user.socketId === socket.id) {
                    connectedUsers.delete(userId);
                    io.emit('connectedUsers', Array.from(connectedUsers.values()));
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
        res.status(401).json({ success: false, error: 'Token manquant' });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            console.error('Erreur de vérification du token:', err.message);
            res.status(403).json({ success: false, error: 'Token invalide' });
            return;
        }
        req.user = user;
        next();
    });
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'ADMIN') {
        console.error('Accès non autorisé: utilisateur non admin', { user: req.user });
        res.status(403).json({ success: false, error: 'Accès réservé aux administrateurs' });
        return;
    }
    next();
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
        });

        console.log('Match créé:', { matchId: match.id, redTeamId: redTeam.id, blueTeamId: blueTeam.id });
        req.app.get('io').emit('matchCreated', match);

        return res.status(201).json({
            success: true,
            data: {
                matchId: match.id,
                redTeamId: redTeam.id,
                blueTeamId: blueTeam.id,
            },
        });
    } catch (err: any) {
        console.error('Erreur lors de la création du match:', err.message, err.stack);
        res.status(500).json({ success: false, error: 'Erreur lors de la création du match', details: err.message });
    }
});

router.get('/list', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const matches = await prisma.match.findMany({
            include: {
                redTeam: { include: { users: true } },
                blueTeam: { include: { users: true } },
            },
        });
        console.log('Matchs récupérés:', matches.length);
        return res.status(200).json({
            success: true,
            data: matches,
        });
    } catch (err: any) {
        console.error('Erreur lors de la récupération des matchs:', err.message, err.stack);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des matchs', details: err.message });
    }
});

router.get('/:matchId/teams', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = req.params;
    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
                redTeam: { include: { users: true } },
                blueTeam: { include: { users: true } },
            },
        });
        if (!match) {
            console.log('Match non trouvé:', matchId);
            return res.status(404).json({ success: false, error: 'Match non trouvé' });
        }
        console.log('Équipes récupérées pour match:', matchId);
        return res.status(200).json({
            success: true,
            data: {
                redTeam: match.redTeam,
                blueTeam: match.blueTeam,
            },
        });
    } catch (err: any) {
        console.error('Erreur lors de la récupération des équipes:', err.message, err.stack);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des équipes', details: err.message });
    }
});

router.get('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const users = Array.from(connectedUsers.values()).map((user) => ({
            id: user.userId,
            username: user.username || 'Inconnu',
        }));
        console.log('Utilisateurs connectés envoyés:', users);
        return res.status(200).json({
            success: true,
            data: users,
        });
    } catch (err: any) {
        console.error('Erreur lors de la récupération des utilisateurs:', err.message, err.stack);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des utilisateurs', details: err.message });
    }
});

router.post('/assign-team', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { userId, teamId, matchId } = req.body;

    console.log('Requête assign-team reçue:', { userId, teamId, matchId });

    try {
        if (!userId || !matchId) {
            return res.status(400).json({ success: false, error: 'userId et matchId sont requis' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, teamId: true },
        });
        if (!user) {
            console.error('Utilisateur non trouvé:', userId);
            return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
        }

        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { redTeam: true, blueTeam: true },
        });
        if (!match) {
            console.error('Match non trouvé:', matchId);
            return res.status(404).json({ success: false, error: 'Match non trouvé' });
        }

        if (teamId !== null && teamId !== match.redTeamId && teamId !== match.blueTeamId) {
            console.error('teamId invalide:', { teamId, redTeamId: match.redTeamId, blueTeamId: match.blueTeamId });
            return res.status(400).json({ success: false, error: 'teamId invalide pour ce match' });
        }

        // Identifier les matchs affectés
        let affectedMatchIds = [matchId];
        if (user.teamId) {
            const oldMatch = await prisma.match.findFirst({
                where: { OR: [{ redTeamId: user.teamId }, { blueTeamId: user.teamId }] },
            });
            if (oldMatch && oldMatch.id !== matchId) {
                affectedMatchIds.push(oldMatch.id);
            }
        }

        // Dissocier l'utilisateur de toute équipe
        await prisma.user.update({
            where: { id: userId },
            data: { teamId: null },
        });

        // Assigner à la nouvelle équipe
        if (teamId) {
            await prisma.user.update({
                where: { id: userId },
                data: { teamId },
            });
        }

        console.log('Utilisateur assigné:', { userId, teamId, matchId, affectedMatchIds });
        req.app.get('io').emit('teamAssigned', { affectedMatchIds, userId, teamId, username: user.username });

        return res.status(200).json({ success: true, message: 'Utilisateur assigné avec succès' });
    } catch (err: any) {
        console.error('Erreur lors de l\'assignation de l\'équipe:', {
            message: err.message,
            code: err.code,
            meta: err.meta,
            stack: err.stack,
        });
        res.status(500).json({ success: false, error: 'Erreur lors de l\'assignation de l\'équipe', details: err.message });
    }
});

router.post('/join', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    return res.status(403).json({ success: false, error: 'Les utilisateurs ne peuvent pas rejoindre une équipe eux-mêmes' });
});

router.post('/leave-team', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    return res.status(403).json({ success: false, error: 'Les utilisateurs ne peuvent pas quitter une équipe eux-mêmes' });
});

router.delete('/:matchId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = req.params;

    console.log('Requête de suppression de match reçue:', { matchId, user: req.user });

    try {
        await prisma.$transaction(async (tx) => {
            const match = await tx.match.findUnique({
                where: { id: matchId },
                include: {
                    redTeam: { include: { users: true } },
                    blueTeam: { include: { users: true } },
                },
            });

            if (!match) {
                console.error('Match non trouvé:', matchId);
                throw new Error('Match non trouvé');
            }

            console.log('Match trouvé:', {
                matchId,
                redTeamId: match.redTeamId,
                blueTeamId: match.blueTeamId,
                redTeamUsers: match.redTeam.users.length,
                blueTeamUsers: match.blueTeam.users.length,
            });

            // Dissocier les utilisateurs
            const updatedUsers = await tx.user.updateMany({
                where: { teamId: { in: [match.redTeamId, match.blueTeamId] } },
                data: { teamId: null },
            });
            console.log('Utilisateurs dissociés:', updatedUsers.count);

            // Supprimer les équipes
            const deletedTeams = await tx.team.deleteMany({
                where: { id: { in: [match.redTeamId, match.blueTeamId] } },
            });
            console.log('Équipes supprimées:', deletedTeams.count);

            // Supprimer le match
            await tx.match.delete({ where: { id: matchId } });
            console.log('Match supprimé:', matchId);
        });

        req.app.get('io').emit('matchDeleted', matchId);
        return res.status(200).json({ success: true, message: 'Match supprimé avec succès' });
    } catch (err: any) {
        console.error('Erreur lors de la suppression du match:', {
            message: err.message,
            code: err.code,
            meta: err.meta,
            stack: err.stack,
            matchId,
        });
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la suppression du match',
            details: err.message,
            code: err.code,
        });
    }
});

export default router;