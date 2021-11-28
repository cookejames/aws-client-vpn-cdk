import {
  Vpc,
  ClientVpnEndpoint,
  SubnetType,
  CfnClientVpnEndpoint,
} from "@aws-cdk/aws-ec2";
import * as cdk from "@aws-cdk/core";
import * as ssm from "@aws-cdk/aws-ssm";
import { HostedZone, CnameRecord } from "@aws-cdk/aws-route53";
import { RemindingLambda } from "./lambda";

type Props = {
  vpc: Vpc;
  domainName: string;
  recordName?: string;
  toAddress: string;
  fromAddress: string;
} & cdk.StackProps;
// A stack to create a VPN with a lambda that sends emails reminding that it is up and running
export class VpnStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    {
      vpc,
      domainName,
      recordName = "vpn",
      toAddress,
      fromAddress,
      ...props
    }: Props
  ) {
    super(scope, id, props);

    // Get client and server certificates. This sets up mutual authentication.
    const serverCertificateArn = ssm.StringParameter.valueForStringParameter(
      this,
      "vpn-server-certificate"
    );
    const clientCertificateArn = ssm.StringParameter.valueForStringParameter(
      this,
      "vpn-client-certificate"
    );

    // Create a VPN endpoint with DNS servers
    const vpnEndpoint = new ClientVpnEndpoint(this, "Endpoint", {
      cidr: "10.100.0.0/16",
      serverCertificateArn,
      clientCertificateArn,
      vpc,
      dnsServers: ["8.8.8.8", "8.8.4.4"],
    });

    // Add an authorisation rule and routes to allow internet access
    vpnEndpoint.addAuthorizationRule("AllowAll", {
      cidr: "0.0.0.0/0",
      description: "AllowAll",
    });
    vpc
      .selectSubnets({ subnetType: SubnetType.PUBLIC })
      .subnetIds.map((subnetId, i) => {
        vpnEndpoint.addRoute(`internet-access-${i}`, {
          cidr: "0.0.0.0/0",
          description: "Internet Access",
          target: { subnetId },
        });
      });

    // Now create a DNS record for our VPN
    const hostedZone = HostedZone.fromLookup(this, "domain", { domainName });

    // I need a random stable id
    const logicalId = this.getLogicalId(
      vpnEndpoint.node.defaultChild as CfnClientVpnEndpoint
    ).slice(-8);

    // This CNAME maps to one of the random VPN endpoint addresses
    new CnameRecord(this, "recordName", {
      domainName: `${logicalId}.${vpnEndpoint.endpointId}.prod.clientvpn.${
        cdk.Stack.of(this).region
      }.amazonaws.com`,
      zone: hostedZone,
      recordName,
      ttl: cdk.Duration.seconds(60),
    });

    // This wildcard CNAME allows VPNs with the remote-random-hostname option enabled to resolve
    new CnameRecord(this, "*recordName", {
      domainName: `${recordName}.${domainName}`,
      zone: hostedZone,
      recordName: `*.${recordName}`,
      ttl: cdk.Duration.seconds(60),
    });

    // Setup a lambda that sends a reminder that the VPN is running
    new RemindingLambda(this, "RemindingLambda", { toAddress, fromAddress });
  }
}
