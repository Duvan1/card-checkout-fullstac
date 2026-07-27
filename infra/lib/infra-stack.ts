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

    const vpc = new ec2.Vpc(this, 'CardCheckoutVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    const ecrRepository = new ecr.Repository(this, 'BackendEcrRepo', {
      repositoryName: 'card-checkout-backend',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    const wompiSecrets = secretsmanager.Secret.fromSecretNameV2(
      this,
      'WompiPaymentSecrets',
      'prod/card-checkout/payment-gateway'
    );

    const frontendUrlSecret = new secretsmanager.Secret(
      this,
      'FrontendUrlSecret',
      {
        secretName: 'card-checkout/frontend-url',
        secretObjectValue: {
          FRONTEND_URL: cdk.SecretValue.unsafePlainText(
            'https://d3k7kreyyuu362.cloudfront.net'
          ),
        },
      }
    );

    const postgresDb = new rds.DatabaseInstance(
      this,
      'PostgresDatabase',
      {
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

        credentials: rds.Credentials.fromGeneratedSecret(
          'postgres'
        ),

        allocatedStorage: 20,
        maxAllocatedStorage: 30,

        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Secreto para Prisma DATABASE_URL
    const databaseUrlSecret = new secretsmanager.Secret(
      this,
      'DatabaseUrlSecret',
      {
        secretName: 'card-checkout/database-url',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            DATABASE_URL:
              `postgresql://postgres@${postgresDb.dbInstanceEndpointAddress}:5432/card_checkout`,
          }),
          generateStringKey: 'unused',
        },
      }
    );

    const ecsCluster = new ecs.Cluster(
      this,
      'CardCheckoutCluster',
      {
        vpc,
      }
    );

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

          circuitBreaker: {
            rollback: true,
          },

          taskImageOptions: {
            image:
              ecs.ContainerImage.fromEcrRepository(
                ecrRepository,
                'latest'
              ),

            containerPort: 3000,

            environment: {
              NODE_ENV: 'production',
              PORT: '3000',
              DB_HOST:
                postgresDb.dbInstanceEndpointAddress,
              DB_PORT: '5432',
              DB_NAME: 'card_checkout',
              DB_USER: 'postgres',
            },

            secrets: {
              DB_PASSWORD:
                ecs.Secret.fromSecretsManager(
                  postgresDb.secret!,
                  'password'
                ),

              DATABASE_URL:
                ecs.Secret.fromSecretsManager(
                  databaseUrlSecret,
                  'DATABASE_URL'
                ),

              FRONTEND_URL:
                ecs.Secret.fromSecretsManager(
                  frontendUrlSecret,
                  'FRONTEND_URL'
                ),
              PAYMENT_GATEWAY_API_URL:
                ecs.Secret.fromSecretsManager(
                  wompiSecrets,
                  'PAYMENT_GATEWAY_API_URL'
                ),

              PAYMENT_GATEWAY_PUBLIC_KEY:
                ecs.Secret.fromSecretsManager(
                  wompiSecrets,
                  'PAYMENT_GATEWAY_PUBLIC_KEY'
                ),

              PAYMENT_GATEWAY_PRIVATE_KEY:
                ecs.Secret.fromSecretsManager(
                  wompiSecrets,
                  'PAYMENT_GATEWAY_PRIVATE_KEY'
                ),

              PAYMENT_GATEWAY_INTEGRITY_SECRET:
                ecs.Secret.fromSecretsManager(
                  wompiSecrets,
                  'PAYMENT_GATEWAY_INTEGRITY_SECRET'
                ),

              PAYMENT_GATEWAY_EVENTS_SECRET:
                ecs.Secret.fromSecretsManager(
                  wompiSecrets,
                  'PAYMENT_GATEWAY_EVENTS_SECRET'
                ),
            },
          },
        }
      );

    fargateService.targetGroup.configureHealthCheck({
      path: '/api/health',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    postgresDb.connections.allowDefaultPortFrom(
      fargateService.service
    );

    const frontendBucket = new s3.Bucket(
      this,
      'FrontendBucket',
      {
        blockPublicAccess:
          s3.BlockPublicAccess.BLOCK_ALL,

        removalPolicy:
          cdk.RemovalPolicy.DESTROY,

        autoDeleteObjects: true,
      }
    );

    const frontendDistribution =
      new cloudfront.Distribution(
        this,
        'FrontendDistribution',
        {
          defaultBehavior: {
            origin:
              origins.S3BucketOrigin.withOriginAccessControl(
                frontendBucket
              ),

            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy
                .REDIRECT_TO_HTTPS,
          },

          additionalBehaviors: {
            '/api/*': {
              origin:
                new origins.HttpOrigin(
                  fargateService.loadBalancer
                    .loadBalancerDnsName,
                  {
                    protocolPolicy:
                      cloudfront
                        .OriginProtocolPolicy
                        .HTTP_ONLY,
                  }
                ),

              viewerProtocolPolicy:
                cloudfront.ViewerProtocolPolicy
                  .REDIRECT_TO_HTTPS,

              allowedMethods:
                cloudfront.AllowedMethods.ALLOW_ALL,

              cachePolicy:
                cloudfront.CachePolicy
                  .CACHING_DISABLED,

              originRequestPolicy:
                cloudfront
                  .OriginRequestPolicy
                  .ALL_VIEWER_EXCEPT_HOST_HEADER,
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

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: ecrRepository.repositoryUri,
    });

    new cdk.CfnOutput(this, 'EcsClusterName', {
      value: ecsCluster.clusterName,
    });

    new cdk.CfnOutput(this, 'EcsServiceName', {
      value:
        fargateService.service.serviceName,
    });

    new cdk.CfnOutput(this, 'BackendUrl', {
      value:
        fargateService.loadBalancer
          .loadBalancerDnsName,
    });

    new cdk.CfnOutput(
      this,
      'FrontendCloudFrontUrl',
      {
        value:
          `https://${frontendDistribution.distributionDomainName}`,
      }
    );

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: frontendBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'FrontendDistributionId', {
      value: frontendDistribution.distributionId,
    });
  }
}