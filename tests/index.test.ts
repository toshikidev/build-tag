import nock from 'nock'
import { Toolkit } from 'actions-toolkit'
import buildAndTagAction from '../src/lib'
import { generateToolkit } from './helpers'

describe('build2tag', () => {
  let tools: Toolkit

  beforeEach(() => {
    nock.cleanAll()
    tools = generateToolkit()
    delete process.env.INPUT_SETUP
    delete process.env.INPUT_TAG_NAME
  })

  it('updates the ref and updates an existing major ref', async () => {
    nock('https://api.github.com')
      .patch('/repos/andatoshiki/test/git/refs/tags%2Fv1.0.0')
      .reply(200)
      .patch('/repos/andatoshiki/test/git/refs/tags%2Fv1')
      .reply(200)
      .patch('/repos/andatoshiki/test/git/refs/tags%2Fv1.0')
      .reply(200)
      .get('/repos/andatoshiki/test/git/matching-refs/tags%2Fv1')
      .reply(200, [{ ref: 'tags/v1' }])
      .get('/repos/andatoshiki/test/git/matching-refs/tags%2Fv1.0')
      .reply(200, [{ ref: 'tags/v1.0' }])
      .post('/repos/andatoshiki/test/git/commits')
      .reply(200, { commit: { sha: '123abc' } })
      .post('/repos/andatoshiki/test/git/trees')
      .reply(200)

    await buildAndTagAction(tools)

    expect(nock.isDone()).toBe(true)
  })

  it('updates the ref and creates a new major & minor ref', async () => {
    nock('https://api.github.com')
      .patch('/repos/andatoshiki/test/git/refs/tags%2Fv1.0.0')
      .reply(200)
      .post('/repos/andatoshiki/test/git/refs')
      .times(2)
      .reply(200)
      .get('/repos/andatoshiki/test/git/matching-refs/tags%2Fv1')
      .reply(200, [])
      .get('/repos/andatoshiki/test/git/matching-refs/tags%2Fv1.0')
      .reply(200, [])
      .post('/repos/andatoshiki/test/git/commits')
      .reply(200, { commit: { sha: '123abc' } })
      .post('/repos/andatoshiki/test/git/trees')
      .reply(200)

    await buildAndTagAction(tools)

    expect(nock.isDone()).toBe(true)
  })

  it('does not update the major ref if the release is a draft', async () => {
    nock('https://api.github.com')
      .patch('/repos/andatoshiki/test/git/refs/tags%2Fv1.0.0')
      .reply(200)
      .post('/repos/andatoshiki/test/git/commits')
      .reply(200, { commit: { sha: '123abc' } })
      .post('/repos/andatoshiki/test/git/trees')
      .reply(200)

    tools.context.payload.release.draft = true

    await buildAndTagAction(tools)

    expect(nock.isDone()).toBe(true)
  })

  it('does not update the major ref if the release is a prerelease', async () => {
    nock('https://api.github.com')
      .patch('/repos/andatoshiki/test/git/refs/tags%2Fv1.0.0')
      .reply(200)
      .post('/repos/andatoshiki/test/git/commits')
      .reply(200, { commit: { sha: '123abc' } })
      .post('/repos/andatoshiki/test/git/trees')
      .reply(200)

    tools.context.payload.release.prerelease = true

    await buildAndTagAction(tools)

    expect(nock.isDone()).toBe(true)
  })

  it('updates the ref and creates a new major ref for an event other than `release`', async () => {
    nock('https://api.github.com')
      .patch('/repos/andatoshiki/test/git/refs/tags%2Fv2.0.0')
      .reply(200)
      .post('/repos/andatoshiki/test/git/refs')
      .times(2)
      .reply(200)
      .get('/repos/andatoshiki/test/git/matching-refs/tags%2Fv2')
      .reply(200, [])
      .get('/repos/andatoshiki/test/git/matching-refs/tags%2Fv2.0')
      .reply(200, [])
      .post('/repos/andatoshiki/test/git/commits')
      .reply(200, { commit: { sha: '123abc' } })
      .post('/repos/andatoshiki/test/git/trees')
      .reply(200)

    tools.context.event = 'pull_request'
    process.env.INPUT_TAG_NAME = 'v2.0.0'

    await buildAndTagAction(tools)

    expect(nock.isDone()).toBe(true)
  })
})
