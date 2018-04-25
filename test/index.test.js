// You can import your modules
const { createRobot } = require('probot')
const app = require('..')

const payload = require('./fixtures/labeled.json')

describe('Bot', () => {
  let robot
  let github
  beforeEach(() => {
    robot = createRobot()
    app(robot)
    github = {
      issues: {
        createComment: jest.fn(),
        edit: jest.fn()
      }
    }
    robot.auth = () => Promise.resolve(github)
  })

  test('Will schedule a job', async () => {
    await robot.receive(payload)
  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/
