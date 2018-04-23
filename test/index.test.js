// You can import your modules
const { createRobot } = require('probot')
const app = require('..')

describe('Bot', () => {
  let robot
  let github
  beforeEach(() => {
    robot = createRobot()
    app(robot)
    github = {
      issues: {
        createComment: jest.fn()
      }
    }
    robot.auth = () => Promise.resolve(github)
  })

  test('Will schedule a job', () => {
    // your real tests go here
    expect(1 + 2 + 3).toBe(6)
  })
})

// For more information about testing with Jest see:
// https://facebook.github.io/jest/
