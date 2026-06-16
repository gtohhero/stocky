import pool from '../models/db.js';
import ExcelJS from 'exceljs';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

// Obtener todos los productos
export const getProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, name, description, 
        purchase_price, selling_price, 
        (selling_price - purchase_price) as profit,
        stock, category, barcode, location, min_stock,
        expiration, created_at, updated_at
      FROM products 
      ORDER BY created_at DESC
    `);
    
    const totalValue = result.rows.reduce((sum, p) => sum + (Number(p.purchase_price) * Number(p.stock)), 0);
    const totalSalesValue = result.rows.reduce((sum, p) => sum + (Number(p.selling_price) * Number(p.stock)), 0);
    
    res.json({
      products: result.rows,
      stats: {
        totalProducts: result.rows.length,
        totalInvestment: totalValue,
        totalValue: totalSalesValue,
        totalProfit: totalSalesValue - totalValue,
        lowStock: result.rows.filter(p => p.stock <= p.min_stock).length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Subir archivo Excel
export const uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }
    
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
        expiration: row.getCell(10)?.value || null
      };
      
      if (rowData.name) {
        rows.push(rowData);
      }
    });
    
    const results = {
      success: [],
      errors: [],
      total: rows.length
    };
    
    for (const product of rows) {
      try {
        const existing = await pool.query(
          'SELECT id FROM products WHERE barcode = $1',
          [product.barcode]
        );
        
        if (existing.rows.length > 0) {
          await pool.query(`
            UPDATE products 
            SET stock = stock + $1, 
                purchase_price = $2,
                selling_price = $3,
                updated_at = NOW()
            WHERE barcode = $4
          `, [product.stock, product.purchase_price, product.selling_price, product.barcode]);
          results.success.push({ ...product, action: 'actualizado' });
        } else {
          await pool.query(`
            INSERT INTO products (
              name, description, purchase_price, selling_price, 
              stock, category, barcode, location, min_stock, expiration, user_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [product.name, product.description, product.purchase_price, 
              product.selling_price, product.stock, product.category, 
              product.barcode, product.location, product.min_stock, 
              product.expiration, req.user.id]);
          results.success.push({ ...product, action: 'creado' });
        }
      } catch (rowError) {
        results.errors.push({ product, error: rowError.message });
      }
    }
    
    res.json({
      message: `✅ Procesados ${results.success.length} de ${results.total} productos`,
      results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar el archivo' });
  }
};

// Crear producto individual
export const createProduct = async (req, res) => {
  try {
    const { 
      name, description, purchase_price, selling_price, 
      stock, category, barcode, location, min_stock, expiration 
    } = req.body;
    
    const result = await pool.query(`
      INSERT INTO products (
        name, description, purchase_price, selling_price, 
        stock, category, barcode, location, min_stock, expiration, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [name, description, purchase_price, selling_price, stock, category, barcode, location, min_stock, expiration, req.user.id]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// Actualizar producto
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, selling_price, purchase_price, min_stock } = req.body;
    
    const result = await pool.query(`
      UPDATE products 
      SET stock = COALESCE($1, stock),
          selling_price = COALESCE($2, selling_price),
          purchase_price = COALESCE($3, purchase_price),
          min_stock = COALESCE($4, min_stock),
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [stock, selling_price, purchase_price, min_stock, id]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

// Obtener estadísticas
export const getInventoryStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(stock) as total_units,
        ROUND(SUM(stock * purchase_price)::numeric, 2) as total_investment,
        ROUND(SUM(stock * selling_price)::numeric, 2) as total_value,
        ROUND(SUM((selling_price - purchase_price) * stock)::numeric, 2) as total_profit,
        COUNT(CASE WHEN stock <= min_stock THEN 1 END) as low_stock_count,
        ROUND(AVG(selling_price - purchase_price)::numeric, 2) as avg_profit_per_unit
      FROM products
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// Exportar a Excel
export const exportToExcel = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        name, description, purchase_price, selling_price, 
        (selling_price - purchase_price) as profit,
        stock, category, barcode, location, min_stock,
        (stock * purchase_price) as total_investment,
        (stock * selling_price) as total_value
      FROM products 
      ORDER BY name
    `);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario Stocky');
    
    worksheet.columns = [
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Descripción', key: 'description', width: 40 },
      { header: 'Costo Compra', key: 'purchase_price', width: 15 },
      { header: 'Precio Venta', key: 'selling_price', width: 15 },
      { header: 'Ganancia', key: 'profit', width: 15 },
      { header: 'Stock', key: 'stock', width: 12 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Código', key: 'barcode', width: 20 },
      { header: 'Ubicación', key: 'location', width: 15 },
      { header: 'Stock Mínimo', key: 'min_stock', width: 15 },
      { header: 'Inversión', key: 'total_investment', width: 15 },
      { header: 'Valor Venta', key: 'total_value', width: 15 }
    ];
    
    result.rows.forEach(row => {
      worksheet.addRow(row);
    });
    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=inventario-stocky.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al exportar' });
  }
};