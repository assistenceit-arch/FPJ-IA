export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),

  nodeEnv: process.env.NODE_ENV ?? 'development',

  databaseUrl: process.env.DATABASE_URL,

  jwtSecret: process.env.JWT_SECRET,

  // Usado por el módulo de narrativa (src/narrativa) para generar la
  // narración automática de los hechos del FPJ-5 vía la API de Anthropic.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});