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

  async function getTodoById(todoId: string): Promise<TodoItem> {
    logger.info('getTodoById', { todoId })

    const result = await docClient
      .query({
        TableName: todoTable,
        KeyConditionExpression: 'todoId = :todoId',
        ExpressionAttributeValues: { ':todoId': todoId }
      })
      .promise()

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

    const result = await docClient
      .query({
        TableName: todoTable,
        IndexName: userIdIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    return result.Items as TodoItem[]
  }

  async function createTodo(todo: CreateTodoRequest): Promise<TodoItem> {
    logger.info('createTodo', todo)

    await docClient
      .put({
        TableName: todoTable,
        Item: todo
      })
      .promise()

    return todo as TodoItem
  }

  async function updateTodo(todoId: string, todo: TodoUpdate): Promise<void> {
    logger.info('updateTodo', `${todoId} - ${todo}`)

    const item = await getTodoById(todoId)

    await this.docClient
      .update({
        TableName: this.todoTable,
        Key: { todoId, createdAt: item.createdAt },
        UpdateExpression: 'set #N=:name, dueDate=:dueDate, done=:done',
        ExpressionAttributeNames: { '#N': 'name' },
        ExpressionAttributeValues: {
          ':name': todo.name,
          ':dueDate': todo.dueDate,
          ':done': todo.done
        }
      })
      .promise()
  }

  async function deleteTodo(todoId: string) {
    logger.info('deleteTodo', todoId)

    const item = await getTodoById(todoId)

    await docClient
      .delete({
        TableName: todoTable,
        Key: { todoId, createdAt: item.createdAt }
      })
      .promise()
  }

  const createImage = async function (imageId: string, todoId: string) {
    logger.info('createImage', ` ${imageId} ${todoId}`)

    const item = await getTodoById(todoId)

    return docClient
      .update({
        TableName: todoTable,
        Key: { todoId, createdAt: item.createdAt },
        UpdateExpression: 'set attachmentUrl=:attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': `https://${bucketName}.s3.amazonaws.com/${imageId}`
        }
      })
      .promise()
  }

  return {
    getTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    createImage
  }
}
