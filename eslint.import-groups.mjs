// Orden de imports del proyecto (ver CLAUDE.md). Los grupos se separan con una
// línea en blanco y dentro de cada grupo el orden es alfabético.
export const importGroups = [
  // Imports que solo ejecutan algo ('dotenv/config', CSS globales). Van
  // primero y conservan su orden, porque ese orden importa.
  ['^\\u0000'],
  // Módulos de Node y paquetes externos.
  ['^node:', '^@?\\w'],
  // Paquetes del workspace.
  ['^@segapp/'],
  // Alias de la app web.
  ['^@/'],
  // Imports relativos: primero '../' y luego './'.
  ['^\\.'],
  // Estilos importados con nombre (CSS Modules), al final.
  ['^[^\\u0000].*\\.css$'],
];
