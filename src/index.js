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

// função para fazer operação de depositar ou sacar
function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount
    } else {
      return acc - operation.amount
    }
  }, 0)

  return balance
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

app.post('/deposit', verifyIfExistsAccountCPF, (req, res) => {
  const { description, amount } = req.body

  // pegando info do middleware e verifica se a conta é válida.
  const { customer } = req

  // monta o obj
  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }

  customer.statement.push(statementOperation)
  // {
  //   "description": "Depósito Ignit",
  //   "amount": 1500,
  //   "created_at": "2021-11-12T00:00:30.713Z",
  //   "type": "Crédito"
  // }

  return res.status(201).json('Depósito feito!')
})

app.post('/withdrawn', verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = req
  const { amount } = req.body

  // se o valor em conta for suficiente
  const balance = getBalance(customer.statement)

  if (balance < amount) {
    return res.status(400).json({ error: 'Insulficient funds!'})
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  }

  customer.statement.push(statementOperation)
  // {
  //   "amount": 100,
  //   "created_at": "2021-11-12T00:11:19.282Z",
  //   "type": "debit"
  // },

  return res.status(201).json('Saque feito!')
})

app.get('/statement/:date', verifyIfExistsAccountCPF, (req, res) => {
  // recebendo os dados do middleware
  const { customer } = req
  const { date } = req.query

  const dateFormat = new Date(date + ' 00:00')

  // filtrar e retornar soment o extrato do dia
  const statement = customer.statement.filter(
    statement => statement.created_at.toDateString() ===
    new Date(dateFormat).toDateString()
  )

  // se ele encontrar no filtro retorna aqui
  return res.json(statement)
})

app.delete('/account', verifyIfExistsAccountCPF, (req, res) => {
  const { customer } = request

  // splice podemos usar para remover
  Customers.splice(customer, 1)

  return res.status(200).json(customer)
})

app.listen(4000)
