export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Repo memakai prefix [AA] di subject (format "<type>: [AA] deskripsi"),
    // jadi pemeriksaan kapitalisasi subject dimatikan.
    'subject-case': [0],
  },
}
