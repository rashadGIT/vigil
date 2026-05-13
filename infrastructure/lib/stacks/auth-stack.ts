import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

// Cognito hosted-UI domain prefix — must be globally unique
const DOMAIN_PREFIX = 'vigil-auth';

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolId: string;
  public readonly userPoolClientId: string;
  public readonly cognitoDomain: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Pre Sign-Up Lambda — links a Google federated identity to the admin-pre-created
    // Cognito user that shares the same email. This carries over custom:tenantId and
    // custom:role so multi-tenant isolation is preserved for Google sign-ins.
    const preSignUpFn = new lambda.Function(this, 'PreSignUpLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(10),
      code: lambda.Code.fromInline(`
const { CognitoIdentityProviderClient, ListUsersCommand, AdminLinkProviderForUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const client = new CognitoIdentityProviderClient({});

exports.handler = async (event) => {
  // Only intercept federated (Google) sign-ups
  if (event.triggerSource !== 'PreSignUp_ExternalProvider') return event;

  const email = event.request.userAttributes.email;
  const [providerName, providerUserId] = event.userName.split('_');

  const listRes = await client.send(new ListUsersCommand({
    UserPoolId: event.userPoolId,
    Filter: \`email = "\${email}"\`,
    Limit: 1,
  }));

  const existing = listRes.Users?.[0];
  if (!existing) {
    throw new Error('No Vigil account found for this email. Contact your administrator.');
  }

  // Link the Google identity to the existing Cognito user so it inherits
  // custom:tenantId and custom:role from the pre-created account.
  await client.send(new AdminLinkProviderForUserCommand({
    UserPoolId: event.userPoolId,
    DestinationUser: { ProviderName: 'Cognito', ProviderAttributeValue: existing.Username },
    SourceUser: {
      ProviderName: providerName,
      ProviderAttributeName: 'Cognito_Subject',
      ProviderAttributeValue: providerUserId,
    },
  }));

  event.response.autoConfirmUser = true;
  event.response.autoVerifyEmail = true;
  return event;
};
      `),
    });

    preSignUpFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:ListUsers', 'cognito-idp:AdminLinkProviderForUser'],
        resources: ['*'],
      }),
    );

    this.userPool = new cognito.UserPool(this, 'VigilUserPool', {
      userPoolName: 'vigil-user-pool',
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
      },
      customAttributes: {
        tenantId: new cognito.StringAttribute({ mutable: false }),
        role: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: { sms: false, otp: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lambdaTriggers: {
        preSignUp: preSignUpFn,
      },
    });

    // Google Identity Provider
    // Supply GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET as env vars when running cdk deploy
    const googleClientId = process.env.GOOGLE_CLIENT_ID ?? '';
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';

    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'GoogleProvider', {
      userPool: this.userPool,
      clientId: googleClientId,
      clientSecretValue: cdk.SecretValue.unsafePlainText(googleClientSecret),
      scopes: ['email', 'profile', 'openid'],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        givenName: cognito.ProviderAttribute.GOOGLE_GIVEN_NAME,
        familyName: cognito.ProviderAttribute.GOOGLE_FAMILY_NAME,
      },
    });

    // Hosted UI domain — required for OAuth/PKCE flows
    const domain = this.userPool.addDomain('HostedUIDomain', {
      cognitoDomain: { domainPrefix: DOMAIN_PREFIX },
    });

    const callbackUrls = [
      'http://localhost:3000/auth/callback',
      'https://app.vigilhq.com/auth/callback',
    ];
    const logoutUrls = [
      'http://localhost:3000/login',
      'https://app.vigilhq.com/login',
    ];

    this.userPoolClient = new cognito.UserPoolClient(this, 'VigilUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'vigil-web-client',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        cognito.UserPoolClientIdentityProvider.GOOGLE,
      ],
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
          cognito.OAuthScope.OPENID,
        ],
        callbackUrls,
        logoutUrls,
      },
      accessTokenValidity: cdk.Duration.minutes(15),
      idTokenValidity: cdk.Duration.minutes(15),
      refreshTokenValidity: cdk.Duration.days(30),
      enableTokenRevocation: true,
      preventUserExistenceErrors: true,
    });

    // Ensure the Google provider is created before the client
    this.userPoolClient.node.addDependency(googleProvider);

    this.userPoolId = this.userPool.userPoolId;
    this.userPoolClientId = this.userPoolClient.userPoolClientId;
    this.cognitoDomain = `${DOMAIN_PREFIX}.auth.${this.region}.amazoncognito.com`;

    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClientId });
    new cdk.CfnOutput(this, 'CognitoDomain', { value: this.cognitoDomain });
    new cdk.CfnOutput(this, 'HostedUISignInUrl', {
      value: domain.signInUrl(this.userPoolClient, { redirectUri: callbackUrls[0] }),
    });
  }
}
