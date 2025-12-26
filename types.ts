
export interface RestaurantData {
  name: string;
  document: string;
  cep: string;
  address: string;
  serviceTax: number;
  logoUrl: string;
}

export interface AdminAccess {
  username: string;
  password: string;
}

export interface RegistrationState {
  establishment: RestaurantData;
  admin: AdminAccess;
}
