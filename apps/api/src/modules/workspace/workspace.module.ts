import { Module } from '@nestjs/common';

import { WorkspaceController } from './infrastructure/http/workspace.controller';
import { GetWorkspacesUseCase } from './application/queries/get-workspaces.use-case';
import { CreateWorkspaceUseCase } from './application/commands/create-workspace.use-case';

@Module({
  controllers: [WorkspaceController],
  providers: [GetWorkspacesUseCase, CreateWorkspaceUseCase],
})
export class WorkspaceModule {}
