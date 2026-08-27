
export type Clock = () => string;

/** Devuelve un identificador nuevo para una incidencia. */
export type IdGenerator = () => string;
export const systemClock: Clock = () => new Date().toISOString();