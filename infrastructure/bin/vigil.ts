#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {
  FoundationStack,
  NetworkStack,
  AuthStack,
  DataStack,
  LambdaStack,
  AmplifyStack,
} from '../lib';

const app = new cdk.App();

const env = {
  account: '887067305712',
  region: 'us-east-2',
};

const foundation = new FoundationStack(app, 'VigilFoundationStack', { env });
const network = new NetworkStack(app, 'VigilNetworkStack', { env });
const _auth = new AuthStack(app, 'VigilAuthStack', { env });

const data = new DataStack(app, 'VigilDataStack', {
  env,
  vpc: network.vpc,
  rdsSg: network.rdsSg,
});

new LambdaStack(app, 'VigilLambdaStack', {
  env,
  certificate: foundation.certificate,
  hostedZone: foundation.hostedZone,
  dbSecret: data.dbSecret,
  apiDomain: 'api.vigil.automagicly.ai',
});

new AmplifyStack(app, 'VigilAmplifyStack', {
  env,
  hostedZone: foundation.hostedZone,
  certificate: foundation.certificate,
});
