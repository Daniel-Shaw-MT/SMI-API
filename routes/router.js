require('dotenv').config()

const express = require('express')
const router = express.Router()

const User = require('../models/user')

const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt')

// Empty route
router.get('/code', async(req, res) => {
    res.redirect('https://github.com/Daniel-Shaw-MT/SMI-API')
})
// Login
router.post('/login', getUsr, async (req, res) => {
    const internalU = await User.findOne({ userName: req.body.userName }).exec()
    if (internalU == null) {
        return res.status(400).json('User Not Found!')
    }
    if (internalU.active != true) {
        res.status(400).json({
            message: "Verify your email!"
        })
    } else {
        try {
            // Compare
            if (await bcrypt.compare(req.body.password, internalU.password)) {

                jwt.sign({ internalU }, process.env.SECRET_TOKEN, { expiresIn: "24h" }, (err, token) => {
                    res.json({
                        token: token
                    })
                })

            } else {

                res.status(400).json({ message: 'Bad Password!' })
            }

        } catch (err) {
            res.status(500)
        }
    }

})

// signup
router.post('/signup', async (req, res) => {
    if ((req.body.password).length < 7) {
        res.status(400).json({ message: 'Password too short!' })
    } else {
        try {
            const salt = await bcrypt.genSalt()
            const hashedPassword = await bcrypt.hash(req.body.password, salt)
            console.log(salt)
            console.log(hashedPassword)
            const user = new User({
                userName: req.body.userName,
                email: req.body.email,
                password: hashedPassword,
                authLvl: 0,
                active: false,
                SmNumber: req.body.SmNumber
            })
            const internalU = await User.findOne({ userName: req.body.userName }).exec()
            const internalE = await User.findOne({ email: req.body.email }).exec()
            if (internalE != null) {
                res.status(400).json({ message: 'Email already in use!' })
            }
            if (internalU != null) {
                res.status(400).json({ message: 'Username already exists!' })
            } else {
                try {
                    const newUser = await user.save()
                    jwt.sign({ user }, process.env.SECRET_TOKEN, { expiresIn: "7d" }, (err, verifyCode) => {
                        var transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: 'slsauthservice@gmail.com',
                                pass: process.env.EMAIL_PASS
                            }
                        });
                        var mailOptions = {
                            from: 'SMI AUTHENTICATION SERVICE',
                            to: req.body.email,
                            subject: 'AUTH SERVICE',
                            html: `<a href=http://localhost:8000/main/verify/${verifyCode}>Click to verify</a>`
                        };

                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log('Email sent: ' + info.response);
                            }
                        });
                    })
                    res.status(201).json(`Created User ` + req.body.userName)
                } catch (err) {
                    res.status(500).json({ message: "Internal Error" })
                }
            }
        } catch (err) {

        }

    }
})

// Verify
router.get('/verify/:token', async (req, res) => {
    jwt.verify(req.params.token, process.env.SECRET_TOKEN, async (err, authData) => {
        if (err) {
            console.log(err)
            res.status(403).json({
                message: 'Forbidden!'
            })
        }
        else {
            (async () => {
                try {
                    const internalU = await User.findOne({ userName: authData.user.userName }).exec()

                    // Update record with _id
                    internalU.active = true
                    const updatedUser = await internalU.save()
                    res.redirect('http://localhost:3000/verify')
                } catch (err) {
                    res.status(400).json({ message: err.message })
                }

            })().catch(err)

        }
    })
})

// Functions

// Used to retrieve specified user and then passes info to caller.
async function getUsr(req, res, next) {
    let user
    try {
        user = await User.findOne({ userName: req.body.userName }).exec()
        if (user == null) {
            return res.status(404).json({ message: 'User not found' })

        }
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
    res.user = user
    next()
}

// Protect endpoint
function verifyToken(req, res, next) {
    // Retrieve header value (auth value)
    const bearerHeader = req.headers['authorization']
    if (typeof bearerHeader !== 'undefined') {
        // Split at space
        const bearer = bearerHeader.split(' ')
        const bearerToken = bearer[1]
        // Set token
        req.token = bearerToken
        next()

    } else {
        // Forbidden
        res.sendStatus(403)
    }
}


module.exports = router