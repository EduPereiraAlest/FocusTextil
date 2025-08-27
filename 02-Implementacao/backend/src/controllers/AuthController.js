const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const UserService = require('../services/UserService');
const SessionService = require('../services/SessionService');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { validateEmail, validatePassword } = require('../utils/validation');

class AuthController {
  // POST /api/auth/register
  async register(request, reply) {
    try {
      const { name, email, password, role = 'user' } = request.body;

      // Validações
      if (!name || !email || !password) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Nome, email e senha são obrigatórios'
        });
      }

      if (!validateEmail(email)) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Email inválido'
        });
      }

      if (!validatePassword(password)) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número'
        });
      }

      // Verificar se usuário já existe
      const existingUser = await UserService.findByEmail(email);
      if (existingUser) {
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Email já está em uso'
        });
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 12);

      // Criar usuário
      const user = await UserService.create({
        name,
        email,
        passwordHash,
        role
      });

      // Gerar tokens
      const { accessToken, refreshToken } = await generateTokens(user);

      // Salvar refresh token
      await SessionService.create(user.id, refreshToken);

      reply.code(201).send({
        message: 'Usuário criado com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '15m'
        }
      });
    } catch (error) {
      request.log.error('Register error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/auth/login
  async login(request, reply) {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Email e senha são obrigatórios'
        });
      }

      // Buscar usuário
      const user = await UserService.findByEmail(email);
      if (!user) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Credenciais inválidas'
        });
      }

      // Verificar se usuário está ativo
      if (!user.active) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Conta desativada'
        });
      }

      // Verificar senha
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Credenciais inválidas'
        });
      }

      // Atualizar último login
      await UserService.updateLastLogin(user.id);

      // Gerar tokens
      const { accessToken, refreshToken } = await generateTokens(user);

      // Salvar refresh token
      await SessionService.create(user.id, refreshToken);

      reply.send({
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLogin: new Date()
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '15m'
        }
      });
    } catch (error) {
      request.log.error('Login error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/auth/refresh
  async refresh(request, reply) {
    try {
      const { refreshToken } = request.body;

      if (!refreshToken) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Refresh token é obrigatório'
        });
      }

      // Verificar refresh token
      const decoded = await verifyRefreshToken(refreshToken);
      const session = await SessionService.findByToken(refreshToken);

      if (!session || session.user_id !== decoded.userId) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Refresh token inválido'
        });
      }

      // Buscar usuário
      const user = await UserService.findById(decoded.userId);
      if (!user || !user.active) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Usuário inválido ou inativo'
        });
      }

      // Gerar novos tokens
      const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

      // Atualizar sessão
      await SessionService.update(session.id, newRefreshToken);

      reply.send({
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn: '15m'
        }
      });
    } catch (error) {
      request.log.error('Refresh token error:', error);
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Refresh token inválido ou expirado'
      });
    }
  }

  // POST /api/auth/logout
  async logout(request, reply) {
    try {
      const { refreshToken } = request.body;

      if (refreshToken) {
        await SessionService.deleteByToken(refreshToken);
      }

      reply.send({
        message: 'Logout realizado com sucesso'
      });
    } catch (error) {
      request.log.error('Logout error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/auth/me
  async me(request, reply) {
    try {
      const userId = request.user.userId;
      const user = await UserService.findById(userId);

      if (!user) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Usuário não encontrado'
        });
      }

      reply.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          lastLogin: user.last_login,
          createdAt: user.created_at
        }
      });
    } catch (error) {
      request.log.error('Get user profile error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new AuthController();