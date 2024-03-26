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

// AppDataSource.initialize()
//   .then(async () => {
//     console.log("Inserting a new user into the database...");
//     const user = new User();
//     user.firstName = "Timber";
//     user.lastName = "Saw";
//     user.age = 25;
//     await AppDataSource.manager.save(user);
//     console.log("Saved a new user with id: " + user.id);

//     console.log("Loading users from the database...");
//     const users = await AppDataSource.manager.find(User);
//     console.log("Loaded users: ", users);

//     console.log(
//       "Here you can setup and run express / fastify / any other framework."
//     );
//   })
//   .catch((error) => console.log(error));
