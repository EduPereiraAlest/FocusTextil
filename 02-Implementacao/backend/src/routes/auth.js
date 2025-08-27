const AuthController = require('../controllers/AuthController');
const { schemas } = require('../utils/validation');

async function authRoutes(fastify, options) {
  // POST /api/auth/register
  fastify.post('/register', {
    schema: {
      body: schemas.user.create,
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' }
              }
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'string' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, AuthController.register);

  // POST /api/auth/login
  fastify.post('/login', {
    schema: {
      body: schemas.user.login,
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                lastLogin: { type: 'string' }
              }
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, AuthController.login);

  // POST /api/auth/refresh
  fastify.post('/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, AuthController.refresh);

  // POST /api/auth/logout
  fastify.post('/logout', {
    schema: {
      body: {
        type: 'object',
        properties: {
          refreshToken: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, AuthController.logout);

  // GET /api/auth/me - Perfil do usuário logado
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                lastLogin: { type: 'string' },
                createdAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, AuthController.me);

  // PUT /api/auth/change-password
  fastify.put('/change-password', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { 
            type: 'string',
            minLength: 8,
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { currentPassword, newPassword } = request.body;
      const userId = request.user.userId;

      const bcrypt = require('bcryptjs');
      const UserService = require('../services/UserService');

      // Buscar usuário
      const user = await UserService.findById(userId);
      if (!user) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Usuário não encontrado'
        });
      }

      // Verificar senha atual
      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!validPassword) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Senha atual incorreta'
        });
      }

      // Hash da nova senha
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Atualizar senha
      await UserService.updatePassword(userId, newPasswordHash);

      reply.send({
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      request.log.error('Change password error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erro interno do servidor'
      });
    }
  });
}

module.exports = authRoutes;