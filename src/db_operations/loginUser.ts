import bcrypt from "bcrypt";
import { AppDataSource } from "../db_connection/data-source";
import { User } from "../db_models/User";

export async function loginUser(email: string, password: string) {
  try {
    const dataSource = await AppDataSource.initialize();
  } catch (e) {
    console.log("error:", e);
  }

  const foundUser = await AppDataSource.manager.findOne(User, {
    where: { email },
  });

  if (await bcrypt.compare(password, foundUser?.hashedPassword ?? "")) {
    return foundUser;
  } else {
    return null;
  }
}
