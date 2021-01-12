const baseUrl = 'https://qb.harness.io'
const targetLocalHost = true // set to false to target baseUrl environment instead of localhost

module.exports = {
  '/ng/api': {
    pathRewrite: { '^/ng/api': '' },
    target: targetLocalHost ? 'http://localhost:7457' : `${baseUrl}/ng/api`
  },
  '/pipeline/api': {
    pathRewrite: { '^/pipeline/api': '/api' },
    target: targetLocalHost ? 'http://localhost:12001' : `${baseUrl}/pipeline`
  },
  '/notifications/api': {
    pathRewrite: { '^/notifications/api': '/api' },
    target: targetLocalHost ? 'http://localhost:9005' : `${baseUrl}/notifications/api`
  },
  '/api': {
    target: targetLocalHost ? 'https://localhost:9090' : baseUrl
  },
  '/cv/api': {
    target: targetLocalHost ? 'https://localhost:6060' : `${baseUrl}`
  },
  '/cf': {
    target: targetLocalHost ? 'http://localhost:3000' : baseUrl,
    pathRewrite: targetLocalHost ? { '^/cf': '/api/1.0' } : {}
  },
  '/ci': {
    target: targetLocalHost ? 'https://localhost:7171' : baseUrl
  },
  '/ti-service': {
    target: targetLocalHost ? 'https://localhost:7457' : baseUrl,
    pathRewrite: targetLocalHost ? undefined : { '/ti-service/': '/gateway/ti-service/' }
  },
  '/gateway/log-service': {
    target: targetLocalHost ? 'https://localhost:7457' : baseUrl
  },
  '/lw/api': {
    target: 'http://localhost:9090',
    pathRewrite: { '^/lw/api': '' }
  }
}
