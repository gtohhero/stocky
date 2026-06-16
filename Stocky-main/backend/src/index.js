import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ============================================
// CONEXIÓN A LA BASE DE DATOS
// ============================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ CONEXIÓN EXITOSA a la base de datos Neon');
    console.log('📊 Base de datos:', client.database);
    client.release();
    return true;
  } catch (err) {
    console.log('❌ ERROR de conexión a la base de datos:', err.message);
    return false;
  }
}

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configuración de multer para guardar imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../frontend/public/images/products');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    cb(null, fileName);
  }
});

const uploadImage = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
    }
  }
});

const uploadExcel = multer({ storage: multer.memoryStorage() });

// ============================================
// RUTAS DE PRUEBA
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/db-status', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      connected: true,
      time: result.rows[0].now,
      message: 'Base de datos conectada exitosamente'
    });
  } catch (error) {
    res.json({
      connected: false,
      error: error.message
    });
  }
});

// ============================================
// RUTAS DE AUTENTICACIÓN
// ============================================

// REGISTRO - SIEMPRE CREA ADMINISTRADOR
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // VALIDACIONES
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    if (name.length < 3) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
    }
    
    if (name.length > 100) {
      return res.status(400).json({ error: 'El nombre no puede tener más de 100 caracteres' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'El correo electrónico no es válido' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    if (password.length > 50) {
      return res.status(400).json({ error: 'La contraseña no puede tener más de 50 caracteres' });
    }
    
    console.log('📝 Intentando registrar administrador:', email);
    
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // SIEMPRE CREAR COMO ADMINISTRADOR
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, 'ADMIN']
    );
    
    console.log('✅ Usuario ADMIN registrado:', email);
    
    res.status(201).json({
      message: 'Administrador creado exitosamente. Ahora puedes iniciar sesión.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// LOGIN - ACEPTA EMAIL O NOMBRE DE USUARIO
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Usuario/Email y contraseña son requeridos' });
    }
    
    console.log('🔐 Intento de login con:', identifier);
    
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR name = $1',
      [identifier]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    console.log('✅ Login exitoso:', user.email);
    
    res.json({
      token: 'token-temporal-' + Date.now(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// RUTAS DE USUARIOS (ADMIN)
// ============================================
app.get('/api/auth/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.delete('/api/auth/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === '1') {
      return res.status(400).json({ error: 'No se puede eliminar al administrador principal' });
    }
    
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// ============================================
// CREAR TRABAJADOR O ADMIN (SOLO ADMIN) CON VALIDACIONES
// ============================================
app.post('/api/auth/register-worker', async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;
    
    // VALIDACIONES
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }
    
    if (name.length < 3) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
    }
    
    if (name.length > 100) {
      return res.status(400).json({ error: 'El nombre no puede tener más de 100 caracteres' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'El correo electrónico no es válido' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    if (password.length > 50) {
      return res.status(400).json({ error: 'La contraseña no puede tener más de 50 caracteres' });
    }
    
    if (role !== 'WORKER' && role !== 'ADMIN') {
      return res.status(400).json({ error: 'Rol no válido' });
    }
    
    // Validar teléfono si se proporciona
    if (phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'El teléfono debe tener 10 dígitos' });
      }
    }
    
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, phone, address) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, role, phone, address`,
      [name, email, hashedPassword, role, phone || null, address || null]
    );
    
    console.log(`✅ Usuario ${role} registrado:`, email);
    
    res.status(201).json({
      message: `${role === 'WORKER' ? 'Trabajador' : 'Administrador'} creado exitosamente`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ============================================
// RUTAS DE SUCURSALES
// ============================================
app.get('/api/branches', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, address, phone, email, manager, status, created_at
      FROM branches 
      WHERE status = 'ACTIVE'
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener sucursales:', error);
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
});

// CREAR SUCURSAL CON VALIDACIONES
app.post('/api/branches', async (req, res) => {
  try {
    const { name, address, phone, email, manager } = req.body;
    
    // VALIDACIONES
    if (!name) {
      return res.status(400).json({ error: 'El nombre de la sucursal es requerido' });
    }
    
    if (name.length < 3) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
    }
    
    if (name.length > 100) {
      return res.status(400).json({ error: 'El nombre no puede tener más de 100 caracteres' });
    }
    
    if (phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'El teléfono debe tener 10 dígitos' });
      }
    }
    
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'El correo electrónico no es válido' });
      }
    }
    
    const existing = await pool.query('SELECT id FROM branches WHERE name = $1', [name]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe una sucursal con ese nombre' });
    }
    
    const result = await pool.query(`
      INSERT INTO branches (name, address, phone, email, manager, status)
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
      RETURNING *
    `, [name, address, phone, email, manager]);
    
    console.log(`✅ Sucursal "${name}" creada`);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    res.status(500).json({ error: 'Error al crear sucursal' });
  }
});

app.put('/api/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, manager, status } = req.body;
    
    const result = await pool.query(`
      UPDATE branches 
      SET name = $1, address = $2, phone = $3, email = $4, manager = $5, status = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [name, address, phone, email, manager, status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar sucursal:', error);
    res.status(500).json({ error: 'Error al actualizar sucursal' });
  }
});

app.delete('/api/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM branch_products WHERE branch_id = $1', [id]);
    await pool.query('DELETE FROM branches WHERE id = $1', [id]);
    
    res.json({ message: 'Sucursal eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar sucursal:', error);
    res.status(500).json({ error: 'Error al eliminar sucursal' });
  }
});

