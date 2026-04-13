import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  certificate: acm.ICertificate;
  hostedZone: route53.IHostedZone;
  dbSecret: secretsmanager.ISecret;
}

export class ComputeStack extends cdk.Stack {
  public readonly ecsCluster: ecs.Cluster;
  public readonly fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;
  public readonly ecrRepo: ecr.Repository;
  public readonly githubActionsRoleArn: string;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    this.ecrRepo = new ecr.Repository(this, 'VigilBackendRepo', {
      repositoryName: 'vigil-backend',
      imageTagMutability: ecr.TagMutability.MUTABLE,
      imageScanOnPush: true,
      lifecycleRules: [{ maxImageCount: 10, description: 'Keep last 10 images' }],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.ecsCluster = new ecs.Cluster(this, 'VigilEcsCluster', {
      vpc: props.vpc,
      clusterName: 'vigil-cluster',
      containerInsights: true,
    });

    const logGroup = new logs.LogGroup(this, 'VigilBackendLogs', {
      logGroupName: '/vigil/backend',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const containerImage = ecs.ContainerImage.fromEcrRepository(this.ecrRepo, 'latest');

    this.fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      'VigilFargateService',
      {
        cluster: this.ecsCluster,
        serviceName: 'vigil-backend',
        cpu: 512,
        memoryLimitMiB: 1024,
        desiredCount: 1,
        publicLoadBalancer: true,
        assignPublicIp: true, // HARD CONSTRAINT — no NAT gateway
        taskSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificate: props.certificate,
        domainName: 'api.vigil.automagicly.ai',
        domainZone: props.hostedZone,
        redirectHTTP: true,
        taskImageOptions: {
          image: containerImage,
          containerName: 'vigil-backend',
          containerPort: 3000,
          logDriver: ecs.LogDrivers.awsLogs({ streamPrefix: 'backend', logGroup }),
          environment: {
            NODE_ENV: 'production',
            PORT: '3000',
          },
          secrets: {
            DATABASE_URL: ecs.Secret.fromSecretsManager(props.dbSecret),
          },
        },
      },
    );

    props.dbSecret.grantRead(this.fargateService.taskDefinition.taskRole);

    // Health check against nginx placeholder root path; update to /health when real image is deployed
    this.fargateService.targetGroup.configureHealthCheck({
      path: '/',
      interval: cdk.Duration.seconds(30),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 5,
    });

    const scalable = this.fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });
    scalable.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Migrations task definition — DATABASE_URL injected at run time via --overrides in CI
    const migrationsTaskDef = new ecs.FargateTaskDefinition(this, 'VigilMigrationsTaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
      family: 'vigil-migrations',
    });
    migrationsTaskDef.addContainer('migrations', {
      image: containerImage,
      command: ['npx', 'prisma', 'migrate', 'deploy'],
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'migrations', logGroup }),
      environment: { NODE_ENV: 'production' },
    });

    // GitHub Actions OIDC provider + deploy role
    const ghOidcProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    const ghDeployRole = new iam.Role(this, 'GitHubActionsDeployRole', {
      roleName: 'VigilGitHubActionsDeployRole',
      assumedBy: new iam.FederatedPrincipal(
        ghOidcProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          },
          StringLike: {
            'token.actions.githubusercontent.com:sub': 'repo:rashadGIT/Vigil:*',
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      description: 'Assumed by GitHub Actions to push ECR images and update ECS service',
    });

    ghDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ecr:GetAuthorizationToken'],
        resources: ['*'],
      }),
    );
    ghDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ecr:BatchCheckLayerAvailability',
          'ecr:PutImage',
          'ecr:InitiateLayerUpload',
          'ecr:UploadLayerPart',
          'ecr:CompleteLayerUpload',
          'ecr:BatchGetImage',
        ],
        resources: [this.ecrRepo.repositoryArn],
      }),
    );
    ghDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ecs:UpdateService', 'ecs:DescribeServices', 'ecs:RunTask', 'iam:PassRole'],
        resources: ['*'],
      }),
    );

    this.githubActionsRoleArn = ghDeployRole.roleArn;

    new cdk.CfnOutput(this, 'EcrRepoUri', { value: this.ecrRepo.repositoryUri });
    new cdk.CfnOutput(this, 'EcsClusterName', { value: this.ecsCluster.clusterName });
    new cdk.CfnOutput(this, 'EcsServiceName', { value: this.fargateService.service.serviceName });
    new cdk.CfnOutput(this, 'GitHubActionsRoleArn', { value: this.githubActionsRoleArn });
    new cdk.CfnOutput(this, 'ApiUrl', { value: 'https://api.vigil.automagicly.ai' });
  }
}
