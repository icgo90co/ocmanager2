import { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';

const execAsync = promisify(exec);

export const runSeed = async (req: Request, res: Response) => {
  try {
    logger.info('🌱 Running database seed...');
    
    const { stdout, stderr } = await execAsync('npm run seed:prod', {
      cwd: process.cwd(),
    });

    if (stderr) {
      logger.error(`Seed stderr: ${stderr}`);
    }

    logger.info(`Seed stdout: ${stdout}`);

    res.json({
      success: true,
      message: 'Seed ejecutado exitosamente',
      output: stdout,
    });
  } catch (error: any) {
    logger.error(`Seed error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar seed',
      error: error.message,
    });
  }
};
