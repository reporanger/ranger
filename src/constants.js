exports.APP_USER_ID = process.env.NODE_ENV === 'production' ? 39074581 : 38635471

exports.PULL_REQUEST_MERGE_DELAY = process.env.NODE_ENV === 'production' ? 7 * 1000 : 0

exports.CLOSE = 'close'
exports.MERGE = 'merge'
exports.COMMENT = 'comment'
exports.LABEL = 'label'
exports.DELETE_BRANCH = 'delete_branch'
exports.TAG = 'tag'
exports.DELETE_COMMENT = 'delete_comment'

// https://developer.github.com/v4/enum/commentauthorassociation/
exports.MAINTAINERS = ['COLLABORATOR', 'MEMBER', 'OWNER']

// https://developer.github.com/v4/enum/mergestatestatus/
exports.STATUS = {
  BEHIND: 'behind', // sometimes good to merge, depending on repo config
  BLOCKED: 'blocked', // cannot merge
  CLEAN: 'clean', // good to go 👍
  DIRTY: 'dirty', // merge conflicts
  HAS_HOOKS: 'has_hooks', // good-to-go, even with extra checks
  UNKNOWN: 'unknown', // in between states
  UNSTABLE: 'unstable', // can merge, but build is failing 🚫
  DRAFT: 'draft',
}

// https://developer.github.com/v4/enum/statusstate/
exports.STATE = {
  SUCCESS: 'success',
  PENDING: 'pending',
  FAILURE: 'failure',
  ERROR: 'error',
  EXPECTED: 'expected',
}

// https://developer.github.com/v4/enum/checkconclusionstate/
exports.CONCLUSION = {
  ACTION_REQUIRED: 'action_required', // The check suite or run requires action.
  CANCELLED: 'cancelled', // The check suite or run has been cancelled.
  FAILURE: 'failure', // The check suite or run has failed.
  NEUTRAL: 'neutral', // The check suite or run was neutral.
  SKIPPED: 'skipped', // The check suite or run was skipped.
  STALE: 'stale', // The check suite or run was marked stale by GitHub. Only GitHub can use this conclusion.
  SUCCESS: 'success', // The check suite or run has succeeded.
  TIMED_OUT: 'timed_out', // The check suite or run has timed out.
}

// Payment Plans
exports.OPEN_SOURCE = 1
