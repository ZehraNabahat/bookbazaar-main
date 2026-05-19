import User from '../models/User.js';

export const ADMIN_EMAIL = 'admin@bookbazaar.com';
export const ADMIN_DEFAULT_PASSWORD = 'admin123';

/** Create or repair the admin user (used by CLI seed and dev startup). */
export async function ensureAdminUser({ resetPassword = false } = {}) {
  let admin = await User.findOne({ email: ADMIN_EMAIL });

  if (!admin) {
    admin = await User.create({
      name: 'System Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_DEFAULT_PASSWORD,
      role: 'admin',
    });
    return { created: true, admin, message: 'Admin account created.' };
  }

  let changed = false;
  if (admin.role !== 'admin') {
    admin.role = 'admin';
    changed = true;
  }
  if (resetPassword) {
    admin.password = ADMIN_DEFAULT_PASSWORD;
    changed = true;
  }
  if (changed) {
    await admin.save();
    return { created: false, admin, message: 'Admin account updated.' };
  }

  return { created: false, admin, message: 'Admin account already exists.' };
}
