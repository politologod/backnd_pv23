import multer from 'multer';
import path from 'path';
import fs from 'fs';
import logger from '../configs/logger';
import { Request, Response, NextFunction } from 'express';


// Asegurar que los directorios de carga existan
const createUploadDirectories = () => {
  const uploadDir = path.join(__dirname, '../../uploads');
  const tempDir = path.join(uploadDir, 'temp');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
};

// Crear directorios al iniciar la aplicación
createUploadDirectories();

// Configuración de almacenamiento temporal para Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/temp'));
  },
  filename: (req, file, cb) => {
    // Generar nombre único con timestamp y extensión original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Filtrar archivos por tipo
const fileFilter = (req: any, file: any, cb: any) => {
  // Permitir solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

// Límites para los archivos
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
  files: 5 // Máximo 5 archivos por carga
};

// Crear middleware de carga
const upload = multer({ 
  storage, 
  fileFilter,
  limits
});

// Middleware para manejar errores de Multer
const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // Error de Multer
    console.error('Error en carga de archivo', err);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'El archivo excede el tamaño máximo permitido (5MB)' 
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Se ha excedido el número máximo de archivos (5)' 
      });
    }
    
    return res.status(400).json({ error: err.message });
  }
  
  if (err) {
    // Otro tipo de error
    console.error('Error en procesamiento de archivos', err);
    return res.status(500).json({ error: err.message });
  }
  
  next();
};

// Middleware para limpiar archivos temporales después de procesarlos
const cleanupTempFiles = (req: Request, res: Response, next: NextFunction) => {
  // Guardar el método original end
  const originalEnd = res.end;
  
  // Sobrescribir el método end
  (res as any).end = function(...args: any[]) {
    // Limpiar archivos temporales si existen
    if (req.file) {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        // Solo loguear el error si el archivo existe pero no se puede eliminar
        if ((err as any).code !== 'ENOENT') {
          console.error('Error al eliminar archivo temporal', err, req.file.path);
        }
      }
    }
    
    if (req.files) {
      // Si hay múltiples archivos
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      
      files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (err) {
          // Solo loguear el error si el archivo existe pero no se puede eliminar
          if ((err as any).code !== 'ENOENT') {
            console.error('Error al eliminar archivo temporal', err, file.path);
          }
        }
      });
    }
    
    // Llamar al método original end
    originalEnd.apply(this, args);
  };
  
  next();
};

export {
  upload,
  handleMulterError,
  cleanupTempFiles
}; 