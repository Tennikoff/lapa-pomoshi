export type ProfileDto = {
  userId: string;
  email: string;
  name: string;

  // было number (1/2), по swagger role в register строка,
  // что возвращает profile — уточним по реальному ответу
  role: string | number;

  age: number | null;
  description: string | null;
  sumRating: number;
  countRating: number;
  photoUrl: string | null;
};