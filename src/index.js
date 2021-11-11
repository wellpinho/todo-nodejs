const { request } = require('express')
const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

const Customers = []
/* Scheme obj
* cpf = string
* name - string
* id - uuid
* statement []
*/

// Middleware
function verifyIfExistsAccountCPF(req, res, next) {
  // com headers não precisamos passar o params pela rota e sim no header
  const { cpf } = req.headers

  // find retorna o obj por isso não usamos some()
  const customer = Customers.find(customer => customer.cpf === cpf)

  if (!customer) {
    return res.status(400).json({ error: 'Customer not found!'})
  }

  // passando informação do middleware para as rotas
  req.customer = customer

  return next()
}

app.use(express.json())

app.post('/account', (req, res) => {
  const { cpf, name } = req.body

  // retorna true ou false com some
  const customerAlreadyExists = Customers.some(customer => customer.cpf === cpf)

  // se exitir o cpf...
  if (customerAlreadyExists) {
    return res.status(400).json({ error: 'Custom already exists!'})
  }

  Customers.push({
      cpf,
      name,
      id: uuidv4(),
      statement: []
    })

  return res.status(201).json('User criado')
})

app.get('/statement', verifyIfExistsAccountCPF, (req, res) => {
  // recebendo os dados do middleware
  const { customer } = req

  // retornando extrato do client
  return res.json(customer.statement)
})

app.listen(4000)
