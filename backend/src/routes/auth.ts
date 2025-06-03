import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// @ts-ignore
router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Nom d\'utilisateur déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: 'USER',
      },
    });

    const token = jwt.sign(
        { userId: user.id, role: user.role, username: user.username },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.cookie('tokenId', token, {
      httpOnly: true,
      secure: true, // Toujours true sur Render (HTTPS)
      sameSite: 'strict',
      maxAge: 3600000, // 1 heure
      path: '/',
    });

    console.log('Utilisateur inscrit:', { userId: user.id, username: user.username });
    return res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: { id: user.id, username: user.username, role: user.role },
      },
    });
  } catch (err: any) {
    console.error('Erreur lors de l\'inscription:', err.message, err.stack);
    return res.status(500).json({ success: false, error: 'Erreur serveur lors de l\'inscription', details: err.message });
  }
});

// @ts-ignore
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    }

    const token = jwt.sign(
        { userId: user.id, role: user.role, username: user.username },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.cookie('tokenId', token, {
      httpOnly: true,
      secure: true, // Toujours true sur Render (HTTPS)
      sameSite: 'strict',
      maxAge: 3600000, // 1 heure
      path: '/',
    });

    console.log('Utilisateur connecté:', { userId: user.id, username: user.username });
    return res.status(200).json({
      success: true,
      message: 'Authentification réussie',
      data: {
        user: { id: user.id, username: user.username, role: user.role },
      },
    });
  } catch (err: any) {
    console.error('Erreur lors de la connexion:', err.message, err.stack);
    return res.status(500).json({ success: false, error: 'Erreur serveur lors de la connexion', details: err.message });
  }
});

export default router;