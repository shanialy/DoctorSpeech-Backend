import { BEARER_TOKEN, EXPIRES_IN, JWT_SECRET, SALT } from "./environment";

const AuthConfig = {
  JWT_SECRET: JWT_SECRET,
  BEARER_TOKEN: BEARER_TOKEN,
  SALT: SALT,
  EXPIRES_IN: EXPIRES_IN,
};

export default AuthConfig;
