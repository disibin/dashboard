export const getBaseUrl = (req) => {
    if (req) {
        if (typeof req === 'string') return req.replace(/\/$/, '');
        const host = req.headers?.get?.('host') || req.headers?.['host'];
        const proto = req.headers?.get?.('x-forwarded-proto') || req.headers?.['x-forwarded-proto'] || 'http';
        if (host) {
            return `${proto}://${host}`.replace(/\/$/, '');
        }
    }
    const envUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
    if (envUrl) {
        return envUrl.replace(/\/$/, '');
    }
    return 'http://localhost:3000';
};

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME;
export const CLOUDINARY_API = process.env.CLOUDINARY_API;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
export const MONGODB_URI = process.env.MONGODB_URI;

export const PG_USER = process.env.PG_USER;
export const PG_PASSWORD = process.env.PG_PASSWORD;
export const PG_HOST = process.env.PG_HOST;
export const PG_PORT = process.env.PG_PORT;
export const PG_DATABASE = process.env.PG_DATABASE;

export const JWT_SECRET = process.env.JWT_SECRET;

export const NODE_ENV = process.env.NODE_ENV || "production";
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD;

export const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
export const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME;
export const BREVO_API_KEY = process.env.BREVO_API_KEY;

export const CURRENCY = '৳';
export const CURRENCY_CODE ='BDT';

export const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return `${CURRENCY}${num.toLocaleString()}`;
};