app.get('/api/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, name, address, phone, email, manager, status FROM branches WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener sucursal' });
  }
});

// ============================================
// TABLA branch_products (PRODUCTOS POR SUCURSAL)
// ============================================

// OBTENER PRODUCTOS DE UNA SUCURSAL
app.get('/api/products/branch/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        id, name, description, purchase_price, selling_price,
        stock, category, barcode, location, min_stock,
        usage_description, benefits, side_effects, presentation, laboratory, image_url
      FROM branch_products
      WHERE branch_id = $1
      ORDER BY name
    `, [branchId]);
    
    res.json({ products: result.rows, branchId });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// ============================================
// OBTENER UN PRODUCTO ESPECÍFICO POR ID (CON SUCURSAL)
// ============================================
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.query.branch;
    
    if (!branchId) {
      return res.status(400).json({ error: 'Se requiere el parámetro branch' });
    }
    
    const result = await pool.query(`
      SELECT 
        id, name, description, purchase_price, selling_price,
        stock, category, barcode, location, min_stock,
        usage_description, benefits, side_effects, presentation, laboratory, image_url
      FROM branch_products
      WHERE id = $1 AND branch_id = $2
    `, [id, branchId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// ============================================
// SUBIR EXCEL A UNA SUCURSAL
// ============================================
app.post('/api/branches/:branchId/upload-excel', uploadExcel.single('file'), async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const branchCheck = await pool.query('SELECT id, name FROM branches WHERE id = $1', [branchId]);
    if (branchCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    
    console.log(`📁 Procesando Excel para sucursal: ${branchCheck.rows[0].name}`);
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.worksheets[0];
    
    const rows = [];
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      
      const rowData = {
        name: row.getCell(1).value?.toString() || '',
        description: row.getCell(2)?.value?.toString() || '',
        purchase_price: parseFloat(row.getCell(3)?.value) || 0,
        selling_price: parseFloat(row.getCell(4)?.value) || 0,
        stock: parseInt(row.getCell(5)?.value) || 0,
        category: row.getCell(6)?.value?.toString() || 'General',
        barcode: row.getCell(7)?.value?.toString() || '',
        location: row.getCell(8)?.value?.toString() || '',
        min_stock: parseInt(row.getCell(9)?.value) || 5,
        usage_description: row.getCell(10)?.value?.toString() || '',
        benefits: row.getCell(11)?.value?.toString() || '',
        side_effects: row.getCell(12)?.value?.toString() || '',
        presentation: row.getCell(13)?.value?.toString() || '',
        laboratory: row.getCell(14)?.value?.toString() || ''
      };
      
      if (rowData.name) {
        rows.push(rowData);
      }
    });
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of rows) {
      try {
        const existing = await pool.query(
          'SELECT id FROM branch_products WHERE branch_id = $1 AND barcode = $2',
          [branchId, product.barcode]
        );
        
        if (existing.rows.length > 0) {
          await pool.query(`
            UPDATE branch_products 
            SET stock = stock + $1,
                purchase_price = $2,
                selling_price = $3,
                name = $4,
                description = $5,
                category = $6,
                location = $7,
                min_stock = $8,
                usage_description = $9,
                benefits = $10,
                side_effects = $11,
                presentation = $12,
                laboratory = $13,
                updated_at = NOW()
            WHERE branch_id = $14 AND barcode = $15
          `, [product.stock, product.purchase_price, product.selling_price,
              product.name, product.description, product.category,
              product.location, product.min_stock,
              product.usage_description, product.benefits, product.side_effects,
              product.presentation, product.laboratory, branchId, product.barcode]);
        } else {
          await pool.query(`
            INSERT INTO branch_products (
              branch_id, name, description, purchase_price, selling_price,
              stock, category, barcode, location, min_stock,
              usage_description, benefits, side_effects, presentation, laboratory
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          `, [branchId, product.name, product.description, product.purchase_price,
              product.selling_price, product.stock, product.category,
              product.barcode, product.location, product.min_stock,
              product.usage_description, product.benefits, product.side_effects,
              product.presentation, product.laboratory]);
        }
        successCount++;
      } catch (rowError) {
        console.error('Error en fila:', rowError);
        errorCount++;
      }
    }
    
    console.log(`✅ ${successCount} productos procesados para ${branchCheck.rows[0].name}`);
    
    res.json({
      message: `✅ Procesados ${successCount} de ${rows.length} productos para ${branchCheck.rows[0].name}`,
      total: rows.length,
      success: successCount,
      errors: errorCount
    });
  } catch (error) {
    console.error('Error al procesar Excel:', error);
    res.status(500).json({ error: 'Error al procesar el archivo' });
  }
});

// ============================================
// ACTUALIZAR STOCK
// ============================================
app.put('/api/products/:productId/stock', async (req, res) => {
  try {
    const { productId } = req.params;
    const { stock, branchId } = req.body;
    
    const result = await pool.query(`
      UPDATE branch_products 
      SET stock = $1, updated_at = NOW()
      WHERE id = $2 AND branch_id = $3
      RETURNING *
    `, [stock, productId, branchId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado en esta sucursal' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar stock' });
  }
});

// ============================================
// SUBIR IMAGEN DE PRODUCTO (GUARDAR EN CARPETA)
// ============================================
app.post('/api/products/:id/upload-image', uploadImage.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { branchId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }
    
    const imageUrl = `/images/products/${req.file.filename}`;
    
    const result = await pool.query(`
      UPDATE branch_products 
      SET image_url = $1, updated_at = NOW()
      WHERE id = $2 AND branch_id = $3
      RETURNING *
    `, [imageUrl, id, branchId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json({
      message: 'Imagen subida y actualizada correctamente',
      imageUrl: imageUrl,
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
});

// ============================================
// ELIMINAR IMAGEN DE PRODUCTO (BORRAR ARCHIVO)
// ============================================
app.delete('/api/products/:id/delete-image', async (req, res) => {
  try {
    const { id } = req.params;
    const { branchId } = req.body;
    
    const product = await pool.query(
      'SELECT image_url FROM branch_products WHERE id = $1 AND branch_id = $2',
      [id, branchId]
    );
    
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    const imageUrl = product.rows[0].image_url;
    
    if (imageUrl) {
      const filename = imageUrl.replace('/images/products/', '');
      const filePath = path.join(__dirname, '../../frontend/public/images/products', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    const result = await pool.query(`
      UPDATE branch_products 
      SET image_url = NULL, updated_at = NOW()
      WHERE id = $1 AND branch_id = $2
      RETURNING *
    `, [id, branchId]);
    
    res.json({
      message: 'Imagen eliminada correctamente',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al eliminar la imagen' });
  }
});

// ============================================
// ESTADÍSTICAS POR SUCURSAL
// ============================================
app.get('/api/stats/branch/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(stock), 0) as total_units,
        COALESCE(ROUND(SUM(stock * purchase_price)::numeric, 2), 0) as total_investment,
        COALESCE(ROUND(SUM(stock * selling_price)::numeric, 2), 0) as total_value,
        COALESCE(ROUND(SUM(stock * (selling_price - purchase_price))::numeric, 2), 0) as total_profit,
        COUNT(CASE WHEN stock <= min_stock THEN 1 END) as low_stock_count
      FROM branch_products
      WHERE branch_id = $1
    `, [branchId]);
    
    res.json({
      total_products: Number(result.rows[0].total_products) || 0,
      total_units: Number(result.rows[0].total_units) || 0,
      total_investment: Number(result.rows[0].total_investment) || 0,
      total_value: Number(result.rows[0].total_value) || 0,
      total_profit: Number(result.rows[0].total_profit) || 0,
      low_stock_count: Number(result.rows[0].low_stock_count) || 0
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ============================================
// ESTADÍSTICAS DE TODAS LAS SUCURSALES
// ============================================
app.get('/api/stats/all', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(stock), 0) as total_units,
        COALESCE(ROUND(SUM(stock * purchase_price)::numeric, 2), 0) as total_investment,
        COALESCE(ROUND(SUM(stock * selling_price)::numeric, 2), 0) as total_value,
        COALESCE(ROUND(SUM(stock * (selling_price - purchase_price))::numeric, 2), 0) as total_profit,
        COUNT(CASE WHEN stock <= min_stock THEN 1 END) as low_stock_count,
        COALESCE(ROUND(AVG(selling_price - purchase_price)::numeric, 2), 0) as avg_profit_per_unit,
        COALESCE(ROUND(AVG(CASE WHEN selling_price > 0 THEN ((selling_price - purchase_price) / selling_price * 100) ELSE 0 END)::numeric, 2), 0) as avg_margin
      FROM branch_products
    `);
    
    res.json({
      total_products: Number(result.rows[0].total_products) || 0,
      total_units: Number(result.rows[0].total_units) || 0,
      total_investment: Number(result.rows[0].total_investment) || 0,
      total_value: Number(result.rows[0].total_value) || 0,
      total_profit: Number(result.rows[0].total_profit) || 0,
      low_stock_count: Number(result.rows[0].low_stock_count) || 0,
      avg_profit_per_unit: Number(result.rows[0].avg_profit_per_unit) || 0,
      avg_margin: Number(result.rows[0].avg_margin) || 0
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ============================================
// RUTAS PÚBLICAS
// ============================================
app.get('/api/products/public', async (req, res) => {
  try {
    const branchId = req.query.branch || 1;
    
    const result = await pool.query(`
      SELECT 
        id, name, description, selling_price, stock, category, image_url
      FROM branch_products
      WHERE branch_id = $1 AND stock > 0
      ORDER BY name ASC
    `, [branchId]);
    
    res.json({
      products: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error en productos públicos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// ============================================
// RUTAS DE VENTAS
// ============================================
app.post('/api/sales', async (req, res) => {
  const client = await pool.connect();
  try {
    const { items, client_name, client_phone, payment_method, seller_id, branch_id } = req.body;
    
    await client.query('BEGIN');
    
    let total_amount = 0;
    let total_profit = 0;
    
    for (const item of items) {
      const product = await client.query(
        `SELECT selling_price, purchase_price, stock 
         FROM branch_products
         WHERE id = $1 AND branch_id = $2`,
        [item.product_id, branch_id]
      );
      
      if (product.rows.length === 0) {
        throw new Error(`Producto no encontrado`);
      }
      
      if (product.rows[0].stock < item.quantity) {
        throw new Error(`Stock insuficiente`);
      }
      
      const subtotal = product.rows[0].selling_price * item.quantity;
      const profit = (product.rows[0].selling_price - product.rows[0].purchase_price) * item.quantity;
      
      total_amount += subtotal;
      total_profit += profit;
    }
    
    const invoice_number = `FAC-${Date.now()}`;
    const sale = await client.query(
      `INSERT INTO sales (invoice_number, total_amount, total_profit, payment_method, client_name, client_phone, seller_id, branch_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [invoice_number, total_amount, total_profit, payment_method, client_name, client_phone, seller_id, branch_id]
    );
    
    for (const item of items) {
      const product = await client.query(
        `SELECT selling_price, purchase_price, stock 
         FROM branch_products
         WHERE id = $1 AND branch_id = $2`,
        [item.product_id, branch_id]
      );
      
      const oldStock = product.rows[0].stock;
      const newStock = oldStock - item.quantity;
      const subtotal = product.rows[0].selling_price * item.quantity;
      
      await client.query(
        `INSERT INTO sale_details (sale_id, product_id, quantity, unit_price, purchase_price, subtotal, branch_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sale.rows[0].id, item.product_id, item.quantity, product.rows[0].selling_price, product.rows[0].purchase_price, subtotal, branch_id]
      );
      
      await client.query(
        'UPDATE branch_products SET stock = stock - $1, updated_at = NOW() WHERE id = $2 AND branch_id = $3',
        [item.quantity, item.product_id, branch_id]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({
      message: 'Venta registrada exitosamente',
      sale: sale.rows[0],
      total_amount,
      total_profit
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en venta:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get('/api/sales/today', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as total_sales_today, COALESCE(SUM(total_amount), 0) as today_revenue
      FROM sales WHERE DATE(sale_date) = CURRENT_DATE
    `);
    res.json({
      today_sales: 0,
      today_revenue: result.rows[0].today_revenue,
      total_sales_today: parseInt(result.rows[0].total_sales_today)
    });
  } catch (error) {
    res.json({ today_sales: 0, today_revenue: 0, total_sales_today: 0 });
  }
});

app.get('/api/sales/today/list', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, invoice_number, total_amount, payment_method, client_name, sale_date
      FROM sales WHERE DATE(sale_date) = CURRENT_DATE ORDER BY sale_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.json([]);
  }
});

