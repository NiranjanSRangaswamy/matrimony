const dotenv = require('dotenv')

dotenv.config({
    path:'./.env'
})

const http = require('http');
const app = require('./app');
const PORT = 5000;

http.createServer(app).listen(PORT,(err)=>{
    if(err)
    console.log(err);
console.log(`server started on port ${PORT} sucessfully`);
})