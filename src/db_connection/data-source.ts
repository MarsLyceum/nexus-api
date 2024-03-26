import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../db_models/User";
import { decryptDbPassword } from "./decryptPassword";

const DB_HOST = "host.docker.internal";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: DB_HOST,
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
