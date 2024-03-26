import bcrypt from "bcrypt";
import { AppDataSource } from "../db_connection/data-source";
import { User } from "../db_models/User";

export async function createUser(email: string, password: string) {
  const dataSource = await AppDataSource.initialize();

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  await AppDataSource.manager.save(new User(email, hashedPassword));
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
