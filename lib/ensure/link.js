'use strict'

const u = require('universalify').fromCallback
const path = require('path')

const _mkdir = require('../mkdirs')
const _pathExists = require('../path-exists')

const prep = fs => {
  const mkdir = _mkdir(fs)
  const pathExists = _pathExists(fs).pathExists

  function createLink (srcpath, dstpath, callback) {
    function makeLink (srcpath, dstpath) {
      fs.link(srcpath, dstpath, err => {
        if (err) return callback(err)
        callback(null)
      })
    }

    pathExists(dstpath, (err, destinationExists) => {
      if (err) return callback(err)
      if (destinationExists) return callback(null)
      fs.lstat(srcpath, (err, stat) => {
        if (err) {
          err.message = err.message.replace('lstat', 'ensureLink')
          return callback(err)
        }

        const dir = path.dirname(dstpath)
        pathExists(dir, (err, dirExists) => {
          if (err) return callback(err)
          if (dirExists) return makeLink(srcpath, dstpath)
          mkdir.mkdirs(dir, err => {
            if (err) return callback(err)
            makeLink(srcpath, dstpath)
          })
        })
      })
    })
  }

  function createLinkSync (srcpath, dstpath, callback) {
    const destinationExists = fs.existsSync(dstpath)
    if (destinationExists) return undefined

    try {
      fs.lstatSync(srcpath)
    } catch (err) {
      err.message = err.message.replace('lstat', 'ensureLink')
      throw err
    }

    const dir = path.dirname(dstpath)
    const dirExists = fs.existsSync(dir)
    if (dirExists) return fs.linkSync(srcpath, dstpath)
    mkdir.mkdirsSync(dir)

    return fs.linkSync(srcpath, dstpath)
  }

  return {
    createLink: u(createLink),
    createLinkSync
  }
}

module.exports = prep
