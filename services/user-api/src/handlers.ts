import { Request, Response } from 'express';

import {
    User,
    CreateUserPayload,
    GetUserParams,
    UpdateUserParams,
    UpdateUserPayload,
    DeleteUserParams,
} from 'user-api-client';

export const createUser = async (
    req: Request<unknown, unknown, CreateUserPayload>,
    res: Response
    // eslint-disable-next-line @typescript-eslint/require-await
) => {
    try {
        const { email, firstName, lastName, phoneNumber } = req.body;
        // TODO: Add logic to create a user in the database
        res.status(201).json({ id: 'newly-created-id', name, email });
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

// eslint-disable-next-line @typescript-eslint/require-await
export const getUser = async (req: Request<GetUserParams>, res: Response) => {
    try {
        const { email } = req.params;
        // TODO: Add logic to retrieve a user from the database
        if (!email) {
            res.status(404).send('User not found');
        } else {
            res.json({
                email,
                name: 'Sample Name',
            });
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
        const { email: emailToUpdate } = req.params;
        const { firstName, lastName, phoneNumber, email } = req.body;
        // TODO: Add logic to update a user in the database
        res.json({ id: userId, name, email });
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};

// eslint-disable-next-line @typescript-eslint/require-await
export const deleteUser = async (
    req: Request<UpdateUserParams>,
    res: Response
) => {
    try {
        const { email } = req.params;
        // TODO: Add logic to delete a user from the database
        res.status(204).send();
    } catch (error) {
        res.status(500).send((error as Error).message);
    }
};
