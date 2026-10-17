const core = require('@actions/core')
const github = require('@actions/github')
const fs = require('fs')
const { jirafyChangelog } = require('./utils/changelog')

var headRef = core.getInput('head-ref')
var baseRef = core.getInput('base-ref')
const githubToken = core.getInput('githubToken')
const octokit = github.getOctokit(githubToken)
const { owner, repo } = github.context.repo
const gitRefRegexp = /^[.A-Za-z0-9_\-\/]+$/

function writeActionOutput(name, value) {
  const outputPath = process.env.GITHUB_OUTPUT
  if (!outputPath) {
    core.warning(`GITHUB_OUTPUT is not defined; cannot set output "${name}".`)
    return
  }
  const delimiter = `EOF_${Math.random().toString(36).slice(2)}`
  fs.appendFileSync(outputPath, `${name}<<${delimiter}\n${value}\n${delimiter}\n`, { encoding: 'utf8' })
}

async function run() {
  try {
    // Without head-ref: the pushed tag, else the current commit (target_commitish anchors a tag that does not exist)
    let targetCommitish
    if (!headRef) {
      const { ref, sha } = github.context
      headRef = ref && ref.startsWith('refs/tags/') ? ref.substring('refs/tags/'.length) : sha
      targetCommitish = sha
    }

    if (!baseRef) {
      try {
        const latestRelease = await octokit.rest.repos.getLatestRelease({ owner, repo })
        baseRef = latestRelease.data.tag_name
      } catch (err) {
        if (err.status !== 404) throw err
        core.setFailed(`There are no releases on ${owner}/${repo}. Tags are not releases.`)
        return
      }
    }

    if (!!headRef && !!baseRef && gitRefRegexp.test(headRef) && gitRefRegexp.test(baseRef)) {
      let resp

      try {
        resp = await octokit.rest.repos.generateReleaseNotes({
          owner: owner,
          repo: repo,
          tag_name: headRef,
          previous_tag_name: baseRef,
          ...(targetCommitish && { target_commitish: targetCommitish }),
        })
      } catch (err) {
        core.setFailed(`Could not generate changelog between references because: ${err.message}`)
        return
      }

      const baseChangelog = resp.data.body
      console.log('\x1b[32m%s\x1b[0m', `Base changelog between ${baseRef} and ${headRef}:\n${baseChangelog}\n`)

      const jirafiedChangelog = jirafyChangelog(baseChangelog)
      console.log('\x1b[32m%s\x1b[0m', `Jirafied Changelog:\n${jirafiedChangelog}\n`)

      writeActionOutput('changelog', jirafiedChangelog)
    } else {
      core.setFailed(
        'Git ref names must contain one or more numbers, strings, underscores, periods, slashes and dashes.'
      )
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
