import { Request, Response } from 'express';
import {
    UserEntity,
    CreateUserPayload,
    GetUserParams,
    GetUserByEmailParams,
    UpdateUserParams,
    UpdateUserPayload,
    DeleteUserParams,
} from 'user-api-client';
import { TypeOrmDataSourceSingleton } from 'third-party-clients';

export const createUser = async (
    req: Request<unknown, unknown, CreateUserPayload>,
    res: Response
) => {
    try {
        const { email, username, firstName, lastName, phoneNumber } = req.body;

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();

        const foundUser =
            (await dataSource.manager.findOne(UserEntity, {
                where: { email },
            })) ?? undefined;

        if (foundUser) {
            res.status(400).json({ message: 'User already exists' });
        } else {
            const newUser = dataSource.manager.create(UserEntity, {
                email,
                username,
                firstName,
                lastName,
                phoneNumber,
            });

            await dataSource.manager.save(newUser);

            res.status(201).json(newUser);
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

export const getUser = async (req: Request<GetUserParams>, res: Response) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            res.status(400).send('User ID parameter is missing');
            return;
        }

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        const user = await dataSource.manager.findOne(UserEntity, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            where: { id: userId },
        });

        if (!user) {
            res.status(404).send('User not found');
        } else {
            res.status(200).json(user);
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

export const getUserByEmail = async (
    req: Request<GetUserByEmailParams>,
    res: Response
) => {
    try {
        const { email } = req.params;

        if (!email) {
            res.status(400).send('Email parameter is missing');
            return;
        }

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        const user = await dataSource.manager.findOne(UserEntity, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            where: { email },
        });

        if (!user) {
            res.status(404).send('User not found');
        } else {
            res.status(200).json(user);
        }
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

export const updateUser = async (
    req: Request<UpdateUserParams, unknown, UpdateUserPayload>,
    res: Response
    // eslint-disable-next-line @typescript-eslint/require-await
) => {
    try {
        const { userId } = req.params;
        const { firstName, lastName, phoneNumber, email } = req.body;

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        const user = await dataSource.manager.findOne(UserEntity, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            where: { id: userId },
        });

        if (!user) {
            res.status(404).send('User not found');
            return;
        }

        user.firstName = firstName ?? user.firstName;
        user.lastName = lastName ?? user.lastName;
        user.phoneNumber = phoneNumber ?? user.phoneNumber;
        user.email = email ?? user.email;

        await dataSource.manager.save(user);

        res.status(200).json(user);
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

// eslint-disable-next-line @typescript-eslint/require-await
export const deleteUser = async (
    req: Request<DeleteUserParams>,
    res: Response
    // eslint-disable-next-line consistent-return
) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            res.status(400).send('User ID parameter is missing');
            return;
        }

        const dataSource = await TypeOrmDataSourceSingleton.getInstance();
        const user = await dataSource.manager.findOne(UserEntity, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            where: { id: userId },
        });

        if (!user) {
            res.status(404).send('User not found');
            return;
        }

        await dataSource.manager.remove(user);

        res.status(204).send();
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
