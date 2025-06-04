import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

// Route Inscription
// @ts-ignore
router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    // Validation des données d'entrée
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Le nom d'utilisateur et le mot de passe sont requis."
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Le nom d'utilisateur doit contenir au moins 3 caractères."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 6 caractères."
      });
    }

    // Vérifier si username existe (insensible à la casse)
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Nom d'utilisateur déjà utilisé."
      });
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 12); // Augmenté à 12 pour plus de sécurité

    // Créer utilisateur
    const newUser = await prisma.user.create({
      data: {
        username: username.trim(), // Supprimer les espaces
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        role: true,
        score: true,
        createdAt: true
      }
    });

    // Générer JWT
    const token = jwt.sign(
        {
          userId: newUser.id,
          role: newUser.role,
          username: newUser.username
        },
        JWT_SECRET,
        { expiresIn: '24h' } // Augmenté à 24h pour une meilleure UX
    );

    console.log('Utilisateur inscrit:', {
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role
    });

    return res.status(201).json({
      success: true, // ✅ Corrigé : était false avant
      message: 'Inscription réussie',
      user: newUser,
      token,
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'inscription:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });

    // Gestion d'erreurs spécifiques à Prisma
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: "Nom d'utilisateur déjà utilisé."
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription.'
    });
  }
});

// Route Connexion
// @ts-ignore
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    // Validation des données d'entrée
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Le nom d'utilisateur et le mot de passe sont requis."
      });
    }

    // Recherche de l'utilisateur (insensible à la casse)
    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: username.trim(),
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        role: true,
        score: true,
        teamId: true,
        createdAt: true
      }
    });

    if (!user) {
      console.log('Tentative de connexion avec utilisateur inexistant:', username);
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides.'
      });
    }

    // Vérifier si l'utilisateur est banni
    if (user.role === 'BANNED') {
      console.log('Tentative de connexion d\'utilisateur banni:', username);
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été suspendu.'
      });
    }

    // Vérifier mot de passe
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      console.log('Tentative de connexion avec mot de passe incorrect:', username);
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides.'
      });
    }

    // Générer JWT
    const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          username: user.username
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    // Préparer les données utilisateur (sans le hash du mot de passe)
    const { passwordHash, ...userWithoutPassword } = user;

    console.log('Utilisateur connecté:', {
      userId: user.id,
      username: user.username,
      role: user.role,
      teamId: user.teamId
    });

    return res.status(200).json({
      success: true,
      message: 'Authentification réussie',
      user: userWithoutPassword,
      token,
    });
  } catch (error: any) {
    console.error('Erreur lors de la connexion:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      username: username || 'non fourni'
    });

    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion.'
    });
  }
});

// Route pour vérifier la validité du token (optionnelle)
// @ts-ignore
router.get('/verify', async (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token manquant'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
      username: string;
    };

    // Vérifier que l'utilisateur existe toujours et n'est pas banni
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        role: true,
        score: true,
        teamId: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (user.role === 'BANNED') {
      return res.status(403).json({
        success: false,
        message: 'Compte suspendu'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Token valide',
      user: user
    });
  } catch (error: any) {
    console.error('Erreur lors de la vérification du token:', error.message);
    return res.status(403).json({
      success: false,
      message: 'Token invalide'
    });
  }
});

export default router;