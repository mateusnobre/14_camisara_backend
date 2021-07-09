import Joi from "joi";

export const signUpSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  email: Joi.string()
    .pattern(/^[^\s@]+@[^\s@]+$/)
    .required(),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .pattern(/^[^\s@]+@[^\s@]+$/)
    .required(),
  password: Joi.string().required(),
});
