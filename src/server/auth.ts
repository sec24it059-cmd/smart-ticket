import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { dbManager } from './db.ts';
import { Role, User } from './types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'ticketnest-super-secret-jwt-key-for-dev-environments-only';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: Role;
  name: string;
  organizationId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function generateToken(user: User, organizationId?: string): string {
  const payload: AuthUserPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    organizationId,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token is required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    
    // Verify user is still active in database
    const db = dbManager.getRawData();
    const liveUser = db.users.find((u) => u.id === decoded.id);
    if (!liveUser || liveUser.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'User account has been suspended or removed' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
      req.user = decoded;
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: This resource requires one of [${allowedRoles.join(', ')}] permissions`,
      });
    }

    next();
  };
}

// Multi-tenant check: verifies whether an organizer has access to a particular organization's events
export function getOrganizerOrganizationId(userId: string): string | null {
  const db = dbManager.getRawData();
  const membership = db.organizationMembers.find((m) => m.userId === userId);
  return membership ? membership.organizationId : null;
}
