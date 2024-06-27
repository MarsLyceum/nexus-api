"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserPayloadSchema = exports.updateUserParamsSchema = exports.deleteUserParamsSchema = exports.getUserParamsSchema = exports.createUserPayloadSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const userIdentifierSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
});
const userProfileSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    firstName: joi_1.default.string().required(),
    lastName: joi_1.default.string().required(),
    phoneNumber: joi_1.default.string().required(),
});
exports.createUserPayloadSchema = userProfileSchema;
exports.getUserParamsSchema = userIdentifierSchema;
exports.deleteUserParamsSchema = userIdentifierSchema;
exports.updateUserParamsSchema = userIdentifierSchema;
exports.updateUserPayloadSchema = userProfileSchema;
