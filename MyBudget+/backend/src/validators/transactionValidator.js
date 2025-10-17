import Joi from 'joi';

// Transaction validation schema
export const transactionSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),
  
  type: Joi.string()
    .valid('income', 'expense')
    .required()
    .messages({
      'string.empty': 'Type is required',
      'any.only': 'Type must be either income or expense',
      'any.required': 'Type is required'
    }),
  
  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Category is required',
      'string.pattern.base': 'Invalid category ID',
      'any.required': 'Category is required'
    }),
  
  wallet: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.empty': 'Wallet is required',
      'string.pattern.base': 'Invalid wallet ID',
      'any.required': 'Wallet is required'
    }),
  
  date: Joi.date()
    .max('now')
    .default(Date.now)
    .messages({
      'date.base': 'Invalid date format',
      'date.max': 'Date cannot be in the future'
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
      'any.required': 'Description is required'
    }),
  
  note: Joi.string()
    .max(1000)
    .allow('')
    .trim()
    .messages({
      'string.max': 'Note cannot exceed 1000 characters'
    }),
  
  attachment: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Attachment must be a valid URL'
    })
});

// Update transaction schema (all fields optional)
export const updateTransactionSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive'
    }),
  
  type: Joi.string()
    .valid('income', 'expense')
    .messages({
      'any.only': 'Type must be either income or expense'
    }),
  
  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid category ID'
    }),
  
  wallet: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid wallet ID'
    }),
  
  date: Joi.date()
    .max('now')
    .messages({
      'date.base': 'Invalid date format',
      'date.max': 'Date cannot be in the future'
    }),
  
  description: Joi.string()
    .min(1)
    .max(500)
    .trim()
    .messages({
      'string.min': 'Description is required',
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  note: Joi.string()
    .max(1000)
    .allow('')
    .trim()
    .messages({
      'string.max': 'Note cannot exceed 1000 characters'
    }),
  
  attachment: Joi.string()
    .uri()
    .allow('')
    .messages({
      'string.uri': 'Attachment must be a valid URL'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        message: 'Validation error',
        errors
      });
    }

    req.body = value;
    next();
  };
};

