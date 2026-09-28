const STORAGE_KEY = 'segapp:lastCompanySlug';

// localStorage puede no estar disponible (modo privado, datos bloqueados);
// recordar la empresa es solo una comodidad, así que los errores se ignoran.
export function getLastCompanySlug(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveLastCompanySlug(companySlug: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, companySlug);
  } catch {
    // Sin almacenamiento, el usuario solo tendrá que indicar su empresa.
  }
}
