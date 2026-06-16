import express from 'express';
import multer from 'multer';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  uploadExcel,
  getInventoryStats,
  exportToExcel
} from '../controllers/productController.js';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticateToken, getProducts);
router.get('/stats', authenticateToken, authorizeAdmin, getInventoryStats);
router.get('/export', authenticateToken, authorizeAdmin, exportToExcel);
router.post('/', authenticateToken, authorizeAdmin, createProduct);
router.post('/upload-excel', authenticateToken, authorizeAdmin, upload.single('file'), uploadExcel);
router.put('/:id', authenticateToken, authorizeAdmin, updateProduct);

export default router;