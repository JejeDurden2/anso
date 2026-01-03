import { Module } from '@nestjs/common';

import { CreateTaskUseCase } from './application/commands/create-task.use-case';
import { DeleteTaskUseCase } from './application/commands/delete-task.use-case';
import { UpdateTaskUseCase } from './application/commands/update-task.use-case';
import { GetTasksUseCase } from './application/queries/get-tasks.use-case';
import { TaskController } from './infrastructure/http/task.controller';

@Module({
  controllers: [TaskController],
  providers: [GetTasksUseCase, CreateTaskUseCase, UpdateTaskUseCase, DeleteTaskUseCase],
  exports: [CreateTaskUseCase],
})
export class TaskModule {}
