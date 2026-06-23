/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Keep these external (not webpack-bundled) so they are traced into
  // .next/standalone/node_modules. mysql2 in particular breaks when bundled
  // because of its dynamic dialect requires.
  serverExternalPackages: ['mysql2', 'bcryptjs', 'jose'],
};

export default nextConfig;
