import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get()
  getRoot() {
    return {
      status: 'ok',
      service: 'shift-planner-api',
      health: '/api/health',
      docs: '/api/docs',
    };
  }
}