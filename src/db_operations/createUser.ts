import bcrypt from "bcrypt";
import { User } from "../db_models/User";
import { initializeDataSource } from "./initializeDataSource";

export async function createUser(email: string, password: string) {
  const dataSource = await initializeDataSource();

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User(email, hashedPassword);

  const savedUser = await dataSource.manager.save(user);
  return savedUser;
}
