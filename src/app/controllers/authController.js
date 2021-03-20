const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../../app/models/User');
const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth');
const router = express.Router();
const crypto = require('crypto');
const mailer = require('../../modules/mailer')

function generateToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400,
  });
}

router.post('/register', async (req, res) => {
  const { email } = req.body;

  try {
    if (await User.findOne({ email }))
      return res.status(400).send({ error: 'User already exists' })
    
    const user = await User.create(req.body);

    // user.password = undefined;
    
    
    return res.send({
      user,
      token: generateToken({ id: user.id }),
    });
  
  } catch (err) {
    return res.status(400).send({ error: 'Registration failed'});
  }

});

router.post('/authenticate', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) 
    return res.status(400).send({ error: 'User not found' });

  if (!await bcrypt.compare(password, user.password))
  return res.status(400).send({ error: 'Invalid Password'});
  
  user.password = undefined;
  
  return res.send({
    msg: "logado",
    user,
    token: generateToken({ id: user.id }),
  });
  
  
});

router.post('/forgot_password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if(!user)
      return res.status(400).send({ error: 'User not found' });

    const token = crypto.randomBytes(20).toString('hex');

    const now = new Date();
    now.setHours(now.getHours() + 1);

    await User.findByIdAndUpdate(user.id, {
      '$set': {
        passwordResetToken: token,
        passwordResetExpires: now,
      }
    });

    mailer.sendMail({
      to: email,
      from: 'jrvieiradesign@gmail.com',
      template: 'auth/forgot_password',
      context: { token },
    }, (err) => {
      if (err)
        return res.status(400).send({ error: 'Cannot send forgot password email' });

        return res.send();
    })
  } catch (err) {
    res.status(400).send({ error: 'Erro on forgot password, try again' });
  }
  


});

router.post('/reset_password', async (req, res) => {
  const { email, token, password } = req.body;

  try {
    const user = await User.findOne({ email })
      .select('+passwordResetToken passwordResetExpires');

    if(!user)
      return res.status(400).send({ error: 'User not found' });

    now = new Date();

    if(token !== user.passwordResetToken)
      return res.status(400).send({error: 'Token invalid'});

    if (now > user.passwordResetExpires) 
      return res.status(400).send({ error: 'token expired'});

    user.password = password;

    await user.save();

    res.send();

  } catch (error) {
    return res.status(400).send({ error: 'error try catch'});
  }
});


module.exports = app => app.use('/auth', router);

