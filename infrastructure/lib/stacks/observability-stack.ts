import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cwActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubs from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface ObservabilityStackProps extends cdk.StackProps {
  ecsCluster: ecs.ICluster;
  fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;
  rdsInstance: rds.IDatabaseInstance;
}

export class ObservabilityStack extends cdk.Stack {
  public readonly alertsTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: ObservabilityStackProps) {
    super(scope, id, props);

    new logs.LogGroup(this, 'VelaEcsAgentLogs', {
      logGroupName: '/vela/ecs-agent',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.alertsTopic = new sns.Topic(this, 'VelaAlertsTopic', {
      topicName: 'vela-alerts',
      displayName: 'Vela Infrastructure Alerts',
    });
    this.alertsTopic.addSubscription(
      new snsSubs.EmailSubscription('rashadbarnett.ai@gmail.com'),
    );

    const snsAction = new cwActions.SnsAction(this.alertsTopic);

    // 1. ECS CPU > 80% for 5 min
    props.fargateService.service
      .metricCpuUtilization({ period: cdk.Duration.minutes(1) })
      .createAlarm(this, 'EcsCpuHighAlarm', {
        threshold: 80,
        evaluationPeriods: 5,
        alarmDescription: 'ECS CPU > 80% for 5 minutes',
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      })
      .addAlarmAction(snsAction);

    // 2. ECS memory > 85% for 5 min
    props.fargateService.service
      .metricMemoryUtilization({ period: cdk.Duration.minutes(1) })
      .createAlarm(this, 'EcsMemoryHighAlarm', {
        threshold: 85,
        evaluationPeriods: 5,
        alarmDescription: 'ECS memory > 85% for 5 minutes',
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      })
      .addAlarmAction(snsAction);

    // 3. ALB 5xx count > 5 in 5 min
    props.fargateService.loadBalancer
      .metrics.httpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT, {
        period: cdk.Duration.minutes(1),
        statistic: 'Sum',
      })
      .createAlarm(this, 'Alb5xxAlarm', {
        threshold: 5,
        evaluationPeriods: 5,
        alarmDescription: 'ALB 5xx error count > 5 in 5 minutes',
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      })
      .addAlarmAction(snsAction);

    // 4. ALB target response time > 3s for 5 min
    props.fargateService.loadBalancer
      .metrics.targetResponseTime({ period: cdk.Duration.minutes(1), statistic: 'Average' })
      .createAlarm(this, 'AlbResponseTimeAlarm', {
        threshold: 3,
        evaluationPeriods: 5,
        alarmDescription: 'ALB target response time > 3s for 5 minutes',
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      })
      .addAlarmAction(snsAction);

    // 5. RDS CPU > 80% for 5 min
    props.rdsInstance
      .metricCPUUtilization({ period: cdk.Duration.minutes(1) })
      .createAlarm(this, 'RdsCpuHighAlarm', {
        threshold: 80,
        evaluationPeriods: 5,
        alarmDescription: 'RDS CPU > 80% for 5 minutes',
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      })
      .addAlarmAction(snsAction);

    // 6. RDS free storage < 2 GB
    props.rdsInstance
      .metricFreeStorageSpace({ period: cdk.Duration.minutes(5) })
      .createAlarm(this, 'RdsFreeStorageLowAlarm', {
        threshold: 2 * 1024 * 1024 * 1024,
        evaluationPeriods: 1,
        alarmDescription: 'RDS free storage < 2 GB',
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      })
      .addAlarmAction(snsAction);

    new cdk.CfnOutput(this, 'AlertsTopicArn', { value: this.alertsTopic.topicArn });
  }
}
