const { Client } = require('pg');
var md5 = require('blueimp-md5')
var jwt = require('jsonwebtoken');

const client = new Client({
  user: 'test',
  host: 'localhost',
  database: 'BJ',
  password: '123456',
  port: 5432,
});

function validSignupInput(user) {
  var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if(!(user.name.length > 0)) return {valid: false, message: "O nome fornecido é inválido"}
  if(!emailRegex.test(user.email)) return {valid: false, message: "O e-mail fornecido é inválido"}
  if(user.password.length < 6) return {valid: false, message: "A senha deve ter pelo menos 6 dígitos"}

  return { valid: true }
}

function validLoginInput(login) {
  var emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if(!emailRegex.test(login.email)) return {valid: false, message: "O e-mail fornecido é inválido"}
  if(login.password.length < 6) return {valid: false, message: "A senha deve ter pelo menos 6 dígitos"}

  return { valid: true }
}

class HandlerGenerator {
  constructor() {
    client.connect();
  }

  index (req, res) {
    res.send('Hello World!');
  }

  // senha 123456
  async login (req, res) {
    const login = req.body.login
    let validInput = validLoginInput(login)

    if(!validInput.valid) {
      res.json({
        success: false,
        message: validInput.message
      })
      return
    }

    var hash = md5(login.password)

    const query = `SELECT * FROM public."User" WHERE email = '${login.email}'`

    const dbRes = await client.query(query)
    const user = dbRes.rows[0]

    if(dbRes.rows.length === 0) {
      res.json({
        success: false,
        message: "Usuário não existe."
      })
      return
    }
    if(user.auth !== hash) {
      res.json({
        success: false,
        message: "Senha incorreta."
      })
      return
    }

    delete user.auth

    let token = jwt.sign({name: user.name, email: user.email},
      "segredoultrasecretodoserver", // segredo do server
      { expiresIn: '24h' } // expires in 24 hours
    );
    // return the JWT token for the future API calls
    res.json({
      success: true,
      message: 'Authentication successful!',
      token: token
    });
  }

  async signup (req, res) {
    const user = req.body.user
    let validInput = validSignupInput(user)

    if(!validInput.valid) {
      res.json({
        success: false,
        message: validInput.message
      })
      return
    }

    var hash = md5(user.password);

    const checkEmail = await client.query(`SELECT id from public."User" WHERE email = '${user.email}'`)
    if(checkEmail.rows.length > 0){
      res.json({
        success: false,
        message: "Esse e-mail já está sendo utilizado."
      })
      return
    }

    const query = `INSERT INTO public."User" (email, name, auth)
    VALUES ('${user.email}', '${user.name}', '${hash}') RETURNING *`

    const dbRes = await client.query(query)

    if(dbRes.rows.length > 0) {
      res.json({
        success: true,
        message: "Usuário criado com sucesso."
      });
    } else {
      res.json({
        success: false,
        message: "Erro inesperado, tente novamente mais tarde."
      });
    }
  };
}

module.exports = HandlerGenerator
