import * as fs from 'fs';
import * as os from 'os';
import * as yaml from 'js-yaml';
import { Logger } from '@nestjs/common';
import { FabricConnectionFactory } from './fabric-client/connection-factory';
import { ChainCodeModel } from './chainCode.model';
import { ProposalResponse } from 'fabric-client';

export class Network {

  organization(membershipServiceProviderIdentifier: string) {
    return {
      transact: (organizationAdministrator: any) => {
        return {
          invokeChainCode: async (chainCodeDefinition: ChainCodeModel, parameters: string[]) => {

            const networkConnectionConfigurationFile
              = fs.readFileSync('networks/' + membershipServiceProviderIdentifier + '/connection.yaml').toString();
            const networkConnectionConfiguration = yaml.load(networkConnectionConfigurationFile);

            // Load channel data
            const channelDefinition = {
              name: undefined,
            };
            channelDefinition.name = Object.keys(networkConnectionConfiguration.channels)[0];

            // Load the certificate authority data
            const certificateAuthority = {
              name: undefined,
              uri: undefined,
            };
            certificateAuthority.name = Object.keys(networkConnectionConfiguration.certificateAuthorities)[0];
            certificateAuthority.uri = networkConnectionConfiguration.certificateAuthorities[certificateAuthority.name];

            // Connect to the HyperLedger Fabric network
            const connectionFactory = new FabricConnectionFactory(os.tmpdir(), 'networks/' + membershipServiceProviderIdentifier);
            const networkConnection = await connectionFactory
              .connect(membershipServiceProviderIdentifier,
                certificateAuthority,
                organizationAdministrator);
            Logger.log('Connected to HyperLedger Fabric', 'HyperLedger Fabric Network');

            const gateway = await networkConnection
              .gateway(membershipServiceProviderIdentifier, 'networks/' + membershipServiceProviderIdentifier, organizationAdministrator.logOn);
            Logger.log('Gateway connected to a network', 'HyperLedger Fabric Network');

            const client = gateway.getClient();
            const channel = client.getChannel();

            // Build the transaction proposal
            const transactionProposal = {
              chaincodeId: chainCodeDefinition.identifier,
              txId: client.newTransactionID(true),
              args: parameters,
            };
            const proposal = await channel.sendTransactionProposal(transactionProposal);
            if (proposal[0] && proposal[0][0]) {
              const response = proposal[0][0] as ProposalResponse;
              if (response && response.response) {
                const payload = response.response.payload.toString();
                const result = JSON.parse(payload);
                Logger.log(result, 'HyperLedger Fabric Network');
                return result;
              }
            }

            Logger.log('Chain-code response not parsed', 'HyperLedger Fabric Network');
            Logger.log(JSON.stringify(proposal), 'HyperLedger Fabric Network');
            return {};
          },
        };
      },
    };
  }
}
