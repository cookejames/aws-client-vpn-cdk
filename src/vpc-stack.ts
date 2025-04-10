import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib'; 
import { aws_ec2 as ec2 } from 'aws-cdk-lib';

export class VpcStack extends Stack {
  vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "VpnVpc", {
      natGateways: 0,
      subnetConfiguration: [
        { cidrMask: 22, name: "public", subnetType: ec2.SubnetType.PUBLIC },
      ],
    });
  }
}
