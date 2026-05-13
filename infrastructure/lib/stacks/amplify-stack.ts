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

    this.amplifyApp = new amplify.App(this, 'VigilFrontendApp', {
      appName: 'vigil-frontend',
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: 'rashadGIT',
        repository: 'Vigil',
        oauthToken: cdk.SecretValue.secretsManager('vigil/amplify/github-token', {
          jsonField: 'token',
        }),
      }),
      buildSpec: codebuild.BuildSpec.fromObjectToYaml({
        version: '1',
        frontend: {
          phases: {
            preBuild: {
              commands: ['cd frontend && npm install'],
            },
            build: {
              commands: ['cd frontend && npm run build'],
            },
          },
          artifacts: {
            baseDirectory: 'frontend/.next',
            files: ['**/*'],
          },
          cache: {
            paths: ['frontend/node_modules/**/*', 'frontend/.next/cache/**/*'],
          },
        },
      }),
      environmentVariables: {
        NEXT_PUBLIC_API_URL: 'https://api.vigilhq.com',
      },
    });

    const mainBranch = this.amplifyApp.addBranch('master', {
      autoBuild: true,
      stage: 'PRODUCTION',
    });

    const domain = this.amplifyApp.addDomain('vigilhq.com', {
      enableAutoSubdomain: true,
      autoSubdomainCreationPatterns: ['*'],
    });
    domain.mapRoot(mainBranch);
    domain.mapSubDomain(mainBranch, 'app');

    new cdk.CfnOutput(this, 'AmplifyAppId', { value: this.amplifyApp.appId });
    new cdk.CfnOutput(this, 'AmplifyDefaultDomain', { value: this.amplifyApp.defaultDomain });
    new cdk.CfnOutput(this, 'FrontendUrl', { value: 'https://app.vigilhq.com' });
  }
}
