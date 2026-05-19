/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'http://localhost:3000',
  generateRobotsTxt: true,
  exclude: ['/admin', '/admin/*', '/profile', '/profile/*', '/cart', '/checkout', '/orders', '/orders/*'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: '*',
        disallow: ['/admin', '/profile', '/cart', '/checkout', '/orders'],
      },
    ],
  },
};
