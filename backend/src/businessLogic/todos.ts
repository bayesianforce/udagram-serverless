import * as uuid from 'uuid'
import { todoAccessCreator } from '../dataLayer/todoAccess'
import { getUploadUrl } from '../dataLayer/S3'
import { TodoItem } from '../models/TodoItem'
import { createLogger } from '../utils/logger'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { TodoUpdate } from '../models/TodoUpdate'

const logger = createLogger('Todo BusinessLogic')

const TodoAccess = todoAccessCreator()

export async function getTodos(jwtToken: string): Promise<TodoItem[]> {
  logger.info('getAllTodos', jwtToken)
  const userId = '1'

  return TodoAccess.getTodos(userId)
}

export async function createTodo(todo: CreateTodoRequest): Promise<TodoItem> {
  logger.info('createTodo')

  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()

  const newItem = {
    userId: '1',
    todoId,
    createdAt,
    ...todo
  }

  return TodoAccess.createTodo(newItem)
}

export async function updateTodo(
  todoId: string,
  todo: TodoUpdate
): Promise<void> {
  logger.info('updateTodo', `${todoId} - ${todo}`)

  return TodoAccess.updateTodo(todoId, todo)
}

export async function deleteTodo(todoId: string): Promise<void> {
  logger.info('deleteTodo', todoId)

  return TodoAccess.deleteTodo(todoId)
}

export async function generateUploadUrl(todoId: string): Promise<string> {
  logger.info('generateUploadUrl', todoId)

  const imageId = uuid.v4()
  const url = getUploadUrl(imageId)

  await TodoAccess.createImage(imageId, todoId)

  return url
}
