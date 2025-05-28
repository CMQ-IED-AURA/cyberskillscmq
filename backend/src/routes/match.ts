import express, { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: 'https://cyberskills.onrender.com',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
const prisma = new PrismaClient();
const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey'; // À sécuriser via .env

interface AuthenticatedRequest extends Request {
    user?: { userId: string; role: string };
}

const connectedUsers: Map<string, { userId: string; username: string; role: string }> = new Map();

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.warn('Requête sans token');
        res.status(401).json({ success: false, error: 'Token manquant' });
        return;
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            console.error('Erreur vérification token:', err.message);
            res.status(403).json({ success: false, error: 'Token invalide' });
            return;
        }
        req.user = user;
        next();
    });
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'ADMIN') {
        console.warn(`Accès non autorisé: ${req.user?.userId}`);
        res.status(403).json({ success: false, error: 'Accès réservé aux administrateurs' });
        return;
    }
    next();
};

io.on('connection', (socket) => {
    console.log(`Connexion WebSocket: ${socket.id}`);

    socket.on('authenticate', async (token: string) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
            const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
            if (!user) {
                console.error(`Utilisateur non trouvé: ${decoded.userId}`);
                socket.disconnect();
                return;
            }
            connectedUsers.set(socket.id, { userId: decoded.userId, username: user.username, role: decoded.role });
            console.log(`Utilisateur connecté: ${user.username}`);
            io.to('admin-room').emit('connected-users', Array.from(connectedUsers.values()));
        } catch (error: any) {
            console.error('Erreur authentification WebSocket:', error.message);
            socket.disconnect();
        }
    });

    socket.on('join-admin', (token: string) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
            if (decoded.role === 'ADMIN') {
                socket.join('admin-room');
                console.log(`Admin ${decoded.userId} rejoint admin-room`);
            }
        } catch (error: any) {
            console.error('Erreur join-admin:', error.message);
            socket.disconnect();
        }
    });

    socket.on('disconnect', () => {
        console.log(`Déconnexion WebSocket: ${socket.id}`);
        connectedUsers.delete(socket.id);
        io.to('admin-room').emit('connected-users', Array.from(connectedUsers.values()));
    });
});

// Routes
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

        console.log(`Match créé: ${match.id}`);
        io.emit('match-created', match);
        return res.status(201).json({
            success: true,
            matchId: match.id,
            redTeamId: redTeam.id,
            blueTeamId: blueTeam.id,
        });
    } catch (err: any) {
        console.error('Erreur création match:', err.message);
        res.status(500).json({ success: false, error: 'Erreur création match' });
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
        return res.status(200).json({ success: true, matches });
    } catch (err: any) {
        console.error('Erreur récupération matchs:', err.message);
        res.status(500).json({ success: false, error: 'Erreur récupération matchs' });
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
            return res.status(404).json({ success: false, error: 'Match non trouvé' });
        }
        return res.status(200).json({
            success: true,
            redTeam: match.redTeam,
            blueTeam: match.blueTeam,
        });
    } catch (err: any) {
        console.error('Erreur récupération équipes:', err.message);
        res.status(500).json({ success: false, error: 'Erreur récupération équipes' });
    }
});

router.get('/users', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                teamId: true,
                createdAt: true,
            },
        });
        return res.status(200).json({ success: true, users });
    } catch (err: any) {
        console.error('Erreur récupération utilisateurs:', err.message);
        res.status(500).json({ success: false, error: 'Erreur récupération utilisateurs' });
    }
});

router.post('/assign-team', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { userId, teamId } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
        }

        const team = teamId ? await prisma.team.findUnique({ where: { id: teamId } }) : null;
        if (teamId && !team) {
            return res.status(404).json({ success: false, error: 'Équipe non trouvée' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { teamId },
        });

        const updatedMatch = await prisma.match.findFirst({
            where: { OR: [{ redTeamId: teamId }, { blueTeamId: teamId }] },
            include: {
                redTeam: { include: { users: true } },
                blueTeam: { include: { users: true } },
            },
        });

        console.log(`Utilisateur ${userId} assigné à équipe ${teamId || 'aucune'}`);
        io.emit('match-updated', updatedMatch);
        return res.status(200).json({ success: true, message: 'Utilisateur assigné' });
    } catch (err: any) {
        console.error('Erreur assignation équipe:', err.message);
        res.status(500).json({ success: false, error: 'Erreur assignation équipe' });
    }
});

router.post('/join', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    return res.status(403).json({ success: false, error: 'Action non autorisée' });
});

router.post('/leave-team', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    return res.status(403).json({ success: false, error: 'Action non autorisée' });
});

router.delete('/:matchId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { matchId } = req.params;
    try {
        const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { redTeam: true, blueTeam: true },
        });

        if (!match) {
            console.warn(`Match non trouvé: ${matchId}`);
            return res.status(404).json({ success: false, error: 'Match non trouvé' });
        }

        await prisma.user.updateMany({
            where: { teamId: { in: [match.redTeamId, match.blueTeamId] } },
            data: { teamId: null },
        });

        await prisma.team.deleteMany({
            where: { id: { in: [match.redTeamId, match.blueTeamId] } },
        });

        await prisma.match.delete({ where: { id: matchId } });

        console.log(`Match supprimé: ${matchId}`);
        io.emit('match-deleted', matchId);
        return res.status(200).json({ success: true, message: 'Match supprimé' });
    } catch (err: any) {
        console.error('Erreur suppression match:', err.message);
        res.status(500).json({ success: false, error: 'Erreur suppression match' });
    }
});

app.use(cors({ origin: 'https://cyberskills.onrender.com', credentials: true }));
app.use(express.json());
app.use('/match', router);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Serveur démarré sur port ${PORT}`);
});

export default router;