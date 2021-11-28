import * as cdk from "@aws-cdk/core";
import { Vpc, SubnetType } from "@aws-cdk/aws-ec2";

export class VpcStack extends cdk.Stack {
  vpc: Vpc;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, "VpnVpc", {
      natGateways: 0,
      subnetConfiguration: [
        { cidrMask: 22, name: "public", subnetType: SubnetType.PUBLIC },
      ],
    });
  }
}
