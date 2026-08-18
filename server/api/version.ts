import versionData from '../../version.json'

export default defineEventHandler((event) => {
  return {
    project_name: "Talenavi Product Management",
    environment: process.env.APP_ENV || process.env.NODE_ENV || "Development",
    generated_at: new Date().toISOString(),
    services: [
      {
        service_name: versionData.service_name,
        version: versionData.version,
        updated_at: versionData.updated_at
      }
    ]
  }
})
