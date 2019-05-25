var express = require('express');
var bodyParser = require('body-parser')
var HandlerGenerator = require('./handlerGenerator')
const cors = require('cors');

function main() {
  var app = express();

  app.use(bodyParser.json());

  app.use(cors({
    'allowedHeaders': ['sessionId', 'Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-Amz-Security-Token', 'x-amz-date'],
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  }));

  let handlers = new HandlerGenerator()

  app.get('/', handlers.index);
  app.post('/user/login', handlers.login)
  app.post('/user/signup', handlers.signup)

  app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
  });
}

main()




