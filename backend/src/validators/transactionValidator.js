import Joi from 'joi';

/** IDs Prisma (cuid / uuid / mongo legacy) */
const idSchema = Joi.string()
  .pattern(/^[a-zA-Z0-9_-]{10,40}$/)
  .messages({
    'string.pattern.base': 'Invalid ID format',
  });

export const transactionSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required',
    }),

  type: Joi.string()
    .valid('income', 'expense')
    .required()
    .messages({
      'string.empty': 'Type is required',
      'any.only': 'Type must be either income or expense',
      'any.required': 'Type is required',
    }),

  category: idSchema.required().messages({
    'string.empty': 'Category is required',
    'string.pattern.base': 'Invalid category ID',
    'any.required': 'Category is required',
  }),

  wallet: idSchema.required().messages({
    'string.empty': 'Wallet is required',
    'string.pattern.base': 'Invalid wallet ID',
    'any.required': 'Wallet is required',
  }),

  date: Joi.date()
    .default(() => new Date())
    .messages({
      'date.base': 'Invalid date format',
    }),

  description: Joi.string()
    .min(1)
    .max(500)
    .required()
    .trim()
    .messages({
      'string.empty': 'Description is required',
      'string.min': 'Description is required',
      'string.max': 'Description cannot exceed 500 characters',
      'any.required': 'Description is required',
    }),

  note: Joi.string()
    .max(1000)
    .allow('', null)
    .trim()
    .messages({
      'string.max': 'Note cannot exceed 1000 characters',
    }),

  notes: Joi.string().max(1000).allow('', null).trim(),

  tags: Joi.array().items(Joi.string()).default([]),

  attachment: Joi.string()
    .allow('', null)
    .messages({
      'string.base': 'Attachment must be a string',
    }),

  bankAccount: idSchema.allow(null, ''),
});

export const updateTransactionSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
    }),

  type: Joi.string()
    .valid('income', 'expense')
    .messages({
      'any.only': 'Type must be either income or expense',
    }),

  category: idSchema.messages({
    'string.pattern.base': 'Invalid category ID',
  }),

  wallet: idSchema.messages({
    'string.pattern.base': 'Invalid wallet ID',
  }),

  date: Joi.date().messages({
    'date.base': 'Invalid date format',
  }),

  description: Joi.string()
    .min(1)
    .max(500)
    .trim()
    .messages({
      'string.min': 'Description is required',
      'string.max': 'Description cannot exceed 500 characters',
    }),

  note: Joi.string().max(1000).allow('', null).trim(),
  notes: Joi.string().max(1000).allow('', null).trim(),
  tags: Joi.array().items(Joi.string()),
  attachment: Joi.string().allow('', null),
  bankAccount: idSchema.allow(null, ''),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        message: 'Validation error',
        errors,
      });
    }

    req.body = value;
    next();
  };
};
