import { Body, Controller, Post } from '@nestjs/common';
import { Network } from './network';
import { ChainCodeInvokeRequest } from './requests/chainCode.invoke';

@Controller('chainCode')
export class ChainCodeController {

  @Post('invoke')
  async invoke(@Body() body: ChainCodeInvokeRequest) {

    const invokeResult = await new Network().organization(body.msp.identifier)
      .transact(body.administrator)
      .invokeChainCode(body.chainCode, body.parameters);

    return invokeResult;
  }
}
