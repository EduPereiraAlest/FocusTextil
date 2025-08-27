const jwt = require('jsonwebtoken');
const config = require('../config');

async function generateTokens(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  // Access Token (curta duração)
  const accessToken = jwt.sign(
    payload,
    config.jwt.secret,
    { expiresIn: config.jwt.accessTokenExpiry }
  );

  // Refresh Token (longa duração)
  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshTokenExpiry }
  );

  return {
    accessToken,
    refreshToken
  };
}

async function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('Token inválido');
  }
}

async function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Tipo de token inválido');
    }

    return decoded;
  } catch (error) {
    throw new Error('Refresh token inválido');
  }
}

function decodeToken(token) {
  return jwt.decode(token);
}

function isTokenExpired(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
}

module.exports = {
  generateTokens,
  verifyToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired
};