'use strict'

const request = require('request')
const hat = require('hat')
const TOKEN = 'abc123'

const users = {
  'tabone': 0,
  'lorenzo': 25,
}

module.exports = (req, res) => {
  return getUser(req.query.username)
    .then(createToken)
    .then((token) => {
      res.cookie('notifyToken', token.attributes.token, {
        maxAge: 10000000000
      })
      res.end()
    })
    .catch(() => {
      res.status(403).end()
    })
}

/**
 * getUser returns the user from the System.
 * @param  {String} username username of the user trying to log in.
 * @return {Promise}         Resolved with the user's internal id if the
 *                           username exists, rejected otherwise.
 */
function getUser (username) {
  const internalID = users[username]
  if (internalID === undefined) return Promise.reject()
  return getNotifyUser(internalID)
}

/**
 * getNotifyUser retrieves the notify user related to the user who just logged
 * in.
 * @param  {String} internalID Internal ID used to link the system user with the
 *                             notify user.
 * @return {Promise}           Resolved on successful retrieval of the notify
 *                             user, rejected otherwise.
 */
function getNotifyUser (internalID) {
  const opts = {
    url: `http://localhost:8080/users?filter[internalID]=${internalID}`,
    headers: {
      'x-notify-token': TOKEN
    }
  }

  return new Promise((resolve, reject) => {
    request(opts, (err, res, body) => {
      const payload = JSON.parse(body)
      const user = payload.data[0]

      if (user === undefined) reject(internalID)
      resolve(user)
    })
  })
  .catch(createNotifyUser)
}

/**
 * createNotifyUser creates a new notify user related to the System user who
 * just logged in. This happens when the user doesn't have a notify user.
 * @param  {String} internalID Internal ID used to link the system user with the
 *                             notify user.
 * @return {Promise}           Resolved on successful creation of the user,
 *                             rejected otherwise.
 */
function createNotifyUser (internalID) {
  var payload = {
    data: {
      type: 'users',
      attributes: {
        username: 'test',
        internalID: internalID,
        bot: false
      }
    }
  }

  const opts = {
    method: 'POST',
    body: JSON.stringify(payload),
    url: `http://localhost:8080/users`,
    headers: {
      'x-notify-token': TOKEN,
      'Content-Type': 'application/vnd.api+json'
    }
  }

  return new Promise((resolve, reject) => {
    request(opts, (err, res, body) => {
      if (err) return reject(err)
      return resolve(JSON.parse(body).data)
    })
  })
}

/**
 * createToken creates an Access Token and links it with the user who just
 * logged in.
 * @param  {Object} user User who logged in
 * @return {Promise}     Resolved when the access token has been successfully
 *                       created
 */
function createToken (user) {
  var payload = {
    data: {
      type: 'tokens',
      attributes: {
        token: hat(),
        created: new Date(),
        origin: 'http://localhost:4200'
      },
      relationships: {
        user: {
          data: {
            type: 'users',
            id: user.id
          }
        }
      }
    }
  }

  const opts = {
    method: 'POST',
    body: JSON.stringify(payload),
    url: `http://localhost:8080/tokens`,
    headers: {
      'x-notify-token': TOKEN,
      'Content-Type': 'application/vnd.api+json'
    }
  }

  return new Promise((resolve, reject) => {
    request(opts, (err, res, body) => {
      if (err) return reject(err)
      return resolve(JSON.parse(body).data)
    })
  })
}