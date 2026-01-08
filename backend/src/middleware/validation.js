const Joi = require('joi');
const { AppError } = require('./errorHandler');

/**
 * 通用验证中间件
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errorMessage = error.details
                .map(detail => detail.message)
                .join(', ');
            return next(new AppError(`数据验证失败: ${errorMessage}`, 400));
        }

        req.body = value;
        next();
    };
};

/**
 * 企业信息验证规则
 */
const companySchema = Joi.object({
    name: Joi.string().required().min(2).max(100).messages({
        'string.empty': '企业名称不能为空',
        'string.min': '企业名称至少2个字符',
        'string.max': '企业名称最多100个字符',
        'any.required': '企业名称是必填项',
    }),
    tax_code: Joi.string().pattern(/^[0-9A-Z]{15,20}$/).allow('', null).messages({
        'string.pattern.base': '税号格式不正确（应为15-20位数字或大写字母）',
    }),
    company_type: Joi.string().allow('', null),
    legal_person: Joi.string().allow('', null),
    registered_capital: Joi.number().min(0).allow(null).messages({
        'number.min': '注册资本不能为负数',
    }),
    establishment_date: Joi.string().allow('', null),
    business_term: Joi.string().allow('', null),
    address: Joi.string().allow('', null),
    business_scope: Joi.string().allow('', null),
    industry: Joi.string().allow('', null),
    industry_code: Joi.string().allow('', null),
    company_scale: Joi.string().allow('', null),
    employee_count: Joi.number().integer().min(0).allow(null).messages({
        'number.min': '员工数量不能为负数',
        'number.integer': '员工数量必须是整数',
    }),
    shareholder_info: Joi.string().allow('', null),
});

/**
 * 用户注册验证规则
 */
const registerSchema = Joi.object({
    username: Joi.string().required().min(3).max(30).pattern(/^[a-zA-Z0-9_]+$/).messages({
        'string.empty': '用户名不能为空',
        'string.min': '用户名至少3个字符',
        'string.max': '用户名最多30个字符',
        'string.pattern.base': '用户名只能包含字母、数字和下划线',
        'any.required': '用户名是必填项',
    }),
    email: Joi.string().email().required().messages({
        'string.empty': '邮箱不能为空',
        'string.email': '邮箱格式不正确',
        'any.required': '邮箱是必填项',
    }),
    password: Joi.string().required().min(6).max(50).messages({
        'string.empty': '密码不能为空',
        'string.min': '密码至少6个字符',
        'string.max': '密码最多50个字符',
        'any.required': '密码是必填项',
    }),
    userType: Joi.string().valid('enterprise', 'accounting', 'group').default('enterprise').messages({
        'any.only': '用户类型必须是 enterprise、accounting 或 group',
    }),
});

/**
 * 用户登录验证规则
 */
const loginSchema = Joi.object({
    username: Joi.string().required().messages({
        'string.empty': '用户名不能为空',
        'any.required': '用户名是必填项',
    }),
    password: Joi.string().required().messages({
        'string.empty': '密码不能为空',
        'any.required': '密码是必填项',
    }),
});

/**
 * ID 参数验证
 */
const validateId = (req, res, next) => {
    const id = parseInt(req.params.id);

    if (isNaN(id) || id <= 0) {
        return next(new AppError('无效的 ID 参数', 400));
    }

    req.params.id = id;
    next();
};

/**
 * 批量删除验证
 */
const batchDeleteSchema = Joi.object({
    companyIds: Joi.array().items(Joi.number().integer().positive()).min(1).required().messages({
        'array.min': '至少选择一个企业',
        'any.required': '企业ID列表是必填项',
    }),
});

/**
 * 文件上传验证
 */
const validateFileUpload = (req, res, next) => {
    if (!req.file && !req.files) {
        return next(new AppError('请选择要上传的文件', 400));
    }
    next();
};

/**
 * 期间参数验证
 */
const validatePeriod = (req, res, next) => {
    const { period_year, period_month, period_quarter } = req.query;

    if (period_year) {
        const year = parseInt(period_year);
        if (isNaN(year) || year < 2000 || year > 2100) {
            return next(new AppError('无效的年份参数（2000-2100）', 400));
        }
    }

    if (period_month) {
        const month = parseInt(period_month);
        if (isNaN(month) || month < 1 || month > 12) {
            return next(new AppError('无效的月份参数（1-12）', 400));
        }
    }

    if (period_quarter) {
        const quarter = parseInt(period_quarter);
        if (isNaN(quarter) || quarter < 1 || quarter > 4) {
            return next(new AppError('无效的季度参数（1-4）', 400));
        }
    }

    next();
};

module.exports = {
    validate,
    companySchema,
    registerSchema,
    loginSchema,
    batchDeleteSchema,
    validateId,
    validateFileUpload,
    validatePeriod,
};
