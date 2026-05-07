const mongoose = require('mongoose')

if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGODB_CONNECTION_STRING)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('Could not connect to MongoDB', err))
}
