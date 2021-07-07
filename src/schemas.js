import Joi from "joi";

export const SignUpSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  email: Joi.string()
    .pattern(/^[^\s@]+@[^\s@]+$/)
    .required(),
});
