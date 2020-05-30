import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { getTodos } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'

const logger = createLogger('Todo Get All request')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing event: ', event)

    const authorization = event.headers.Authorization
    const split = authorization.split(' ')
    const jwtToken = split[1]

    const todos = await getTodos(jwtToken)

    return {
      statusCode: 200,
      body: JSON.stringify({ todos })
    }
  }
)

handler.use(cors())
