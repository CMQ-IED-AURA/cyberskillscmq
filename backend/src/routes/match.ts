import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';

interface AuthenticatedRequest extends Request {
    user?: { userId: string; role: string; username: string };
}

const connectedUsers = new Map<string, { userId: string; username: string; socketId: string }>();

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

export const setupSocket = (io: SocketIOServer) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('authenticate', async (token: string) => {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string; role: string };
                connectedUsers.set(decoded.userId, {
                    userId: decoded.userId,
                    username: decoded.username,
                    socketId: socket.id,
                });
                io.emit('connectedUsers', Array.from(connectedUsers.values()));
            } catch (err) {
                console.error('Socket authentication failed:', err);
                socket.disconnect();
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
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
        res.status(401).json({ success: false, message: 'Token manquant' });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            console.error('Token verification error:', err.message);
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

        req.app.get('io').emit('matchCreated', match);

        return res.status(201).json({
            success: true,
            matchId: match.id,
            redTeamId: redTeam.id,
            blueTeamId: blueTeam.id,
        });
    } catch (err: any) {
        console.error('Error creating match:', err.message);
        res.status(500).json({ success: false, message: 'Erreur lors de la création du match', error: err.message });
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
        return res.status(200).json({
            success: true,
            matches,
        });
    } catch (err: any) {
        console.error('Error fetching matches:', err.message);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des matchs', error: err.message });
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
            return res.status(404).json({ success: false, message: 'Match non trouvé' });
        }
        return res.status(200).json({
            success: true,
            redTeam: match.redTeam,
            blueTeam: match.blueTeam,
        });
    } catch (err: any) {
        console.error('Error fetching teams:', err.message);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des équipes', error: err.message });
    }
});

router.get('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const users = Array.from(connectedUsers.values()).map((user) => ({
            id: user.userId,
            username: user.username || 'Unknown',
        }));
        return res.status(200).json({
            success: true,
            users,
        });
    } catch (err: any) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des utilisateurs', error: err.message });
    }
});

router.post('/assign-team', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { userId, teamId, matchId } = req.body;

    console.log('Assign team request:', { userId, teamId, matchId });

    try {
        if (!userId || !matchId) {
            return res.status(400).json({ success: false, message: 'userId et matchId sont requis' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { redTeam: true, blueTeam: true },
        });
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match non trouvé' });
        }

        if (teamId && teamId !== match.redTeamId && teamId !== match.blueTeamId) {
            return res.status(400).json({ success: false, message: 'teamId ne correspond pas au match' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { teamId },
        });

        req.app.get('io').emit('teamAssigned', { matchId, userId, teamId, username: user.username });

        return res.status(200).json({ success: true, message: 'Utilisateur assigné avec succès' });
    } catch (err: any) {
        console.error('Error assigning team:', err.message, err.stack);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'assignation de l\'équipe', error: err.message });
    }
});

router.post('/join', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    return res.status(403).json({ success: false, message: 'Les utilisateurs ne peuvent pas rejoindre une équipe eux-mêmes' });
});

router.post('/leave-team', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    return res.status(403).json({ success: false, message: 'Les utilisateurs ne peuvent pas quitter une équipe eux-mêmes' });
});

router.delete('/:matchId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = req.params;

    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { redTeam: true, blueTeam: true },
        });

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match non trouvé' });
        }

        await prisma.user.updateMany({
            where: { teamId: { in: [match.redTeamId, match.blueTeamId] } },
            data: { teamId: null },
        });

        await prisma.team.deleteMany({
            where: { id: { in: [match.redTeamId, match.blueTeamId] } },
        });

        await prisma.match.delete({
            where: { id: matchId },
        });

        req.app.get('io').emit('matchDeleted', matchId);

        return res.status(200).json({ success: true, message: 'Match supprimé avec succès' });
    } catch (err: any) {
        console.error('Error deleting match:', err.message);
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression du match', error: err.message });
    }
});

export default router;