import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ses from 'aws-cdk-lib/aws-ses';
import { Construct } from 'constructs';

export class FoundationStack extends cdk.Stack {
  public readonly hostedZone: route53.IHostedZone;
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.hostedZone = route53.HostedZone.fromLookup(this, 'VelaHostedZone', {
      domainName: 'automagicly.ai',
    });

    this.certificate = new acm.Certificate(this, 'VelaWildcardCert', {
      domainName: 'vigil.automagicly.ai',
      subjectAlternativeNames: ['*.vigil.automagicly.ai'],
      validation: acm.CertificateValidation.fromDns(this.hostedZone),
    });

    const sesIdentity = new ses.EmailIdentity(this, 'VelaSesIdentity', {
      identity: ses.Identity.domain('vigil.automagicly.ai'),
    });

    new cdk.CfnOutput(this, 'HostedZoneId', { value: this.hostedZone.hostedZoneId });
    new cdk.CfnOutput(this, 'CertificateArn', { value: this.certificate.certificateArn });
    new cdk.CfnOutput(this, 'SesIdentityName', { value: sesIdentity.emailIdentityName });
  }
}
