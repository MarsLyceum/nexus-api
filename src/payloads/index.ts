export type RegisterUserPayload = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    age: number;
};

export type LoginUserPayload = {
    email: string;
    password: string;
};
