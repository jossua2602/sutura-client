
export const isWalkInEmail = (email?: string) => 
  email ? (email.startsWith('walkin_') && email.endsWith('@sutura.com')) : false;

export const COMMON_METRICS = ['Chest', 'Waist', 'Hips', 'Inseam', 'Sleeve Length', 'Shoulders', 'Neck', 'Bust'];
