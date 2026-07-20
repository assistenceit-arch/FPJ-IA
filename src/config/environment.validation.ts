import * as Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),

  // Requerida por el módulo de narrativa (generación IA de la narración de
  // los hechos del FPJ-5). Se crea en console.anthropic.com.
  ANTHROPIC_API_KEY: Joi.string().required(),
});