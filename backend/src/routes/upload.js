const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

// 新增：批量上传多个文件
router.post('/batch/:companyId', uploadController.upload.array('files', 10), uploadController.uploadBatchFiles);

// 原有的单文件上传路由保持不变
router.post('/company-info/:companyId', uploadController.upload.single('file'), uploadController.uploadCompanyInfo);
router.post('/balance-sheet/:companyId', uploadController.upload.single('file'), uploadController.uploadBalanceSheet);
router.post('/income-statement/:companyId', uploadController.upload.single('file'), uploadController.uploadIncomeStatement);
router.post('/tax-reports/:companyId', uploadController.upload.single('file'), uploadController.uploadTaxReports);
router.post('/invoice-data/:companyId', uploadController.upload.single('file'), uploadController.uploadInvoiceData);
router.post('/hr-salary/:companyId', uploadController.upload.single('file'), uploadController.uploadHRSalaryData);
router.post('/account-balance/:companyId', uploadController.upload.single('file'), uploadController.uploadAccountBalance);

module.exports = router;