export type Animal = {
  id: string;
  ownerUserId: string;

  // MVP: dataURL/base64 или null
  photoUrl: string | null;

  name: string;
  species: string; // required в локальной модели
  breed: string;
  age: string;

  history: string;
  health: string;
  character: string;
  needs: string;

  createdAt: string;
  updatedAt: string;
};