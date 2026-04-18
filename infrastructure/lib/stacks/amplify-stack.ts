import * as cdk from 'aws-cdk-lib';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export interface AmplifyStackProps extends cdk.StackProps {
  hostedZone: route53.IHostedZone;
  certificate: acm.ICertificate;
}

export class AmplifyStack extends cdk.Stack {
  public readonly amplifyApp: amplify.App;

  constructor(scope: Construct, id: string, props: AmplifyStackProps) {
    super(scope, id, props);

    this.amplifyApp = new amplify.App(this, 'KelovaFrontendApp', {
      appName: 'kelova-frontend',
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: 'rashadGIT',
        repository: 'Kelova',
        oauthToken: cdk.SecretValue.secretsManager('kelova/amplify/github-token', {
          jsonField: 'token',
        }),
      }),
      buildSpec: codebuild.BuildSpec.fromObjectToYaml({
        version: '1.0',
        applications: [
          {
            appRoot: 'frontend',
            frontend: {
              phases: {
                preBuild: { commands: ['npm ci'] },
                build: { commands: ['npm run build'] },
              },
              artifacts: {
                baseDirectory: '.next',
                files: ['**/*'],
              },
              cache: {
                paths: ['node_modules/**/*', '.next/cache/**/*'],
              },
            },
          },
        ],
      }),
      environmentVariables: {
        NEXT_PUBLIC_API_URL: 'https://api.kelova.automagicly.ai',
      },
    });

    const mainBranch = this.amplifyApp.addBranch('main', {
      autoBuild: true,
      stage: 'PRODUCTION',
    });

    // Custom domain — map app subdomain to main branch
    const domain = this.amplifyApp.addDomain('kelova.automagicly.ai', {
      enableAutoSubdomain: true,
      autoSubdomainCreationPatterns: ['*'],
    });
    domain.mapRoot(mainBranch);
    domain.mapSubDomain(mainBranch, 'app');

    new cdk.CfnOutput(this, 'AmplifyAppId', { value: this.amplifyApp.appId });
    new cdk.CfnOutput(this, 'AmplifyDefaultDomain', { value: this.amplifyApp.defaultDomain });
    new cdk.CfnOutput(this, 'FrontendUrl', { value: 'https://app.kelova.automagicly.ai' });
  }
}
