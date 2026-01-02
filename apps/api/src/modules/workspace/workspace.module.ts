import { Module } from '@nestjs/common';

import { CreateWorkspaceUseCase } from './application/commands/create-workspace.use-case';
import { GetWorkspacesUseCase } from './application/queries/get-workspaces.use-case';
import { WorkspaceController } from './infrastructure/http/workspace.controller';

@Module({
  controllers: [WorkspaceController],
  providers: [GetWorkspacesUseCase, CreateWorkspaceUseCase],
})
export class WorkspaceModule {}
