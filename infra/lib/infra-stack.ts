import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =====================
    // VPC
    // =====================

    const vpc = new ec2.Vpc(this, 'CardCheckoutVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // =====================
    // ECR
    // =====================

    const ecrRepository = new ecr.Repository(this, 'BackendEcrRepo', {
      repositoryName: 'card-checkout-backend',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    // =====================
    // Secrets Manager
    // =====================

    const paymentSecrets = new secretsmanager.Secret(this, 'PaymentGatewaySecrets', {
      secretName: 'card-checkout/payment-gateway',
      description: 'Llaves privadas y secreto de eventos para la pasarela de pagos',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          PAYMENT_GATEWAY_PRIVATE_KEY: 'prv_test_dummy_key',
          PAYMENT_GATEWAY_EVENTS_SECRET: 'evt_test_dummy_secret',
        }),
        generateStringKey: 'dummy_key',
      },
    });

    // =====================
    // PostgreSQL
    // =====================

    const postgresDb = new rds.DatabaseInstance(this, 'PostgresDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      databaseName: 'card_checkout',
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      allocatedStorage: 20,
      maxAllocatedStorage: 30,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // =====================
    // ECS Cluster
    // =====================

    const ecsCluster = new ecs.Cluster(this, 'CardCheckoutCluster', {
      vpc,
    });

    // =====================
    // ECS Fargate
    // =====================

    const fargateService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        'BackendFargateService',
        {
          cluster: ecsCluster,
          cpu: 256,
          memoryLimitMiB: 512,
          desiredCount: 1,
          publicLoadBalancer: true,

          taskImageOptions: {
            image: ecs.ContainerImage.fromEcrRepository(
              ecrRepository,
              'latest'
            ),
            containerPort: 3000,

            environment: {
              NODE_ENV: 'production',
              PORT: '3000',
              DB_HOST: postgresDb.dbInstanceEndpointAddress,
              DB_PORT: '5432',
              DB_NAME: 'card_checkout',
              DB_USER: 'postgres',
            },

            secrets: {
              DB_PASSWORD: ecs.Secret.fromSecretsManager(
                postgresDb.secret!,
                'password'
              ),

              PAYMENT_GATEWAY_PRIVATE_KEY:
                ecs.Secret.fromSecretsManager(
                  paymentSecrets,
                  'PAYMENT_GATEWAY_PRIVATE_KEY'
                ),

              PAYMENT_GATEWAY_EVENTS_SECRET:
                ecs.Secret.fromSecretsManager(
                  paymentSecrets,
                  'PAYMENT_GATEWAY_EVENTS_SECRET'
                ),
            },
          },
        }
      );

    postgresDb.connections.allowDefaultPortFrom(
      fargateService.service
    );

    // =====================
    // Frontend
    // =====================

    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const frontendDistribution = new cloudfront.Distribution(
      this,
      'FrontendDistribution',
      {
        defaultBehavior: {
          origin:
            origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },

        additionalBehaviors: {
          '/api/*': {
            origin: new origins.HttpOrigin(
              fargateService.loadBalancer.loadBalancerDnsName,
              {
                protocolPolicy:
                  cloudfront.OriginProtocolPolicy.HTTP_ONLY,
              }
            ),

            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,

            allowedMethods:
              cloudfront.AllowedMethods.ALLOW_ALL,

            cachePolicy:
              cloudfront.CachePolicy.CACHING_DISABLED,

            originRequestPolicy:
              cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          },
        },

        defaultRootObject: 'index.html',

        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
            ttl: cdk.Duration.seconds(0),
          },
        ],
      }
    );

    // =====================
    // CloudFormation Outputs
    // =====================

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: ecrRepository.repositoryUri,
      description: 'URI del repositorio ECR',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryName', {
      value: ecrRepository.repositoryName,
      description: 'Nombre del repositorio ECR',
    });

    new cdk.CfnOutput(this, 'EcsClusterName', {
      value: ecsCluster.clusterName,
      description: 'Nombre del ECS Cluster',
    });

    new cdk.CfnOutput(this, 'EcsServiceName', {
      value: fargateService.service.serviceName,
      description: 'Nombre del ECS Service',
    });

    new cdk.CfnOutput(this, 'BackendUrl', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'URL pública del Backend',
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
      description: 'Nombre del Bucket S3',
    });

    new cdk.CfnOutput(this, 'FrontendCloudFrontUrl', {
      value: `https://${frontendDistribution.distributionDomainName}`,
      description: 'URL CloudFront',
    });

    new cdk.CfnOutput(this, 'FrontendDistributionId', {
      value: frontendDistribution.distributionId,
      description: 'ID de la distribución CloudFront',
    });
  }
}