const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://127.0.0.1:27017/matrimonial').then(()=>{console.log('database connected sucessfully');}).catch((err)=>{console.log(err);})

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  religion: { type: String, required: true },
  profession: { type: String, required: true },
  location: { type: String, required: true },
  interests: [String],
  about: { type: String }
});

const User = mongoose.model('User', userSchema);

const generateToken = async(userId) => {
  const token = await jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
  return token;
};

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).send('Unauthorized');
  }
};



app.get('/',(req,res)=>{
    res.send('working')
})
app.post('/api/users', async (req, res) => {
  const newUser = new User(req.body);
  try {
    await newUser.save();
    const token =await generateToken(newUser._id);
     res.status(201).json({ token });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.json(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put('/api/users/:id', verifyToken, async (req, res) => {
  if (req.userId !== req.params.id) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.json(user);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.delete('/api/users/:id', verifyToken, async (req, res) => {
  if (req.userId !== req.params.id) {
    return res.status(401).send('Unauthorized');
  }

  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/api/search', async (req, res) => {
    const searchCriteria = req.query;
  
    try {
      const users = await User.find(searchCriteria);
      res.json(users);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  
  app.post('/api/messages', verifyToken, async (req, res) => {
    const { recipientId, message } = req.body;
  
    try {
      const sender = await User.findById(req.userId);
      const recipient = await User.findById(recipientId);
  
      if (!recipient) {
        return res.status(404).send('Recipient not found');
      }
  
      const newMessage = {
        sender: sender._id,
        recipient: recipient._id,
        message
      };
  
      await newMessage.save();
  
      res.status(201).send('Message sent successfully');
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  
  app.get('/api/messages/:id', verifyToken, async (req, res) => {
    try {
      const messages = await Message.find({ threadId: req.params.id });
  
      res.json(messages);
    } catch (error) {
      res.status(500).send(error.message);
    }
  });
  
  module.exports = app