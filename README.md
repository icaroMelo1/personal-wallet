# Documentação de Utilização dos Endpoints do Projeto Nest-Backend (Carteira GAC)

Todos os endpoints disponíveis utilizam o método HTTP **POST**. Abaixo, estão descritos os formatos dos parâmetros que devem ser informados para utilizar cada rota.

## Rotas Disponíveis:

### 1. `localhost:3000/auth/register`
**Rota responsável por cadastrar um novo usuário no banco de dados.**

Para realizar o cadastro, envie um JSON no Body da requisição no seguinte formato:

```json
  {
  "name": "Icaro Freitas",
  "email": "icaro.freitas@gmail.com",
  "password": "P0w3rfullP@ssword!",
  "balance": 500
  }
```
name: String com o nome da pessoa.
email: String em formato de email válido.
password: String com no mínimo 8 caracteres, incluindo 1 letra maiúscula, 1 letra minúscula, 1 número e 1 caractere especial.
balance: Número maior que 0.
Se o cadastro for bem-sucedido e o email não estiver em uso, uma mensagem de sucesso será retornada.

### 2. localhost:3000/auth/login
**Rota responsável por realizar o login do usuário e fornecer o token de acesso.**

Para realizar o login, envie um JSON no Body da requisição no seguinte formato:

```json
  {
    "email": "icaro.freitas@gmail.com",
    "password": "P0w3rfullP@ssword!"
  }
```
email: Email previamente cadastrado.
password: Senha correspondente ao email informado.
Se a combinação de email e senha estiver incorreta, um erro será retornado. Ao logar com sucesso, um token de acesso será fornecido na chave "access_token".

### 3. localhost:3000/transaction
**Rota responsável por realizar transações/transferências de valores entre usuários.**

Para realizar uma transação, envie um JSON no Body da requisição no seguinte formato:

```json
  {
    "targetUserEmail": "icaro.freitas2@gmail.com",
    "amountToTransfer": 300
  }
```
targetUserEmail: Email do usuário que receberá o valor (deve ser um email válido e previamente cadastrado).
amountToTransfer: Valor a ser enviado, que deve ser menor ou igual ao saldo disponível.
Todos os parâmetros são obrigatórios. O "access_token" deve ser informado no header da requisição, no formato "Authorization: Bearer Token". O email de origem não pode ser o mesmo do destinatário.

Em caso de sucesso, será retornada uma mensagem informando o novo saldo e o usuário que recebeu a transferência, junto com o protocolo da transação.

### 4. localhost:3000/transaction/refund
**Rota responsável por realizar o estorno de valores.**

Esta rota permite o estorno da última transação feita, desde que você seja um dos usuários envolvidos. Para realizar o reembolso, envie um JSON no Body da requisição no seguinte formato:

```json
  {
    "originEmail": "icaro.freitas@gmail.com",
    "targetEmail": "icaro.freitas2@gmail.com",
    "refundReason": "Transferi para a pessoa errada, gostaria de realizar o reembolso."
  }
```
originEmail: Email de origem da transação.
targetEmail: Email de destino da transação.
refundReason: Motivo do pedido de estorno.
Todos os parâmetros são obrigatórios, e o "access_token" deve ser incluído no header. Após a requisição bem-sucedida, uma mensagem informará o novo saldo e o usuário envolvido na transação estornada.

### 5. localhost:3000/transaction/refund/:protocol
**Rota alternativa para realizar o estorno de valores.**

Aqui, o protocolo da transação deve ser passado na URL. Envie um JSON no Body da requisição com o seguinte formato:

```json
  {
    "refundReason": "Transferi para a pessoa errada, gostaria de realizar o reembolso."
  }
```
Somente o refundReason é necessário, pois o protocolo já está definido na URL.

Observação: Transações já reembolsadas não poderão ser estornadas novamente. O sistema barrará tentativas de reembolso duplicadas.