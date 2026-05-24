export type Animal = {
  id: string;
  ownerUserId: string;

  photoUrl: string | null;

  name: string;
  species: string;
  breed: string;
  age: string;

  history: string;
  health: string;
  character: string;
  needs: string;

  createdAt: string;
  updatedAt: string;
};