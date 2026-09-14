export default {
  async getVersionMessage(releasePlan, _options) {
    const pkg = releasePlan.releases.find((release) => release.name === 'register-path')

    if (!pkg) {
      throw new Error(`main package not found in release plan`)
    }

    return `chore(release): ${pkg.newVersion}`
  },
}
