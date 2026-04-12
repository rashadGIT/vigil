import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DataStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  rdsSg: ec2.ISecurityGroup;
}

export class DataStack extends cdk.Stack {
  public readonly rdsInstance: rds.DatabaseInstance;
  public readonly dbSecret: secretsmanager.ISecret;
  public readonly documentsBucket: s3.Bucket;
  public readonly publicAssetsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    this.rdsInstance = new rds.DatabaseInstance(this, 'VigilRds', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [props.rdsSg],
      multiAz: false,
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      databaseName: 'vigil',
      credentials: rds.Credentials.fromGeneratedSecret('vigil_admin', {
        secretName: 'vigil/rds/credentials',
      }),
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    this.dbSecret = this.rdsInstance.secret!;

    this.documentsBucket = new s3.Bucket(this, 'VigilDocumentsBucket', {
      bucketName: `vigil-documents-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'archive-to-glacier',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    this.publicAssetsBucket = new s3.Bucket(this, 'VigilPublicAssetsBucket', {
      bucketName: `vigil-public-assets-${this.account}-${this.region}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new secretsmanager.Secret(this, 'CognitoConfigSecret', {
      secretName: 'vigil/cognito/config',
      description: 'Cognito User Pool ID + Client ID',
      secretStringValue: cdk.SecretValue.unsafePlainText(
        JSON.stringify({ userPoolId: 'us-east-2_kd30RmPp5', clientId: '2t3crm3c2s4rtoldp0lq17p11e' }),
      ),
    });

    new secretsmanager.Secret(this, 'N8nWebhookSecret', {
      secretName: 'vigil/n8n/webhook-secret',
      description: 'Shared secret for @InternalOnly() guard',
      secretStringValue: cdk.SecretValue.unsafePlainText(
        JSON.stringify({ secret: 'PLACEHOLDER_CHANGE_ME' }),
      ),
    });

    new secretsmanager.Secret(this, 'SentryDsnSecret', {
      secretName: 'vigil/sentry/dsn',
      description: 'Sentry DSN',
      secretStringValue: cdk.SecretValue.unsafePlainText(
        JSON.stringify({ dsn: 'PLACEHOLDER' }),
      ),
    });

    new secretsmanager.Secret(this, 'AmplifyGitHubTokenSecret', {
      secretName: 'vigil/amplify/github-token',
      description: 'GitHub PAT for Amplify source code provider',
      secretStringValue: cdk.SecretValue.unsafePlainText(
        JSON.stringify({ token: 'PLACEHOLDER_CHANGE_ME' }),
      ),
    });

    new cdk.CfnOutput(this, 'RdsEndpoint', { value: this.rdsInstance.dbInstanceEndpointAddress });
    new cdk.CfnOutput(this, 'DocumentsBucketName', { value: this.documentsBucket.bucketName });
    new cdk.CfnOutput(this, 'PublicAssetsBucketName', { value: this.publicAssetsBucket.bucketName });
  }
}
