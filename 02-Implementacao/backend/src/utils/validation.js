const Joi = require('joi');

// Validação de Email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validação de Senha Forte
function validatePassword(password) {
  // Pelo menos 8 caracteres, uma maiúscula, uma minúscula, um número
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Validação de UUID
function validateUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Validação de CPF
function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');
  
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) {
    return false;
  }
  
  const cpfArray = cpf.split('').map(el => +el);
  const rest = (count) => (cpfArray.slice(0, count-12)
    .reduce((soma, el, index) => (soma + el * (count-index)), 0) * 10) % 11 % 10;
  
  return rest(10) === cpfArray[9] && rest(11) === cpfArray[10];
}

// Validação de CNPJ
function validateCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  
  if (cnpj.length !== 14) return false;
  
  // Elimina CNPJs inválidos conhecidos
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Validação do primeiro dígito verificador
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  
  // Validação do segundo dígito verificador
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado !== parseInt(digitos.charAt(1))) return false;
  
  return true;
}

// Schemas Joi para validação de requisições
const schemas = {
  user: {
    create: Joi.object({
      name: Joi.string().min(2).max(255).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
      role: Joi.string().valid('admin', 'manager', 'user').default('user')
    }),
    
    update: Joi.object({
      name: Joi.string().min(2).max(255),
      email: Joi.string().email(),
      role: Joi.string().valid('admin', 'manager', 'user'),
      active: Joi.boolean()
    }),

    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    })
  },

  material: {
    create: Joi.object({
      code: Joi.string().max(50).required(),
      name: Joi.string().max(255).required(),
      description: Joi.string().allow(''),
      type: Joi.string().valid('Geral', 'Pré Lançamento', 'Outlet', 'Promo', 'Sales').default('Geral'),
      category: Joi.string().max(100).allow(''),
      price: Joi.number().positive().precision(2).allow(null),
      stockQuantity: Joi.number().integer().min(0).default(0),
      unit: Joi.string().max(20).default('metros'),
      composition: Joi.string().allow(''),
      color: Joi.string().max(100).allow(''),
      width: Joi.number().positive().precision(2).allow(null),
      weight: Joi.number().positive().precision(2).allow(null)
    }),

    update: Joi.object({
      code: Joi.string().max(50),
      name: Joi.string().max(255),
      description: Joi.string().allow(''),
      type: Joi.string().valid('Geral', 'Pré Lançamento', 'Outlet', 'Promo', 'Sales'),
      category: Joi.string().max(100).allow(''),
      price: Joi.number().positive().precision(2).allow(null),
      stockQuantity: Joi.number().integer().min(0),
      unit: Joi.string().max(20),
      composition: Joi.string().allow(''),
      color: Joi.string().max(100).allow(''),
      width: Joi.number().positive().precision(2).allow(null),
      weight: Joi.number().positive().precision(2).allow(null),
      active: Joi.boolean()
    })
  },

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};

// Middleware de validação para Fastify
function createValidationMiddleware(schema) {
  return {
    body: schema
  };
}

// Sanitização de dados
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '');
}

function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// Validação de upload de arquivo
function validateFileUpload(file, allowedTypes = [], maxSize = 10 * 1024 * 1024) {
  const errors = [];
  
  if (!file) {
    errors.push('Arquivo é obrigatório');
    return errors;
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    errors.push(`Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`);
  }
  
  if (file.size > maxSize) {
    errors.push(`Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`);
  }
  
  return errors;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateUUID,
  validateCPF,
  validateCNPJ,
  schemas,
  createValidationMiddleware,
  sanitizeString,
  sanitizeObject,
  validateFileUpload
};