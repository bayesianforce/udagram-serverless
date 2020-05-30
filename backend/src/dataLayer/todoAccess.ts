import * as AWS from 'aws-sdk'
import { TodoItem } from '../models/TodoItem'
import { createLogger } from '../utils/logger'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { TodoUpdate } from '../models/TodoUpdate'

const logger = createLogger('Todo Access')

export function todoAccessCreator() {
  const docClient = new AWS.DynamoDB.DocumentClient()
  const todoTable = process.env.TODO_TABLE
  const userIdIndex = process.env.USER_ID_INDEX
  const bucketName = process.env.IMAGES_S3_BUCKET
  const urlExpiration = process.env.SIGNED_URL_EXPIRATION
  const s3 = new AWS.S3({ signatureVersion: 'v4' })

  async function getTodoById(todoId: string): Promise<TodoItem> {
    logger.info('getTodoById', { todoId })

    const params = {
      TableName: todoTable,
      KeyConditionExpression: 'todoId = :todoId',
      ExpressionAttributeValues: { ':todoId': todoId }
    }

    const result = await docClient.query(params).promise()

    if (result.Items.length < 1) {
      throw {
        statusCode: '404',
        message: 'Item not found'
      }
    }

    return result.Items[0] as TodoItem
  }

  async function getTodos(userId: string): Promise<TodoItem[]> {
    logger.info('getAllTodos', userId)

    const params = {
      TableName: todoTable,
      IndexName: userIdIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }

    const result = await docClient.query(params).promise()

    return result.Items as TodoItem[]
  }

  async function createTodo(todo: CreateTodoRequest): Promise<TodoItem> {
    logger.info('createTodo', todo)

    const params = {
      TableName: todoTable,
      Item: todo
    }

    await docClient.put(params).promise()

    return todo as TodoItem
  }

  async function updateTodo(todoId: string, todo: TodoUpdate): Promise<void> {
    logger.info('updateTodo', `${todoId} - ${todo}`)

    const item = await getTodoById(todoId)

    const params = {
      TableName: todoTable,
      Key: { todoId, createdAt: item.createdAt },
      UpdateExpression: 'set #N=:name, dueDate=:dueDate, done=:done',
      ExpressionAttributeNames: { '#N': 'name' },
      ExpressionAttributeValues: {
        ':name': todo.name,
        ':dueDate': todo.dueDate,
        ':done': todo.done
      }
    }
    await docClient.update(params).promise()
  }

  async function deleteTodo(todoId: string) {
    logger.info('deleteTodo', todoId)

    const item = await getTodoById(todoId)

    const params = {
      TableName: todoTable,
      Key: { todoId, createdAt: item.createdAt }
    }

    await docClient.delete(params).promise()
  }

  async function generateUploadUrl(
    imageId: string,
    todoId: string
  ): Promise<string> {
    logger.info('generateUploadUrl', ` ${imageId} ${todoId}`)

    const item = await getTodoById(todoId)

    const params0 = {
      Bucket: bucketName,
      Key: imageId,
      Expires: urlExpiration
    }

    const url = await s3.getSignedUrl('putObject', params0)

    const params1 = {
      TableName: todoTable,
      Key: { todoId, createdAt: item.createdAt },
      UpdateExpression: 'set attachmentUrl=:attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': `https://${bucketName}.s3.amazonaws.com/${imageId}`
      }
    }

    await docClient.update(params1).promise()

    return url
  }

  return {
    getTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    generateUploadUrl
  }
}
