import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Interface pour typer req.user
interface AuthenticatedRequest extends Request {
    user?: { userId: string; role: string };
}

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Middleware pour vérifier le token
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

// Middleware pour vérifier le rôle admin
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Accès réservé aux administrateurs' });
        return;
    }
    next();
};

// Créer un match (admin uniquement)
// @ts-ignore
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

        return res.status(201).json({
            success: true,
            matchId: match.id,
            redTeamId: redTeam.id,
            blueTeamId: blueTeam.id,
        });
    } catch (err: any) {
        console.error('Erreur lors de la création du match:', err.message, err.stack);
        res.status(500).json({ success: false, message: 'Erreur lors de la création du match', error: err.message });
    }
});

// Liste des matchs
// @ts-ignore
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
        console.error('Erreur lors de la récupération des matchs:', err.message, err.stack);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des matchs', error: err.message });
    }
});

// Obtenir les membres des équipes d'un match
// @ts-ignore
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
        console.error('Erreur lors de la récupération des équipes:', err.message, err.stack);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des équipes', error: err.message });
    }
});

// Lister les utilisateurs (admin uniquement)
// @ts-ignore
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
        return res.status(200).json({
            success: true,
            users,
        });
    } catch (err: any) {
        console.error('Erreur lors de la récupération des utilisateurs:', err.message, err.stack);
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des utilisateurs', error: err.message });
    }
});

// Placer/déplacer un utilisateur dans une équipe (admin uniquement)
// @ts-ignore
router.post('/assign-team', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { userId, teamId } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

        const team = teamId ? await prisma.team.findUnique({ where: { id: teamId } }) : null;
        if (teamId && !team) {
            return res.status(404).json({ success: false, message: 'Équipe non trouvée' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { teamId },
        });

        return res.status(200).json({ success: true, message: 'Utilisateur assigné à l\'équipe avec succès' });
    } catch (err: any) {
        console.error('Erreur lors de l\'assignation de l\'équipe:', err.message, err.stack);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'assignation de l\'équipe', error: err.message });
    }
});

// Rejoindre une équipe (désactivé pour les utilisateurs standards)
// @ts-ignore
router.post('/join', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    return res.status(403).json({ success: false, message: 'Les utilisateurs ne peuvent pas rejoindre une équipe eux-mêmes' });
});

// Quitter une équipe (désactivé pour les utilisateurs standards)
// @ts-ignore
router.post('/leave-team', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    return res.status(403).json({ success: false, message: 'Les utilisateurs ne peuvent pas quitter une équipe eux-mêmes' });
});

// Supprimer un match (admin uniquement)
// @ts-ignore
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

        // Dissocier les utilisateurs des équipes
        await prisma.user.updateMany({
            where: { teamId: { in: [match.redTeamId, match.blueTeamId] } },
            data: { teamId: null },
        });

        // Supprimer les équipes
        await prisma.team.deleteMany({
            where: { id: { in: [match.redTeamId, match.blueTeamId] } },
        });

        // Supprimer le match
        await prisma.match.delete({
            where: { id: matchId },
        });

        return res.status(200).json({ success: true, message: 'Match supprimé avec succès' });
    } catch (err: any) {
        console.error('Erreur lors de la suppression du match:', err.message, err.stack);
        res.status(500).json({ success: false, message: 'Erreur lors de la suppression du match', error: err.message });
    }
});

export default router;