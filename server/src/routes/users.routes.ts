import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate';
import { requireRole, requireOwnerOrRole } from '../middlewares/authorize';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/users.controller';

export const usersRouter = Router();

// All user routes require authentication
usersRouter.use(authenticate);

// Admin only — list all users
usersRouter.get('/', requireRole('admin'), getUsers);

// Self or admin — a user can view their own profile; admin can view any profile
usersRouter.get('/:id', requireOwnerOrRole('id', 'admin'), getUserById);

// Admin only — direct creation (normal path is POST /api/auth/register)
usersRouter.post('/', requireRole('admin'), createUser);

// Self or admin — updating profile; role/status changes are admin-only inside the controller
usersRouter.put('/:id', requireOwnerOrRole('id', 'admin'), updateUser);

// Admin only — soft-deactivate
usersRouter.delete('/:id', requireRole('admin'), deleteUser);
