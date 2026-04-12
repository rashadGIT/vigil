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

const foundation = new FoundationStack(app, 'VigilFoundationStack', { env });
const network = new NetworkStack(app, 'VigilNetworkStack', { env });
const _auth = new AuthStack(app, 'VigilAuthStack', { env });

const data = new DataStack(app, 'VigilDataStack', {
  env,
  vpc: network.vpc,
  rdsSg: network.rdsSg,
});

const compute = new ComputeStack(app, 'VigilComputeStack', {
  env,
  vpc: network.vpc,
  certificate: foundation.certificate,
  hostedZone: foundation.hostedZone,
});

const _amplify = new AmplifyStack(app, 'VigilAmplifyStack', {
  env,
  hostedZone: foundation.hostedZone,
  certificate: foundation.certificate,
});

new ObservabilityStack(app, 'VigilObservabilityStack', {
  env,
  ecsCluster: compute.ecsCluster,
  fargateService: compute.fargateService,
  rdsInstance: data.rdsInstance,
});
