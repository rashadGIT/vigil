#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {
  FoundationStack,
  NetworkStack,
  AuthStack,
  DataStack,
  ComputeStack,
  AmplifyStack,
  ObservabilityStack,
} from '../lib';

const app = new cdk.App();

const env = {
  account: '887067305712',
  region: 'us-east-2',
};

const foundation = new FoundationStack(app, 'KelovaFoundationStack', { env });
const network = new NetworkStack(app, 'KelovaNetworkStack', { env });
const _auth = new AuthStack(app, 'KelovaAuthStack', { env });

const data = new DataStack(app, 'KelovaDataStack', {
  env,
  vpc: network.vpc,
  rdsSg: network.rdsSg,
});

const compute = new ComputeStack(app, 'KelovaComputeStack', {
  env,
  vpc: network.vpc,
  certificate: foundation.certificate,
  hostedZone: foundation.hostedZone,
  dbSecret: data.dbSecret,
});

const _amplify = new AmplifyStack(app, 'KelovaAmplifyStack', {
  env,
  hostedZone: foundation.hostedZone,
  certificate: foundation.certificate,
});

new ObservabilityStack(app, 'KelovaObservabilityStack', {
  env,
  ecsCluster: compute.ecsCluster,
  fargateService: compute.fargateService,
  rdsInstance: data.rdsInstance,
});