// ============================================
// ASIGNAR SUCURSALES A TRABAJADORES
// ============================================
app.get('/api/users/:userId/branches', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT b.id, b.name, b.address, b.phone
      FROM branches b
      JOIN user_branches ub ON b.id = ub.branch_id
      WHERE ub.user_id = $1 AND b.status = 'ACTIVE'
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener sucursales del usuario' });
  }
});

app.post('/api/users/:userId/branches', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId } = req.params;
    const { branchIds } = req.body;
    
    await client.query('BEGIN');
    await client.query('DELETE FROM user_branches WHERE user_id = $1', [userId]);
    
    for (const branchId of branchIds) {
      await client.query(`
        INSERT INTO user_branches (user_id, branch_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, branch_id) DO NOTHING
      `, [userId, branchId]);
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Sucursales asignadas correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al asignar sucursales' });
  } finally {
    client.release();
  }
});

app.get('/api/workers', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.role, u.created_at,
        COALESCE(
          (SELECT json_agg(json_build_object('id', b.id, 'name', b.name))
           FROM user_branches ub
           JOIN branches b ON ub.branch_id = b.id
           WHERE ub.user_id = u.id),
          '[]'::json
        ) as branches
      FROM users u
      WHERE u.role IN ('WORKER', 'ADMIN')
      ORDER BY u.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener trabajadores' });
  }
});

