import { Module } from '@nestjs/common';
import { AccountsPayableController } from './accounts-payable.controller.js';
import { AccountsPayableService } from './accounts-payable.service.js';

@Module({
    controllers: [AccountsPayableController],
    providers: [AccountsPayableService],
    exports: [AccountsPayableService],
})
export class AccountsPayableModule { }
