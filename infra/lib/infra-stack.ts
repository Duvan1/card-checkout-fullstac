import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as rds from 'aws-cdk-lib/aws-rds';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'CardCheckoutVpc', {
      maxAzs: 2, 
      natGateways: 1, 
    });

    const ecrRepository = new ecr.Repository(this, 'BackendEcrRepo', {
      repositoryName: 'card-checkout-backend',
      removalPolicy: cdk.RemovalPolicy.DESTROY, 
      autoDeleteImages: true,
    });

    const postgresDb = new rds.DatabaseInstance(this, 'PostgresDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO
      ), 
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      databaseName: 'card_checkout',
      credentials: rds.Credentials.fromGeneratedSecret('postgres'), 
      allocatedStorage: 20,
      maxAllocatedStorage: 30,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const ecsCluster = new ecs.Cluster(this, 'CardCheckoutCluster', { vpc });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: ecrRepository.repositoryUri,
      description: 'URI del repositorio ECR para subir la imagen de Docker',
    });
  }
}