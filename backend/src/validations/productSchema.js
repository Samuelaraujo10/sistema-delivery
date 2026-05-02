const { z } = require('zod');

const productSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional().default(''),
  price: z.coerce.number({ invalid_type_error: 'Preço inválido' }).positive('O preço deve ser positivo'),
  originalPrice: z.preprocess(val => val === '' ? undefined : val, z.coerce.number().positive().optional()),
  categoryId: z.string().uuid('Selecione uma categoria válida'),
  establishmentId: z.string().uuid('ID do estabelecimento inválido'),
  image: z.string().optional().nullable(),
  available: z.preprocess(val => val === 'true' || val === true, z.boolean()).default(true),
  featured: z.preprocess(val => val === 'true' || val === true, z.boolean()).default(false),
  preparationTime: z.coerce.number().int().optional().default(15),
  builderRole: z.enum([
    'massa', 'molho', 'proteina', 'topping', 
    'tamanho', 'fruta', 'complemento', 'calda', 'creme',
    'sabor', 'borda', 'none'
  ]).optional().default('none'),
  modifierGroups: z.preprocess(val => {
    if (typeof val === 'string' && val.trim() !== '') {
      try { return JSON.parse(val); } catch (e) { return []; }
    }
    return Array.isArray(val) ? val : [];
  }, z.array(z.any())).optional().default([]),
});

const validate = (schema) => (req, res, next) => {
  try {
    // Importante: schema.parse retorna os dados transformados/coagidos
    // Substituímos o req.body pelos dados validados para que o controller receba os tipos corretos
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    next(err); // Passed to errorHandler
  }
};

module.exports = { productSchema, validate };
