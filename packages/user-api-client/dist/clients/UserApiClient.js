"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
class UserApiClient {
    constructor() {
        this.baseURL = '/api/users';
    }
    // eslint-disable-next-line class-methods-use-this
    query(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield request;
            return response.data;
        });
    }
    // Get a single user by ID
    getUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.query(axios_1.default.get(`${this.baseURL}/${id}`));
        });
    }
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.query(axios_1.default.get(`${this.baseURL}/${email}`));
        });
    }
    // Create a new user
    createUser(createUserPayload) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.query(axios_1.default.post(this.baseURL, createUserPayload));
        });
    }
    // Update a user
    updateUser(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.query(axios_1.default.put(`${this.baseURL}/${id}`, data));
        });
    }
    // Delete a user
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.query(axios_1.default.delete(`${this.baseURL}/${id}`));
        });
    }
}
exports.UserApiClient = UserApiClient;
// // Usage
// (async () => {
//     const apiClient = new UserApiClient();
//     // Fetch all users
//     const users = await apiClient.fetch().execute();
//     console.log('Users:', users);
//     // Get a single user by ID
//     const user = await apiClient.getUser(1).execute();
//     console.log('User:', user);
//     // Create a new user
//     const newUser = await apiClient
//         .createUser({ name: 'John Doe', age: 30 })
//         .execute();
//     console.log('Created User:', newUser);
//     // Update a user
//     const updatedUser = await apiClient
//         .updateUser(1, { name: 'Jane Doe', age: 31 })
//         .execute();
//     console.log('Updated User:', updatedUser);
//     // Delete a user
//     const deletedUser = await apiClient.deleteUser(1).execute();
//     console.log('Deleted User:', deletedUser);
// })();
