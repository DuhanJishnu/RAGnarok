import dotenv from 'dotenv';
dotenv.config({path:'.env'})
export const PORT = process.env.PORT;
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
export const IMAGE_MAX_SIZE :number = parseInt(process.env.IMAGE_MAX_SIZE! as string);
export const DEFAULT_IMAGE_QUALITY :number = parseInt(process.env.DEFAULT_IMAGE_QUALITY! as string);
export const DEFAULT_IMAGE_WIDTH :number = parseInt(process.env.DEFAULT_IMAGE_WIDTH! as string);
export const DEFAULT_IMAGE_HEIGHT :number = parseInt(process.env.DEFAULT_IMAGE_HEIGHT! as string);
export const AUDIO_MAX_SIZE :number = parseInt(process.env.AUDIO_MAX_SIZE || '50');
export const PDF_MAX_SIZE :number = parseInt(process.env.PDF_MAX_SIZE || '50');
export const DOCUMENT_MAX_SIZE :number = parseInt(process.env.DOCUMENT_MAX_SIZE || '25');