const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Setup proxy configuration for development environment
 * This resolves CORS issues when developing locally or in GitHub Codespaces
 */
module.exports = function(app) {
  // Determine the backend URL based on the environment
  const getBackendUrl = () => {
    const hostname = process.env.HOSTNAME || '';
    
    // Check if running in GitHub Codespaces
    if (hostname.includes('github.dev') || hostname.includes('app.github.dev')) {
      // Extract the codespace name from the hostname
      const codespaceNameMatch = hostname.match(/(.*?)-\d+/);
      const codespaceName = codespaceNameMatch ? codespaceNameMatch[1] : '';
      
      // Construct the backend URL for GitHub Codespaces
      return `https://${codespaceName}-5000.app.github.dev`;
    }
    
    // Default to localhost for development
    return 'http://localhost:5000';
  };

  const backendUrl = getBackendUrl();
  console.log(`Proxying API requests to: ${backendUrl}`);

  // Configure proxy for API requests
  app.use(
    '/api',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: false, // Ignore SSL certificate errors
      pathRewrite: { '^/api': '/api' },
      logLevel: 'debug'
    })
  );

  // Also proxy debug endpoints
  app.use(
    '/debug',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: false,
      logLevel: 'debug'
    })
  );

  // Proxy for health check
  app.use(
    '/health',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: false
    })
  );
}; 