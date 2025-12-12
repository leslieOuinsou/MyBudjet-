import Joi from 'joi';

// Budget validation schema
export const budgetSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .trim()
    .messages({
      'string.empty': 'Budget name is required',
      'string.min': 'Budget name must be at least 2 characters',
      'string.max': 'Budget name cannot exceed 100 characters',
      'any.required': 'Budget name is required'
    }),
  
  amount: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),
  
  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null)
    .messages({
      'string.pattern.base': 'Invalid category ID'
    }),
  
  period: Joi.string()
    .valid('day', 'week', 'month', 'year')
    .default('month')
    .messages({
      'any.only': 'Period must be day, week, month, or year'
    }),
  
  startDate: Joi.date()
    .default(Date.now)
    .messages({
      'date.base': 'Invalid start date format'
    }),
  
  endDate: Joi.date()
    .greater(Joi.ref('startDate'))
    .allow(null)
    .messages({
      'date.base': 'Invalid end date format',
      'date.greater': 'End date must be after start date'
    }),
  
  alertThreshold: Joi.number()
    .min(0)
    .max(100)
    .default(80)
    .messages({
      'number.base': 'Alert threshold must be a number',
      'number.min': 'Alert threshold must be at least 0',
      'number.max': 'Alert threshold cannot exceed 100'
    })
});

// Update budget schema
export const updateBudgetSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .messages({
      'string.min': 'Budget name must be at least 2 characters',
      'string.max': 'Budget name cannot exceed 100 characters'
    }),
  
  amount: Joi.number()
    .positive()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive'
    }),
  
  category: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow(null)
    .messages({
      'string.pattern.base': 'Invalid category ID'
    }),
  
  period: Joi.string()
    .valid('day', 'week', 'month', 'year')
    .messages({
      'any.only': 'Period must be day, week, month, or year'
    }),
  
  startDate: Joi.date()
    .messages({
      'date.base': 'Invalid start date format'
    }),
  
  endDate: Joi.date()
    .messages({
      'date.base': 'Invalid end date format'
    }),
  
  alertThreshold: Joi.number()
    .min(0)
    .max(100)
    .messages({
      'number.base': 'Alert threshold must be a number',
      'number.min': 'Alert threshold must be at least 0',
      'number.max': 'Alert threshold cannot exceed 100'
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

