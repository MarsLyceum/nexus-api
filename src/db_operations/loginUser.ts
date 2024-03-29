import bcrypt from "bcrypt";
import { appDataSource } from "../db_connection/appDataSource";
import { User } from "../db_models/User";

export async function loginUser(email: string, password: string) {
  try {
    const dataSource = await appDataSource.initialize();
  } catch (e) {
    console.log("error:", e);
  }

  const foundUser = await appDataSource.manager.findOne(User, {
    where: { email },
  });

  if (await bcrypt.compare(password, foundUser?.hashedPassword ?? "")) {
    return foundUser;
  } else {
    return null;
  }
}
