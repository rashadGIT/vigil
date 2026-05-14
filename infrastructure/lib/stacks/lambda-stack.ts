import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface LambdaStackProps extends cdk.StackProps {
  certificate: acm.ICertificate;
  hostedZone: route53.IHostedZone;
  dbSecret: secretsmanager.ISecret;
  apiDomain: string; // e.g. 'api.vigilhq.com'
}

export class LambdaStack extends cdk.Stack {
  public readonly apiFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const logGroup = new logs.LogGroup(this, 'VigilApiLogs', {
      logGroupName: '/vigil/api',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Placeholder code — replaced by Amplify build on first deploy
    this.apiFunction = new lambda.Function(this, 'VigilApiFunction', {
      functionName: 'vigil-api',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.X86_64,
      handler: 'dist/lambda.lambdaHandler',
      code: lambda.Code.fromInline(
        'exports.lambdaHandler = async () => ({ statusCode: 200, body: JSON.stringify({ status: "deploying" }) });',
      ),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      logGroup,
      environment: {
        NODE_ENV: 'production',
      },
    });

    // Grant read on all vigil/* secrets (DB creds, Cognito config, etc.)
    this.apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:vigil/*`],
      }),
    );

    props.dbSecret.grantRead(this.apiFunction);

    // HTTP API — Lambda proxy integration. CORS is handled by NestJS, not API GW,
    // because API GW HTTP API doesn't support wildcard subdomain origins.
    const httpApi = new apigateway.HttpApi(this, 'VigilHttpApi', {
      apiName: 'vigil-api',
      defaultIntegration: new integrations.HttpLambdaIntegration('LambdaIntegration', this.apiFunction),
    });

    // Custom domain → Route53
    const customDomain = new apigateway.DomainName(this, 'ApiCustomDomain', {
      domainName: props.apiDomain,
      certificate: props.certificate,
    });

    new apigateway.ApiMapping(this, 'ApiMapping', {
      api: httpApi,
      domainName: customDomain,
    });

    new route53.ARecord(this, 'ApiAliasRecord', {
      zone: props.hostedZone,
      recordName: 'api.vigil',
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayv2DomainProperties(
          customDomain.regionalDomainName,
          customDomain.regionalHostedZoneId,
        ),
      ),
    });

    // GitHub Actions OIDC provider (idempotent — one per account)
    const githubOidc = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
      thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
    });

    // IAM role for GitHub Actions to deploy Lambda
    const githubDeployRole = new iam.Role(this, 'GitHubDeployRole', {
      roleName: 'VigilGitHubDeployRole',
      assumedBy: new iam.WebIdentityPrincipal(githubOidc.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': 'repo:rashadGIT/Vigil:ref:refs/heads/master',
        },
      }),
      description: 'GitHub Actions: deploy vigil-api Lambda',
    });

    githubDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'lambda:UpdateFunctionCode',
          'lambda:GetFunction',
          'lambda:GetFunctionConfiguration',
          'lambda:PublishVersion',
          'lambda:WaitForFunction',
        ],
        resources: [this.apiFunction.functionArn],
      }),
    );

    // Allow GitHub Actions migration step to read DB credentials
    githubDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:vigil/rds/credentials*`],
      }),
    );

    new cdk.CfnOutput(this, 'ApiUrl', { value: `https://${props.apiDomain}` });
    new cdk.CfnOutput(this, 'LambdaFunctionName', { value: this.apiFunction.functionName });
    new cdk.CfnOutput(this, 'HttpApiEndpoint', { value: httpApi.apiEndpoint });
    new cdk.CfnOutput(this, 'GitHubDeployRoleArn', { value: githubDeployRole.roleArn });
  }
}
