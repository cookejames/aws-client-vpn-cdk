import { Construct } from 'constructs';
import { Stack, StackProps, Duration } from 'aws-cdk-lib'; 
import { aws_ec2 as ec2, aws_ssm as ssm, aws_route53 as route53 } from 'aws-cdk-lib'; 
import { RemindingLambda } from "./lambda";

type Props = {
  vpc: ec2.Vpc;
  domainName: string;
  recordName?: string;
  toAddress: string;
  fromAddress: string;
} & StackProps;
// A stack to create a VPN with a lambda that sends emails reminding that it is up and running
export class VpnStack extends Stack {
  constructor(
    scope: Construct,
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
    const vpnEndpoint = new ec2.ClientVpnEndpoint(this, "Endpoint", {
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
      .selectSubnets({ subnetType: ec2.SubnetType.PUBLIC })
      .subnetIds.map((subnetId, i) => {
        vpnEndpoint.addRoute(`internet-access-${i}`, {
          cidr: "0.0.0.0/0",
          description: "Internet Access",
          target: { subnetId },
        });
      });

    // Now create a DNS record for our VPN
    const hostedZone = route53.HostedZone.fromLookup(this, "domain", { domainName });

    // I need a random stable id
    const logicalId = this.getLogicalId(
      vpnEndpoint.node.defaultChild as ec2.CfnClientVpnEndpoint
    ).slice(-8);

    // This CNAME maps to one of the random VPN endpoint addresses
    new route53.CnameRecord(this, "recordName", {
      domainName: `${logicalId}.${vpnEndpoint.endpointId}.prod.clientvpn.${
        Stack.of(this).region
      }.amazonaws.com`,
      zone: hostedZone,
      recordName,
      ttl: Duration.seconds(60),
    });

    // This wildcard CNAME allows VPNs with the remote-random-hostname option enabled to resolve
    new route53.CnameRecord(this, "*recordName", {
      domainName: `${recordName}.${domainName}`,
      zone: hostedZone,
      recordName: `*.${recordName}`,
      ttl: Duration.seconds(60),
    });

    // Setup a lambda that sends a reminder that the VPN is running
    // new RemindingLambda(this, "RemindingLambda", { toAddress, fromAddress });
  }
}
