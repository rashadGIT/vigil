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

const foundation = new FoundationStack(app, 'VelaFoundationStack', { env });
const network = new NetworkStack(app, 'VelaNetworkStack', { env });
const _auth = new AuthStack(app, 'VelaAuthStack', { env });

const data = new DataStack(app, 'VelaDataStack', {
  env,
  vpc: network.vpc,
  rdsSg: network.rdsSg,
});

const compute = new ComputeStack(app, 'VelaComputeStack', {
  env,
  vpc: network.vpc,
  certificate: foundation.certificate,
  hostedZone: foundation.hostedZone,
  dbSecret: data.dbSecret,
});

const _amplify = new AmplifyStack(app, 'VelaAmplifyStack', {
  env,
  hostedZone: foundation.hostedZone,
  certificate: foundation.certificate,
});

new ObservabilityStack(app, 'VelaObservabilityStack', {
  env,
  ecsCluster: compute.ecsCluster,
  fargateService: compute.fargateService,
  rdsInstance: data.rdsInstance,
});
