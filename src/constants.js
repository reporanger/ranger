exports.APP_USER_ID = process.env.NODE_ENV === 'production' ? 39074581 : 38635471

exports.CLOSE = 'close'
exports.MERGE = 'merge'
exports.COMMENT = 'comment'

// https://developer.github.com/v4/enum/commentauthorassociation/
exports.MAINTAINERS = ['COLLABORATOR', 'MEMBER', 'OWNER']

// Payment Plans
exports.OPEN_SOURCE = 1
