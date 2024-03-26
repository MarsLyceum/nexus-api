import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../db_models/User";
import { decryptDbPassword } from "./decryptPassword";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5433,
  username: "postgres",
  password: decryptDbPassword(),
  database: "postgres",
  synchronize: true,
  logging: false,
  entities: [User],
  migrations: [],
  subscribers: [],
});