// ============================================
// OBTENER SUCURSALES DEL TRABAJADOR
// ============================================
app.get('/api/worker/branches', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    const userId = req.query.userId || 1;
    
    const result = await pool.query(`
      SELECT b.id, b.name, b.address, b.phone
      FROM branches b
      JOIN user_branches ub ON b.id = ub.branch_id
      WHERE ub.user_id = $1 AND b.status = 'ACTIVE'
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
});

// Obtener productos de una sucursal específica (para trabajador)
app.get('/api/worker/products/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        id, name, description, purchase_price, selling_price,
        stock, category, barcode, location, min_stock,
        image_url
      FROM branch_products
      WHERE branch_id = $1
      ORDER BY name
    `, [branchId]);
    
    res.json({ products: result.rows, branchId });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// ============================================
// REPORTES DE VENTAS (WORKER Y ADMIN)
// ============================================

// Obtener ventas del día (por trabajador)
app.get('/api/worker/sales/today', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    
    const userId = req.query.userId;
    
    let query = `
      SELECT 
        s.id, s.invoice_number, s.total_amount, s.total_profit,
        s.payment_method, s.client_name, s.sale_date,
        u.name as seller_name,
        b.name as branch_name,
        json_agg(json_build_object(
          'product_name', p.name,
          'quantity', sd.quantity,
          'unit_price', sd.unit_price,
          'subtotal', sd.subtotal
        )) as items
      FROM sales s
      JOIN users u ON s.seller_id = u.id
      JOIN branches b ON s.branch_id = b.id
      JOIN sale_details sd ON s.id = sd.sale_id
      JOIN branch_products p ON sd.product_id = p.id
      WHERE DATE(s.sale_date) = CURRENT_DATE
    `;
    
    const params = [];
    
    if (userId) {
      query += ` AND s.seller_id = $1`;
      params.push(userId);
    }
    
    query += ` GROUP BY s.id, u.name, b.name ORDER BY s.sale_date DESC`;
    
    const result = await pool.query(query, params);
    
    const totalSales = result.rows.length;
    const totalRevenue = result.rows.reduce((sum, row) => sum + Number(row.total_amount), 0);
    const totalProfit = result.rows.reduce((sum, row) => sum + Number(row.total_profit), 0);
    
    res.json({
      sales: result.rows,
      summary: {
        total_sales: totalSales,
        total_revenue: totalRevenue,
        total_profit: totalProfit
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener reporte de ventas' });
  }
});

// Enviar reporte de ventas al administrador
app.post('/api/worker/send-report', async (req, res) => {
  try {
    const { seller_id, seller_name, branch_id, branch_name, sales_summary, sales_details, report_date } = req.body;
    
    const result = await pool.query(`
      INSERT INTO daily_reports (
        seller_id, seller_name, branch_id, branch_name, report_date,
        total_sales, total_revenue, total_profit, sales_details, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')
      RETURNING *
    `, [seller_id, seller_name, branch_id, branch_name, report_date, 
        sales_summary.total_sales, sales_summary.total_revenue, 
        sales_summary.total_profit, JSON.stringify(sales_details)]);
    
    res.json({ 
      message: 'Reporte enviado exitosamente al administrador',
      report: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al enviar el reporte' });
  }
});

// Obtener reportes diarios para el administrador
app.get('/api/admin/reports/daily', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        dr.id,
        dr.seller_id,
        dr.seller_name,
        dr.branch_id,
        dr.branch_name,
        dr.report_date,
        dr.total_sales,
        dr.total_revenue,
        dr.total_profit,
        dr.sales_details,
        dr.status,
        dr.created_at,
        u.name as worker_name
      FROM daily_reports dr
      JOIN users u ON dr.seller_id = u.id
      ORDER BY dr.created_at DESC
    `);
    
    // Parsear los sales_details a JSON si es necesario
    const reports = result.rows.map(row => ({
      ...row,
      sales_details: typeof row.sales_details === 'string' ? JSON.parse(row.sales_details) : row.sales_details
    }));
    
    res.json(reports);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
});

// ============================================
// CAMBIAR ESTADO DEL REPORTE
// ============================================
app.put('/api/admin/reports/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(`
      UPDATE daily_reports 
      SET status = $1 
      WHERE id = $2 
      RETURNING *
    `, [status, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    res.json({ message: 'Estado actualizado', report: result.rows[0] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================
async function startServer() {
  console.log('\n========================================');
  console.log('🚀 INICIANDO SERVIDOR STOCKY');
  console.log('========================================\n');
  
  await testDatabaseConnection();
  
  app.listen(PORT, () => {
    console.log(`\n✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📡 Health: http://localhost:${PORT}/api/health`);
    console.log(`🏢 Branches: http://localhost:${PORT}/api/branches`);
    console.log(`📦 Products by branch: http://localhost:${PORT}/api/products/branch/{branchId}`);
    console.log(`🔍 Product detail: http://localhost:${PORT}/api/products/{id}?branch={branchId}`);
    console.log(`📤 Upload Excel: http://localhost:${PORT}/api/branches/{branchId}/upload-excel`);
    console.log(`🖼️ Upload image: POST /api/products/{id}/upload-image`);
    console.log(`🗑️ Delete image: DELETE /api/products/{id}/delete-image`);
    console.log(`📊 Stats by branch: GET /api/stats/branch/{branchId}`);
    console.log(`📊 Stats all: GET /api/stats/all`);
    console.log(`👥 Register worker: POST /api/auth/register-worker`);
    console.log('\n========================================\n');
  });
}

startServer();