import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { createHash } from 'crypto';

const router = Router();

// Simple password hash for direct login
const hashPassword = (password: string): string => {
  return createHash('sha256').update(password + 'molly_salt_2024').digest('hex');
};

// Direct login for admin (bypasses Firebase)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password (stored in firebaseUid field for simplicity when it starts with 'pwd_')
    const expectedHash = 'pwd_' + hashPassword(password);

    // For admin user with specific password
    if (email === 'vorobyeviv@gmail.com' && password === 'vordest') {
      // Generate a simple token
      const token = 'direct_' + createHash('sha256')
        .update(user.id + Date.now().toString())
        .digest('hex');

      // Update user's firebaseUid to the token for session tracking
      await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid: token },
      });

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          isAdmin: user.isAdmin,
        },
      });
    }

    // For other users with stored password hash
    if (user.firebaseUid === expectedHash) {
      const token = 'direct_' + createHash('sha256')
        .update(user.id + Date.now().toString())
        .digest('hex');

      await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid: token },
      });

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          isAdmin: user.isAdmin,
        },
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/verify', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

export default router;
